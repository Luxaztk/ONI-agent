import path from "path";
import { getVectorStore, saveVectorStore, getMetaPath } from "../infrastructure/vectorDb";
import { runCrawlers } from "../modules/ai/crawler";
import { processElementData, type VectorChunk, slugify } from "../modules/ai/processor";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

import crypto from "crypto";

export interface IngestionOptions {
  targets?: {
    needsCustomGuides?: boolean;
    needsSteam?: boolean;
    needsWiki?: boolean;
    needsOniDb?: boolean;
    changedCustomFiles?: string[];
  };
  force?: boolean;
  onProgress?: (msg: string, pct: number) => void;
}

export const runIngestion = async (options: IngestionOptions | boolean = false) => {
  const isForce = typeof options === "boolean" ? options : options.force ?? false;
  const onProgress = typeof options === "object" ? options.onProgress : undefined;

  const fs = await import("fs");
  const metaPath = await getMetaPath();
  if (!isForce && fs.existsSync(metaPath)) {
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

  const targets = typeof options === "object" ? options.targets : undefined;
  const needsWebCrawling = !targets || Boolean(targets.needsOniDb || targets.needsWiki || targets.needsSteam);

  let rawDocs: Document[] = [];
  if (needsWebCrawling) {
    console.log("Bắt đầu quá trình Cào dữ liệu mạng (Web Crawling)...");
    rawDocs = await runCrawlers(targets);
    console.log(`Đã cào xong ${rawDocs.length} trang web.`);
  } else {
    console.log("⚡ Bỏ qua Cào dữ liệu mạng (chỉ đồng bộ/nạp nguồn Hướng dẫn Cục bộ).");
  }

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

  // Nạp các file Hướng dẫn Cục bộ (data/custom_guides/)
  const doCustomGuides = !targets || Boolean(targets.needsCustomGuides);
  const customGuidesDir = path.join(process.cwd(), "data", "custom_guides");

  if (doCustomGuides && fs.existsSync(customGuidesDir)) {
    console.log(`[Ingest] Đang nạp các file Hướng dẫn Cục bộ từ ${customGuidesDir}...`);
    let files = fs.readdirSync(customGuidesDir);
    
    if (targets?.changedCustomFiles && targets.changedCustomFiles.length > 0) {
      files = files.filter(file => targets.changedCustomFiles?.includes(file));
      console.log(`[Ingest] Lọc nạp tăng cường ${files.length} file custom guide mới/sửa: ${files.join(", ")}`);
    }

    for (const file of files) {
      if (file.endsWith(".md") || file.endsWith(".txt")) {
        const filePath = path.join(customGuidesDir, file);
        const content = fs.readFileSync(filePath, "utf-8");
        const guideDocs = await textSplitter.splitDocuments([
          new Document({
            pageContent: content,
            metadata: {
              source: filePath,
              title: file.replace(/\.[^/.]+$/, "").replace(/_/g, " "),
              type: "custom_guide",
              entity_category: "guide"
            }
          })
        ]);
        processedDocs.push(...guideDocs);
        console.log(`  -> Đã nạp ${file} (${guideDocs.length} chunks)`);
      }
    }
  }

  const normalizeMetadata = (meta: Record<string, any> = {}) => {
    return {
      source: String(meta.source || ""),
      title: String(meta.title || ""),
      type: String(meta.type || ""),
      entity_category: String(meta.entity_category || ""),
      element: String(meta.element || ""),
      id: String(meta.id || ""),
      source_oni_db: String(meta.source_oni_db || ""),
      source_wiki: String(meta.source_wiki || "")
    };
  };

  processedDocs.forEach(doc => {
    doc.metadata = normalizeMetadata(doc.metadata);
  });

  console.log(`Tài liệu đã được làm sạch và chia thành ${processedDocs.length} chunks chất lượng cao.`);

  console.log("Initializing Vector DB...");
  const vectorStore = await getVectorStore();
  console.log(`Adding ${processedDocs.length} chunks to vector store (in batches of 50)...`);
  const batchSize = 50;
  for (let i = 0; i < processedDocs.length; i += batchSize) {
    const batch = processedDocs.slice(i, i + batchSize);
    await vectorStore.addDocuments(batch);
    console.log(`- Added batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(processedDocs.length / batchSize)}`);
  }
  
  console.log("Saving vector store to disk...");
  await saveVectorStore(vectorStore);
  
  // Tính toán MD5 Hash cho tất cả file custom_guides
  const fileHashes: Record<string, string> = {};
  if (fs.existsSync(customGuidesDir)) {
    const files = fs.readdirSync(customGuidesDir);
    for (const file of files) {
      if (file.endsWith(".md") || file.endsWith(".txt")) {
        const filePath = path.join(customGuidesDir, file);
        const content = fs.readFileSync(filePath);
        fileHashes[file] = crypto.createHash("md5").update(content).digest("hex");
      }
    }
  }

  // Lấy số lượng edits hiện tại từ Wiki API
  let currentWikiEdits = 0;
  try {
    const res = await fetch("https://oxygennotincluded.wiki.gg/api.php?action=query&meta=siteinfo&siprop=statistics&format=json");
    if (res.ok) {
      const data = (await res.json()) as any;
      currentWikiEdits = data?.query?.statistics?.edits || 0;
    }
  } catch (e) {
    // Ignore error
  }

  // Lưu Meta.json với cấu trúc Ma Trận Đồng Bộ Nguồn (Startup Sync Matrix)
  const now = Date.now();
  const metaData = {
    last_sync_timestamp: now,
    last_oni_db_update: now,
    last_wiki_update: now,
    last_steam_update: now,
    version: "1.1.0",
    sources: {
      custom_guides: {
        last_updated: now,
        file_hashes: fileHashes
      },
      steam_guides: {
        last_updated: now
      },
      wiki_gg: {
        last_updated: now,
        last_edits_count: currentWikiEdits
      },
      oni_db: {
        last_updated: now
      }
    }
  };
  fs.writeFileSync(metaPath, JSON.stringify(metaData, null, 2), "utf-8");

  if (onProgress) onProgress("Hoàn tất đồng bộ dữ liệu", 100);
  console.log("✅ Ingestion complete!");
};

// Chạy trực tiếp khi gọi qua CLI
if (process.argv[1] && process.argv[1].includes("ingest")) {
  runIngestion(true).catch(console.error);
}
