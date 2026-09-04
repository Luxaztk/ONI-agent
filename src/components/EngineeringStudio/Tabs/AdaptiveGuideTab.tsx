import React from 'react';
import type { ONIBlueprint } from '../../../types/blueprint';
import styles from './AdaptiveGuideTab.module.scss';
import { RefreshCw, Bot } from 'lucide-react';

interface AdaptiveGuideTabProps {
  blueprint: ONIBlueprint;
  onSendToChat: (text: string) => void;
}

export const AdaptiveGuideTab: React.FC<AdaptiveGuideTabProps> = ({ blueprint, onSendToChat }) => {
  const swapTable = blueprint.materialSwapTable || [];

  const handleAskAIAboutMaterial = () => {
    const msg = `[Material Swap Request] Tôi đang chuẩn bị xây bản vẽ "${blueprint.title}" nhưng thiếu một số vật liệu chuẩn. Nhờ AI tư vấn vật liệu thay thế thích hợp cho môi trường căn cứ của tôi!`;
    onSendToChat(msg);
  };

  return (
    <div className={styles.guideContainer}>
      <div className={styles.swapSection}>
        <h3><RefreshCw size={18} /> Bảng Tư Vấn Thay Thế Vật Liệu (Material Swap Table)</h3>
        
        {swapTable.length === 0 ? (
          <p style={{ color: '#888', fontStyle: 'italic', marginTop: '10px' }}>
            Bản vẽ này sử dụng vật liệu cơ bản chuẩn (Igneous Rock, Copper Wire). Có thể xây dựng trực tiếp mà không cần vật liệu hiếm.
          </p>
        ) : (
          <table className={styles.materialTable}>
            <thead>
              <tr>
                <th>Vật Liệu Chuẩn</th>
                <th>Vật Liệu Thay Thế</th>
                <th>Giới Hạn Nhiệt (°C)</th>
                <th>Đánh Giá</th>
                <th>Ghi Chú Kỹ Thuật</th>
              </tr>
            </thead>
            <tbody>
              {swapTable.map((item, idx) => (
                <tr key={idx}>
                  <td><strong>{item.originalMaterial}</strong></td>
                  <td>{item.targetMaterial}</td>
                  <td>{item.temperatureLimitC}°C</td>
                  <td>
                    <span className={item.recommendation === 'optimal' ? styles.badgeOptimal : styles.badgeWarning}>
                      {item.recommendation.toUpperCase()}
                    </span>
                  </td>
                  <td>{item.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className={styles.advisorCard}>
        <h4><Bot size={18} /> AI Adaptive Advisor Note</h4>
        <p>
          Mẹo tối ưu: Khi thiết kế <strong>{blueprint.title}</strong> tại địa hình chật hẹp, bạn có thể điều chỉnh vị trí của các khối gạch cách nhiệt mà không làm gián đoạn luồng chảy khí/nước. Nếu cần hỗ trợ tùy biến theo sơ đồ căn cứ thực tế của bạn, hãy bấm nút tư vấn bên dưới.
        </p>
        <button
          onClick={handleAskAIAboutMaterial}
          style={{
            marginTop: '12px',
            padding: '8px 16px',
            background: '#7b61ff',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Hỏi AI Tư Vấn Địa Hình & Vật Liệu
        </button>
      </div>
    </div>
  );
};
