import { ipcMain } from 'electron';
import { askAgent } from '../modules/ai/agent';

export function setupChatIPC() {
  // Demo IPC handler for testing connection
  ipcMain.handle('ping', () => {
    return 'pong from Main Process (AI Engine ready!)';
  });

  // Giao tiếp Chat với Agent
  ipcMain.handle('chat', async (_event, question: string) => {
    try {
      const answer = await askAgent(question);
      return answer;
    } catch (error: any) {
      console.error("AI Error:", error);
      return `Lỗi hệ thống AI: ${error.message}`;
    }
  });
}
