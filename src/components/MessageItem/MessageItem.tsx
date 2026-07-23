import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User, Copy, Check } from 'lucide-react';
import styles from './MessageItem.module.scss';

export interface MessageProps {
  id: string;
  role: 'user' | 'ai';
  content: string;
}

const CodeBlock: React.FC<{ language?: string; value: string }> = ({ language, value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles.codeBlockWrapper}>
      <div className={styles.codeHeader}>
        <span className={styles.codeLang}>{language || 'code'}</span>
        <button className={styles.copyBtn} onClick={handleCopy} title="Sao chép">
          {copied ? <Check size={14} className={styles.copiedIcon} /> : <Copy size={14} />}
          <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
        </button>
      </div>
      <pre className={styles.preCode}>
        <code>{value}</code>
      </pre>
    </div>
  );
};

const MessageItem: React.FC<{ message: MessageProps }> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`${styles.messageWrapper} ${isUser ? styles.user : styles.ai}`}>
      <div className={styles.avatar}>
        {isUser ? (
          <div className={styles.userAvatar}>
            <User size={18} />
          </div>
        ) : (
          <div className={styles.aiAvatar}>
            <Bot size={20} />
          </div>
        )}
      </div>

      <div className={styles.contentContainer}>
        <div className={styles.authorName}>
          {isUser ? 'Bạn' : 'Kỹ sư trưởng ONI'}
        </div>

        <div className={isUser ? styles.userBubble : styles.aiBubble}>
          {isUser ? (
            <div className={styles.userText}>{message.content}</div>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  const codeString = String(children).replace(/\n$/, '');
                  return !inline ? (
                    <CodeBlock language={match ? match[1] : ''} value={codeString} />
                  ) : (
                    <code className={styles.inlineCode} {...props}>
                      {children}
                    </code>
                  );
                },
                table({ children }) {
                  return (
                    <div className={styles.tableWrapper}>
                      <table className={styles.markdownTable}>{children}</table>
                    </div>
                  );
                }
              }}
            >
              {message.content || '...'}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
