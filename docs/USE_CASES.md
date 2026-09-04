# 🎯 Các Kịch Bản Sử Dụng Thực Tế (Use Cases) - ONI Agent

> **Tài liệu**: Tổng hợp các kịch bản sử dụng (Use Cases) điển hình của hệ thống **ONI Agent** trong quá trình chơi game *Oxygen Not Included*.  
> **Đối tượng người dùng**: Người chơi từ sơ cấp (Beginner), trung cấp (Mid-game) đến kỹ sư chuyên nghiệp (Late-game / Space-age).

---

## 📑 Mục Lục Use Cases

| Mã UC | Tên Kịch Bản Sử Dụng | Giai Đoạn Game | Công Cụ / Module Sử Dụng |
| :--- | :--- | :--- | :--- |
| **UC-01** | [Thiết kế Hệ thống Điện Phân Oxy Tự Cấp Điện (SPOM)](#uc-01-thiết-kế-hệ-thống-điện-phân-oxy-tự-cấp-điện-spom) | Đầu & Giữa Game | SPOM Calculator + Blueprint Canvas + Chat |
| **UC-02** | [Kiểm Soát Tải Nhiệt Căn Cứ Bằng Vòng Lặp AT/ST Cooling](#uc-02-kiểm-soát-tải-nhiệt-căn-cứ-bằng-vòng-lặp-atst-cooling) | Giữa Game (Mid-Game) | AT/ST Calculator + Material Swap + Mermaid |
| **UC-03** | [Thuần Hóa & Khai Thác Mạch Hơi Nước / Núi Lửa (Geyser Tamer)](#uc-03-thuần-hóa--khai-thác-mạch-hơi-nước--núi-lửa-geyser-tamer) | Giữa & Cuối Game | Geyser Pipeline Balancer + Master Blueprints |
| **UC-04** | [Xây Dựng Petroleum Boiler Đun Dầu Tỷ Lệ 1:1](#uc-04-xây-dựng-petroleum-boiler-đun-dầu-tỷ-lệ-11) | Cuối Game (Late-Game) | RAG Chat + Blueprint Canvas (Composite Mode) |
| **UC-05** | [Xây Dựng Bẫy Nén Áp Suất Lưu Trữ Vô Tận (Infinite Storage)](#uc-05-xây-dựng-bẫy-nén-áp-suất-lưu-trữ-vô-tận-infinite-storage) | Mọi Giai Đoạn | Quick Card + Vector Search RAG |
| **UC-06** | [Quy Hoạch Nông Nghiệp & Quản Lý Dinh Dưỡng Dân Số Lớn](#uc-06-quy-hoạch-nông-nghiệp--quản-lý-dinh-dưỡng-dân-số-lớn) | Mọi Giai Đoạn | Food & Resource Calculator |
| **UC-07** | [Tra Cứu Thông Số Vật Liệu & Phản Ứng Chuyển Pha Nhanh](#uc-07-tra-cứu-thông-số-vật-liệu--phản-ứng-chuyển-pha-nhanh) | Tức Thời Trong Game | Recipe Lookup Tool + Local LanceDB |
| **UC-08** | [Vận Hành Ngoại Tuyến An Toàn Trên Laptop / Mạng Di Động](#uc-08-vận-hành-ngoại-tuyến-an-toàn-trên-laptop--mạng-di-động) | Du Lịch / Không Mạng | Offline Guard + Ollama Local Engine |

---

## UC-01: Thiết Kế Hệ Thống Điện Phân Oxy Tự Cấp Điện (SPOM)

### 📌 Bối Cảnh & Vấn Đề
Căn cứ của người chơi tăng trưởng từ 8 lên 20 Duplicants. Nguồn Tảo (Algae) dùng cho máy khử CO2 và khuếch tán oxy cạn kiệt. Căn cứ thiếu Oxy trầm trọng. Người chơi cần xây dựng cụm điện phân nước (Electrolyzer) tự phân loại Oxy/Hydro mà không tốn thêm điện từ lưới chính (Self-Powered).

```mermaid
graph LR
    A[Người chơi chọn 20 Duplicants] --> B[SPOM Calculator tính toán]
    B --> C[Kết quả: 3 Electrolyzers, 3.0 kg/s Nước, 6 Bơm O2, 2 Bơm H2]
    C --> D[Gợi ý bản vẽ: Full Rodriguez SPOM]
    D --> E[Mở Blueprint Canvas xem 6 lớp]
    E --> F[Sao chép Blueprint String & Xây dựng trong ONI]
```

### 🛠️ Các Bước Thực Hiện
1. Nhấn nút **Engineering Studio V3** ở thanh Sidebar $\to$ chọn tab **Calculators Panel**.
2. Tại mục **SPOM Calculator**, kéo thanh trượt số lượng Duplicants lên `20`.
3. Hệ thống hiển thị tức thời:
   - **Nhu cầu Oxy**: `2000 g/s` ($2.0\text{ kg/s}$).
   - **Số Electrolyzer cần**: `3 máy` (công suất $888\text{ g/s/máy}$).
   - **Nước sạch tiêu thụ**: `3.0 kg/s`.
   - **Sản lượng Hydro**: `336 g/s` $\implies$ Cấp cho 3 máy phát Hydrogen Generator sinh ra $+2400\text{W}$.
   - **Cân bằng điện**: Dư thừa $+480\text{W}$ (Đạt chuẩn *Self-Powered*).
4. Nhấn **"Xem Bản Vẽ Đề Xuất"** để chuyển sang **Blueprint Canvas** xem chi tiết vị trí buồng bẫy khí Hydro ở trên đỉnh và 6 máy bơm Oxy bên dưới.
5. Nhấn **"Gửi vào Chat"** để Kỹ Sư Trưởng AI tư vấn thêm về vị trí đặt cảm biến Atmo Sensor ($>750\text{g}$).

---

## UC-02: Kiểm Soát Tải Nhiệt Căn Cứ Bằng Vòng Lặp AT/ST Cooling

### 📌 Bối Cảnh & Vấn Đề
Khu vực máy móc công nghiệp (Máy ép phân, Máy nung quặng, Máy phát điện) tỏa nhiệt khiến nhiệt độ trung tâm căn cứ lên đến $45^\circ\text{C}$. Ruộng trồng Bánh sâu (Mealwood) bị đình trệ sản xuất do nhiệt độ vượt ngưỡng $30^\circ\text{C}$.

### 🛠️ Các Bước Thực Hiện
1. Mở **Engineering Studio V3** $\to$ **Calculators Panel** $\to$ chọn **AT/ST Heat & Cooling Calculator**.
2. Nhập tải nhiệt ước tính cần giải nhiệt: `800 kDTU/s`.
3. Chọn chất làm mát (**Coolant**): `Nước bẩn (Polluted Water)` (Nhiệt dung riêng $SHC = 4.179$).
4. Hệ thống phân tích:
   - Một máy Aquatuner chạy P-Water làm mát được $196 \times 4.179 = 819.08\text{ kDTU/s}$.
   - **Số lượng Aquatuner cần**: `1 máy` ($1200\text{W}$).
   - **Số lượng Steam Turbine cần**: `1 máy` (tiêu tán tối đa $877.5\text{ kDTU/s}$).
5. Chuyển sang tab **Adaptive Material Guide**:
   - Bảng **Material Swap Table** cảnh báo: *"Nếu chế tạo Aquatuner bằng Gold Amalgam (ngưỡng quá nhiệt $+50^\circ\text{C} \to 175^\circ\text{C}$), máy sẽ hỏng vì phòng hơi nước cần duy trì ở $200^\circ\text{C}$. Khuyến nghị chuyển sang Thép (Steel, $+200^\circ\text{C} \to 325^\circ\text{C}$)."*
6. Nhấn **Mermaid Logic Flow** để xem sơ đồ tự động hóa với Thermo Sensor: Ngắt Aquatuner khi nước tuần hoàn $< 15^\circ\text{C}$ để chống đóng băng vỡ đường ống.

---

## UC-03: Thuần Hóa & Khai Thác Mạch Hơi Nước / Núi Lửa (Geyser Tamer)

### 📌 Bối Cảnh & Vấn Đề
Người chơi đào thấy một **Mạch Hơi Nước Nóng (Steam Vent, $500^\circ\text{C}$)** hoặc **Núi Lửa Sắt (Iron Volcano, $2526^\circ\text{C}$)**. Nếu mở nắp bừa bãi, nhiệt độ cực cao sẽ làm tràn nhiệt phá hủy toàn bộ căn cứ.

### 🛠️ Các Bước Thực Hiện
1. Mở **Calculators Panel** $\to$ **Geyser & Volcano Pipeline Balancer**.
2. Chọn loại geyser: `Núi lửa sắt (Iron Volcano)`.
3. Nhập sản lượng phun thực tế: `1.2 kg/s`, chu kỳ hoạt động `60%`.
4. Hệ thống tính toán:
   - **Sản lượng sắt bình quân**: `0.72 kg/s` ($432\text{ kg/chu kỳ}$).
   - **Nhiệt lượng tỏa ra**: `~750 kDTU/s` khi làm mát sắt từ $2526^\circ\text{C}$ xuống $200^\circ\text{C}$.
   - **Thiết bị tiêu tán nhiệt**: `1x Steam Turbine` đặt trực tiếp trên đỉnh phòng kín chân không.
5. Người chơi hỏi Kỹ Sư Trưởng AI trong khung Chat:
   > *"Cách cách nhiệt và vận chuyển sắt ra ngoài bằng băng chuyền?"*
6. AI Agent phân tích: Sử dụng gạch cách nhiệt *Insulated Tile (Igneous Rock)*, ngâm băng chuyền *Conveyor Rail* chạy qua hồ nước làm mát và ngắt nhiệt bằng cửa tự động *Vacuum Air-lock*.

---

## UC-04: Xây Dựng Petroleum Boiler Đun Dầu Tỷ Lệ 1:1

### 📌 Bối Cảnh & Vấn Đề
Sử dụng máy lọc dầu *Oil Refinery* chỉ cho tỷ lệ chuyển đổi $50\%$ ($10\text{ kg/s}$ Dầu thô $\to 5\text{ kg/s}$ Dầu hỏa $+ 90\text{g/s}$ Khí tự nhiên) và tiêu tốn công nhân vận hành. Người chơi muốn xây dựng hệ thống đun sôi Dầu thô ở $402^\circ\text{C}$ thành Dầu hỏa với hiệu suất $100\%$ ($10\text{ kg/s} \to 10\text{ kg/s}$).

### 🛠️ Các Bước Thực Hiện
1. Nhấp vào thẻ gợi ý nhanh **"Petroleum Boiler"** tại màn hình chính.
2. AI Agent trích xuất tài liệu chuẩn từ Jahws Compendium và giải thích nguyên lý 3 phân hệ:
   - **Nguồn nhiệt (Heat Injector)**: Nhỏ giọt Magma hoặc dùng cửa cơ khí *Steel Mechanical Airlock* truyền nhiệt từ lõi dung nham.
   - **Bộ trao đổi nhiệt đối lưu ngược dòng (Counter-flow Heat Exchanger)**: Dầu hỏa nóng chảy $400^\circ\text{C}$ chảy xuôi bậc thang làm nóng Dầu thô $80^\circ\text{C}$ đi ngược trong ống dẫn kim loại *Radiant Pipe*, giúp dầu thô đạt $380^\circ\text{C}$ trước khi tới điểm đun.
   - **Hệ thống bơm dầu hỏa thành phẩm**: Thu dầu hỏa đã nguội về mức $95^\circ\text{C}$.
3. Người chơi mở **Blueprint Canvas**, chọn bản vẽ `petroleum_boiler_magma`, bật chế độ **Composite Mode** để xem chồng lớp đường ống dẫn Dầu thô, đường dẫn Dầu hỏa và mạng dây cảm biến nhiệt độ.

---

## UC-05: Xây Dựng Bẫy Nén Áp Suất Lưu Trữ Vô Tận (Infinite Storage)

### 📌 Bối Cảnh & Vấn Đề
Các bình chứa khí (*Gas Reservoir - 150kg*) và bồn chứa nước (*Liquid Reservoir - 5000kg*) chiếm quá nhiều diện tích và tiêu tốn nhiều kim loại. Người chơi muốn nén hàng trăm tấn chất lỏng hoặc chất khí vào duy nhất 1 ô gạch ($1\times 1$).

### 🛠️ Các Bước Thực Hiện
1. Người chơi nhập vào khung chat: *"Cách làm bẫy nén khí vô hạn không bị quá áp?"*
2. AI Agent kích hoạt RAG và giải thích cơ chế vật lý của game:
   - Lỗ thông khí (*Gas Vent*) sẽ báo lỗi `Overpressure` khi áp suất ô gạch $\ge 2\text{ kg}$.
   - **Mẹo vật lý**: Nhỏ một giọt chất lỏng nhẹ (ví dụ: $500\text{g}$ Nước hoặc Dầu thô) lên ô có lỗ thông khí. Khi khí được bơm ra, giọt chất lỏng bị dịch chuyển tạm thời rồi rơi lại, khiến lỗ thông khí luôn nhận diện môi trường là chất lỏng và không bao giờ bị quá áp.
   - **Vật liệu thành buồng**: Bắt buộc xây bằng gạch thông khí (*Airflow Tile*) hoặc gạch cơ khí kín để tránh bị nứt vỡ do áp suất chất lỏng cực đại (*Pressure Damage*).

---

## UC-06: Quy Hoạch Nông Nghiệp & Quản Lý Dinh Dưỡng Dân Số Lớn

### 📌 Bối Cảnh & Vấn Đề
Căn cứ dự kiến nuôi 16 Duplicants bằng món ăn cao cấp **Frost Burger** ($+16\text{ Morale}$) hoặc **Bristle Berry**. Người chơi cần biết chính xác mỗi chu kỳ phải cấp bao nhiêu kg Nước sạch, bao nhiêu kg Bùn vi sinh và cần bao nhiêu diện tích trồng trọt.

### 🛠️ Các Bước Thực Hiện
1. Mở **Engineering Studio V3** $\to$ **Calculators Panel** $\to$ **Food & Resource Calculator**.
2. Nhập số Duplicants: `16`.
3. Chọn loại thực phẩm: `Bristle Blossom (Bristle Berry)`.
4. Bật tùy chọn **Bón phân vi chất (Farmer's Touch Boost)**.
5. Xem báo cáo tài nguyên chi tiết:
   - **Tổng Calo cần**: $16,000\text{ kcal/chu kỳ}$.
   - **Thời gian sinh trưởng sau khi kích thích**: $3.0\text{ chu kỳ}$ (rút ngắn một nửa từ 6 chu kỳ).
   - **Số lượng cây cần trồng**: `16 cây`.
   - **Nhu cầu Nước sạch tưới**: `320 kg/chu kỳ` ($0.533\text{ kg/s}$).
   - **Tổng lượng nước cho 100 chu kỳ**: `32,000 kg` ($32\text{ tấn}$).
   - **Điều kiện môi trường**: Nhiệt độ lý tưởng $20^\circ\text{C}$, cần đèn chiếu sáng $\ge 200\text{ Lux}$.

---

## UC-07: Tra Cứu Thông Số Vật Liệu & Phản Ứng Chuyển Pha Nhanh

### 📌 Bối Cảnh & Vấn Đề
Người chơi đang xây dựng đường ống dẫn dầu quanh núi lửa và phân vân không biết nên dùng ống dẫn bằng **Chì (Lead)**, **Đồng (Copper)** hay **Vàng (Gold)**.

### 🛠️ Các Bước Thực Hiện
1. Nhập vào thanh chat nhanh: `"So sánh Chì, Đồng, Vàng điểm nóng chảy và dẫn nhiệt"`.
2. Hệ thống gọi Tool `recipe_lookup` kết hợp cơ sở dữ liệu LanceDB và hiển thị bảng so sánh trực quan:

| Chất Liệu | Điểm Nóng Chảy | Độ Dẫn Nhiệt (TC) | Nhiệt Dung Riêng (SHC) | Khuyến Nghị Sử Dụng |
| :--- | :--- | :--- | :--- | :--- |
| **Lead (Chì)** | $327.5^\circ\text{C}$ | $35.0\text{ W/(m}\cdot\text{K)}$ | $0.128\text{ DTU/(g}\cdot^\circ\text{C)}$ | Dễ kiếm, dẫn nhiệt nhanh nhưng nhiệt độ nóng chảy thấp $\implies$ **Tuyệt đối không dùng gần Magma**. |
| **Copper (Đồng)** | $1084^\circ\text{C}$ | $4.5\text{ W/(m}\cdot\text{K)}$ | $0.385\text{ DTU/(g}\cdot^\circ\text{C)}$ | Trung bình, phù hợp đường dây điện thông thường. |
| **Gold (Vàng)** | $1064^\circ\text{C}$ | $60.0\text{ W/(m}\cdot\text{K)}$ | $0.129\text{ DTU/(g}\cdot^\circ\text{C)}$ | Dẫn nhiệt cực tốt, trang trí cao ($+50\%$ Decor). |
| **Steel (Thép)** | $2427^\circ\text{C}$ | $54.0\text{ W/(m}\cdot\text{K)}$ | $0.449\text{ DTU/(g}\cdot^\circ\text{C)}$ | Chịu nhiệt siêu cấp $+200^\circ\text{C}$ Overheat $\implies$ **Tối ưu cho khu vực công nghiệp**. |

---

## UC-08: Vận Hành Ngoại Tuyến An Toàn Trên Laptop / Mạng Di Động

### 📌 Bối Cảnh & Vấn Đề
Người chơi đang chơi game trên máy bay, tàu xe hoặc sử dụng điểm phát sóng 4G/5G từ điện thoại di động và muốn tránh việc ứng dụng tự động tải dữ liệu ngầm làm cạn dung lượng data.

### 🛠️ Các Bước Thực Hiện
1. Nhấn **Cài đặt AI Engine** ở góc dưới Sidebar.
2. Tại mục **Bảo Vệ Dữ Liệu Di Động (Cellular Data Guard)**, tích chọn **Bật Chế độ Tiết kiệm Mạng Di động (Offline Mode)**.
3. Chuyển nhà cung cấp AI sang **Ollama Local**.
4. Toàn bộ các kết nối cào dữ liệu từ Wiki.gg, Steam và ONI-DB bị khóa hoàn toàn.
5. Ứng dụng vận hành với độ trễ $0\text{ms}$ dựa trên kho 1,927 vectors nhúng cục bộ trong LanceDB và mô hình cục bộ trên máy.

---

<div align="center">
  <sub>Tài liệu Use Cases được cập nhật đồng bộ cùng phiên bản <b>ONI Agent V3</b>.</sub>
</div>
