import log from 'electron-log/main';

// Cấu hình định dạng log cho Main Process
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] [Main] {text}';
log.transports.console.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] [Main] {text}';

// Bắt tự động các lỗi không mong muốn
log.errorHandler.startCatching();

export default log;
