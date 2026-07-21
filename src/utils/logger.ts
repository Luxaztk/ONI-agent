import log from 'electron-log/renderer';

// Cấu hình định dạng log cho Renderer Process
log.transports.console.format = '[{h}:{i}:{s}.{ms}] [{level}] [UI] {text}';

// electron-log tự động forward log từ renderer lên main process và lưu vào chung file
export default log;
