# Hướng dẫn Sử dụng — Dual Canvas Editor

> **Thiết kế áo thun đôi (Nam/Nữ) — từ upload ảnh đến xuất file in**

---

## Mục lục

1. [Giao diện Tổng quan](#1-giao-diện-tổng-quan)
2. [Upload Ảnh](#2-upload-ảnh)
3. [Thêm & Chỉnh sửa Text](#3-thêm--chỉnh-sửa-text)
4. [Quản lý Layer](#4-quản-lý-layer)
5. [Chế độ Mirror](#5-chế-độ-mirror)
6. [Xuất File (Export)](#6-xuất-file-export)
7. [Phím tắt & Touch Gestures](#7-phím-tắt--touch-gestures)
8. [Mẹo thiết kế](#8-mẹo-thiết-kế)

---

## 1. Giao diện Tổng quan

```
┌──────────────────────────────────────────────────────────┐
│  HEADER    [Undo] [Redo] [Mirror 🔄] [⬇ Export]         │
├──────────────────────┬───────────────────────────────────┤
│                      │                                   │
│   ÁO NAM             │      ÁO NỮ                       │
│   ┌──────────────┐   │      ┌──────────────┐            │
│   │ Vùng in 2:3  │   │      │ Vùng in 2:3  │            │
│   │              │   │      │              │            │
│   │  Text / Ảnh  │   │      │  Text / Ảnh  │            │
│   └──────────────┘   │      └──────────────┘            │
│                      │                                   │
├──────────────────────┴───────────────────────────────────┤
│  CONTROL PANEL     [Layers] [Thuộc tính] [Kho ảnh]      │
└──────────────────────────────────────────────────────────┘
```

| Khu vực | Chức năng |
|----------|----------|
| **Header** | Undo/Redo, bật/tắt Mirror Mode, nút Export |
| **Canvas Nam** (trái) | Vùng thiết kế áo Nam. Vùng in 2:3 được đánh dấu viền tím. |
| **Canvas Nữ** (phải) | Vùng thiết kế áo Nữ. Có thể khác hoặc giống Nam (Mirror). |
| **Control Panel** | Quản lý layer, chỉnh thuộc tính, kho ảnh, chọn font. |

---

## 2. Upload Ảnh

### Cách upload

1. Mở tab **Assets** (Kho ảnh) trong Control Panel
2. Click nút **"📤 Upload ảnh mới"** hoặc kéo thả file vào vùng upload
3. Chọn ảnh từ máy (PNG, JPEG, WebP — tối đa 10 MB)
4. Ảnh sẽ được xử lý (resize, tạo thumbnail, xóa EXIF) và hiển thị trong kho ảnh

### Đưa ảnh lên canvas

**Cách 1 — Kéo thả:**
- Kéo ảnh từ Kho ảnh thả vào canvas Nam hoặc Nữ
- Ảnh sẽ xuất hiện tại vị trí thả

**Cách 2 — Click:**
- Click vào ảnh trong Kho ảnh để chọn
- Ảnh sẽ được đặt vào giữa canvas đang active

### Chỉnh sửa ảnh trên canvas

| Thao tác | Cách làm |
|----------|----------|
| Di chuyển | Click + kéo ảnh |
| Resize | Kéo nút vuông ở góc (giữ Shift để giữ tỉ lệ) |
| Xoay | Kéo nút tròn phía trên ảnh |
| Xóa | Chọn ảnh → nhấn `Delete` |
| Đổi opacity | Tab Properties → thanh trượt Opacity |

### Định dạng được hỗ trợ

| Định dạng | Trạng thái |
|-----------|------------|
| PNG | ✅ Hỗ trợ (nền trong suốt OK) |
| JPEG | ✅ Hỗ trợ |
| WebP | ✅ Hỗ trợ |
| SVG | ❌ Không hỗ trợ (bảo mật) |
| GIF | ❌ Không hỗ trợ |

---

## 3. Thêm & Chỉnh sửa Text

### Thêm text mới

1. Mở tab **Layers** trong Control Panel
2. Click **"+ Add Text"**
3. Một text layer mới xuất hiện trên canvas đang active
4. Gõ nội dung trực tiếp trên canvas

### Chỉnh sửa text

Chọn text layer trên canvas hoặc trong danh sách Layers, sau đó mở tab **Properties**:

| Thuộc tính | Mô tả |
|------------|-------|
| **Font** | Chọn từ danh sách font (Inter, Roboto, Playfair Display) |
| **Size** | Kích thước chữ (px) |
| **Color** | Màu chữ — click vào ô màu để chọn |
| **Bold / Italic** | In đậm, in nghiêng |
| **Align** | Căn trái / giữa / phải |
| **Stroke** | Viền chữ (màu + độ dày) |
| **Opacity** | Độ trong suốt (0-100%) |

### Mẹo text

- Double-click vào text trên canvas để chỉnh sửa nội dung trực tiếp
- Dùng stroke (viền) để text nổi bật trên nền áo tối màu
- Kết hợp Bold + Stroke cho text tiêu đề lớn

---

## 4. Quản lý Layer

### Danh sách layer

Mở tab **Layers** để xem tất cả layer trên canvas đang active:

```
👁  🔓  [T]  "Forever Together"     ≡  🗑    ← Text layer
👁  🔒  [🖼]  flower-pattern.png     ≡  🗑    ← Ảnh layer
👁  🔓  [T]  "Est. 2026"            ≡  🗑    ← Text layer
```

### Thao tác với layer

| Icon | Chức năng |
|------|-----------|
| 👁 / 👁‍🗨 | Ẩn / Hiện layer |
| 🔒 / 🔓 | Khóa / Mở khóa layer (khóa = không di chuyển được) |
| T / 🖼 | Loại layer (Text / Ảnh) |
| ≡ | Kéo để sắp xếp lại thứ tự layer |
| 🗑 | Xóa layer |

### Thứ tự layer

- Layer trên cùng trong danh sách = nằm trên cùng trên canvas
- Kéo thả layer trong danh sách để thay đổi z-order
- Layer bị che có thể ẩn layer phía trên để chỉnh sửa

---

## 5. Chế độ Mirror

Chế độ Mirror (**🔄**) đồng bộ thiết kế giữa canvas Nam và Nữ.

### Bật/Tắt

- Click nút **Mirror 🔄** trên Header để bật/tắt
- Khi **ON**: mọi thay đổi trên canvas Nam sẽ tự động copy sang canvas Nữ
- Khi **OFF**: hai canvas hoạt động độc lập

### Khi nào dùng Mirror?

| Tình huống | Mirror |
|------------|--------|
| Thiết kế giống hệt cho cả Nam và Nữ | **ON** |
| Chỉnh vị trí khác nhau cho Nam/Nữ | ON trước → OFF → chỉnh riêng |
| Thiết kế hoàn toàn khác nhau | **OFF** |

---

## 6. Xuất File (Export)

### Các bước export

1. Click nút **⬇ Export** trên Header
2. Chọn định dạng:
   - **PNG** — 2400×3600px, ~300 DPI (in ấn)
   - **PDF** — Vector text, print-ready (đang phát triển)
3. Chọn chất lượng:
   - **Draft** — nhanh, xem trước
   - **Standard** — cân bằng tốc độ/chất lượng
   - **High** — in ấn chuyên nghiệp
4. Click **Export** để bắt đầu
5. Đợi thanh tiến trình hoàn tất
6. Click **Download PNG** để tải file về máy

### Lưu ý quan trọng

- ⏱️ File export được lưu trên server trong **1 giờ**. Hãy tải về ngay.
- 🔄 Export là **idempotent** — nếu export lại cùng thiết kế, server trả về file đã có (nhanh hơn).
- 📐 Kích thước export cố định 2400×3600px (tỉ lệ 2:3).

---

## 7. Phím tắt & Touch Gestures

### Phím tắt (Desktop)

| Phím tắt | Hành động |
|----------|-----------|
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` | Redo |
| `Delete / Backspace` | Xóa layer đang chọn |
| `Ctrl/Cmd + A` | Chọn tất cả layer |
| `Ctrl/Cmd + M` | Bật/tắt Mirror Mode |
| `Ctrl/Cmd + E` | Mở hộp thoại Export |
| `+ / -` | Zoom in/out |
| `0` | Fit canvas (xem toàn bộ) |
| `Phím mũi tên` | Di chuyển layer 1px |
| `Shift + Mũi tên` | Di chuyển layer 10px |
| `Escape` | Bỏ chọn tất cả |

### Touch Gestures (Mobile/Tablet)

| Gesture | Hành động |
|---------|-----------|
| **1 ngón chạm** | Chọn layer |
| **1 ngón kéo** | Di chuyển layer |
| **2 ngón pinch** | Zoom in/out canvas |
| **2 ngón pan** | Di chuyển viewport canvas |
| **Double tap** | Fit canvas (xem toàn bộ) |
| **Chạm giữ** | Mở context menu (Cut/Copy/Paste/Delete) |

### Mobile Layout

Trên màn hình nhỏ (< 768px):
- Canvas Nam và Nữ xếp **dọc** (Nam trên, Nữ dưới)
- Control Panel hiển thị dạng **bottom sheet** — kéo từ dưới lên
- Touch targets tối thiểu 44×44px

---

## 8. Mẹo thiết kế

### Text rõ nét khi in

- ✅ Font size tối thiểu **16px** cho text chính
- ✅ Dùng stroke (viền) cho text trên nền tối
- ✅ Chọn font sans-serif (Inter, Roboto) cho text nhỏ
- ❌ Tránh text quá nhỏ (< 12px) — sẽ không đọc được khi in

### Ảnh sắc nét

- ✅ Upload ảnh có độ phân giải cao (≥ 800px cạnh ngắn)
- ✅ Dùng PNG nền trong suốt cho logo, sticker
- ❌ Tránh ảnh JPEG chất lượng thấp (< 500px) — sẽ bị vỡ khi in

### Bố cục

- Vùng in là **2:3** (200×300mm) — thiết kế trong vùng viền tím
- Đặt text/ảnh chính ở giữa vùng in
- Chừa lề ≥ 10mm mỗi cạnh để tránh bị cắt khi in

---

## Yêu cầu Hệ thống

| Thành phần | Yêu cầu |
|------------|---------|
| **Trình duyệt** | Chrome 90+, Firefox 90+, Safari 15+, Edge 90+ |
| **Hệ điều hành** | Windows 10+, macOS 11+, iOS 15+, Android 11+ |
| **Màn hình** | Tối thiểu 360px rộng (mobile), khuyến nghị 1280px+ (desktop) |
| **Internet** | Cần kết nối để upload ảnh và export |

---

**Cần hỗ trợ?** Xem thêm [SETUP.md](SETUP.md) cho hướng dẫn cài đặt môi trường dev.
