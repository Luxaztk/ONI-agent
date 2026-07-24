import { ipcMain } from 'electron';
import { UpdateManager } from '@electron/modules/ai/updateManager';

export function setupUpdateIPC() {
  // Lắng nghe nút Check Update từ UI
  ipcMain.handle('check-update', async (event) => {
    try {
      event.sender.send('loading-progress', 'Đang kiểm tra nguồn tri thức...', 10);
      const status = await UpdateManager.checkForUpdates();
      if (status.hasUpdates) {
        event.sender.send('loading-progress', 'Phát hiện tri thức mới. Đang đồng bộ...', 30);
        const success = await UpdateManager.performUpdate(status, (msg, pct) => {
          event.sender.send('loading-progress', msg, pct);
        });
        event.sender.send('loading-progress', 'Hoàn tất cập nhật tri thức', 100);
        return { ...status, updated: success };
      }
      event.sender.send('loading-progress', 'Dữ liệu tri thức đã mới nhất', 100);
      return { ...status, updated: false, hasUpdates: false };
    } catch (e: any) {
      event.sender.send('loading-progress', 'Lỗi kiểm tra cập nhật: ' + e.message, -1);
      return { error: e.message };
    }
  });
}
