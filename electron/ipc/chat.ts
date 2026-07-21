import { ipcMain } from 'electron';
import { askAgent, askAgentStream } from '@electron/modules/ai/agent';

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

  // Giao tiếp Chat Streaming
  ipcMain.on('chat-stream-request', async (event, { question, channelId }) => {
    try {
      console.log(`[Main] Bắt đầu xử lý chat-stream-request: ${question} (channel: ${channelId})`);
      const stream = await askAgentStream(question);
      console.log(`[Main] Đã lấy được stream, bắt đầu gửi token...`);
      for await (const chunk of stream) {
        event.sender.send(`${channelId}-token`, chunk);
      }
      event.sender.send(`${channelId}-complete`);
    } catch (error: any) {
      console.error("AI Stream Error:", error);
      event.sender.send(`${channelId}-error`, error.message);
    }
  });
}
