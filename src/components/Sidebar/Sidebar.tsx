import React, { useState } from 'react';
import { Plus, Sun, Moon, MessageSquare, Trash2, RefreshCw, Settings, Cpu } from 'lucide-react';
import styles from './Sidebar.module.scss';
import { useTheme } from '../../context/ThemeContext';
import { useChat } from '../../context/ChatContext';
import SettingsModal from '../SettingsModal/SettingsModal';
import EngineeringStudioModal from '../EngineeringStudio/EngineeringStudioModal';

const Sidebar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { sessions, currentSessionId, createNewSession, selectSession, deleteSession, sendMessage } = useChat();
  const [isChecking, setIsChecking] = useState(false);
  const [updateStatus, setUpdateStatus] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStudioOpen, setIsStudioOpen] = useState(false);

  const handleCheckUpdate = async () => {
    if (isChecking) return;
    setIsChecking(true);
    setUpdateStatus('Đang kiểm tra...');
    try {
      if ((window as any).electronAPI?.checkUpdate) {
        const res = await (window as any).electronAPI.checkUpdate();
        if (res.error) {
          setUpdateStatus('Lỗi: ' + res.error);
        } else if (res.hasUpdates) {
          setUpdateStatus('Đã cập nhật tri thức!');
        } else {
          setUpdateStatus('Tri thức đã mới nhất');
        }
      } else {
        setUpdateStatus('Nút này dành cho Electron');
      }
    } catch (e: any) {
      setUpdateStatus('Lỗi kiểm tra');
    } finally {
      setTimeout(() => {
        setIsChecking(false);
        setTimeout(() => setUpdateStatus(''), 4000);
      }, 800);
    }
  };

  const handleSendStudioToChat = (text: string) => {
    sendMessage(text);
  };

  return (
    <>
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
          <button
            className={styles.themeToggle}
            onClick={() => setIsStudioOpen(true)}
            title="Mở ONI Engineering & Blueprint Studio V3"
            style={{
              background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.15), rgba(123, 97, 255, 0.15))',
              borderColor: 'rgba(0, 229, 255, 0.3)',
              color: '#00e5ff',
              fontWeight: 'bold'
            }}
          >
            <Cpu size={18} />
            <span>Engineering Studio V3</span>
          </button>

          <button
            className={`${styles.actionBtn} ${isChecking ? styles.checking : ''}`}
            onClick={handleCheckUpdate}
            disabled={isChecking}
            title="Kiểm tra Cập nhật Tri thức"
          >
            <RefreshCw size={16} className={isChecking ? styles.spinIcon : ''} />
            <span>{updateStatus || 'Cập nhật Tri thức'}</span>
          </button>

          <button
            className={styles.themeToggle}
            onClick={() => setIsSettingsOpen(true)}
            title="Cài đặt Cấu hình AI Engine"
          >
            <Settings size={18} />
            <span>Cài đặt AI Engine</span>
          </button>

          <button className={styles.themeToggle} onClick={toggleTheme}>
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            {theme === 'light' ? 'Chế độ tối' : 'Chế độ sáng'}
          </button>
        </div>
      </div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <EngineeringStudioModal
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        onSendToChat={handleSendStudioToChat}
      />
    </>
  );
};

export default Sidebar;

