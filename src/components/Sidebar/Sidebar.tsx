import React from 'react';
import { Plus, Sun, Moon } from 'lucide-react';
import styles from './Sidebar.module.scss';
import { useTheme } from '../../context/ThemeContext';

const Sidebar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={styles.sidebar}>
      <button className={styles.newChatBtn}>
        <Plus size={18} />
        New Chat
      </button>

      <div className={styles.historyList}>
        {/* Lịch sử chat sẽ được render ở đây sau này */}
      </div>

      <div className={styles.bottomSection}>
        <button className={styles.themeToggle} onClick={toggleTheme}>
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          {theme === 'light' ? 'Dark mode' : 'Light mode'}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
