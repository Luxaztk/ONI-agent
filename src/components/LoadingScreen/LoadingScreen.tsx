import { useEffect, useState } from 'react';
import './LoadingScreen.scss';

export const LoadingScreen = ({ onReady }: { onReady: () => void }) => {
  const [status, setStatus] = useState<string>('Đang khởi tạo...');
  const [percent, setPercent] = useState<number>(0);

  useEffect(() => {
    if (!window.electronAPI?.onLoadingProgress) {
      setStatus('Lỗi: Không thể kết nối với hệ thống lõi (electronAPI missing). Hãy thử khởi động lại ứng dụng.');
      return;
    }

    window.electronAPI.onLoadingProgress((msg, pct) => {
      setStatus(msg);
      setPercent(pct);
      if (pct === 100 && msg === 'Sẵn sàng') {
        setTimeout(onReady, 500); // Đợi 1 chút để UI kịp cập nhật 100%
      }
    });
  }, [onReady]);

  if (percent === 100 && status === 'Sẵn sàng') {
    return null; // Trả quyền render cho Layout
  }

  return (
    <div className="loading-screen">
      <div className="loading-content">
        <h1 className="title">ONI Agent</h1>
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${percent > 0 ? percent : 0}%` }}></div>
        </div>
        <div className="status-text">{status} {percent > 0 && percent < 100 ? `(${percent}%)` : ''}</div>
      </div>
    </div>
  );
};
