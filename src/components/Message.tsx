// src/components/Message.tsx
import React from 'react';

export interface MessageProps {
  role: 'user' | 'assistant';
  content: string;
}

export const Message: React.FC<MessageProps> = ({ role, content }) => {
  const isUser = role === 'user';
  return (
    <div className={`message ${isUser ? 'user' : 'assistant'}`}>
      <div className="bubble">
        {content}
      </div>
    </div>
  );
};
