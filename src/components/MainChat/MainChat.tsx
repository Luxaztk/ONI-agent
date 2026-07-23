import React from 'react';
import { Bot, Sparkles, Flame, Snowflake, Zap, Droplets } from 'lucide-react';
import styles from './MainChat.module.scss';
import MessageList from '../MessageList';
import ChatInput from '../ChatInput';
import { useChat } from '../../context/ChatContext';

interface QuickCard {
  icon: React.ReactNode;
  title: string;
  query: string;
  badge: string;
}

const QUICK_CARDS: QuickCard[] = [
  {
    icon: <Droplets size={20} className={styles.iconCyan} />,
    title: "Vòng Lập Làm Mát AT/ST",
    query: "Làm sao để làm mát căn cứ bằng hệ thống Thermo Aquatuner và Steam Turbine (AT/ST)?",
    badge: "Cooling"
  },
  {
    icon: <Zap size={20} className={styles.iconAmber} />,
    title: "SPOM Tự Cấp Điện",
    query: "Hướng dẫn xây dựng hệ thống SPOM (Self-Powering Oxygen Module) sản xuất Oxi tự cấp điện",
    badge: "Oxygen"
  },
  {
    icon: <Flame size={20} className={styles.iconRose} />,
    title: "Petroleum Boiler",
    query: "Cách đun dầu thô (Crude Oil) thành Petroleum bằng nhiệt Magma hiệu quả cao",
    badge: "Power"
  },
  {
    icon: <Snowflake size={20} className={styles.iconBlue} />,
    title: "Bẫy Lưu Trữ Vô Hạn",
    query: "Cách xây dựng bẫy nén áp suất lưu trữ chất lỏng và chất khí vô tận",
    badge: "Storage"
  }
];

const MainChat: React.FC = () => {
  const { messages, isLoading, sendMessage } = useChat();

  return (
    <div className={styles.mainChat}>
      {messages.length === 0 ? (
        <div className={styles.welcomeContainer}>
          <div className={styles.heroSection}>
            <div className={styles.avatarGlow}>
              <div className={styles.welcomeIcon}>
                <Bot size={44} />
              </div>
            </div>
            <h1 className={styles.welcomeTitle}>Kỹ Sư Trưởng ONI Agent</h1>
            <p className={styles.welcomeSubtitle}>
              Hệ thống AI Hỗ Trợ Kỹ Thuật, Tính Toán Công Suất & Trích Xuất Bản Thiết Kế Game <b>Oxygen Not Included</b>
            </p>
          </div>

          <div className={styles.suggestionsGrid}>
            <div className={styles.suggestionHeader}>
              <Sparkles size={16} className={styles.sparkleIcon} />
              <span>Gợi ý câu hỏi phổ biến:</span>
            </div>
            <div className={styles.cardsGrid}>
              {QUICK_CARDS.map((card, idx) => (
                <button
                  key={idx}
                  className={styles.cardItem}
                  onClick={() => sendMessage(card.query)}
                >
                  <div className={styles.cardTop}>
                    <div className={styles.cardIconBox}>{card.icon}</div>
                    <span className={styles.cardBadge}>{card.badge}</span>
                  </div>
                  <div className={styles.cardTitle}>{card.title}</div>
                  <div className={styles.cardQuery}>{card.query}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <MessageList messages={messages} />
      )}
      
      <div className={messages.length === 0 ? styles.inputWrapperCenter : styles.inputWrapperBottom}>
        <ChatInput onSendMessage={sendMessage} disabled={isLoading} />
      </div>
    </div>
  );
};

export default MainChat;
