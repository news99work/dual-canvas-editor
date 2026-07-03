# Hướng dẫn Sử dụng — Dual Canvas Editor

> **Hướng dẫn cơ bản cho người dùng thiết kế áo thun đôi (Nam/Nữ)**

---

## Mục lục

1. [Giới thiệu](#1-giới-thiệu)
2. [Giao diện Tổng quan](#2-giao-diện-tổng-quan)
3. [Thao tác Cơ bản](#3-thao-tác-cơ-bản)
4. [Thiết kế với Text](#4-thiết-kế-với-text)
5. [Thiết kế với Ảnh](#5-thiết-kế-với-ảnh)
6. [Quản lý Layer](#6-quản-lý-layer)
7. [Chế độ Mirror](#7-chế-độ-mirror)
8. [Xuất File (Export)](#8-xuất-file-export)
9. [Phím tắt](#9-phím-tắt)
10. [Mẹo và Thủ thuật](#10-mẹo-và-thủ-thuật)
11. [Yêu cầu Hệ thống](#11-yêu-cầu-hệ-thống)

---

## 1. Giới thiệu

**Dual Canvas Editor** là công cụ thiết kế trực tuyến giúp bạn tạo hình in cho áo thun đôi — thiết kế đồng thời trên hai mẫu áo Nam và Nữ.

**Bạn có thể:**
- ✏️ Thêm text với font, màu sắc, kích thước tùy chỉnh
- 🖼️ Upload ảnh và đặt lên áo
- 🎨 Thay đổi màu áo
- 🔄 Đồng bộ thiết kế giữa áo Nam và Nữ (Mirror Mode)
- 📤 Xuất file in chất lượng cao (PNG 2400×3600)

**Lưu ý:** Đây là phiên bản MVP (Minimum Viable Product). Thiết kế của bạn được lưu trong phiên làm việc và file export được giữ trong 1 giờ. **Hãy tải file về ngay sau khi export.**

---

## 2. Giao diện Tổng quan

```
┌──────────────────────────────────────────────────────────┐
│  HEADER: Logo | Undo/Redo | Mirror Toggle | Export       │
├──────────────────────┬───────────────────────────────────┤
│                      │                                   │
│   ÁO NAM             │      ÁO NỮ                       │
│   ┌──────────────┐   │      ┌──────────────┐            │
│   │  Vùng in     │   │      │  Vùng in     │            │
│   │  (có viền)   │   │      │  (có viền)   │            │
│   │              │   │      │              │            │
│   │  Text/Ảnh    │   │      │  Text/Ảnh    │            │
│   └──────────────┘   │      └──────────────┘            │
│                      │                                   │
├──────────────────────┴───────────────────────────────────┤
│  CONTROL PANEL      [Layers] [Thuộc tính] [Kho ảnh]     │
│  ───────────────────────────────────────────────────    │
│  Nội dung tab đang active                                │
└──────────────────────────────────────────────────────────┘
```

### Các khu vực chính

| Khu vực | Chức năng |
|---|---|
| **Header** | Undo/Redo, bật/tắt Mirror Mode, nút Export |
| **Canvas Nam** (trái) | Vùng thiết kế áo Nam. Vùng in được đánh dấu bằng viền tím mờ |
| **Canvas Nữ** (phải) | Vùng thiết kế áo Nữ. Có thể khác hoặc giống áo Nam (Mirror Mode) |
| **Control Panel** (dưới) | Quản lý layer, chỉnh thuộc tính, kho ảnh, công cụ text |

---

## 3. Thao tác Cơ bản

### 3.1 Chọn Đối tượng

- **Click** vào text hoặc ảnh trên canvas để chọn
- Đối tượng được chọn sẽ có viền xanh dương và các nút resize/xoay ở góc
- **Click ra ngoài** để bỏ chọn

### 3.2 Di chuyển

- **Kéo thả** đối tượng đến vị trí mong muốn
- Đối tượng sẽ tự động nằm trong vùng in (có snap guide)

### 3.3 Resize (Thay đổi kích thước)

- **Kéo nút ở góc** để thay đổi kích thước
- **Giữ Shift** khi kéo để giữ tỉ lệ (aspect ratio)

### 3.4 Xoay

- **Kéo nút xoay** (ở phía trên đối tượng khi được chọn) để xoay
- **Giữ Shift** để xoay theo bước 15°

### 3.5 Zoom/Pan

- **Lăn chuột** để zoom in/out
- **Kéo canvas nền** (không phải đối tượng) để di chuyển vùng nhìn (pan)
- **Double-click canvas nền** để fit toàn bộ thiết kế

### 3.6 Undo/Redo

- **Nút Undo (↩)** trên header: quay lại thao tác trước (tối đa 50 bước)
- **Nút Redo (↪)** trên header: làm lại thao tác đã undo

---

## 4. Thiết kế với Text

### 4.1 Thêm Text

1. Chọn tab **Text** trong Control Panel
2. Nhập nội dung text vào ô "Nhập text..."
3. Chọn font, kích thước, màu sắc
4. Nhấn **"Thêm text"**
5. Text sẽ xuất hiện trên canvas đang active

### 4.2 Chỉnh sửa Text

- **Double-click** vào text trên canvas để chỉnh sửa trực tiếp (in-place editing)
- Con trỏ sẽ xuất hiện, bạn có thể gõ, xóa, chọn text như trong Word
- **Nhấn Enter** hoặc click ra ngoài để kết thúc chỉnh sửa

### 4.3 Định dạng Text

Khi chọn text, tab **Thuộc tính** hiển thị:

| Thuộc tính | Mô tả |
|---|---|
| **Font** | Danh sách font có sẵn (Inter, Montserrat, Pacifico...) |
| **Kích thước** | 12–200px, có thể gõ số hoặc kéo thanh trượt |
| **Màu chữ** | Color picker, chọn màu từ palette hoặc nhập mã hex |
| **Căn lề** | Trái / Giữa / Phải |
| **In đậm / Nghiêng** | Toggle Bold / Italic |
| **Viền chữ (Stroke)** | Thêm đường viền quanh chữ, tùy chỉnh màu + độ dày |
| **Độ trong suốt** | Opacity 0–100% |

### 4.4 Font Có sẵn

| Font | Phong cách | Dùng cho |
|---|---|---|
| **Inter** | Sans-serif hiện đại | Text thông thường, thông điệp |
| **Montserrat** | Sans-serif mạnh mẽ | Heading, slogan |
| **Playfair Display** | Serif thanh lịch | Thiết kế cổ điển, cưới hỏi |
| **Pacifico** | Handwriting mềm mại | Tên cặp đôi, text tình cảm |
| **Bebas Neue** | Display đậm, cao | Số áo, text thể thao |
| **Dancing Script** | Handwriting uyển chuyển | Thiết kệu vintage, cưới |

---

## 5. Thiết kế với Ảnh

### 5.1 Upload Ảnh

1. Chọn tab **Kho ảnh** trong Control Panel
2. Nhấn nút **"Upload ảnh"** (hoặc kéo thả file vào khu vực upload)
3. Chọn file ảnh từ máy (hỗ trợ: PNG, JPEG, WebP, tối đa 10 MB)
4. Ảnh sẽ được upload lên server, tự động resize và tạo thumbnail
5. Ảnh xuất hiện trong kho ảnh sau khi upload hoàn tất

### 5.2 Thêm Ảnh vào Canvas

- **Kéo thả** ảnh từ kho ảnh vào canvas
- Hoặc **click đúp** vào ảnh trong kho
- Ảnh sẽ được thêm vào giữa canvas, sau đó bạn có thể di chuyển/resize

### 5.3 Chỉnh sửa Ảnh

Khi chọn ảnh, tab **Thuộc tính** hiển thị:

| Thuộc tính | Mô tả |
|---|---|
| **Vị trí X, Y** | Tọa độ pixel trên canvas |
| **Kích thước** | Width × Height |
| **Xoay** | Góc xoay (0–360°) |
| **Độ trong suốt** | Opacity 0–100% |
| **Crop** | Cắt ảnh — kéo các cạnh để chọn vùng giữ lại |
| **Filter** | Hiệu ứng: Grayscale, Sepia, Blur, Brightness, Contrast |

### 5.4 Gợi ý Chất lượng Ảnh

- Ảnh nên có độ phân giải ít nhất **1000×1000px** để đảm bảo chất lượng in
- Ảnh PNG với nền trong suốt cho kết quả đẹp nhất
- Tránh ảnh quá nhỏ (< 300px) — sẽ bị vỡ khi export
- Dung lượng tối đa: 10 MB/file

---

## 6. Quản lý Layer

### 6.1 Layer là gì?

Mỗi text và ảnh trên canvas là một **layer** riêng biệt. Layer ở trên cùng sẽ đè lên layer ở dưới. Bạn có thể sắp xếp thứ tự layer để tạo hiệu ứng chồng lớp.

### 6.2 Bảng Layer

Chọn tab **Layers** trong Control Panel để xem danh sách layer:

```
┌──────────────────────────────────────┐
│ Layers                     [Mirror] │
├──────────────────────────────────────┤
│ 👁 🔓 T  "Forever Together"  ≡  🗑  │
│ 👁 🔒 🖼  tim.png             ≡  🗑  │
│ 👁 🔓 T  "2026"              ≡  🗑  │
├──────────────────────────────────────┤
│ [+ Thêm Text] [+ Thêm Ảnh]          │
└──────────────────────────────────────┘
```

| Biểu tượng | Chức năng |
|---|---|
| 👁 / 👁‍🗨 | Hiện/ẩn layer (visibility toggle) |
| 🔒 / 🔓 | Khóa/Mở khóa layer (không thể chọn/di chuyển) |
| **T** / 🖼 | Loại layer: Text hoặc Image |
| Tên | Click để chọn layer → hiện thuộc tính |
| ≡ | Kéo để sắp xếp lại thứ tự layer |
| 🗑 | Xóa layer |

### 6.3 Thao tác Layer

- **Kéo thả** layer lên/xuống trong danh sách để thay đổi z-index
- **Click vào tên layer** để chọn layer đó trên canvas
- **Ẩn layer** (👁) nếu muốn tạm thời không nhìn thấy nhưng không xóa
- **Khóa layer** (🔒) để tránh vô tình di chuyển

---

## 7. Chế độ Mirror

### 7.1 Mirror Mode là gì?

Mirror Mode tự động sao chép thiết kế từ áo Nam sang áo Nữ (hoặc ngược lại). Thay đổi trên một bên sẽ tự động áp dụng cho bên kia.

### 7.2 Cách sử dụng

1. Nhấn nút **Mirror** (🔄) trên Header để bật
2. Nút sẽ chuyển màu vàng — Mirror Mode đang hoạt động
3. Thiết kế trên canvas đang active sẽ được đồng bộ sang canvas còn lại
4. Mọi thay đổi (thêm, sửa, xóa, di chuyển) đều được mirror

### 7.3 Khi nào nên dùng Mirror

- **Thiết kế giống nhau cho cả Nam và Nữ** — bật Mirror, thiết kế một lần
- **Thiết kế mỗi bên khác nhau** — tắt Mirror (nút màu xám), thiết kế riêng từng bên
- **Thiết kế nền giống, text khác** — bật Mirror để thêm ảnh nền, sau đó tắt Mirror để chỉnh text riêng

---

## 8. Xuất File (Export)

### 8.1 Các bước Export

1. Nhấn nút **"Export"** (📥) trên Header
2. Chọn định dạng:
   - **PNG** — Ảnh chất lượng cao (2400×3600px, ~300 DPI cho áo ~20×30cm)
   - **PDF** — File PDF sẵn sàng in
   - **Cả hai** — Xuất cả PNG và PDF
3. Chọn chất lượng:
   - **Draft** — Nhanh, file nhỏ (xem trước)
   - **Standard** — Cân bằng chất lượng/dung lượng
   - **High** — Chất lượng cao nhất (khuyên dùng cho in ấn)
4. Nhấn **"Bắt đầu Export"**
5. Đợi server xử lý (thường 5–15 giây)
6. Khi hoàn tất, link download sẽ hiện ra — **tải về ngay**

### 8.2 Lưu ý quan trọng

⚠️ **File export chỉ được lưu trên server trong 1 giờ.** Sau 1 giờ, file sẽ tự động bị xóa. Hãy tải về ngay sau khi export hoàn tất.

⚠️ **Export IDEMPOTENT**: Nếu bạn nhấn Export nhiều lần với cùng một thiết kế, server sẽ trả về kết quả cũ (không tạo file mới). Để export lại sau khi chỉnh sửa, hãy thay đổi thiết kế trước.

### 8.3 Kích thước Export

| Định dạng | Kích thước | DPI tương đương (áo ~20×30cm) |
|---|---|---|
| PNG | 2400 × 3600 px | ~300 DPI |
| PDF | A4 portrait | Vector text + ảnh 300 DPI |

---

## 9. Phím tắt

| Phím tắt | Hành động |
|---|---|
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` | Redo |
| `Ctrl/Cmd + C` | Copy layer đang chọn |
| `Ctrl/Cmd + V` | Paste layer |
| `Delete / Backspace` | Xóa layer đang chọn |
| `Ctrl/Cmd + D` | Bỏ chọn (deselect) |
| `Ctrl/Cmd + A` | Chọn tất cả layer |
| `Ctrl/Cmd + G` | Group các layer đang chọn |
| `Ctrl/Cmd + Shift + G` | Ungroup |
| `↑ ↓ ← →` | Di chuyển layer 1px |
| `Shift + ↑ ↓ ← →` | Di chuyển layer 10px |
| `Ctrl/Cmd + M` | Bật/tắt Mirror Mode |
| `Ctrl/Cmd + E` | Mở hộp thoại Export |
| `+ / -` | Zoom in / out |
| `0` | Fit toàn bộ canvas |

---

## 10. Mẹo và Thủ thuật

### 10.1 Thiết kế Đẹp hơn

- **Dùng Mirror Mode** để đảm bảo thiết kế đồng nhất giữa áo Nam và Nữ
- **Group các layer liên quan** (Ctrl+G) để di chuyển/resize cùng lúc
- **Thêm viền (stroke) cho text** nếu chữ bị chìm trên nền áo tối màu
- **Dùng font phù hợp**: Sans-serif cho thông điệp hiện đại, Script cho tên cặp đôi
- **Chừa khoảng trống (bleed)** — không đặt text/ảnh sát mép vùng in

### 10.2 Tối ưu cho In ấn

- **Luôn export ở chất lượng "High"** khi chuẩn bị file in
- **Kiểm tra vùng in** (viền tím) — mọi thứ ngoài vùng này sẽ không được in
- **Text nên ≥ 24px** để đảm bảo đọc được trên áo thật
- **Ảnh nên có nền trong suốt (PNG)** để hòa trộn đẹp với màu áo

### 10.3 Làm việc trên Mobile

- Layout tự động chuyển sang **xếp dọc** trên màn hình nhỏ
- Sử dụng **tab** ở dưới để chuyển giữa canvas Nam và Nữ
- Kéo 2 ngón tay để **pinch-to-zoom**
- Kéo 1 ngón tay trên canvas nền để **pan**

---

## 11. Yêu cầu Hệ thống

### Trình duyệt hỗ trợ

| Trình duyệt | Phiên bản tối thiểu |
|---|---|
| Chrome | 64+ |
| Firefox | 58+ |
| Safari | 11+ |
| Edge | Chromium-based |

### Mobile

- **iOS**: Safari 11+, Chrome
- **Android**: Chrome 64+, Firefox 58+

### Kết nối

- Cần kết nối Internet để upload ảnh và export
- Canvas editing hoạt động offline sau khi load

---

## Cần trợ giúp?

- 📧 Email: [contact@dualcanvas.app]
- 🐛 Báo lỗi: [GitHub Issues](https://github.com/your-org/dual-canvas-editor/issues)
- 📖 Tài liệu kỹ thuật: [Developer Guide](DEVELOPER_GUIDE.md)

---

**Phiên bản**: 0.1.0 (MVP)
**Cập nhật lần cuối**: 2026-07-02
