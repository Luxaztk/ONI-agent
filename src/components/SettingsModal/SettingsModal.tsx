import React, { useState, useEffect } from 'react';
import { X, Settings, Cpu, Cloud, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, Save, Zap, Plus, Minus } from 'lucide-react';
import styles from './SettingsModal.module.scss';
import type { AIConfig } from '../../types/settings';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_CONFIG: AIConfig = {
  provider: 'ollama',
  azure: {
    endpoint: '',
    apiKey: '',
    modelName: 'gpt-5.3-codex',
    apiVersion: '2024-06-01',
  },
  ollama: {
    port: 11434,
    model: 'nomic-embed-text',
  },
};

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState<AIConfig>(DEFAULT_CONFIG);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      if (window.electronAPI?.getSettings) {
        const loaded = await window.electronAPI.getSettings();
        if (loaded) {
          setConfig(loaded);
        }
      }
    } catch (e) {
      console.error('Lỗi khi nạp cài đặt:', e);
    }
  };

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      if (window.electronAPI?.testLLMConnection) {
        const res = await window.electronAPI.testLLMConnection(config);
        if (res.success) {
          setTestResult({ success: true, message: res.message || 'Kết nối thành công!' });
        } else {
          setTestResult({ success: false, message: res.error || 'Kết nối thất bại.' });
        }
      } else {
        setTestResult({ success: false, message: 'Tính năng này chỉ hỗ trợ trong môi trường Electron.' });
      }
    } catch (e: any) {
      setTestResult({ success: false, message: e.message || 'Lỗi kiểm tra kết nối.' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setTestResult(null);
    try {
      if (window.electronAPI?.saveSettings) {
        const res = await window.electronAPI.saveSettings(config);
        if (res.success) {
          setTestResult({ success: true, message: 'Đã lưu cấu hình thành công!' });
          setTimeout(() => {
            onClose();
          }, 800);
        } else {
          setTestResult({ success: false, message: res.error || 'Lỗi khi lưu cấu hình.' });
        }
      }
    } catch (e: any) {
      setTestResult({ success: false, message: e.message || 'Lỗi hệ thống khi lưu.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <Settings className={styles.icon} size={22} />
            <h2>Cài Đặt Cấu Hình AI Engine</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose} title="Đóng">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {/* Provider Selection */}
          <div className={styles.section}>
            <span className={styles.label}>Chế độ AI Engine</span>
            <div className={styles.providerGrid}>
              <div
                className={`${styles.providerCard} ${config.provider === 'ollama' ? styles.active : ''}`}
                onClick={() => setConfig({ ...config, provider: 'ollama' })}
              >
                <div className={styles.cardHeader}>
                  <span className={styles.cardTitle}>
                    <Cpu size={18} /> Ollama Local
                  </span>
                  <span className={`${styles.badge} ${styles.free}`}>Miễn phí</span>
                </div>
                <div className={styles.cardDesc}>
                  Chạy mô hình trên máy cục bộ. Không tốn phí API, tùy chọn mô hình đã pull.
                </div>
              </div>

              <div
                className={`${styles.providerCard} ${config.provider === 'azure' ? styles.active : ''}`}
                onClick={() => setConfig({ ...config, provider: 'azure' })}
              >
                <div className={styles.cardHeader}>
                  <span className={styles.cardTitle}>
                    <Cloud size={18} /> Azure AI / OpenAI
                  </span>
                  <span className={`${styles.badge} ${styles.pro}`}>Enterprise (BYOK)</span>
                </div>
                <div className={styles.cardDesc}>
                  Kết nối Cloud LLM siêu tốc (GPT-5.3-Codex, GPT-4o). Yêu cầu nhập Key cá nhân.
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Provider Form */}
          {config.provider === 'azure' ? (
            <div className={styles.section}>
              <span className={styles.label}>Cấu hình Azure AI Foundry / Azure OpenAI</span>
              
              <div className={styles.formGroup}>
                <label>Endpoint URL</label>
                <div className={styles.inputWrapper}>
                  <input
                    type="text"
                    placeholder="https://your-resource.openai.azure.com/"
                    value={config.azure.endpoint}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        azure: { ...config.azure, endpoint: e.target.value },
                      })
                    }
                  />
                </div>
                <span className={styles.hint}>Đường dẫn endpoint Azure OpenAI / Azure AI Foundry</span>
              </div>

              <div className={styles.formGroup}>
                <label>API Key (Được mã hóa an toàn bằng safeStorage)</label>
                <div className={styles.inputWrapper}>
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    placeholder="Nhập Azure API Key..."
                    value={config.azure.apiKey}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        azure: { ...config.azure, apiKey: e.target.value },
                      })
                    }
                  />
                  <button
                    type="button"
                    className={styles.inputIconBtn}
                    onClick={() => setShowApiKey(!showApiKey)}
                    title={showApiKey ? 'Ẩn Key' : 'Hiện Key'}
                  >
                    {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Deployment / Model Name</label>
                <div className={styles.inputWrapper}>
                  <input
                    type="text"
                    placeholder="gpt-5.3-codex"
                    value={config.azure.modelName}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        azure: { ...config.azure, modelName: e.target.value },
                      })
                    }
                  />
                </div>
                <div className={styles.modelSuggestions}>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Gợi ý:</span>
                  {['gpt-5.3-codex', 'gpt-4o', 'gpt-4o-mini'].map((model) => (
                    <span
                      key={model}
                      className={styles.chip}
                      onClick={() =>
                        setConfig({
                          ...config,
                          azure: { ...config.azure, modelName: model },
                        })
                      }
                    >
                      {model}
                    </span>
                  ))}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>API Version</label>
                <div className={styles.inputWrapper}>
                  <input
                    type="text"
                    placeholder="2024-06-01"
                    value={config.azure.apiVersion || '2024-06-01'}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        azure: { ...config.azure, apiVersion: e.target.value },
                      })
                    }
                  />
                </div>
                <div className={styles.modelSuggestions}>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Gợi ý:</span>
                  {['2024-06-01', '2024-02-01', '2024-08-01-preview', '2024-10-21'].map((ver) => (
                    <span
                      key={ver}
                      className={styles.chip}
                      onClick={() =>
                        setConfig({
                          ...config,
                          azure: { ...config.azure, apiVersion: ver },
                        })
                      }
                    >
                      {ver}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.section}>
              <span className={styles.label}>Cấu hình Ollama Cục Bộ</span>

              <div className={styles.formGroup}>
                <label>Ollama API Port</label>
                <div className={styles.inputWrapper}>
                  <input
                    type="number"
                    placeholder="11434"
                    value={config.ollama.port}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        ollama: { ...config.ollama, port: parseInt(e.target.value, 10) || 11434 },
                      })
                    }
                  />
                  <div className={styles.numberControls}>
                    <button
                      type="button"
                      onClick={() =>
                        setConfig({
                          ...config,
                          ollama: { ...config.ollama, port: Math.max(1, config.ollama.port - 1) },
                        })
                      }
                      title="Giảm Port (-1)"
                    >
                      <Minus size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setConfig({
                          ...config,
                          ollama: { ...config.ollama, port: Math.min(65535, config.ollama.port + 1) },
                        })
                      }
                      title="Tăng Port (+1)"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
                <span className={styles.hint}>Mặc định: 11434 (Tự động phát hiện port rảnh nếu trùng)</span>
              </div>

              <div className={styles.formGroup}>
                <label>Local LLM Model Name</label>
                <div className={styles.inputWrapper}>
                  <input
                    type="text"
                    placeholder="qwen2.5 / llama3.2 / gemma2"
                    value={config.ollama.model}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        ollama: { ...config.ollama, model: e.target.value },
                      })
                    }
                  />
                </div>
                <div className={styles.modelSuggestions}>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Gợi ý:</span>
                  {['qwen2.5', 'llama3.2', 'deepseek-r1', 'gemma2', 'nomic-embed-text'].map((m) => (
                    <span
                      key={m}
                      className={styles.chip}
                      onClick={() =>
                        setConfig({
                          ...config,
                          ollama: { ...config.ollama, model: m },
                        })
                      }
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Cellular / Offline Data Guard Section */}
          <div className={styles.section}>
            <span className={styles.label}>Bảo Vệ Dữ Liệu Di Động (Cellular Data Guard)</span>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.875rem', color: '#e2e8f0', background: 'rgba(255,255,255,0.03)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <input
                type="checkbox"
                style={{ width: '1.1rem', height: '1.1rem', accentColor: '#06b6d4', cursor: 'pointer' }}
                checked={Boolean(config.offlineMode)}
                onChange={(e) => setConfig({ ...config, offlineMode: e.target.checked })}
              />
              <div>
                <div style={{ fontWeight: 600, color: config.offlineMode ? '#22d3ee' : '#f8fafc' }}>
                  Bật Chế độ Tiết kiệm Mạng Di động (Offline Mode)
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                  Khóa 100% kết nối cào mạng ngoài. Ứng dụng chỉ truy xuất dữ liệu vector offline có sẵn trên máy.
                </div>
              </div>
            </label>
          </div>

          {/* Test connection & Save feedback status */}
          {testResult && (
            <div
              className={`${styles.statusMessage} ${
                testResult.success ? styles.success : styles.error
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
              ) : (
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
              )}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button
            className={styles.testBtn}
            onClick={handleTestConnection}
            disabled={isTesting || isSaving}
          >
            {isTesting ? <Loader2 size={16} className={styles.spin} /> : <Zap size={16} />}
            <span>{isTesting ? 'Đang kiểm tra...' : 'Kiểm tra kết nối'}</span>
          </button>

          <div className={styles.actionGroup}>
            <button className={styles.cancelBtn} onClick={onClose} disabled={isSaving}>
              Hủy
            </button>
            <button className={styles.saveBtn} onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 size={16} className={styles.spin} /> : <Save size={16} />}
              <span>Lưu Cấu Hình</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
