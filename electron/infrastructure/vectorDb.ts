import { LanceDB } from "@langchain/community/vectorstores/lancedb";
import { connect } from "@lancedb/lancedb";
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

export const getDbDirPath = async (): Promise<string> => {
  if (process.versions.electron) {
    const electron = await import('electron');
    return path.join(electron.app.getPath('userData'), 'lancedb');
  }
  return path.join(process.cwd(), "data", "lancedb");
};

export const getDbPath = async (): Promise<string> => {
  return await getDbDirPath();
};

export const getMetaPath = async (): Promise<string> => {
  if (process.versions.electron) {
    const electron = await import('electron');
    return path.join(electron.app.getPath('userData'), 'meta.json');
  }
  return path.join(process.cwd(), "data", "meta.json");
};

let storeInstance: LanceDB | null = null;

export const getVectorStore = async (): Promise<LanceDB> => {
  if (storeInstance) return storeInstance;

  const dbDir = await getDbDirPath();
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const db = await connect(dbDir);
  const tableName = "oni_knowledge";
  const tableNames = await db.tableNames();

  let table: any = undefined;
  if (tableNames.includes(tableName)) {
    table = await db.openTable(tableName);
  } else {
    console.log(`[VectorDb] Bảng "${tableName}" chưa tồn tại. Đang tự động khởi tạo bảng LanceDB...`);
    try {
      const sampleVec = new Array(768).fill(0.001);
      table = await db.createTable(tableName, [{
        vector: sampleVec,
        text: "Initial ONI Knowledge Base Anchor",
        source: "system",
        title: "Initial System Anchor",
        type: "system",
        entity_category: "system",
        element: "system",
        id: "anchor-0",
        source_oni_db: "",
        source_wiki: ""
      }]);
      console.log(`[VectorDb] Đã tạo bảng "${tableName}" thành công!`);
    } catch (e: any) {
      console.error(`[VectorDb] Lỗi khi tạo bảng ${tableName}:`, e.message);
    }
  }

  const store = new LanceDB(getEmbeddings(), {
    table,
    tableName,
  });

  if (table) {
    storeInstance = store;
  }

  return store;
};

// LanceDB tự động lưu đĩa phẳng, giữ hàm saveVectorStore để tương thích ngược
export const saveVectorStore = async (_store: LanceDB) => {
  console.log("✅ LanceDB đã tự động lưu dữ liệu xuống đĩa phẳng.");
};
