import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { MessageProps } from '../components/MessageItem';

export interface ChatSession {
  id: string;
  title: string;
  messages: MessageProps[];
  createdAt: number;
}

interface ChatContextProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  messages: MessageProps[];
  isLoading: boolean;
  createNewSession: () => void;
  selectSession: (id: string) => void;
  deleteSession: (id: string) => void;
  sendMessage: (text: string) => void;
}

const ChatContext = createContext<ChatContextProps | undefined>(undefined);
const LOCAL_STORAGE_KEY = 'oni_chat_sessions_v1';

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Ref để truy cập state mới nhất trong async callbacks mà không dính closure cũ
  const sessionsRef = useRef<ChatSession[]>([]);
  sessionsRef.current = sessions;

  const currentSessionIdRef = useRef<string | null>(null);
  currentSessionIdRef.current = currentSessionId;

  // 1. Tải danh sách sessions khi khởi chạy ứng dụng
  useEffect(() => {
    const loadSessions = async () => {
      try {
        let loaded: ChatSession[] = [];
        if ((window as any).electronAPI?.getChatSessions) {
          loaded = await (window as any).electronAPI.getChatSessions();
        }

        if ((!loaded || loaded.length === 0) && localStorage.getItem(LOCAL_STORAGE_KEY)) {
          const legacy = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (legacy) {
            loaded = JSON.parse(legacy);
            if ((window as any).electronAPI?.saveChatSessions) {
              await (window as any).electronAPI.saveChatSessions(loaded);
            }
          }
        }

        if (loaded && Array.isArray(loaded)) {
          setSessions(loaded);
        }
      } catch (e) {
        console.error("Lỗi khi nạp chat sessions từ APPDATA:", e);
      } finally {
        setIsLoaded(true);
      }
    };

    loadSessions();
  }, []);

  // 2. Tự động lưu sessions vào APPDATA file mỗi khi sessions thay đổi
  useEffect(() => {
    if (!isLoaded) return;
    if ((window as any).electronAPI?.saveChatSessions) {
      (window as any).electronAPI.saveChatSessions(sessions).catch((err: any) => {
        console.error("Failed to save chat sessions to APPDATA:", err);
      });
    }
  }, [sessions, isLoaded]);

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession ? currentSession.messages : [];

  const createNewSession = () => {
    setCurrentSessionId(null);
  };

  const selectSession = (id: string) => {
    setCurrentSessionId(id);
  };

  const deleteSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    if (currentSessionId === id) {
      setCurrentSessionId(null);
    }
  };

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    let targetSessionId = currentSessionIdRef.current;
    let isBrandNew = false;

    // Nếu chưa có session hiện tại, tạo duy nhất 1 session ID mới
    if (!targetSessionId) {
      targetSessionId = `session-${Date.now()}`;
      isBrandNew = true;
    }

    const userMsg: MessageProps = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmed
    };

    const aiMsgId = (Date.now() + 1).toString();
    const aiMsg: MessageProps = {
      id: aiMsgId,
      role: 'ai',
      content: ''
    };

    // Chuẩn bị chat history cho RAG
    const existingMsgs = targetSessionId
      ? (sessionsRef.current.find(s => s.id === targetSessionId)?.messages || [])
      : [];

    const chatHistory = existingMsgs
      .filter(m => m.content.trim().length > 0)
      .map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      }));

    // Cập nhật state sessions
    if (isBrandNew) {
      const newSession: ChatSession = {
        id: targetSessionId,
        title: trimmed.slice(0, 30) || 'Cuộc hội thoại mới',
        messages: [userMsg, aiMsg],
        createdAt: Date.now()
      };
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(targetSessionId);
    } else {
      setSessions(prev =>
        prev.map(s => {
          if (s.id === targetSessionId) {
            return {
              ...s,
              messages: [...s.messages, userMsg, aiMsg]
            };
          }
          return s;
        })
      );
    }

    setIsLoading(true);
    let accumulatedContent = '';

    (window as any).electronAPI.chatStream(
      trimmed,
      (chunk: string) => {
        accumulatedContent += chunk;
        setSessions(prev =>
          prev.map(s => {
            if (s.id === targetSessionId) {
              const updated = [...s.messages];
              const lastIdx = updated.length - 1;
              if (lastIdx >= 0 && updated[lastIdx].id === aiMsgId) {
                updated[lastIdx] = { ...updated[lastIdx], content: accumulatedContent };
              }
              return { ...s, messages: updated };
            }
            return s;
          })
        );
      },
      () => {
        setIsLoading(false);
      },
      (error: string) => {
        setIsLoading(false);
        const errorText = accumulatedContent + `\n\n[Lỗi Hệ Thống]: ${error}`;
        setSessions(prev =>
          prev.map(s => {
            if (s.id === targetSessionId) {
              const updated = [...s.messages];
              const lastIdx = updated.length - 1;
              if (lastIdx >= 0 && updated[lastIdx].id === aiMsgId) {
                updated[lastIdx] = { ...updated[lastIdx], content: errorText };
              }
              return { ...s, messages: updated };
            }
            return s;
          })
        );
      },
      chatHistory
    );
  };

  return (
    <ChatContext.Provider
      value={{
        sessions,
        currentSessionId,
        messages,
        isLoading,
        createNewSession,
        selectSession,
        deleteSession,
        sendMessage
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextProps => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
};
