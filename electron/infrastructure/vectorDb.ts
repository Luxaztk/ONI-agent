import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { OllamaEmbeddings } from "@langchain/ollama";
import { OllamaManager } from "../modules/ai/OllamaManager";
import fs from "fs";
import path from "path";

const getEmbeddings = () => {
  const port = process.env.OLLAMA_API_PORT || OllamaManager.getPort();
  return new OllamaEmbeddings({
    model: "nomic-embed-text",
    baseUrl: `http://127.0.0.1:${port}`,
  });
};

export const getDbPath = async () => {
  if (process.versions.electron) {
    const electron = await import('electron');
    return path.join(electron.app.getPath('userData'), 'vector_store.json');
  }
  return path.join(process.cwd(), "data", "vector_store.json");
};

export const getMetaPath = async () => {
  if (process.versions.electron) {
    const electron = await import('electron');
    return path.join(electron.app.getPath('userData'), 'meta.json');
  }
  return path.join(process.cwd(), "data", "meta.json");
};

let storeInstance: MemoryVectorStore | null = null;

// Hàm hỗ trợ lưu store xuống ổ cứng
export const saveVectorStore = async (store: MemoryVectorStore) => {
  const data = JSON.stringify(store.memoryVectors);
  const dbPath = await getDbPath();
  
  // Đảm bảo thư mục tồn tại
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(dbPath, data, "utf-8");
};

// Hàm tải store
export const getVectorStore = async (): Promise<MemoryVectorStore> => {
  if (storeInstance) return storeInstance;

  storeInstance = new MemoryVectorStore(getEmbeddings());
  const dbPath = await getDbPath();
  
  if (fs.existsSync(dbPath)) {
    try {
      const data = fs.readFileSync(dbPath, "utf-8");
      const vectors = JSON.parse(data);
      storeInstance.memoryVectors = vectors;
      console.log(`Loaded ${vectors.length} vectors from ${dbPath}`);
    } catch (e) {
      console.error("Failed to load vector store", e);
    }
  }
  return storeInstance;
};
