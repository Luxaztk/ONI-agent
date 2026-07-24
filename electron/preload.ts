import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  ping: () => ipcRenderer.invoke('ping'),
  chat: (question: string) => ipcRenderer.invoke('chat', question),
  getChatSessions: () => ipcRenderer.invoke('get-chat-sessions'),
  saveChatSessions: (sessions: any) => ipcRenderer.invoke('save-chat-sessions', sessions),
  chatStream: (
    question: string,
    onToken: (chunk: string) => void,
    onComplete: () => void,
    onError: (err: string) => void,
    history: Array<{ role: string; content: string }> = []
  ) => {
    const channelId = `chat-${Date.now()}`;
    const tokenListener = (_event: any, chunk: string) => onToken(chunk);
    const completeListener = () => {
      cleanup();
      onComplete();
    };
    const errorListener = (_event: any, err: string) => {
      cleanup();
      onError(err);
    };

    const cleanup = () => {
      ipcRenderer.removeListener(`${channelId}-token`, tokenListener);
      ipcRenderer.removeListener(`${channelId}-complete`, completeListener);
      ipcRenderer.removeListener(`${channelId}-error`, errorListener);
    };

    ipcRenderer.on(`${channelId}-token`, tokenListener);
    ipcRenderer.on(`${channelId}-complete`, completeListener);
    ipcRenderer.on(`${channelId}-error`, errorListener);

    ipcRenderer.send('chat-stream-request', { question, channelId, history });
  },
  onLoadingProgress: (callback: (status: string, percent: number) => void) => {
    ipcRenderer.on('loading-progress', (_event: any, status: any, percent: any) => callback(status, percent));
  },
  checkUpdate: () => ipcRenderer.invoke('check-update'),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (config: any) => ipcRenderer.invoke('save-settings', config),
  testLLMConnection: (config: any) => ipcRenderer.invoke('test-llm-connection', config)
});
