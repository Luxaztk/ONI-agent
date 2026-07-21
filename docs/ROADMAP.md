# Roadmap: ONI AI Agent (TypeScript + Electron ADK)

## Phase 1: Chuyển đổi Kiến trúc & Cấu hình (Tuần 1)
- [x] Xóa bỏ cấu trúc Python cũ.
- [x] Đổi tên dự án Frontend thành `app` và tích hợp cấu trúc Electron.
- [x] Cài đặt các thư viện AI (LangChain.js, ChromaDB, Ollama).
- [x] Viết code khởi tạo `Electron Main Process` và `Preload script` bảo mật.
- [x] Cấu hình Vite để có thể build song song Main và Renderer process.

## Phase 2: Bộ não AI (Main Process) (Tuần 2)
- [x] Khởi tạo kết nối với mô hình `gemma:2b` qua thư viện `ollama` cục bộ.
- [x] Viết logic LangChain.js để quản lý luồng RAG trong Node.js.
- [x] Tích hợp VectorDB cục bộ (thay cho Chroma để không cần cài Server).
- [x] (Dữ liệu) Viết script đọc file JSON thô, tạo vector bằng `nomic-embed-text` qua Ollama và lưu xuống ổ cứng.

## Phase 3: Giao diện Chat (Renderer Process) (Tuần 3)
- [x] Xây dựng UI Component (Sidebar, Chat Area, Input) bằng React.
- [x] Gửi request từ UI (Renderer) lên AI Engine (Main) thông qua `ipcRenderer`.
- [x] Xử lý Streaming Text (chữ hiện dần dần) qua IPC event.
- [ ] Quản lý trạng thái bằng React Context.

## Phase 4: Cô lập Môi trường & Đóng gói (Tuần 4)
- [ ] Xây dựng module `OllamaManager.ts` để quản lý vòng đời tiến trình con của Ollama.
- [ ] Thiết lập tải tự động binary `ollama.exe` (chỉ tải bản Windows cho MVP).
- [ ] Định tuyến `OLLAMA_MODELS` về `%APPDATA%` và `OLLAMA_HOST` về port ngẫu nhiên.
- [ ] Xây dựng cơ chế **Auto-Update VectorDB**: Tự động chuyển DB từ `resources` vào `%APPDATA%`.
- [ ] Thiết lập luồng kiểm tra dữ liệu cũ: Oni-db (Time-based 30 ngày), Wiki (API version check).
- [ ] Bổ sung tính năng cào ngầm bằng `puppeteer-core` (dùng chung lõi Chromium của Electron) và tích hợp nút "Check Update" trên UI.
- [ ] Đóng gói toàn bộ ứng dụng thành 1 file `.exe` duy nhất bằng Electron Builder.
