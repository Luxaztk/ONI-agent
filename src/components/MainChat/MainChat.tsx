import React, { useState } from 'react';
import { Bot } from 'lucide-react';
import styles from './MainChat.module.scss';
import MessageList from '../MessageList';
import ChatInput from '../ChatInput';
import type { MessageProps } from '../MessageItem';

const MainChat: React.FC = () => {
  const [messages, setMessages] = useState<MessageProps[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = (text: string) => {
    // 1. Lưu câu hỏi của User
    const newUserMsg: MessageProps = {
      id: Date.now().toString(),
      role: 'user',
      content: text
    };
    
    // Tạo sẵn 1 block tin nhắn AI rỗng để bắt đầu stream
    const aiMsgId = (Date.now() + 1).toString();
    const newAiMsg: MessageProps = {
      id: aiMsgId,
      role: 'ai',
      content: ''
    };

    setMessages(prev => [...prev, newUserMsg, newAiMsg]);
    setIsLoading(true);

    console.log('[UI] Sending chatStream request to main process:', text);

    // 2. Gọi electronAPI stream
    window.electronAPI.chatStream(
      text,
      (chunk) => {
        // Cập nhật từng đoạn nhỏ (token) vào tin nhắn cuối cùng
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMsgIndex = newMessages.length - 1;
          const lastMsg = { ...newMessages[lastMsgIndex] }; // deep copy
          if (lastMsg.id === aiMsgId) {
            lastMsg.content += chunk;
          }
          newMessages[lastMsgIndex] = lastMsg;
          return newMessages;
        });
      },
      () => {
        // Hoàn thành
        setIsLoading(false);
      },
      (error) => {
        // Có lỗi
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMsgIndex = newMessages.length - 1;
          const lastMsg = { ...newMessages[lastMsgIndex] };
          if (lastMsg.id === aiMsgId) {
            lastMsg.content += `\n\n[Lỗi Hệ Thống]: ${error}`;
          }
          newMessages[lastMsgIndex] = lastMsg;
          return newMessages;
        });
        setIsLoading(false);
      }
    );
  };

  return (
    <div className={styles.mainChat}>
      {messages.length === 0 ? (
        <div className={styles.welcomeScreen}>
          <div className={styles.welcomeIcon}>
            <Bot size={48} />
          </div>
          <h1 className={styles.welcomeText}>Xin chào! Tôi có thể giúp gì cho bạn?</h1>
        </div>
      ) : (
        <MessageList messages={messages} />
      )}
      
      <div className={messages.length === 0 ? styles.inputWrapperCenter : styles.inputWrapperBottom}>
        <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
      </div>
    </div>
  );
};

export default MainChat;
