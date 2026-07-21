import { getVectorStore, saveVectorStore, getMetaPath } from "@electron/infrastructure/vectorDb";
import { runCrawlers } from "@electron/modules/ai/crawler";
import { processElementData, type VectorChunk, slugify } from "@electron/modules/ai/processor";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export const runIngestion = async () => {
  // Kiểm tra meta.json để tránh cào dữ liệu quá thường xuyên (30 ngày)
  const fs = await import("fs");
  const metaPath = await getMetaPath();
  if (fs.existsSync(metaPath)) {
    try {
      const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
      const now = Date.now();
      const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
      if (now - (meta.last_oni_db_update || 0) < THIRTY_DAYS_MS) {
        console.log("✅ Dữ liệu đã cập nhật gần đây, bỏ qua quá trình cào.");
        return;
      }
    } catch (e) {
      console.error("Failed to read meta.json", e);
    }
  }

  console.log("Bắt đầu quá trình Cào dữ liệu mạng (Web Crawling)...");
  const rawDocs = await runCrawlers();
  console.log(`Đã cào xong ${rawDocs.length} trang web.`);

  console.log("Xử lý, làm sạch & Hợp nhất dữ liệu bằng processor (JSDOM & Semantic Chunking)...");
  
  // Xây dựng bản đồ tra cứu ONI-DB theo tên/slug để đối chiếu trùng lặp
  const oniDbMap = new Map<string, any>();
  const wikiDocs: Document[] = [];
  const otherDocs: Document[] = [];

  for (const doc of rawDocs) {
    if (doc.metadata?.type === "onidb_stats") {
      const title = doc.metadata?.title || "";
      const slug = slugify(title.replace(/>.*$/, "").trim());
      oniDbMap.set(slug, {
        name: title,
        content: doc.pageContent,
        sourceUrl: doc.metadata?.source || ""
      });
    } else {
      const rawContent = doc.pageContent;
      const isWikiHtml = rawContent.includes("<html") || rawContent.includes("<!DOCTYPE") || rawContent.includes("<body") || rawContent.includes("<div");
      if (isWikiHtml) {
        wikiDocs.push(doc);
      } else {
        otherDocs.push(doc);
      }
    }
  }

  const processedDocs: Document[] = [];
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  // Xử lý hợp nhất Wiki HTML với dữ liệu ONI-DB tương ứng
  for (const doc of wikiDocs) {
    const rawHtml = doc.pageContent;
    const title = doc.metadata?.title || "Unknown Entity";
    const slug = slugify(title);

    const matchingOniDb = oniDbMap.get(slug) || {
      name: title,
      sourceUrl: doc.metadata?.source || ""
    };

    try {
      const chunks: VectorChunk[] = await processElementData(rawHtml, matchingOniDb);

      for (const chunk of chunks) {
        processedDocs.push(
          new Document({
            pageContent: chunk.content,
            metadata: {
              ...chunk.metadata,
              id: chunk.id,
              element: chunk.element,
              entity_category: chunk.entity_category,
              source_oni_db: chunk.source_summary.oni_db,
              source_wiki: chunk.source_summary.wiki,
              source: doc.metadata?.source || chunk.source_summary.wiki,
              title: chunk.element
            }
          })
        );
      }
    } catch (err) {
      console.warn(`[Ingest] Lỗi khi dùng processElementData cho ${doc.metadata?.source}, dùng fallback textSplitter:`, err);
      const fallbackChunks = await textSplitter.splitDocuments([doc]);
      processedDocs.push(...fallbackChunks);
    }
  }

  if (otherDocs.length > 0) {
    const fallbackChunks = await textSplitter.splitDocuments(otherDocs);
    processedDocs.push(...fallbackChunks);
  }

  console.log(`Tài liệu đã được làm sạch và chia thành ${processedDocs.length} chunks chất lượng cao.`);

  console.log("Initializing Vector DB...");
  const vectorStore = await getVectorStore();
  console.log(`Adding ${processedDocs.length} chunks to vector store (in batches of 50)...`);
  const batchSize = 50;
  for (let i = 0; i < processedDocs.length; i += batchSize) {
    const batch = processedDocs.slice(i, i + batchSize);
    await vectorStore.addDocuments(batch);
    console.log(`- Added batch ${i / batchSize + 1}/${Math.ceil(processedDocs.length / batchSize)}`);
  }
  
  console.log("Saving vector store to disk...");
  await saveVectorStore(vectorStore);
  
  // Lưu Meta.json
  const metaData = {
    last_oni_db_update: Date.now(),
    last_wiki_update: Date.now(),
    version: "1.0.0"
  };
  fs.writeFileSync(metaPath, JSON.stringify(metaData, null, 2), "utf-8");

  console.log("✅ Ingestion complete!");
};

// Ingestion will be triggered by UpdateManager
