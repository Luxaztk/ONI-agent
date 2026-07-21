import { app, BrowserWindow } from 'electron';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import log from '@electron/utils/logger';

// Khởi tạo electron-log và ghi đè console mặc định
log.initialize();
Object.assign(console, log.functions);

import { UpdateManager } from '@electron/modules/ai/updateManager';
import { setupChatIPC } from '@electron/ipc/chat';
import { setupUpdateIPC } from '@electron/ipc/update';
import { OllamaManager } from '@electron/modules/ai/OllamaManager';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    title: 'ONI Agent',
    width: 1024,
    height: 768,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(async () => {
  // Setup IPC Handlers
  setupChatIPC();


  setupUpdateIPC();

  // Setup DB cho user nếu là lần đầu mở app
  await UpdateManager.checkAndSetupInitialDB();

  // Kiểm tra cập nhật ngầm
  const status = await UpdateManager.checkForUpdates();
  if (status.needsOniDbUpdate || status.needsWikiUpdate) {
    UpdateManager.performUpdate(status).catch(console.error);
  }

  createWindow();

  mainWindow?.webContents.once('did-finish-load', async () => {
    try {
      await OllamaManager.start((statusStr, pct) => {
        mainWindow?.webContents.send('loading-progress', statusStr, pct);
      });
      // Báo hoàn thành
      mainWindow?.webContents.send('loading-progress', 'Sẵn sàng', 100);
    } catch (e: any) {
      log.error('Ollama Error:', e);
      mainWindow?.webContents.send('loading-progress', 'Lỗi: ' + e.message, -1);
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  OllamaManager.stop();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
