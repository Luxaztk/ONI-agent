import React from 'react';
import { Plus, Sun, Moon, MessageSquare, Trash2 } from 'lucide-react';
import styles from './Sidebar.module.scss';
import { useTheme } from '../../context/ThemeContext';
import { useChat } from '../../context/ChatContext';

const Sidebar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { sessions, currentSessionId, createNewSession, selectSession, deleteSession } = useChat();

  return (
    <div className={styles.sidebar}>
      <button className={styles.newChatBtn} onClick={createNewSession}>
        <Plus size={18} />
        Cuộc hội thoại mới
      </button>

      <div className={styles.historyList}>
        {sessions.length === 0 ? (
          <div className={styles.emptyHistory}>Chưa có lịch sử trò chuyện</div>
        ) : (
          sessions.map(session => {
            const isActive = session.id === currentSessionId;
            return (
              <div
                key={session.id}
                className={`${styles.historyItem} ${isActive ? styles.active : ''}`}
                onClick={() => selectSession(session.id)}
              >
                <MessageSquare size={16} className={styles.itemIcon} />
                <span className={styles.itemTitle} title={session.title}>
                  {session.title}
                </span>
                <button
                  className={styles.deleteBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSession(session.id);
                  }}
                  title="Xóa cuộc hội thoại"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })
        )}
      </div>

      <div className={styles.bottomSection}>
        <button className={styles.themeToggle} onClick={toggleTheme}>
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          {theme === 'light' ? 'Chế độ tối' : 'Chế độ sáng'}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
