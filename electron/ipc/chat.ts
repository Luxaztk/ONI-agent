import { ipcMain, app } from 'electron';
import { askAgent, askAgentStream } from '@electron/modules/ai/agent';
import fs from 'fs';
import path from 'path';

const getChatHistoryPath = () => {
  const userDataDir = app.getPath('userData');
  return path.join(userDataDir, 'chat_history.json');
};

export function setupChatIPC() {
  // Demo IPC handler for testing connection
  ipcMain.handle('ping', () => {
    return 'pong from Main Process (AI Engine ready!)';
  });

  // Lấy danh sách chat sessions từ file %APPDATA%/oni-agent/chat_history.json
  ipcMain.handle('get-chat-sessions', async () => {
    try {
      const filePath = getChatHistoryPath();
      if (!fs.existsSync(filePath)) return [];
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (e: any) {
      console.error("Lỗi khi đọc chat_history.json:", e);
      return [];
    }
  });

  // Lưu danh sách chat sessions vào file %APPDATA%/oni-agent/chat_history.json
  ipcMain.handle('save-chat-sessions', async (_event, sessions: any) => {
    try {
      const filePath = getChatHistoryPath();
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(sessions, null, 2), 'utf-8');
      return true;
    } catch (e: any) {
      console.error("Lỗi khi lưu chat_history.json:", e);
      return false;
    }
  });

  // Giao tiếp Chat với Agent
  ipcMain.handle('chat', async (_event, payload: any) => {
    try {
      const question = typeof payload === "string" ? payload : payload.question;
      const history = typeof payload === "object" ? payload.history : [];
      const answer = await askAgent(question, history);
      return answer;
    } catch (error: any) {
      console.error("AI Error:", error);
      return `Lỗi hệ thống AI: ${error.message}`;
    }
  });

  // Giao tiếp Chat Streaming
  ipcMain.on('chat-stream-request', async (event, payload: any) => {
    const { question, channelId, history = [] } = typeof payload === "object" ? payload : { question: payload, channelId: "chat-stream" };
    try {
      console.log(`[Main] Bắt đầu xử lý chat-stream-request: ${question} (channel: ${channelId})`);
      const stream = await askAgentStream(question, history);
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
