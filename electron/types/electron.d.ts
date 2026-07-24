export interface IElectronAPI {
  ping: () => Promise<string>;
  chat: (question: string) => Promise<string>;
  getChatSessions: () => Promise<any>;
  saveChatSessions: (sessions: any) => Promise<any>;
  chatStream: (
    question: string,
    onToken: (chunk: string) => void,
    onComplete: () => void,
    onError: (err: string) => void,
    history?: Array<{ role: string; content: string }>
  ) => void;
  onLoadingProgress: (callback: (status: string, percent: number) => void) => void;
  checkUpdate: () => Promise<{ hasUpdates?: boolean; error?: string }>;
  getSettings: () => Promise<any>;
  saveSettings: (config: any) => Promise<{ success: boolean; config?: any; error?: string }>;
  testLLMConnection: (config: any) => Promise<{ success: boolean; message?: string; error?: string }>;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
