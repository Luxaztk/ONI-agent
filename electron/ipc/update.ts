import { ipcMain } from 'electron';
import { UpdateManager } from '@electron/modules/ai/updateManager';

export function setupUpdateIPC() {
  // Lắng nghe nút Check Update từ UI
  ipcMain.handle('check-update', async () => {
    try {
      const status = await UpdateManager.checkForUpdates();
      if (status.needsOniDbUpdate || status.needsWikiUpdate) {
        const success = await UpdateManager.performUpdate(status);
        return { ...status, updated: success };
      }
      return { ...status, updated: false };
    } catch (e: any) {
      return { error: e.message };
    }
  });
}
