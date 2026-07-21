import React, { useRef, useEffect } from 'react';
import styles from './MessageList.module.scss';
import MessageItem from '../MessageItem';
import type { MessageProps } from '../MessageItem';

interface MessageListProps {
  messages: MessageProps[];
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const listRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className={styles.listContainer} ref={listRef}>
      {messages.map(msg => (
        <MessageItem key={msg.id} message={msg} />
      ))}
    </div>
  );
};

export default MessageList;
