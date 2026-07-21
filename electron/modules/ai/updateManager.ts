import fs from 'fs';
import path from 'path';
import { getDbPath, getMetaPath } from '@electron/infrastructure/vectorDb';
import { runIngestion } from '@electron/workers/ingest';

const WIKI_API = "https://oxygennotincluded.wiki.gg/api.php?action=query&meta=siteinfo&siprop=statistics&format=json";

export class UpdateManager {
  
  // Được gọi khi khởi động App (trong main/index.ts)
  static async checkAndSetupInitialDB() {
    const dbPath = await getDbPath();
    const metaPath = await getMetaPath();

    if (!fs.existsSync(dbPath)) {
       console.log("First run detected. Copying initial Vector DB to user data...");
       
       let sourceDb = "";
       let sourceMeta = "";
       
       if (process.versions.electron) {
          const electron = await import('electron');
          const isPackaged = electron.app.isPackaged;
          
          if (isPackaged) {
             sourceDb = path.join(process.resourcesPath, 'data', 'vector_store.json');
             sourceMeta = path.join(process.resourcesPath, 'data', 'meta.json');
          } else {
             sourceDb = path.join(process.cwd(), 'data', 'vector_store.json');
             sourceMeta = path.join(process.cwd(), 'data', 'meta.json');
          }
       } else {
          return; // Node script, không cần copy
       }

       const dir = path.dirname(dbPath);
       if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

       if (fs.existsSync(sourceDb)) fs.copyFileSync(sourceDb, dbPath);
       if (fs.existsSync(sourceMeta)) fs.copyFileSync(sourceMeta, metaPath);
    }
  }

  // Trả về kết quả xem nguồn nào cần cào lại
  static async checkForUpdates(): Promise<{ needsOniDbUpdate: boolean, needsWikiUpdate: boolean }> {
    const metaPath = await getMetaPath();
    if (!fs.existsSync(metaPath)) return { needsOniDbUpdate: true, needsWikiUpdate: true };

    const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
    const now = Date.now();

    // 1. Oni-DB: Cập nhật sau mỗi 30 ngày
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const needsOniDbUpdate = (now - (meta.last_oni_db_update || 0)) > thirtyDaysMs;

    // 2. Wiki: Kiểm tra API để xem số lượng chỉnh sửa có tăng đáng kể không (ví dụ > 50 edits)
    let needsWikiUpdate = false;
    try {
      const res = await fetch(WIKI_API);
      const data = await res.json() as any;
      const currentEdits = data.query.statistics.edits;
      
      if (!meta.wiki_edits_count || currentEdits > meta.wiki_edits_count + 50) {
         needsWikiUpdate = true;
         console.log(`Wiki updates found: ${meta.wiki_edits_count} -> ${currentEdits}`);
      }
    } catch(e) {
      console.error("Failed to check wiki update via API", e);
    }

    return { needsOniDbUpdate, needsWikiUpdate };
  }

  // Thực thi quá trình cập nhật DB
  static async performUpdate(updates: { needsOniDbUpdate: boolean, needsWikiUpdate: boolean }) {
    if (updates.needsOniDbUpdate || updates.needsWikiUpdate) {
      console.log('🔄 Đang khởi động Crawler để cập nhật dữ liệu...');
      try {
        await runIngestion();
        console.log('✅ Cập nhật dữ liệu thành công!');
        return true;
      } catch (error) {
        console.error('❌ Lỗi trong quá trình cập nhật dữ liệu:', error);
        return false;
      }
    }
    return false;
  }
}
