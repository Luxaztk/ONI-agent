import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getDbDirPath, getMetaPath } from '@electron/infrastructure/vectorDb';
import { runIngestion, type IngestionOptions } from '@electron/workers/ingest';

const WIKI_API = "https://oxygennotincluded.wiki.gg/api.php?action=query&meta=siteinfo&siprop=statistics&format=json";

export interface SyncStatus {
  hasUpdates: boolean;
  needsCustomGuides: boolean;
  needsSteam: boolean;
  needsWiki: boolean;
  needsOniDb: boolean;
  changedCustomFiles: string[];
}

import { configManager } from '@electron/modules/config/configManager';

export class UpdateManager {
  
  // Được gọi khi khởi động App (trong main.ts)
  static async checkAndSetupInitialDB() {
    const dbDirPath = await getDbDirPath();
    const metaPath = await getMetaPath();
    const now = Date.now();

    let sourceLanceDir = "";
    let sourceMeta = "";

    if (process.versions.electron) {
      const electron = await import('electron');
      const isPackaged = electron.app.isPackaged;
      
      if (isPackaged) {
        sourceLanceDir = path.join(process.resourcesPath, 'data', 'lancedb');
        sourceMeta = path.join(process.resourcesPath, 'data', 'meta.json');
      } else {
        sourceLanceDir = path.join(process.cwd(), 'data', 'lancedb');
        sourceMeta = path.join(process.cwd(), 'data', 'meta.json');
      }
    } else {
      return;
    }

    // Nếu chưa có DB ở APPDATA, copy từ project/package sang
    if (!fs.existsSync(dbDirPath) || fs.readdirSync(dbDirPath).length === 0) {
       console.log("[UpdateManager] Phát hiện lần chạy đầu tiên hoặc thiếu DB. Đang copy dữ liệu LanceDB ban đầu...");
       if (fs.existsSync(sourceLanceDir)) {
         fs.cpSync(sourceLanceDir, dbDirPath, { recursive: true });
         console.log(`[UpdateManager] Đã copy thành công LanceDB từ ${sourceLanceDir} sang ${dbDirPath}`);
       }
    }

    // Đảm bảo meta.json ở APPDATA luôn được khởi tạo chuẩn xác để không bị cào lại khi mới mở app
    if (!fs.existsSync(metaPath)) {
      if (fs.existsSync(sourceMeta)) {
        fs.copyFileSync(sourceMeta, metaPath);
      } else {
        // Tự tính MD5 hash các custom guide hiện tại
        const customGuidesDir = path.join(process.cwd(), 'data', 'custom_guides');
        const fileHashes: Record<string, string> = {};
        if (fs.existsSync(customGuidesDir)) {
          const files = fs.readdirSync(customGuidesDir);
          for (const file of files) {
            if (file.endsWith('.md') || file.endsWith('.txt')) {
              const fullPath = path.join(customGuidesDir, file);
              fileHashes[file] = this.getFileHash(fullPath);
            }
          }
        }

        const initialMeta = {
          last_sync_timestamp: now,
          last_oni_db_update: now,
          last_wiki_update: now,
          last_steam_update: now,
          version: "1.1.0",
          sources: {
            custom_guides: { last_updated: now, file_hashes: fileHashes },
            steam_guides: { last_updated: now },
            wiki_gg: { last_updated: now, last_edits_count: 71194 },
            oni_db: { last_updated: now }
          }
        };
        const dir = path.dirname(metaPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(metaPath, JSON.stringify(initialMeta, null, 2), "utf-8");
        console.log(`[UpdateManager] Đã tạo file meta.json khởi tạo tại ${metaPath}`);
      }
    }
  }

  // Tính mã MD5 Hash của 1 file
  static getFileHash(filePath: string): string {
    if (!fs.existsSync(filePath)) return '';
    const content = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(content).digest('hex');
  }

  // Kiểm tra chi tiết mốc thời gian & thay đổi thực tế khi bấm "Cập nhật Tri thức" trên UI
  static async checkForUpdates(): Promise<SyncStatus> {
    const status: SyncStatus = {
      hasUpdates: false,
      needsCustomGuides: false,
      needsSteam: false,
      needsWiki: false,
      needsOniDb: false,
      changedCustomFiles: []
    };

    const cfg = configManager.getConfig();
    if (cfg.offlineMode) {
      console.log('[UpdateCheck] 🛡️ Chế độ Tiết kiệm Mạng Di động (Offline Guard) đang BẬT. Khóa 100% kết nối cào mạng ngoài.');
      return status;
    }

    const metaPath = await getMetaPath();

    let meta: any = {};
    if (fs.existsSync(metaPath)) {
      try {
        meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
      } catch (e) {
        console.error("Lỗi khi đọc meta.json:", e);
      }
    }

    const now = Date.now();
    let metaNeedsSave = false;

    // 1. Kiểm tra Custom Guides (data/custom_guides/) bằng MD5 Hash & mtime
    const customGuidesDir = path.join(process.cwd(), 'data', 'custom_guides');
    const knownHashes = meta.sources?.custom_guides?.file_hashes || {};

    if (fs.existsSync(customGuidesDir)) {
      const files = fs.readdirSync(customGuidesDir);
      for (const file of files) {
        if (file.endsWith('.md') || file.endsWith('.txt')) {
          const fullPath = path.join(customGuidesDir, file);
          const currentHash = this.getFileHash(fullPath);
          if (!knownHashes[file]) {
            // Lần đầu ghi nhận hash file mà không ép cào lại trừ khi file bị sửa sau này
            knownHashes[file] = currentHash;
            metaNeedsSave = true;
          } else if (knownHashes[file] !== currentHash) {
            status.needsCustomGuides = true;
            status.changedCustomFiles.push(file);
            console.log(`[UpdateCheck] Phát hiện file custom guide bị chỉnh sửa: ${file}`);
          }
        }
      }
      meta.sources = meta.sources || {};
      meta.sources.custom_guides = { ...meta.sources?.custom_guides, file_hashes: knownHashes };
    }

    // 2. Kiểm tra Steam Guides (Đồng bộ theo chu kỳ 30 ngày)
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    let lastSteamSync = meta.sources?.steam_guides?.last_updated || meta.last_steam_update;
    if (!lastSteamSync) {
      lastSteamSync = now;
      meta.sources = meta.sources || {};
      meta.sources.steam_guides = { last_updated: now };
      metaNeedsSave = true;
    } else if (now - lastSteamSync > THIRTY_DAYS_MS) {
      status.needsSteam = true;
      console.log(`[UpdateCheck] Steam Guides quá hạn đồng bộ 30 ngày.`);
    }

    // 3. Kiểm tra Wiki.gg (Số lượng bài viết chỉnh sửa trên MediaWiki API)
    let lastWikiEdits = meta.sources?.wiki_gg?.last_edits_count || meta.wiki_edits_count;
    try {
      const res = await fetch(WIKI_API);
      if (res.ok) {
        const data = (await res.json()) as any;
        const currentEdits = data?.query?.statistics?.edits || 0;
        if (!lastWikiEdits || lastWikiEdits === 0) {
          // Lần đầu thiết lập mốc edits chuẩn của Wiki mà không ép cào lại
          meta.sources = meta.sources || {};
          meta.sources.wiki_gg = { ...meta.sources?.wiki_gg, last_edits_count: currentEdits, last_updated: now };
          metaNeedsSave = true;
        } else if (currentEdits > lastWikiEdits + 500) {
          status.needsWiki = true;
          console.log(`[UpdateCheck] Phát hiện cập nhật lớn Wiki.gg: ${lastWikiEdits} -> ${currentEdits} edits.`);
        }
      }
    } catch (e: any) {
      console.error("[UpdateCheck] Lỗi khi kiểm tra API Wiki:", e.message);
    }

    // 4. Kiểm tra ONI-DB (Đồng bộ theo chu kỳ 60 ngày)
    const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;
    let lastOniDbSync = meta.sources?.oni_db?.last_updated || meta.last_oni_db_update;
    if (!lastOniDbSync) {
      lastOniDbSync = now;
      meta.sources = meta.sources || {};
      meta.sources.oni_db = { last_updated: now };
      metaNeedsSave = true;
    } else if (now - lastOniDbSync > SIXTY_DAYS_MS) {
      status.needsOniDb = true;
      console.log(`[UpdateCheck] ONI-DB quá hạn đồng bộ 60 ngày.`);
    }

    if (metaNeedsSave && fs.existsSync(metaPath)) {
      try {
        fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), "utf-8");
      } catch (e) {
        console.error("Failed to save updated meta.json:", e);
      }
    }

    status.hasUpdates = status.needsCustomGuides || status.needsSteam || status.needsWiki || status.needsOniDb;
    return status;
  }

  // Thực thi quá trình cập nhật tăng cường (Incremental Ingestion)
  static async performUpdate(
    status: SyncStatus,
    onProgress?: (statusMsg: string, pct: number) => void
  ): Promise<boolean> {
    if (!status.hasUpdates) {
      console.log('✅ Tất cả nguồn dữ liệu tri thức đã ở bản mới nhất!');
      return false;
    }

    console.log('🔄 Đang khởi động Đồng bộ Tri thức Tăng Cường (Selective Ingestion)...');
    try {
      const options: IngestionOptions = {
        targets: status,
        force: true,
        onProgress
      };
      await runIngestion(options);
      console.log('✅ Đồng bộ tri thức mới thành công!');
      return true;
    } catch (error) {
      console.error('❌ Lỗi trong quá trình đồng bộ tri thức:', error);
      return false;
    }
  }
}
