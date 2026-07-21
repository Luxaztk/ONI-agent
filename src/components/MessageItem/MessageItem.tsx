import React from 'react';
import styles from './MessageItem.module.scss';

export interface MessageProps {
  id: string;
  role: 'user' | 'ai';
  content: string;
}

const MessageItem: React.FC<{ message: MessageProps }> = ({ message }) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={`${styles.messageWrapper} ${isUser ? styles.user : styles.ai}`}>
      <div className={isUser ? styles.userBubble : styles.aiBubble}>
        {message.content}
      </div>
    </div>
  );
};

export default MessageItem;
