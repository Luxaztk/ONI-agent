import fs from "fs";
import path from "path";
import { getVectorStore } from "../electron/infrastructure/vectorDb";
import { Document } from "@langchain/core/documents";

export async function migrateJsonToLanceDB() {
  console.log("=== BẮT ĐẦU MIGRATION DỮ LIỆU TỪ JSON SANG LANCEDB ===");
  
  const jsonDbPath = path.join(process.cwd(), "data", "vector_store.json");
  const appDataDir = process.env.APPDATA || "";
  const userDataJsonPath = appDataDir ? path.join(appDataDir, "oni-agent", "vector_store.json") : "";

  let targetJsonFile = "";
  if (fs.existsSync(jsonDbPath)) targetJsonFile = jsonDbPath;
  else if (userDataJsonPath && fs.existsSync(userDataJsonPath)) targetJsonFile = userDataJsonPath;

  if (!targetJsonFile) {
    console.log("Không tìm thấy file vector_store.json cũ. Không cần chuyển đổi.");
    return;
  }

  console.log(`Đang đọc dữ liệu vector cũ từ: ${targetJsonFile}...`);
  try {
    const rawData = fs.readFileSync(targetJsonFile, "utf-8");
    const vectors = JSON.parse(rawData);

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

    console.log(`Đã nạp ${vectors.length} vectors từ file JSON.`);
    const documents: Document[] = vectors.map((v: any) => new Document({
      pageContent: v.pageContent || v.content || "",
      metadata: normalizeMetadata(v.metadata || {})
    })).filter((doc: Document) => doc.pageContent.trim().length > 0);

    // Xóa dữ liệu LanceDB dở dang cũ nếu có
    const lancedbDir = path.join(process.cwd(), "data", "lancedb");
    const appDataLanceDir = path.join(appDataDir, "oni-agent", "lancedb");
    if (fs.existsSync(lancedbDir)) fs.rmSync(lancedbDir, { recursive: true, force: true });
    if (appDataLanceDir && fs.existsSync(appDataLanceDir)) fs.rmSync(appDataLanceDir, { recursive: true, force: true });

    console.log(`Chuyển đổi thành ${documents.length} LangChain Documents. Đang đẩy vào LanceDB...`);
    const vectorStore = await getVectorStore();

    const BATCH_SIZE = 100;
    for (let i = 0; i < documents.length; i += BATCH_SIZE) {
      const batch = documents.slice(i, i + BATCH_SIZE);
      await vectorStore.addDocuments(batch);
      console.log(`  -> Đã chuyển đổi batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(documents.length / BATCH_SIZE)}`);
    }

    console.log("✅ Chuyển đổi dữ liệu sang LanceDB thành công!");
    
    // Backup & Dọn dẹp file JSON cũ
    const backupPath = `${targetJsonFile}.bak`;
    fs.renameSync(targetJsonFile, backupPath);
    console.log(`Đã chuyển file JSON cũ thành file backup: ${backupPath}`);
  } catch (e: any) {
    console.error("❌ Lỗi trong quá trình chuyển đổi dữ liệu sang LanceDB:", e.message);
  }
}

if (process.argv[1] && process.argv[1].includes("migrate")) {
  migrateJsonToLanceDB().catch(console.error);
}
