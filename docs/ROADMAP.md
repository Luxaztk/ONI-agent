# Roadmap: ONI AI Agent (TypeScript + Electron ADK)

## Phase 1: Chuyển đổi Kiến trúc & Cấu hình (Tuần 1)
- [x] Xóa bỏ cấu trúc Python cũ.
- [x] Đổi tên dự án Frontend thành `app` và tích hợp cấu trúc Electron.
- [x] Cài đặt các thư viện AI (LangChain.js, Ollama, LanceDB).
- [x] Viết code khởi tạo `Electron Main Process` và `Preload script` bảo mật.
- [x] Cấu hình Vite để có thể build song song Main và Renderer process.

## Phase 2: Bộ não AI (Main Process) (Tuần 2)
- [x] **Tối Ưu Hóa Ollama Engine**: Loại bỏ hoàn toàn mô hình `gemma:2b` dư thừa (~1.7GB) để tiết kiệm CPU/GPU, RAM và băng thông. Ollama chạy ngầm phục vụ duy nhất mô hình vector embeddings `nomic-embed-text`.
- [x] Viết logic LangChain.js để quản lý luồng RAG trong Node.js.
- [x] **Chuyển đổi VectorDB sang LanceDB**: Thay thế JSON Vector Store bằng LanceDB đĩa phẳng hiệu năng cao (`oni_knowledge.lance`).
- [x] **Nạp 1,927 Vectors Tri Thức**: Viết script `migrate_json_to_lancedb.ts` chuyển đổi toàn bộ kho tri thức thô kèm chuẩn hóa metadata schema.
- [x] Tự động khởi tạo bảng (`db.createTable`) nếu thiếu và đồng bộ dữ liệu vào `%APPDATA%/oni-agent/lancedb/`, xóa bỏ 100% cảnh báo `Table not found`.

## Phase 3: Giao diện Chat & Trải nghiệm Người Dùng (Renderer Process) (Tuần 3)
- [x] **Trình Trình Bày Markdown Cao Cấp**: Tích hợp `react-markdown` + `remark-gfm` hiển thị Tiêu đề, Bảng thông số kỹ thuật, Danh sách, Trích dẫn và Khung mã nguồn.
- [x] **Nút Sao Chép Mã (Copy Code Button)**: Thanh tiêu đề khung mã tích hợp nút Copy mã/bản thiết kế 1-touch.
- [x] **Avatar Phân Biệt Nổi Bật**: Avatar Kỹ Sư Trưởng AI phát sáng Cyan/Blue và Avatar Người chơi Indigo/Violet.
- [x] **Welcome Hero & Quick Suggestion Cards**: Màn hình chào với 4 thẻ gợi ý câu hỏi phổ biến (AT/ST, SPOM, Petroleum Boiler, Infinite Storage).
- [x] **Khung Nhập Nổi Floating Input Box**: Thiết kế khung chat nổi với hiệu ứng viền phát sáng Cyan (`glow focus`).
- [x] **Ẩn Tất Cả Thanh Cuộn (Universal Scrollbar Hiding)**: Triệt tiêu 100% thanh cuộn trên toàn giao diện (Sidebar, Main Chat, Message List, Code Block, Table) nhưng giữ nguyên khả năng cuộn chuột mượt mà.
- [x] **Lưu Trữ Lịch Sử Chat Bằng File APPDATA**: Tự động lưu/nạp danh sách các phiên trò chuyện vào file `%APPDATA%/oni-agent/chat_history.json` an toàn vĩnh viễn (không dính mốc giới hạn 5MB của `localStorage`).
- [x] **Tái Cấu Trúc Single Source of Truth**: Loại bỏ hoàn toàn xung đột state giữa `MainChat` và `ChatContext`, triệt tiêu 100% lỗi tạo trùng lặp 2 phiên chat trên Sidebar.

## Phase 4: Môi trường, Tích hợp Model & Đóng gói (Tuần 4)
- [x] Xây dựng module `OllamaManager.ts` để quản lý vòng đời tiến trình con của Ollama.
- [x] **Giải Quyết Xung Đột Quyền & Tiến Trình Windows (EBUSY & Process Tree Cleanup)**:
  - [x] Tự động thực thi `taskkill /F /IM ollama.exe /T` trước khi giải nén/khởi động để diệt triệt để cây tiến trình con chạy ngầm và giải phóng file lock DLL (`cublas64_13.dll`).
  - [x] Cấu hình giải nén an toàn `extractAllTo(binDir, false)` ngăn lỗi EBUSY khi ghi đè DLL CUDA đang bị GPU chiếm giữ.
  - [x] Đăng ký sự kiện `before-quit` và `will-quit` trong Electron Main Process giải phóng tiến trình khi tắt app.
