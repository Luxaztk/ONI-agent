import { AIConfig } from './settings';

declare global {
  interface Window {
    electronAPI?: {
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
      getSettings: () => Promise<AIConfig>;
      saveSettings: (config: AIConfig) => Promise<{ success: boolean; config?: AIConfig; error?: string }>;
      testLLMConnection: (config: AIConfig) => Promise<{ success: boolean; message?: string; error?: string }>;
    };
  }
}
