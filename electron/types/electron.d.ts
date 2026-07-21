export interface IElectronAPI {
  ping: () => Promise<string>;
  chat: (question: string) => Promise<string>;
  chatStream: (
    question: string,
    onToken: (chunk: string) => void,
    onComplete: () => void,
    onError: (err: string) => void
  ) => void;
  onLoadingProgress: (callback: (status: string, percent: number) => void) => void;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