- [x] **Mở Khóa Sức Mạnh Enterprise LLM**: Cấu hình kết nối Microsoft Azure AI Foundry / Azure OpenAI (`gpt-5.3-codex`) với `maxTokens: 4096` và `timeout: 60000` chống ngắt luồng stream giữa chừng.
- [x] Sửa lỗi đóng gói Electron ES Module Scope & shim `__dirname` / `apache-arrow`.
- [x] **Ma Trận Đồng Bộ Tri Thức Ngầm (Startup Sync Matrix)**:
  - [x] Custom Guides: So sánh mã MD5 Hash của từng file.
  - [x] Steam Guides: Đồng bộ theo chu kỳ 7 ngày.
  - [x] Wiki.gg: Theo dõi số lượng chỉnh sửa MediaWiki API `last_edits_count` (71,194 edits).
  - [x] ONI-DB: Đồng bộ theo chu kỳ 30 ngày.
- [x] Sửa triệt để lỗi cào lại mạng ngoài ý muốn khi restart app bằng cách lưu đúng mốc mtime và `last_edits_count` trong `%APPDATA%/oni-agent/meta.json`.
- [x] Bổ sung tính năng cào ngầm bằng `puppeteer-core` (dùng chung lõi Chromium của Electron) và tích hợp nút "Check Update" trên UI.
- [x] Đóng gói toàn bộ ứng dụng thành 1 file `.exe` cài đặt Windows (NSIS Installer) bằng Electron Builder.

## Phase 5: Mở Rộng Tri Thức Cộng Đồng & Tối Ưu RAG Nâng Cao
- [x] **Phase 5.1: Mở Rộng Wiki.gg Crawler (16 Danh mục cốt lõi)**
  - [x] Nâng cấp `wikiCrawler.ts` quét 16 danh mục/trang cốt lõi (`Category:Guides`, `Building`, `Geysers`, `Elements`, `Duplicant`, `Critters`, `Disease`, `Skills`, `Equipment`, `Food`, `Category:Research`, `Biome`, `Resource`, `Asteroid_Types`, `Planetoid_Clusters`).
- [x] **Phase 5.2: Hướng Dẫn Cục Bộ Custom Guides (`data/custom_guides/`)**
  - [x] Tạo thư mục `data/custom_guides/`.
  - [x] Biên soạn các file Markdown chuẩn cho các mô hình huyền thoại theo Jahws Compendium (AT/ST, Rodriguez SPOM, Petroleum Boiler, Infinite Storage, Volcano Tamers...).
  - [x] Cập nhật worker `ingest.ts` để tự động nạp toàn bộ file trong `data/custom_guides/` vào Vector DB.
- [x] **Phase 5.3: Community & Steam Guides Crawler (0 Token LLM)**
  - [x] Viết module `steamCrawler.ts` cào bài viết văn bản từ Steam Community Guides (*The Compendium of Amazing Designs*) qua Cheerio/JSDOM.
  - [x] Tự động bóc tách từng phân đoạn `.subSectionTitle` & `.subSectionText` thành các Document độc lập.
- [x] **Phase 5.4: Tối Ưu Hóa Enterprise RAG Pipeline**
  - [x] **LLM Query Rewriter (`queryRewriter.ts`)**: Sử dụng LLM tự động mở rộng và giải mã các từ khóa viết tắt kỹ thuật ONI (SPOM, AT/ST, Boiler, Hydra, Rodriguez) trước khi tra cứu RAG.
  - [x] **LLM Cross-Reranker (`reranker.ts`)**: Lấy `k=25` candidates từ LanceDB và dùng LLM Cross-Reranker để lọc ra 8 đoạn tri thức xuất sắc nhất.
  - [x] **ONI Engineering Tools (`tools/index.ts`)**: Tích hợp các công cụ tra cứu công thức chế tạo, tính toán công suất kỹ thuật và tra cứu LanceDB RAG.
  - [x] **Multi-Turn Chat History**: Tự động ghi nhớ và đưa 6 tin nhắn gần nhất (`ChatMessage[] history`) vào ngữ cảnh Prompt RAG.

## Phase 6: Quản Lý Cấu Hình LLM & Giao Diện Cài Đặt (BYOK & Security UI)
- [x] **Thiết Kế Giao Diện Cài Đặt (Settings Modal / Page UI)**:
  - [x] Tạo UI cho phép chọn chế độ AI: **Ollama Local (Miễn phí)** hoặc **Azure AI Foundry / Azure OpenAI (BYOK - Nhập Key cá nhân)**.
  - [x] Form nhập dữ liệu cấu hình: `Endpoint`, `API Key`, `Model Name`.
  - [x] Tích hợp nút **"Kiểm tra kết nối" (Test Connection)** xác nhận API Key hoạt động trước khi lưu.
- [x] **Bảo Mật API Key Cá Nhân Cục Bộ**:
  - [x] Sử dụng API `safeStorage` của Electron để mã hóa API Key trước khi lưu xuống đĩa cục bộ, ngăn chặn rò rỉ khi người dùng sử dụng máy.
  - [x] Đảm bảo ứng dụng không nhúng bất kỳ API Key mặc định nào trong bản build thương mại để bảo vệ tài khoản nhà phát triển.
