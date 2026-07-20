import { getVectorStore, saveVectorStore, getMetaPath } from "../infrastructure/vectorDb";
import { runCrawlers } from "../modules/ai/crawler";
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

  console.log("Chia nhỏ tài liệu (Text Splitting)...");
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  
  const docs = await textSplitter.splitDocuments(rawDocs);
  console.log(`Tài liệu đã được chia thành ${docs.length} mảnh nhỏ (chunks).`);

  console.log("Initializing Vector DB...");
  const vectorStore = await getVectorStore();
  
  console.log(`Adding ${docs.length} chunks to vector store...`);
  await vectorStore.addDocuments(docs);
  
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
