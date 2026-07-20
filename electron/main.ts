import { app, BrowserWindow } from 'electron';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

import { UpdateManager } from './modules/ai/updateManager';
import { setupChatIPC } from './ipc/chat';
import { setupUpdateIPC } from './ipc/update';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
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

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
