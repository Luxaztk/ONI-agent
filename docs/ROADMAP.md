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

## Phase 7: Công Cụ Tính Toán Kỹ Thuật & Multi-Layer Blueprint Engine V3 (Cấp 1.2)
- [x] **Giao Diện Engineering Calculators Panel**:
  - [x] **SPOM Calculator**: Tính toán số lượng Electrolyzer, Hydrogen Generator, Pump & lọc khí cần thiết cho N Duplicants.
  - [x] **AT/ST Heat & Cooling Calculator**: Tính số lượng Steam Turbine cần thiết để giải nhiệt cho Aquatuner chạy Coolant bất kỳ (Polluted Water, Super Coolant, Naphtha).
  - [x] **Food & Resource Calculator**: Tính sản lượng Calo, Nước tưới, Phân bón và số Cây trồng / Động vật cần duy trì.
- [x] **Mở Rộng Thư Mục Master Blueprints (`data/blueprints/`)**:
  - [x] Biên soạn và chuẩn hóa kho Master Blueprints mở rộng (50+ bản vẽ bao gồm SPOM, AT/ST, Petroleum/Sour Gas Boiler, Infinite Storages, Tamers, Rocketry, Shipping Hubs...).
- [x] **Bộ Sinh Sơ Đồ Multi-Layer Blueprint Engine (Bao Phủ 6 Overlays ONI)**:
  - [x] **Tab 1 - Multi-Diagram Mermaid Logic Engine**: Xuất sơ đồ luồng Mermaid phân tách riêng biệt theo từng Layer (Logic Kiến trúc, Đường Nước 🔵, Đường Khí 🟢, Mạch Điện 🟡 & Automation 🔴, Băng chuyền 📦).
  - [x] **Tab 2 - Interactive `<BlueprintViewer />` với 6-Layer Switcher**: Canvas 2D có thanh công cụ chuyển lớp (`Building`, `Liquid`, `Gas`, `Power`, `Automation`, `Shipping`) và chế độ đè lớp `Composite Mode` kèm nút Copy Blueprint String.
  - [x] **Tab 3 - Adaptive Base Guide Engine**: LLM tư vấn thay thế vật liệu (Material Swap Table) và điều chỉnh linh kiện phù hợp với địa hình & diện tích thực tế của căn cứ người chơi.
- [x] **Tích Hợp LLM Tool Calling Layer**:
  - [x] Kết nối các Calculator Module & Multi-Layer Blueprint Viewer với LLM Tool Agent để tự động kích hoạt khi người dùng đặt câu hỏi thiết kế trong Chat.



## Phase 8: Chuyên Gia Soi Lỗi Trực Quan - Vision Debugger Agent (Cấp 2.1 & 2.2)
- [ ] **Giao Diện Tương Tác Visual Debugger (Renderer Process)**:
  - [ ] Tích hợp tính năng Kéo-Thả (Drag & Drop) và Dán (Ctrl+V) ảnh chụp màn hình vào Khung Chat.
  - [ ] **Crop Tool & Overlay Selector**: Cho phép người dùng khoanh vùng đường ống/dây điện hoặc chọn loại Overlay (Plumbing, Electrical, Automation, Gas).
- [ ] **Tích Hợp Vision Model (Ollama / Azure Vision API)**:
  - [ ] Cấu hình Ollama hỗ trợ VLM (Moondream2 / LLaVA) hoặc Azure OpenAI Vision API (`gpt-4o` / `gpt-5.3-vision`).
  - [ ] **Rule-based Port Checker Engine**: Kiểm tra quy tắc màu sắc đường ống ONI:
    - Cổng Trắng (Input) -> Cổng Trắng (Lỗi trùng lối vào).
    - Cổng Xanh (Output) -> Cổng Xanh (Lỗi trùng lối ra).
    - Phát hiện ngược chiều Bridge (Liquid/Gas/Bridge / Automation Filter).

## Phase 9: Người Gác Đền Thời Gian Thực - Real-time Telemetry Agent (Cấp 3.1 & 3.2)
- [ ] **Xây Dựng C# Harmony Mod (`ONI-Agent-Observer.dll`)**:
  - [ ] Hook vào sự kiện kết thúc Cycle (`GameClock.Instance`) và `SaveGame`.
  - [ ] Xuất dữ liệu thống kê sinh tồn ra đĩa cục bộ (`%APPDATA%/Klei/OxygenNotIncluded/mods/data/telemetry.json`).
  - [ ] Thu thập dữ liệu: Than, Nước, Dầu, Oxy, Thực phẩm, Áp suất trung bình, Nhiệt độ các vòm sinh thái.
- [ ] **Bộ Lắng Nghe & Cảnh Báo Ngầm Electron (`TelemetryWatcher.ts`)**:
  - [ ] Lắng nghe sự thay đổi file bằng `fs.watch` với giao thức Debounce chống ghi chồng.
  - [ ] **Predictive Burn & Threat Engine**: Tính toán tốc độ tiêu thụ tài nguyên (Burn rate) và tự động phát hiện nguy cơ thảm họa (ví dụ: *Còn 4.2 chu kỳ là cạn Than*, *Nhiệt độ nước vượt 35°C*).
  - [ ] **Telemetry HUD Bar & Toast Alerts**: Hiển thị thanh chỉ số thời gian thực ở đầu ứng dụng Electron và gửi thông báo pop-up cảnh báo.

## Phase 10: Tự Động Hóa Bản Thiết Kế - Autonomous Blueprint Agent (Cấp 4.1 & 4.2)
- [ ] **Chương Trình Quản Lý & Xuất/Nhập Blueprint (Blueprint Studio)**:
  - [ ] Hỗ trợ chuẩn nén Blueprint ONI (`.blueprint` / JSON base64).
  - [ ] Hiển thị sơ đồ 2D Blueprint trực quan trong Electron kèm danh sách vật liệu xây dựng tổng hợp.
- [ ] **Mod C# Giao Tiếp 2 Chiều (`ONI-Agent-Bridge.dll`)**:
  - [ ] Lắng nghe lệnh gửi từ Electron IPC (`%APPDATA%/oni-agent/blueprint_request.json`).
  - [ ] **Geyser & Terrain Scanner**: Đọc thông số Mạch nước phun / Núi lửa khi người chơi chọn vào đối tượng trong game.
  - [ ] **AI Blueprint Generator**: Sinh bản thiết kế Tamer tối ưu dựa trên khoảng trống địa hình thực tế xung quanh.
  - [ ] **In-game Ghost Placement Engine**: Gọi API Harmony trong game để tự động đặt bóng công trình (Ghost Construction Plan) lên bản đồ.

