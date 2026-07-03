# Hướng dẫn Sử dụng — Dual Canvas Editor

> **Thiết kế áo thun đôi (Nam/Nữ) — hướng dẫn từng bước**

---

## 1. Giao diện tổng quan

Khi mở app, bạn thấy 3 khu vực chính:

```
┌──────────────────────────────────────────────────────────┐
│  HEADER: Logo | Undo/Redo | Mirror | Export              │
├────────────────────┬─────────────────────────────────────┤
│   ÁO NAM           │   ÁO NỮ                            │
│  ┌──────────────┐  │  ┌──────────────┐                  │
│  │ Vùng in      │  │  │ Vùng in      │                  │
│  │ (tỉ lệ 2:3)  │  │  │ (tỉ lệ 2:3)  │                  │
│  └──────────────┘  │  └──────────────┘                  │
├────────────────────┴─────────────────────────────────────┤
│  TABS: [Layers] [Thuộc tính] [Kho ảnh]                  │
└──────────────────────────────────────────────────────────┘
```

| Khu vực | Công dụng |
|----------|----------|
| **Canvas Nam** (trái) | Thiết kế áo Nam |
| **Canvas Nữ** (phải) | Thiết kế áo Nữ |
| **Control Panel** (dưới/phải) | Layers, chỉnh thuộc tính, kho ảnh |

---

## 2. Upload ảnh

### Cách upload

1. Mở tab **Kho ảnh** (Assets)
2. Click nút **"📤 Upload ảnh mới"**
3. Chọn file ảnh từ máy (PNG, JPEG, WebP)
4. Đợi upload hoàn thành — ảnh xuất hiện trong kho

### Định dạng hỗ trợ

| Định dạng | Hỗ trợ | Ghi chú |
|-----------|--------|---------|
| PNG | ✅ | Khuyên dùng — nền trong suốt |
| JPEG | ✅ | Không có nền trong suốt |
| WebP | ✅ | Dung lượng nhỏ |
| SVG | ❌ | Không chấp nhận (bảo mật) |
| Ảnh > 10MB | ❌ | Vượt quá giới hạn |

### Mẹo upload

- Dùng file PNG có nền trong suốt để đẹp nhất khi đặt lên áo
- Resize ảnh trước nếu > 2000px để upload nhanh hơn
- Server tự động tạo thumbnail 200px và strip EXIF

---

## 3. Kéo ảnh vào canvas

### Desktop (chuột)

1. Mở tab **Kho ảnh**
2. **Drag** ảnh từ kho ảnh vào canvas
3. Thả vào vị trí mong muốn
4. Kéo các góc để resize, kéo cạnh để xoay

### Mobile (cảm ứng)

1. Mở tab **Kho ảnh**
2. **Chạm** vào ảnh — ảnh được đặt vào giữa canvas
3. Dùng **2 ngón tay** để pinch-zoom canvas
4. **1 ngón tay** kéo để di chuyển ảnh
5. Chạm giữ để mở menu ngữ cảnh

> **Lưu ý mobile:** Không hỗ trợ drag-and-drop trên mobile. Dùng tap để thêm ảnh, sau đó chỉnh vị trí bằng tay.

---

## 4. Thêm và chỉnh sửa Text

### Thêm text

1. Mở tab **Layers**
2. Click **"+ Add Text"**
3. Một text box "Nhập text..." xuất hiện trên canvas
4. **Double-click** vào text để sửa nội dung
5. Gõ nội dung mới, click ra ngoài để xác nhận

### Chỉnh thuộc tính text

1. **Chọn** text layer trên canvas (click)
2. Mở tab **Thuộc tính** (Properties)
3. Chỉnh sửa:

| Thuộc tính | Mô tả | Ví dụ |
|-----------|-------|-------|
| Font | Chọn font từ danh sách | Inter, Roboto, Playfair Display |
| Size | Kích thước chữ (px) | 24, 48, 72 |
| Color | Màu chữ | #FFFFFF (trắng), #6c63ff (tím) |
| Bold / Italic | In đậm / nghiêng | Bật/tắt |
| Align | Căn lề | Trái, Giữa, Phải |
| Stroke | Viền chữ | Màu + độ dày |
| Opacity | Độ trong suốt | 0% (ẩn) → 100% (đậm) |
| Rotation | Góc xoay | 0° → 360° |

### Mẹo text

- **Double-click** để edit trực tiếp nội dung
- Font được tải từ server — 7 font có sẵn (Inter 3 biến thể, Roboto 2, Playfair Display 2)
- Dùng font sans-serif (Inter, Roboto) cho text nhỏ để dễ đọc
- Dùng font serif (Playfair Display) cho text trang trí

---

## 5. Quản lý Layers

> Mỗi text hoặc ảnh trên canvas là một **layer**. Layer ở trên che layer ở dưới.

### Tab Layers

```
┌──────────────────────────────────────┐
│  👁 [T] "Forever Together"     ≡  🗑  │  ← Layer text
│  👁 [🖼] flower-pattern.png     ≡  🗑  │  ← Layer ảnh
│  👁 [T] "Est. 2026"            ≡  🗑  │  ← Layer text
├──────────────────────────────────────┤
│  [+ Add Text]   [+ Add Image]        │
└──────────────────────────────────────┘
```

### Thao tác với layer

