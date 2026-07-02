# UI Design — Dual Canvas Editor MVP

> **Dự án**: Dual Canvas Editor — T-Shirt Designer
> **Ngày**: 2026-07-02
> **Phiên bản**: 1.0.0
> **Vai trò**: Solution Architect (pa-solution-architect)
> **Nhiệm vụ**: #23 — Visual System, Responsive Layouts, Component States
> **Canvas Engine**: Fabric.js >= 7.4.0 (ADR-001)
> **Ngôn ngữ**: Tiếng Việt

---

## Mục lục

1. [Tổng quan](#1-tổng-quan)
2. [Color System](#2-color-system)
3. [Typography](#3-typography)
4. [Iconography](#4-iconography)
5. [Spacing & Grid](#5-spacing--grid)
6. [Layout Strategy](#6-layout-strategy)
7. [Component States](#7-component-states)
8. [Interaction Details](#8-interaction-details)
9. [Responsive Breakpoints](#9-responsive-breakpoints)
10. [Accessibility](#10-accessibility)

---

## 1. Tổng quan

### 1.1 Nguyên tắc thiết kế

| Nguyên tắc                  | Mô tả                                                                  |
| --------------------------- | ---------------------------------------------------------------------- |
| **Canvas là trung tâm**     | UI chrome phải tối giản, không cạnh tranh thị giác với canvas thiết kế |
| **Dark-first**              | Theme tối mặc định giúp canvas thiết kế nổi bật, giảm mỏi mắt          |
| **Mobile-first responsive** | Layout xếp chồng trên mobile, mở rộng dần lên desktop                  |
| **Phản hồi tức thì**        | Mọi tương tác đều có visual feedback trong < 100ms                     |
| **Nhất quán**               | Cùng một component luôn có cùng visual language trên mọi kích thước    |

### 1.2 Kiến trúc UI tổng thể

```
┌──────────────────────────────────────────────────────────┐
│  HEADER: Logo | Undo/Redo | Mirror Toggle | Export       │
├──────────────────────┬───────────────────────────────────┤
│                      │                                   │
│   NAM CANVAS         │      NỮ CANVAS                    │
│   (Fabric.js)        │      (Fabric.js)                  │
│                      │                                   │
│   ┌──────────────┐   │      ┌──────────────┐            │
│   │  Áo thun mẫu │   │      │  Áo thun mẫu │            │
│   │  + layers    │   │      │  + layers    │            │
│   └──────────────┘   │      └──────────────┘            │
│                      │                                   │
├──────────────────────┴───────────────────────────────────┤
│  CONTROL PANEL                                           │
│  [Layers] [Thuộc tính] [Kho ảnh] [Text] [Màu sắc]       │
│  ───────────────────────────────────────────────────    │
│  Nội dung tab đang active                                │
└──────────────────────────────────────────────────────────┘
```

---

## 2. Color System

### 2.1 Theme: Dark Mode (Mặc định)

Ứng dụng thiết kế cần giao diện tối để canvas thiết kế nổi bật và giảm mỏi mắt khi làm việc lâu.

#### Core Palette

| Token                       | Hex       | RGB           | Usage                               |
| --------------------------- | --------- | ------------- | ----------------------------------- |
| `--color-bg-primary`        | `#0F0F11` | 15, 15, 17    | Nền chính toàn app                  |
| `--color-bg-secondary`      | `#1A1A1E` | 26, 26, 30    | Nền control panel, header           |
| `--color-bg-tertiary`       | `#25252B` | 37, 37, 43    | Nền card, input, dropdown           |
| `--color-bg-elevated`       | `#2D2D35` | 45, 45, 53    | Nền modal, tooltip, popover         |
| `--color-bg-canvas`         | `#E8E8EC` | 232, 232, 236 | Nền vùng canvas (sáng để thấy áo)   |
| `--color-bg-canvas-checker` | `#D0D0D8` | 208, 208, 216 | Checkerboard pattern (transparency) |

#### Surface / Border

| Token                      | Hex       | RGB           | Usage                      |
| -------------------------- | --------- | ------------- | -------------------------- |
| `--color-border-primary`   | `#35353F` | 53, 53, 63    | Border chính (card, input) |
| `--color-border-secondary` | `#2A2A33` | 42, 42, 51    | Border phụ (divider nhẹ)   |
| `--color-border-focus`     | `#6366F1` | 99, 102, 241  | Border khi focus           |
| `--color-border-error`     | `#EF4444` | 239, 68, 68   | Border khi lỗi             |
| `--color-border-canvas`    | `#C0C0C8` | 192, 192, 200 | Border vùng canvas         |

#### Text

| Token                    | Hex       | RGB           | Usage                      |
| ------------------------ | --------- | ------------- | -------------------------- |
| `--color-text-primary`   | `#F4F4F6` | 244, 244, 246 | Text chính, heading        |
| `--color-text-secondary` | `#A0A0AA` | 160, 160, 170 | Text phụ, label            |
| `--color-text-tertiary`  | `#656570` | 101, 101, 112 | Text disabled, placeholder |
| `--color-text-on-canvas` | `#1A1A1E` | 26, 26, 30    | Text trên nền canvas sáng  |
| `--color-text-link`      | `#818CF8` | 129, 140, 248 | Link                       |

#### Brand / Accent

| Token                            | Hex       | RGB          | Usage                               |
| -------------------------------- | --------- | ------------ | ----------------------------------- |
| `--color-accent-primary`         | `#6366F1` | 99, 102, 241 | CTA chính, active state, focus ring |
| `--color-accent-primary-hover`   | `#5558E6` | 85, 88, 230  | Hover CTA                           |
| `--color-accent-primary-pressed` | `#4A4DD4` | 74, 77, 212  | Pressed CTA                         |
| `--color-accent-secondary`       | `#22D3EE` | 34, 211, 238 | Highlight phụ, badge, indicator     |
| `--color-accent-mirror`          | `#F59E0B` | 245, 158, 11 | Mirror mode active indicator        |

#### Semantic

| Token             | Hex       | RGB          | Usage                          |
| ----------------- | --------- | ------------ | ------------------------------ |
| `--color-success` | `#22C55E` | 34, 197, 94  | Thành công (export done)       |
| `--color-warning` | `#F59E0B` | 245, 158, 11 | Cảnh báo                       |
| `--color-error`   | `#EF4444` | 239, 68, 68  | Lỗi (upload fail, export fail) |
| `--color-info`    | `#3B82F6` | 59, 130, 246 | Thông tin                      |

#### Canvas-specific

| Token                       | Hex                      | RGB           | Usage                            |
| --------------------------- | ------------------------ | ------------- | -------------------------------- |
| `--color-selection`         | `#6366F1`                | 99, 102, 241  | Selection box, transform handles |
| `--color-selection-border`  | `#818CF8`                | 129, 140, 248 | Border object đang chọn          |
| `--color-print-area`        | `rgba(99,102,241,0.15)`  | —             | Vùng in được highlight           |
| `--color-print-area-border` | `rgba(99,102,241,0.40)`  | —             | Border vùng in                   |
| `--color-layer-hover`       | `rgba(129,140,248,0.10)` | —             | Hover layer trên canvas          |
| `--color-guide-line`        | `rgba(99,102,241,0.30)`  | —             | Snap/alignment guide             |

#### Bảng màu áo thun (Garment Colors)

Các màu có sẵn cho user chọn làm nền áo:

```
Trắng      #FFFFFF    Đen        #1A1A1A    Xám        #9CA3AF
Navy       #1E3A5F    Đỏ         #DC2626    Xanh dương #2563EB
Xanh lá    #16A34A    Vàng       #EAB308    Hồng       #EC4899
Cam        #F97316    Tím        #7C3AED    Beige      #D6C8B0
```

### 2.2 CSS Custom Properties (Tailwind Config Mapping)

```css
:root {
  /* Backgrounds */
  --color-bg-primary: #0f0f11;
  --color-bg-secondary: #1a1a1e;
  --color-bg-tertiary: #25252b;
  --color-bg-elevated: #2d2d35;
  --color-bg-canvas: #e8e8ec;
  --color-bg-canvas-checker: #d0d0d8;

  /* Borders */
  --color-border-primary: #35353f;
  --color-border-secondary: #2a2a33;
  --color-border-focus: #6366f1;
  --color-border-error: #ef4444;
  --color-border-canvas: #c0c0c8;

  /* Text */
  --color-text-primary: #f4f4f6;
  --color-text-secondary: #a0a0aa;
  --color-text-tertiary: #656570;
  --color-text-link: #818cf8;

  /* Accent */
  --color-accent-primary: #6366f1;
  --color-accent-primary-hover: #5558e6;
  --color-accent-primary-pressed: #4a4dd4;
  --color-accent-secondary: #22d3ee;
  --color-accent-mirror: #f59e0b;

  /* Semantic */
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.5);
  --shadow-canvas: 0 0 0 1px var(--color-border-canvas), 0 2px 8px rgba(0, 0, 0, 0.15);
  --shadow-focus: 0 0 0 3px rgba(99, 102, 241, 0.4);

  /* Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;
}
```

---

## 3. Typography

### 3.1 Font Stack

```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
```

- **Inter**: UI text, labels, buttons, controls — Google Fonts, hỗ trợ tiếng Việt tốt
- **JetBrains Mono**: Code, technical values (kích thước pixel, tọa độ)

### 3.2 Type Scale

| Token       | Size | Line Height | Weight | Usage                                    |
| ----------- | ---- | ----------- | ------ | ---------------------------------------- |
| `text-xs`   | 11px | 16px        | 400    | Badge, helper text, keyboard shortcut    |
| `text-sm`   | 13px | 18px        | 400    | Label, secondary text, input placeholder |
| `text-base` | 15px | 22px        | 400    | Body text, button, menu item             |
| `text-lg`   | 17px | 24px        | 500    | Section heading, card title              |
| `text-xl`   | 20px | 28px        | 600    | Panel title, dialog heading              |
| `text-2xl`  | 24px | 32px        | 700    | Page heading                             |
| `text-3xl`  | 32px | 40px        | 700    | Hero/landing (nếu có)                    |

### 3.3 Font Weights

| Weight | Token    | Usage                        |
| ------ | -------- | ---------------------------- |
| 400    | Regular  | Body text, labels            |
| 500    | Medium   | Subheadings, emphasized text |
| 600    | Semibold | Section titles, active tabs  |
| 700    | Bold     | Page headings, CTA text      |

### 3.4 Text Styles cho Canvas (Fabric.js IText)

Các preset text style cho user chọn khi thêm text lên áo:

| Preset   | Font                      | Size | Style                 |
| -------- | ------------------------- | ---- | --------------------- |
| Heading  | Montserrat / Inter Bold   | 72px | Bold, uppercase       |
| Subtitle | Inter SemiBold            | 36px | SemiBold              |
| Body     | Inter Regular             | 24px | Regular               |
| Script   | Pacifico / Dancing Script | 48px | Regular (handwriting) |
| Impact   | Anton / Impact            | 64px | Bold, uppercase       |

Font canvas được load qua Fabric.js path caching, fallback về system font nếu chưa load.

---

## 4. Iconography

### 4.1 Icon System

- **Thư viện**: Lucide Icons (React components, tree-shakeable)
- **Kích thước chuẩn**: 16px, 20px, 24px
- **Stroke width**: 1.5px (regular), 2px (bold)
- **Màu**: Kế thừa từ parent text color (`currentColor`)

### 4.2 Icon Map

| Chức năng     | Icon (Lucide)               | Kích thước |
| ------------- | --------------------------- | ---------- |
| Undo          | `Undo2`                     | 18px       |
| Redo          | `Redo2`                     | 18px       |
| Mirror mode   | `FlipHorizontal2`           | 18px       |
| Export        | `Download`                  | 18px       |
| Add text      | `Type`                      | 20px       |
| Add image     | `ImagePlus`                 | 20px       |
| Upload        | `Upload`                    | 20px       |
| Layer list    | `Layers`                    | 20px       |
| Properties    | `SlidersHorizontal`         | 20px       |
| Color picker  | `Palette`                   | 20px       |
| Asset library | `Library`                   | 20px       |
| Delete layer  | `Trash2`                    | 16px       |
| Lock layer    | `Lock` / `Unlock`           | 16px       |
| Visibility    | `Eye` / `EyeOff`            | 16px       |
| Duplicate     | `Copy`                      | 16px       |
| Move up/down  | `ChevronUp` / `ChevronDown` | 16px       |
| Zoom in/out   | `ZoomIn` / `ZoomOut`        | 18px       |
| Fit canvas    | `Maximize2`                 | 18px       |
| Close/dismiss | `X`                         | 18px       |
| Check/success | `Check`                     | 18px       |
| Alert/error   | `AlertTriangle`             | 18px       |
| Loading       | `Loader2` (animate-spin)    | 18px       |
| Drag handle   | `GripVertical`              | 16px       |
| Male shirt    | `Shirt` (hoặc custom SVG)   | 24px       |
| Female shirt  | Custom SVG                  | 24px       |
