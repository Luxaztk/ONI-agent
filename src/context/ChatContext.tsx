// src/context/ChatContext.tsx
import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatContextProps {
  messages: ChatMessage[];
  sendMessage: (content: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextProps | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const sendMessage = async (content: string) => {
    // add user message
    setMessages((prev) => [...prev, { role: 'user', content }]);
    try {
      // @ts-ignore – electronAPI injected by preload
      const answer = await (window as any).electronAPI.chat(content);
      setMessages((prev) => [...prev, { role: 'assistant', content: answer }]);
    } catch (e) {
      console.error('Chat error', e);
      setMessages((prev) => [...prev, { role: 'assistant', content: '❗ Lỗi khi gọi AI' }]);
    }
  };

  return (
    <ChatContext.Provider value={{ messages, sendMessage }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextProps => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
};