| Thao tác | Cách làm |
|----------|----------|
| **Chọn** | Click vào tên layer |
| **Ẩn/Hiện** | Click icon 👁 |
| **Khóa/Mở** | Click icon 🔒 — layer bị khóa không thể di chuyển |
| **Xóa** | Click icon 🗑 |
| **Đổi thứ tự** | Kéo icon ≡ lên/xuống |
| **Bring to Front** | Click chuột phải → "Bring to Front" |

### Thứ tự layer quan trọng!

Layer **trên cùng trong danh sách** = layer **trên cùng trên canvas** (che các layer khác). Khi thiết kế áo:
- **Layer nền** (màu áo) → để dưới cùng
- **Layer ảnh** (hoa văn) → ở giữa
- **Layer text** (chữ) → trên cùng để dễ đọc

---

## 6. Chế độ Mirror (Đồng bộ Nam/Nữ)

### Bật Mirror Mode

Click nút **🔄 Mirror** trên Header. Khi bật:

- Mọi thay đổi trên **Áo Nam được sao chép sang Áo Nữ**
- Áo Nữ bị khóa — không chỉnh sửa trực tiếp được
- Layer mới, xóa layer, đổi vị trí đều được đồng bộ

### Khi nào dùng Mirror?

- **Có:** Khi thiết kế giống hệt cho cả Nam và Nữ (ví dụ: logo, slogan)
- **Không:** Khi muốn mỗi áo có thiết kế riêng (ví dụ: áo Nam hoa văn khác áo Nữ)

### Tắt Mirror

Click lại nút **🔄 Mirror** để tắt. Hai canvas trở về **độc lập** — thay đổi trên canvas này không ảnh hưởng canvas kia.

---

## 7. Xuất File (Export)

### Các bước export

1. Click nút **📤 Export** trên Header
2. Chọn định dạng:
   - **PNG** — 2400×3600px, ~300 DPI, phù hợp in kỹ thuật số
   - **PDF** — In ấn chuyên nghiệp
   - **Both** — Cả PNG và PDF
3. Chọn chất lượng:
   - **Draft** — Nhanh, xem trước
   - **Standard** — Cân bằng (khuyên dùng)
   - **High** — Chất lượng cao nhất, in ấn
4. Click **Export**
5. Đợi server xử lý (thường 5-15 giây)
6. Khi hoàn thành → click **Download** để tải về

### Lưu ý export

- File export được giữ trên server **1 giờ**. Hãy tải về ngay!
- Export sử dụng **idempotency** — nếu export lại cùng thiết kế, server trả về file cũ (nhanh hơn)
- Xuất đồng thời **cả 2 canvas** (Nam + Nữ) trong 1 lần

---

## 8. Mobile Touch Gestures

Khi dùng trên điện thoại/máy tính bảng:

| Cử chỉ | Hành động |
|--------|----------|
| **1 ngón chạm** | Chọn đối tượng (text/ảnh) |
| **1 ngón kéo** | Di chuyển đối tượng đã chọn |
| **1 ngón kéo (nền trống)** | Pan canvas (di chuyển vùng nhìn) |
| **2 ngón pinch** | Zoom in/out |
| **2 ngón xoay** | Xoay canvas |
| **Double-tap** | Fit canvas (vừa màn hình) |
| **Chạm giữ** | Menu ngữ cảnh (Cut, Copy, Delete...) |
| **1 ngón kéo (control panel)** | Kéo bottom sheet lên/xuống |

### Giới hạn mobile

- **Không có drag-and-drop** từ kho ảnh sang canvas → dùng tap
- Bàn phím ảo sẽ hiện khi edit text → canvas có thể bị che
- Khuyên dùng **màn hình ngang** (landscape) khi thiết kế

---

## 9. Phím tắt

| Phím tắt | Hành động |
|----------|----------|
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |
| `Delete` / `Backspace` | Xóa layer đang chọn |
| `Ctrl+C` | Copy |
| `Ctrl+V` | Paste |
| `Ctrl+A` | Chọn tất cả |
| `Ctrl+M` | Toggle Mirror Mode |
| `Ctrl+E` | Mở Export dialog |
| `+` / `-` | Zoom in/out |
| `0` | Fit canvas |
| `Mũi tên` | Di chuyển layer 1px |
| `Shift + Mũi tên` | Di chuyển layer 10px |
| `Escape` | Bỏ chọn tất cả |

---

## 10. Xử lý lỗi thường gặp

| Lỗi | Nguyên nhân | Cách xử lý |
|-----|-----------|------------|
| **"Backend Connection Failed"** | Server chưa chạy | Chạy `pnpm dev:server` |
| **Upload thất bại** | File > 10MB hoặc định dạng không hỗ trợ | Dùng PNG/JPEG/WebP < 10MB |
| **Export không tải được** | File hết hạn (sau 1 giờ) | Export lại |
| **"Export job not found"** | ID export sai hoặc hết hạn | Export lại từ đầu |
| **Canvas không hiện** | Fabric.js chưa load | Refresh trang, đợi vài giây |
| **Font không hiển thị** | Font chưa tải xong | Chọn font khác, thử lại |
| **"ApiError 429"** | Rate limit — quá nhiều request | Đợi 1-2 phút rồi thử lại |

---

## 11. Yêu cầu hệ thống

| Thành phần | Tối thiểu |
|-----------|----------|
| **Browser** | Chrome 90+, Firefox 90+, Safari 15+, Edge 90+ |
| **Màn hình** | ≥ 768px rộng (khuyên dùng ≥ 1280px) |
| **Internet** | Cần thiết (app hoạt động online) |
| **RAM** | ≥ 4GB |
| **Touch** | Hỗ trợ touch trên mobile/tablet |
