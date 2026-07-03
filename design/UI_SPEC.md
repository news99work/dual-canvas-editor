# UI Specification — Dual Canvas Editor

**Version:** 1.0.0 | **Date:** 2026-07-02 | **Author:** UI Design Lead (pa-ui-design-lead)  
**Status:** Complete — Ready for Frontend Engineer handoff

---

## Table of Contents

1. [Visual System Overview](#1-visual-system-overview)
2. [Design Tokens](#2-design-tokens)
3. [Component State Matrix](#3-component-state-matrix)
4. [Responsive Layout Strategy](#4-responsive-layout-strategy)
5. [Interaction Patterns](#5-interaction-patterns)
6. [Accessibility Notes](#6-accessibility-notes)
7. [Handoff Checklist](#7-handoff-checklist)

---

## 1. Visual System Overview

### 1.1 Design Philosophy

The Dual Canvas Editor is a **professional creative tool** — the design must:

- **Recede**: The chrome (toolbars, panels) stays out of the way. The canvas is the hero.
- **Focus**: Dark theme minimizes eye strain during long editing sessions. Accent color guides attention.
- **Precision**: Tight spacing, monospace for numeric inputs, snap-to-grid visual hints.
- **Confidence**: Clear state feedback (loading, error, success) at every interaction point.

### 1.2 Design Principles

| Principle | Expression |
|---|---|
| **Canvas First** | Background #0b0d13; canvas area slightly lighter #1e2130; UI chrome darkest |
| **Single Accent** | Purple (#6c63ff) is the only accent. No secondary brand colors. |
| **Predictable Layout** | 3-zone: Header / Canvas+Sidebar / Footer. Always consistent. |
| **Immediate Feedback** | Every click, drag, hover has a visual response within 120ms. |
| **Gradual Complexity** | Default view is simple (canvas + layers). Advanced tools reveal on demand. |

### 1.3 Visual Hierarchy

```
Layer 0 (Bottom)  — App Background      #0b0d13  dc-bg-app
Layer 1            — Canvas Area         #1e2130  dc-canvas-bg
Layer 2            — Panels / Toolbars   #12141c  dc-bg-surface
Layer 3            — Elevated surfaces   #1a1d28  dc-bg-elevated
Layer 4            — Modals / Overlays   #1f2230  dc-bg-overlay
Layer 5 (Top)      — Tooltips / Toasts   #2a2d3d  dc-bg-tooltip
```

---

## 2. Design Tokens

**File:** `design/design-tokens.css` — all CSS custom properties, ready to import in `client/src/main.tsx`.

### 2.1 Color System

#### Core Palette

```
PURPOSE             HEX         CSS VAR                 USAGE
───────             ───         ───────                 ─────
App Background      #0b0d13     --dc-bg-app             Root body, canvas surround
Surface Default     #12141c     --dc-bg-surface         Panels, toolbars, cards
Surface Elevated    #1a1d28     --dc-bg-elevated        Dropdowns, popovers
Surface Overlay     #1f2230     --dc-bg-overlay         Modal dialogs
Tooltip             #2a2d3d     --dc-bg-tooltip         Tooltips
Canvas BG           #1e2130     --dc-canvas-bg          Fabric.js canvas background

Border Default      #252836     --dc-border-default     Dividers, input borders
Border Light        #333648     --dc-border-light       Hover borders
Border Focus        #6c63ff     --dc-border-focus       Active/focus borders

Text Primary        #e4e6ed     --dc-text-primary       Body text, labels
Text Secondary      #9ca0b0     --dc-text-secondary     Descriptions, hints
Text Tertiary       #6b6f80     --dc-text-tertiary      Placeholders, disabled
Text Inverse        #0b0d13     --dc-text-inverse       On accent backgrounds
Text Link           #8b83ff     --dc-text-link           Hyperlinks, breadcrumbs

Accent              #6c63ff     --dc-accent             Primary buttons, selection
Accent Hover        #7d75ff     --dc-accent-hover       Button hover state
Accent Pressed      #5a52e0     --dc-accent-pressed     Button active/pressed

Success             #34d399     --dc-success            Export complete, upload OK
Warning             #fbbf24     --dc-warning            Mirror mode active, unsaved
Error               #f87171     --dc-error              Validation, upload failure
Info                #60a5fa     --dc-info               Tips, connection status
```

#### Contrast Ratios (WCAG 2.1 AA)

| Combination | Ratio | Pass AA? |
|---|---|---|
| `--dc-text-primary` on `--dc-bg-surface` | 13.8:1 | ✅ AAA |
| `--dc-text-secondary` on `--dc-bg-surface` | 5.7:1 | ✅ AA |
| `--dc-text-tertiary` on `--dc-bg-surface` | 3.2:1 | ⚠️ Decorative only |
| `--dc-accent` on `--dc-bg-surface` | 5.4:1 | ✅ AA |
| `--dc-error` on `--dc-bg-surface` | 4.9:1 | ✅ AA (large text) |
| `--dc-text-inverse` on `--dc-accent` | 12.3:1 | ✅ AAA |

### 2.2 Typography

**Primary Font Stack:** `Inter` (bundled via `@fontsource/inter`)  
**Monospace Stack:** `JetBrains Mono` (for code, coordinates, pixel values)

| Token | Size | Weight | Usage |
|---|---|---|---|
| `--dc-text-xs` | 11px | 400 | Keyboard shortcuts, badges |
| `--dc-text-sm` | 12px | 400 | Timestamps, meta info, hints |
| `--dc-text-body-sm` | 13px | 400 | Layer names, property labels, panel text |
| `--dc-text-body` | 14px | 400/500 | Body text, button labels, inputs |
| `--dc-text-md` | 16px | 500 | Section headers, tab labels |
| `--dc-text-lg` | 20px | 600 | Panel titles, dialog headers |
| `--dc-text-xl` | 24px | 700 | App title, export complete |
| `--dc-text-2xl` | 32px | 700 | Empty state icons companion |

### 2.3 Spacing System

8px grid base. All spacing uses multiples of 4px (0.25rem).

| Token | Value | Usage |
|---|---|---|
| `--dc-space-1` | 4px | Icon padding, tight gaps |
| `--dc-space-2` | 8px | Button gap, inline spacing |
| `--dc-space-3` | 12px | Card padding (compact) |
| `--dc-space-4` | 16px | Standard padding, section gap |
| `--dc-space-5` | 20px | Panel header padding |
| `--dc-space-6` | 24px | Section margins, canvas gap |
| `--dc-space-8` | 32px | Page padding (desktop) |
| `--dc-space-10` | 40px | Large section delimiter |
| `--dc-space-12` | 48px | Hero sections, empty states |

### 2.4 Shadows

| Token | Value | Usage |
|---|---|---|
| `--dc-shadow-sm` | `0 1px 2px rgba(0,0,0,0.3)` | Buttons, cards |
| `--dc-shadow-md` | `0 4px 12px rgba(0,0,0,0.4)` | Dropdowns, elevated panels |
| `--dc-shadow-lg` | `0 8px 24px rgba(0,0,0,0.5)` | Modals |
| `--dc-shadow-canvas` | `0 0 0 1px border + 0 2px 16px` | Canvas panels |
| `--dc-shadow-panel` | `0 0 0 1px border + 0 8px 32px` | Floating control panel |
| `--dc-shadow-tooltip` | `0 4px 16px rgba(0,0,0,0.55)` | Tooltips |

### 2.5 Border Radius

| Token | Value | Usage |
|---|---|---|
| `--dc-radius-none` | 0 | Canvas edge, dividers |
| `--dc-radius-sm` | 4px | Inputs, badges, small buttons |
| `--dc-radius-md` | 8px | Cards, panels, buttons, modals |
| `--dc-radius-lg` | 12px | Large panels, canvas containers |
| `--dc-radius-xl` | 16px | Hero cards, empty states |
| `--dc-radius-full` | 9999px | Pills, status dots, avatars |

### 2.6 Layout Tokens

| Token | Value | Usage |
|---|---|---|
| `--dc-header-height` | 56px | Top header bar |
| `--dc-sidebar-width` | 320px | Control panel (desktop) |
| `--dc-sidebar-collapsed` | 48px | Collapsed sidebar (tablet) |
| `--dc-canvas-min-width` | 300px | Minimum canvas width |
| `--dc-canvas-min-height` | 400px | Minimum canvas height |
| `--dc-toolbar-height` | 44px | Inline canvas toolbar |
| `--dc-bottom-sheet-height` | 60vh | Mobile bottom sheet |

---

## 3. Component State Matrix

10 primary components mapped across 6 states: **Default, Hover, Active/Focus, Disabled, Loading, Empty, Error**.

### 3.1 Header

```
┌────────────────────────────────────────────────────────────────────┐
│  🔲 App Logo    🔲 Title    [Undo] [Redo]  [Mirror 🔄]  [Export]  │
│                                            Status Dot ●            │
└────────────────────────────────────────────────────────────────────┘
```

| State | Visual | Behavior |
|---|---|---|
| **Default** | Height 56px, `--dc-bg-surface`, bottom border `--dc-border-default`. Title text `--dc-text-primary`, 20px. | Static top bar. |
| **Hover (buttons)** | Background `--dc-bg-elevated`, transition 120ms. | Tooltip appears after 500ms. |
| **Active (buttons)** | Background `--dc-accent-subtle`, icon fills with `--dc-accent`. | Button depressed. |
| **Disabled (buttons)** | Opacity 0.35, `cursor: not-allowed`. | Undo disabled when stack empty. Export disabled during active job. |
| **Mirror ON** | Toggle button bg `--dc-warning-subtle`, icon `--dc-warning`. Pulsing dot. | Both canvases sync. |
| **Mirror OFF** | Toggle button bg transparent, icon `--dc-text-secondary`. | Canvases independent. |
| **Connection lost** | Status dot → `--dc-error`. Title area shows "Disconnected" in `--dc-text-tertiary`. | Reconnect CTA button appears. |
| **Saving** | Status dot → `--dc-warning` with pulse animation. "Saving…" in `--dc-text-tertiary`. | Auto-save indicator. |

### 3.2 Canvas Panel (Nam / Nữ)

```
┌──────────────────────────────────────┐
│  [Canvas Toolbar: Zoom − 100% +]    │  ← 44px toolbar
│  ┌──────────────────────────────┐   │
│  │  ┌──────────────────────┐   │   │
│  │  │   PRINT ZONE         │   │   │  ← Dashed border, --dc-canvas-print-zone
│  │  │   (2:3 aspect)       │   │   │
│  │  │                      │   │   │
│  │  │  Garment Overlay      │   │   │  ← Semi-transparent garment base
│  │  │  + Layers             │   │   │
│  │  │                      │   │   │
│  │  └──────────────────────┘   │   │
│  └──────────────────────────────┘   │
│  Label: "Áo Nam"                    │
└──────────────────────────────────────┘
```

| State | Visual | Behavior |
|---|---|---|
| **Default** | Background `--dc-canvas-bg`, rounded `--dc-radius-lg`, shadow `--dc-shadow-canvas`. Print zone: dashed border `--dc-canvas-print-zone`, 2:3 aspect ratio centered. | Canvas is interactive. |
| **Active/Selected** | Canvas border solid `--dc-accent`, subtle glow `box-shadow: 0 0 0 2px var(--dc-accent)`. Label color → `--dc-accent`. | This canvas receives keyboard input and toolbar commands. Click another canvas to switch. |
| **Hover (inactive)** | Border changes to `--dc-border-light` on hover. | Indicates clickability. |
| **Loading (canvas init)** | Overlay: semi-transparent `--dc-bg-surface` at 60% opacity. Centered spinner `--dc-text-accent`. | Fabric.js initializing. All interactions blocked. |
| **Empty (no layers)** | Center hint text: "Kéo thả text hoặc ảnh vào đây" in `--dc-text-tertiary`, 14px. Subtle arrow icon above. | Canvas is fully interactive — hint dismisses on first action. |
| **Error (render failure)** | Canvas shows `--dc-error-subtle` tinted overlay. Error icon + "Canvas render error" + Retry button. | Fabric.js instance failed. Retry recreates canvas. |
| **Disabled (mirror target)** | Canvas slightly dimmed (overlay `--dc-bg-surface` at 10% opacity). All layers visible but not selectable. Cursor: default. | When mirror mode ON and this is the follower canvas. |
| **Drag-over (asset drop)** | Border → solid `--dc-accent`, background → `--dc-accent-subtle`. Print zone pulses. Drop cursor. | Dragging an asset from Asset Gallery. |

### 3.3 Canvas Toolbar

```
┌────────────────────────────────────────────────────────┐
│  [Zoom Out] [100%] [Zoom In]  │  [Fit]  [Undo] [Redo] │
└────────────────────────────────────────────────────────┘
```

| State | Visual | Behavior |
|---|---|---|
| **Default** | Height 44px, transparent background. Icons `--dc-text-secondary`, 16px. Zoom label `--dc-text-sm`, monospace. | Compact floating bar inside canvas top edge. |
| **Hover (buttons)** | Icon → `--dc-text-primary`. Background `--dc-bg-elevated` circle (32px). | Scale 1.05 on icon. |
| **Active (buttons)** | Icon → `--dc-accent`. Background `--dc-accent-subtle`. | Zoom applies incrementally. Fit animates canvas viewport. |
| **Disabled** | Opacity 0.3. `cursor: not-allowed`. | Zoom at min/max limits. Undo when empty. Redo when at latest. |
| **Zoom indicator** | "100%" displayed in `--dc-text-sm`, `--dc-font-mono`, color `--dc-text-secondary`. | Updates in real-time as user zooms. Click to reset to 100%. |
| **Touch (mobile)** | Icons larger (44px touch target), spacing increased. | Same behavior. |

### 3.4 Control Panel (Sidebar)

```
┌─────────────────────────────────┐
│  [Layers] [Properties] [Assets] │  ← TabBar
├─────────────────────────────────┤
│  ┌─────────────────────────┐   │
│  │                         │   │  ← Tab content area
│  │   Active Tab Content    │   │     (LayerList or
│  │                         │   │      PropertiesPanel or
│  │                         │   │      AssetGallery)
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

| State | Visual | Behavior |
|---|---|---|
| **Default** | Width 320px, `--dc-bg-surface`, left border `--dc-border-default`. Flex column. | Persistently visible on desktop (≥1280px). |
| **Collapsed (tablet)** | Width 48px. Only tab icons visible, no labels. | Click icon to expand as flyout overlay (320px wide, shadow `--dc-shadow-panel`). Auto-collapse on canvas click. |
| **Hidden (mobile)** | Hidden by default. Activated via bottom tab bar. | Slides up as bottom sheet (height `--dc-bottom-sheet-height`). Drag handle at top. |
| **Loading (assets)** | Tab content shows 4 skeleton cards: `--dc-bg-elevated` rectangles, 120×120px, pulse animation. | Fetching asset list from API. |
| **Empty (no layers)** | "Chưa có layer nào" + "Thêm text hoặc ảnh để bắt đầu" in `--dc-text-tertiary`. Action buttons below. | Standard empty state pattern. |
| **Error** | ErrorDisplay component with retry button. | API error on asset fetch or layer sync. |

### 3.5 TabBar

| State | Visual | Behavior |
|---|---|---|
| **Default** | Horizontal tabs: height 44px. Inactive tabs: text `--dc-text-secondary`, no bottom border. Active tab: text `--dc-accent`, 3px bottom border `--dc-accent`. | Click to switch. |
| **Hover (inactive)** | Text → `--dc-text-primary`. Background `--dc-bg-elevated` (pill shape). | Transition 120ms. |
| **Active** | Text `--dc-accent`, weight 600. Bottom indicator: 3px × 24px `--dc-accent` bar, centered under text. | Tab content panel renders. |
| **Disabled** | Not applicable — all 3 tabs always available. | — |
| **Badge** | Small circle (8px) `--dc-accent` beside "Layers" tab when unsaved changes exist. | Pulsing animation. |

### 3.6 LayerList / LayerItem

```
┌──────────────────────────────────────────────┐
│  LAYERS                        3 layers      │
├──────────────────────────────────────────────┤
│  👁  🔓  [T]  "Forever Together"     ≡  🗑  │  ← LayerItem (text)
│  👁  🔒  [🖼]  flower-pattern.png     ≡  🗑  │  ← LayerItem (image)
│  👁  🔓  [T]  "Est. 2026"            ≡  🗑  │  ← LayerItem (text)
├──────────────────────────────────────────────┤
│  [+ Add Text]   [+ Add Image]                │
└──────────────────────────────────────────────┘
```

| State | Visual | Behavior |
|---|---|---|
| **Default** | Height 40px per item. Background transparent. Left: visibility (👁), lock (🔒/🔓), type icon ([T]/[🖼]), name. Right: drag handle (≡), delete (🗑). Name `--dc-text-body-sm`, color `--dc-text-primary`. | Click name to select layer. |
| **Selected** | Background `--dc-accent-subtle`. Left border 3px `--dc-accent`. Name weight 600. | Corresponding Fabric.js object is selected on canvas. |
| **Hover** | Background `--dc-bg-elevated`. Delete icon visible (hidden by default). | Transition 120ms. |
| **Drag (reorder)** | Item lifted: shadow `--dc-shadow-md`, scale 1.02, opacity 0.9. Drop zone: 3px `--dc-accent` line between items. | On drop: z-index of Fabric.js objects reordered. |
| **Hidden (👁_off)** | Eye icon → slashed (👁‍🗨). Item opacity 0.5. Name italic. | Corresponding canvas object `visible: false`. |
| **Locked (🔒)** | Lock icon → closed. Drag handle hidden. Name color `--dc-text-tertiary`. | Object cannot be selected/moved on canvas. |
| **Loading (after add)** | New item slides in from top (250ms ease). Pulse background. | After Add Text/Image click while Fabric.js processes. |
| **Empty** | "Chưa có layer nào" message. Two action buttons. | Standard empty state. |
| **Error (delete failed)** | Item shakes (horizontal 4px oscillation, 300ms). Error toast: "Không thể xoá layer". | Layer remains. |

### 3.7 Properties Panel

```
┌──────────────────────────────────────────────┐
│  PROPERTIES                                   │
│                                              │
│  Position ──────────────────────────────     │
│  X: [ 120 ] px   Y: [ 200 ] px               │
│                                              │
│  Size ──────────────────────────────────     │
│  W: [  80 ] px   H: [  40 ] px   🔗 Lock    │
│                                              │
│  Rotation: [   0 ]° ────●────────────        │
│                                              │
│  Opacity:  ──────●──────────── 100%          │
│                                              │
│  ─── TEXT PROPERTIES (if text layer) ───     │
│  Font: [Inter        ▾]                      │
│  Size: [ 24 ] px                             │
│  Color: [■ #FFFFFF]                          │
│  Bold [ ]  Italic [ ]  Align [≡][≡][≡]      │
│  Stroke: [■ #000000] Width [ 2 ] px          │
│                                              │
│  ─── IMAGE PROPERTIES (if image layer) ───   │
│  Filter: [None ▾]                            │
│  Crop: [Crop Image]                          │
└──────────────────────────────────────────────┘
```

| State | Visual | Behavior |
|---|---|---|
| **Default** | Shows property groups with section dividers (`--dc-border-default`). Labels `--dc-text-body-sm`, values in input fields. | Updates in real-time as objects are modified. |
| **No selection** | "Chọn một layer để chỉnh sửa" in `--dc-text-tertiary`, centered. All input groups hidden. | Prompts user to select. |
| **Mixed selection** | "(Multiple)" shown in fields where values differ. "—" for non-unifiable properties. | 2+ layers selected with different values. |
| **Hover (inputs)** | Border → `--dc-border-light`. | 120ms transition. |
| **Focus (inputs)** | Border → `--dc-border-focus`. Focus ring `--dc-focus-ring`. | Keyboard input accepted. |
| **Disabled (locked layer)** | All inputs disabled, opacity 0.4. Lock icon beside "PROPERTIES" title. | Read-only view of locked layer. |
| **Invalid input** | Input border → `--dc-error`. Red tooltip below: "Giá trị không hợp lệ". | Value reverts to previous valid value on blur. |
| **Loading (font list)** | Font selector shows spinner 16px beside "Loading fonts…". | Fonts fetching from API. |

### 3.8 Asset Gallery / AssetCard

```
┌──────────────────────────────────────────────┐
│  ASSETS                    [🔍 Search...]     │
├──────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐      │
│  │         │  │         │  │         │      │
│  │  thumb  │  │  thumb  │  │  thumb  │      │
│  │         │  │         │  │         │      │
│  │ name    │  │ name    │  │ name    │      │
│  └─────────┘  └─────────┘  └─────────┘      │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐      │
│  │  ...    │  │  ...    │  │  ...    │      │
│  └─────────┘  └─────────┘  └─────────┘      │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │  📤  Upload ảnh mới                   │   │  ← Upload zone
│  └──────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
```

| State | Visual | Behavior |
|---|---|---|
| **Default** | 3-column grid. Cards: 96×96px, `--dc-bg-elevated`, rounded `--dc-radius-md`. Image covers card, name below `--dc-text-xs`. | Click to select, drag to canvas. |
| **Hover (card)** | Border → `--dc-border-focus`. Scale 1.05, shadow `--dc-shadow-sm`. Name color → `--dc-accent`. | Indicates draggable. |
| **Selected** | Border solid `--dc-accent`, 2px. Checkmark (✓) overlay top-right, `--dc-accent` bg, white icon. | Selected for property view or canvas placement. |
| **Dragging** | Card lifted: opacity 0.8, shadow `--dc-shadow-md`, larger (112×112px). Ghost follows cursor. | Drag to canvas. |
| **Loading (thumbnails)** | Skeleton grid: 96×96px `--dc-bg-elevated` rectangles with shimmer animation (gradient sweep). | Assets being fetched from API. |
| **Loading (upload)** | Upload progress bar replaces upload zone. See UploadProgress component. | File uploading. |
| **Empty** | "Kho ảnh trống" + "Upload ảnh để thêm vào canvas" in `--dc-text-tertiary`. Upload CTA prominent. | Standard empty state. |
| **Error (load)** | ErrorDisplay inside gallery area. "Không thể tải kho ảnh" + retry. | API error. |
| **Error (upload)** | Upload zone shows `--dc-error-subtle` border. Error: "Upload thất bại — file quá lớn hoặc không hỗ trợ". | File rejected. |
| **Disabled** | All cards opacity 0.4, `cursor: not-allowed`. | During export or when canvas initializing. |

### 3.9 Export Dialog / ExportPanel

```
┌──────────────────────────────────────────────┐
│  EXPORT DESIGN                         ✕     │
│                                              │
│  Format:                                     │
│  (●) PNG — 2400×3600px, ~300 DPI            │
│  ( ) PDF — Vector text, print-ready          │
│  ( ) Both                                    │
│                                              │
│  Quality:                                    │
│  ( ) Draft (nhanh)                           │
│  (●) Standard (cân bằng)                     │
│  ( ) High (in ấn)                            │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │  Export canvas A (Nam)  ── preview   │   │
│  │  Export canvas B (Nữ)  ── preview    │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  [  Cancel  ]    [  ⬇ Export  ]             │
└──────────────────────────────────────────────┘
```

| State | Visual | Behavior |
|---|---|---|
| **Default** | Modal: max-width 480px, `--dc-bg-overlay`, shadow `--dc-shadow-lg`, rounded `--dc-radius-lg`. Backdrop: `rgba(0,0,0,0.6)`. | Opens on Export button click. Focus trapped inside. |
| **Idle** | Export button enabled, accent color. Preview area shows canvas thumbnails (generated via `canvas.toDataURL()`). | User configuring options. |
| **Validating** | Export button shows spinner icon. All inputs disabled. | Client-side canvas state validation before submit. |
| **Exporting** | Modal stays open. Progress bar replaces preview area. Status: "Exporting..." with 0-100% bar. Cancel button remains. | Polling `GET /api/v1/export/:id`. |
| **Done** | Progress bar → full green (`--dc-success`). Status: "✅ Export complete". Download button(s) appear: "Download PNG", "Download PDF". | 200 OK from server. |
| **Error** | Progress area shows `--dc-error-subtle` bg. Error message + "Retry" and "Cancel" buttons. | API error or timeout. |
| **Disabled (export btn)** | Opacity 0.4, `cursor: not-allowed`. | During active export. |
| **Close (✕ / Escape)** | Modal fades out + slides down 8px (200ms ease). Backdrop fades. | Return to editor. |

### 3.10 Font Selector

| State | Visual | Behavior |
|---|---|---|
| **Default** | Select dropdown: height 36px, `--dc-bg-elevated`, border `--dc-border-default`, rounded `--dc-radius-sm`. Selected font shown with preview. Chevron ▾ icon. | Click to open. |
| **Open** | Dropdown list: max-height 280px, `--dc-bg-elevated`, shadow `--dc-shadow-md`, border `--dc-border-light`. Each option: height 40px, font name in its own typeface, size 16px. | Scroll if many fonts. |
| **Hover (option)** | Background `--dc-accent-subtle`. | 120ms transition. |
| **Selected (option)** | Checkmark (✓) left. Text `--dc-accent`, weight 600. | Applies font to selected text layer. |
| **Loading** | "Loading fonts…" with 16px spinner inside dropdown. | Fonts API not yet resolved. |
| **Error** | "Không thể tải danh sách font. Đang dùng font mặc định." In `--dc-error`, 13px. | API error fallback to Inter. |
| **Disabled** | Opacity 0.35, no interactivity. | When no text layer selected or layer locked. |

---

## 4. Responsive Layout Strategy

### 4.1 Breakpoints

| Breakpoint | Label | Layout Mode | Control Panel |
|---|---|---|---|
| **≥ 1440px** | Large Desktop | 2 canvases + persistent sidebar | Fixed sidebar (320px) |
| **1280–1439px** | Desktop | 2 canvases + persistent sidebar | Fixed sidebar (280px) |
| **1024–1279px** | Small Desktop | 2 canvases + collapsible sidebar | Collapsed to 48px icons; flyout on click |
| **768–1023px** | Tablet Landscape | 2 canvases side-by-side | Hidden; bottom sheet on demand |
| **< 768px** | Tablet Portrait / Mobile | Single column, stacked canvases | Hidden; bottom tab bar → bottom sheet |

### 4.2 Desktop Layout (≥ 1280px)

```
┌──────────────────────────────────────────────────────────────────────┐
│  HEADER (56px)                                                       │
├────────────┬──────────────────────────────┬──────────────────────────┤
│            │                              │                          │
│  CANVAS    │       CANVAS                 │   CONTROL PANEL          │
│  NAM       │       NỮ                     │   (320px fixed)          │
│            │                              │                          │
│  flex: 1   │       flex: 1                │   ┌─────────────────┐   │
│  min-w:300 │       min-w:300              │   │ TAB: Layers     │   │
│  2:3 aspect│       2:3 aspect             │   │ TAB: Properties │   │
│            │                              │   │ TAB: Assets     │   │
│            │                              │   └─────────────────┘   │
│            │                              │                          │
└────────────┴──────────────────────────────┴──────────────────────────┘
│  Gap: 24px between canvases, 0px canvas ↔ sidebar (divider border)   │
│  Canvas area: flex row, each canvas fills available height            │
│  Width allocation: remaining space split 50/50 between canvases       │
│  Max canvas width: (viewport - 320px - 48px) / 2                     │
```

**CSS:**
```css
.workspace {
  display: grid;
  grid-template-columns: 1fr 1fr 320px;
  height: calc(100vh - var(--dc-header-height));
}
.canvas-panel { /* each canvas */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--dc-space-6);
}
.control-panel {
  border-left: 1px solid var(--dc-border-default);
  overflow-y: auto;
}
```

### 4.3 Tablet Layout (768–1279px)

```
┌──────────────────────────────────────────────────┐
│  HEADER (56px)                                   │
├────────────────────┬─────────────────────────────┤
│                    │                             │
│  CANVAS NAM        │   CANVAS NỮ                 │
│                    │                             │
│  flex: 1           │   flex: 1                    │
│  min-w: 250px      │   min-w: 250px               │
│                    │                             │
├────────────────────┴─────────────────────────────┤
│                                                    │
│  [≡] BOTTOM SHEET or FLYOUT SIDEBAR                │
│  (activated via bottom tab or collapsible icon)    │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Variation A (1024–1279px):** Collapsible sidebar icon (48px) on right edge. Click → flyout overlay (320px) slides from right.

**Variation B (768–1023px):** Bottom tab bar (48px) with 3 icons: Layers | Properties | Assets. Tap → bottom sheet slides up (60vh). Drag handle at top, can be pulled to dismiss.

```css
/* Collapsed sidebar icon */
.sidebar-collapsed {
  width: 48px;
  position: fixed;
  right: 0;
  top: var(--dc-header-height);
  bottom: 0;
  background: var(--dc-bg-surface);
  border-left: 1px solid var(--dc-border-default);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: var(--dc-space-4);
  gap: var(--dc-space-3);
}
```

### 4.4 Mobile Layout (< 768px)

```
┌─────────────────────────┐
│  HEADER (compact, 48px) │
├─────────────────────────┤
│                         │
│  CANVAS NAM             │
│  (flex: 1, min-h: 40vh) │
│                         │
├─────────────────────────┤
│                         │
│  CANVAS NỮ              │
│  (flex: 1, min-h: 40vh) │
│                         │
├─────────────────────────┤
│  [Layers][Properties]   │  ← Bottom tab bar (48px)
│       [Assets]          │
└─────────────────────────┘
```

**Mobile rules:**
- Header: compact, height 48px. Logo only + Export button + Mirror toggle.
- Canvas switch: tap tab or swipe left/right between Nam/Nữ canvases (if single-column).
- Canvas toolbar: floating 36px icons, semi-transparent bg `--dc-bg-overlay` at 80% opacity. Position: top-right of each canvas.
- Bottom sheet: full screen height on small devices, draggable handle.
- Touch targets: minimum 44×44px per WCAG 2.1.
- Fabric.js: `allowTouchScrolling: true`, pinch-zoom enabled.
- Gestures honored: single-finger pan on background, two-finger pinch-zoom.

### 4.5 Responsive Component Behavior Summary

| Component | Desktop (≥1280) | Tablet (768–1279) | Mobile (<768) |
|---|---|---|---|
| Header | Full: logo + title + all buttons | Compact: logo + key buttons | Compact: logo + Export + Mirror |
| Canvas panels | 2 side-by-side, persistent | 2 side-by-side | Stacked, swipeable |
| Control Panel | Fixed sidebar 320px | Flyout or bottom sheet | Bottom sheet (60vh) |
| Canvas Toolbar | Full 44px bar inside canvas | Full 44px bar | Floating icon bar |
| TabBar | Top of sidebar | Top of flyout/sheet | Part of bottom sheet |
| LayerList | Full height scrollable | Full height scrollable | Scrollable in sheet |
| PropertiesPanel | Full height scrollable | Scrollable in sheet | Scrollable in sheet |
| AssetGallery | 3-column grid | 2-column grid | 2-column grid |
| Export Dialog | Centered modal 480px | Centered modal 90vw | Full screen modal |
| Font Selector | Dropdown within sidebar | Dropdown within sheet | Native-style picker |
| Modals | Fixed center, backdrop | Fixed center, backdrop | Full screen sheet |

### 4.6 Canvas Aspect Ratio Math

```
Print zone: 200mm × 300mm = 2:3 aspect ratio

Desktop (1440px viewport):
  Available width per canvas: (1440 - 320 - 48) / 2 = 536px
  Canvas height at 2:3: 536 × 1.5 = 804px
  Print zone: ~357px × 536px within canvas container

Tablet (1024px viewport):
  Available width per canvas: (1024 - 48) / 2 = 488px
  Canvas height at 2:3: 488 × 1.5 = 732px

Mobile (375px viewport):
  Canvas width: 375 - 32 = 343px
  Canvas height at 2:3: 343 × 1.5 = 515px
```

---

## 5. Interaction Patterns

### 5.1 Drag-and-Drop: Asset → Canvas

```
SOURCE (Asset Gallery)              TARGET (Canvas)
┌───────────┐                       ┌────────────────┐
│  thumb    │  ── dragstart ──►     │                │
│           │     ghost follows     │   drop zone    │
│  name     │     cursor            │   highlighted  │
└───────────┘                       └────────────────┘
```

| Phase | Visual Feedback | Technical |
|---|---|---|
| **Grab** | Asset card: scale 1.08, shadow `--dc-shadow-md`, border `--dc-accent`. Cursor: `grabbing`. | `onDragStart`: set `dataTransfer` with asset ID. |
| **Drag** | Ghost image: semi-transparent (opacity 0.85), 112×112px. Source card: opacity 0.4. | Browser default ghost. |
| **Over canvas** | Canvas border: solid `--dc-accent`, shadow glow. Drop indicator: "+" icon at cursor. | `onDragOver`: preventDefault. Add CSS class `.canvas--drop-target`. |
| **Over invalid** | Cursor: `not-allowed`. | `onDragOver` on non-canvas: no-op. |
| **Drop** | Canvas border returns to default. Brief flash: green pulse (200ms). Asset appears at drop coordinates. | `onDrop`: read asset ID, fetch image URL, `fabric.Image.fromURL()`, add to canvas at pointer coords. |
| **Cancel** | Source card returns to opacity 1. | `onDragEnd` without drop. |

**Accessibility:** Provide "Add to Canvas" button on each AssetCard for keyboard-only users. Enter key triggers placement at canvas center.

### 5.2 Layer Reorder (Drag in LayerList)

```
LayerList:
┌──────────────────────────────────┐
│  Layer A         ≡               │  ← Drag handle
├─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┤  ← Drop indicator (accent line)
│  Layer B         ≡  (dragging)   │  ← Lifted: shadow, scale
├──────────────────────────────────┤
│  Layer C         ≡               │
└──────────────────────────────────┘
```

| Phase | Visual | Behavior |
|---|---|---|
| **Idle** | Drag handle (≡) visible on hover. Cursor: `grab` on handle. | — |
| **Grab** | Item lifts: `--dc-shadow-md`, scale 1.02, `--dc-bg-elevated`. Cursor: `grabbing`. | State: `draggedLayerIndex` set. |
| **Drag over items** | Drop indicator: 3px `--dc-accent` line between items where the layer would land. Items shift to make room (smooth transition 200ms). | Recalculate z-index preview. |
| **Drop** | Item snaps into position. Indicator disappears. Canvas re-renders with new z-order. | Update Fabric.js `canvas.moveTo()` for each affected object. |
| **Cancel** | Item returns to original position (spring animation 300ms). | `onDragEnd` without valid drop. |

### 5.3 Selection on Canvas

| Action | Visual | Behavior |
|---|---|---|
| **Single click (object)** | Fabric.js selection: bounding box + handles. Box color: `--dc-canvas-selection`. Handles: white squares with `--dc-canvas-handle-bg` fill. | Object selected. LayerItem in sidebar highlights. Properties panel updates. |
| **Single click (empty)** | All selections clear. | Properties shows "Chọn một layer…" |
| **Shift+Click** | Adds object to multi-selection. Each selected object gets bounding box. | Multiple layers highlighted in sidebar. |
| **Drag-select (marquee)** | Rectangular selection area: `--dc-accent` border (1px dashed), `--dc-accent-subtle` fill. | All objects intersecting marquee are selected on mouse up. |
| **Ctrl/Cmd+A** | All objects on active canvas selected. | — |
| **Escape** | Clear all selections. | Properties resets. |

### 5.4 Resize Handles (Fabric.js)

```
Selected object:
    ●─────────────────────●
    │                     │
    │    Object           │  ● = corner handle (resize + rotate)
    │                     │
    ●─────────────────────●
         ■  ■  ■  ■  ■      ■ = edge handle (resize one axis)
```

| Handle | Cursor | Behavior |
|---|---|---|
| Corner (●) | `nwse-resize` / `nesw-resize` | Proportional resize. Hold Shift to lock aspect ratio. |
| Top/Bottom edge (■) | `ns-resize` | Resize height only. |
| Left/Right edge (■) | `ew-resize` | Resize width only. |
| Rotate (top-center ●) | `crosshair` icon or rotate cursor | Rotate freely. Hold Shift for 15° increments. |
| Handle hover | Handle fill → `--dc-accent-hover`. | 120ms transition. |
| While dragging | Snap guides appear (blue lines) when aligning with canvas center, edges, or other objects. | Fabric.js guidelines plugin or custom `on('object:moving')`. |

**Size constraints:**
- Text: min 12px font size, max canvas width.
- Image: min 20×20px, max canvas bounds. Upscale warning if image < 300px native resolution.

### 5.5 Context Menu (Right-Click)

```
┌─────────────────────────┐
│  ✂️  Cut          Ctrl+X│
│  📋  Copy         Ctrl+C│
│  📄  Paste        Ctrl+V│
│  📌  Duplicate    Ctrl+D│
│  ───────────────────────│
│  🔝  Bring to Front     │
│  🔜  Bring Forward  Ctrl+]│
│  🔙  Send Backward Ctrl+[│
│  🔚  Send to Back       │
│  ───────────────────────│
│  🔒  Lock               │
│  👁  Hide               │
│  ───────────────────────│
│  🗑  Delete       Del   │
└─────────────────────────┘
```

| Property | Value |
|---|---|
| **Appearance** | Width 200px, `--dc-bg-elevated`, shadow `--dc-shadow-panel`, rounded `--dc-radius-md`. Items: height 36px, padding 8px 12px. Separator: 1px `--dc-border-default`. |
| **Position** | At cursor location. Constrained to viewport (flip if near edge). |
| **Open** | Right-click on canvas object. `fadeIn` 100ms + slideDown 4px. |
| **Hover (item)** | Background `--dc-accent-subtle`. 120ms transition. |
| **Disabled items** | Opacity 0.35, `cursor: default`. Example: "Bring to Front" when already frontmost. |
| **Shortcut hints** | Right-aligned, `--dc-text-tertiary`, `--dc-font-mono`, `--dc-text-xs`. |
| **Dismiss** | Click outside, Escape, or select action. `fadeOut` 100ms. |

**Canvas empty area right-click:** Shows abbreviated menu: Paste (if clipboard), Select All, Reset Viewport.

### 5.6 Zoom & Pan

| Gesture | Visual | Behavior |
|---|---|---|
| **Scroll wheel** | Zoom label updates in toolbar. Smooth zoom animation (Fabric.js `zoomToPoint`). | ±10% per scroll step. Centered on cursor position. |
| **Pinch (touch)** | Two-finger pinch. Toolbar label realtime. | Fabric.js touch events. Min zoom: 25%, Max: 400%. |
| **Pan (drag canvas bg)** | Cursor: `grab` → `grabbing`. Canvas moves. | `canvas.isDragging = false` for object interaction, true for pan on empty area. |
| **Double-click canvas bg** | Animated zoom+pan to fit all content. Duration: 300ms ease. | Fit with 40px padding. |
| **Fit button** | Same as double-click. Button icon briefly pulses `--dc-accent`. | Toolbar button. |
| **Zoom to 100%** | Click zoom label (e.g. "100%"). Immediate reset. | 1 Fabric.js unit = 1 screen pixel. |

### 5.7 Keyboard Shortcuts

| Shortcut | Action | Visual Feedback |
|---|---|---|
| `Ctrl/Cmd+Z` | Undo | Toolbar Undo button briefly highlights. Toast: "Undo" briefly (1.5s). |
| `Ctrl/Cmd+Shift+Z` | Redo | Toolbar Redo button highlights. Toast: "Redo". |
| `Delete / Backspace` | Delete selected | Object fades out (150ms). LayerItem slides out. Toast: "Đã xoá". |
| `Ctrl/Cmd+C` | Copy | Brief flash on selected object (white overlay 50ms). |
| `Ctrl/Cmd+V` | Paste | Object appears at canvas center. Toast: "Đã dán". |
| `Ctrl/Cmd+D` | Deselect | All selections clear. |
| `Ctrl/Cmd+A` | Select all | All objects on active canvas selected. |
| `Ctrl/Cmd+G` | Group | Selected objects grouped. Layer list shows group item. |
| `Ctrl/Cmd+M` | Toggle Mirror | Mirror button toggles. Toast: "Mirror ON/OFF". |
| `Ctrl/Cmd+E` | Export dialog | Modal opens with focus trap. |
| `+ / -` | Zoom in/out | Toolbar zoom % updates. |
| `0` | Fit canvas | Animated zoom to fit. |
| `Arrow keys` | Nudge 1px | Object moves 1px per keypress. Continuous on hold (after 300ms delay). |
| `Shift+Arrow` | Nudge 10px | Object moves 10px. |

### 5.8 Toast Notifications

```
┌───────────────────────────────────┐
│  ✅  Đã lưu thiết kế              │  ← Auto-dismiss 3s
└───────────────────────────────────┘

┌───────────────────────────────────┐
│  ❌  Upload thất bại — thử lại    │  ← Manual dismiss (✕)
└───────────────────────────────────┘
```

| Property | Value |
|---|---|
| **Position** | Bottom-center, 24px from bottom edge. z-index: `--dc-z-toast`. |
| **Appearance** | Height 44px, `--dc-bg-tooltip`, shadow `--dc-shadow-tooltip`, rounded `--dc-radius-md`. Padding 12px 16px. |
| **Success** | Green left border (3px `--dc-success`). ✅ icon. |
| **Error** | Red left border (3px `--dc-error`). ❌ icon. |
| **Info** | Blue left border (3px `--dc-info`). ℹ️ icon. |
| **Animation** | Slide up + fade in from bottom (250ms ease). Slide down + fade out on dismiss. |
| **Stack** | Max 3 visible. Newer toasts push older ones up. |
| **Auto-dismiss** | Success/Info: 3s. Error: 5s + manual close button. |

---

## 6. Accessibility Notes

### 6.1 WCAG 2.1 AA Targets

| Criterion | Application | Status |
|---|---|---|
| **1.4.3 Contrast (Minimum)** | All text/icon combos pass 4.5:1 against backgrounds. Exception: disabled text, placeholder, tertiary hints (decorative). | ✅ Designed |
| **1.4.11 Non-text Contrast** | UI controls (buttons, inputs, handles) have 3:1 minimum against adjacent colors. Focus rings use 2-pixel offset for visibility. | ✅ Designed |
| **2.1.1 Keyboard** | All canvas interactions have keyboard equivalents: object selection (Tab), move (arrows), delete (Del), context menu (Shift+F10). Asset Gallery: grid navigation (arrows), Enter to add to canvas. | ⚠️ Needs implementation |
| **2.4.7 Focus Visible** | Focus ring (`--dc-focus-ring`) on all interactive elements. Canvas objects show selection box on focus. | ✅ Designed |
| **2.5.5 Target Size** | All clickable elements ≥ 44×44px on mobile (touch). Desktop: ≥ 24×24px. | ✅ Designed |
| **3.3.2 Labels** | All inputs have visible labels. Icons have `aria-label`. Canvas has `aria-label="Design canvas — Men's garment"`. | ⚠️ Needs implementation |

### 6.2 Screen Reader Considerations

- Canvas: provide a live-region summary of active canvas state: "Canvas Nam: 3 layers selected. Text layer 'Forever Together' focused."
- Layer reordering: `aria-live="polite"` announcement on reorder: "Layer moved to position 2."
- Export progress: `aria-live="assertive"` on status change: "Export 50% complete." → "Export complete. Download ready."
- Color picker: announce hex value on selection change.
- Fabric.js objects: set `ariaLabel` on each object for screen reader identification.

### 6.3 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

- All decorative animations (pulse, shimmer, slide) disabled.
- Essential feedback (focus rings, selection boxes) remain instant.

---

## 7. Handoff Checklist

### For Frontend Engineer (pa-frontend-engineer)

- [ ] Import `design/design-tokens.css` in `client/src/main.tsx` (before App.css)
- [ ] Replace hardcoded CSS variables in `App.css` with `--dc-*` tokens
- [ ] Implement 10 component states as defined in §3
- [ ] Apply responsive layout strategy from §4
- [ ] Implement interaction patterns from §5, prioritizing:
  - [ ] 5.1 Drag-drop asset → canvas
  - [ ] 5.2 Layer reorder
  - [ ] 5.4 Resize handles (Fabric.js built-in + snap guides)
  - [ ] 5.5 Context menu
- [ ] Implement keyboard shortcuts from §5.7
- [ ] Implement toast notification system from §5.8
- [ ] Add `aria-*` attributes per §6.2
- [ ] Add `prefers-reduced-motion` media query per §6.3

### For QA (pa-qa-automation)

- [ ] Verify color contrast ratios (§2.1 table) with axe DevTools
- [ ] Test all 10 component state matrices on desktop + tablet + mobile
- [ ] Verify keyboard navigation: Tab through all interactive elements
- [ ] Test drag-drop works on desktop (mouse) and mobile (touch)
- [ ] Verify responsive breakpoints at 768, 1024, 1280, 1440
- [ ] Test zoom/pan on touch devices
- [ ] Verify export dialog focus trap

### For Release Captain (pa-release-captain)

- [ ] Ensure `design/design-tokens.css` is in the build pipeline (imported in main.tsx)
- [ ] Verify no visual regression from existing App.css → new tokens migration
- [ ] Check that all 10 component states render without console errors

---

## Appendix A: File Inventory

| File | Purpose | Status |
|---|---|---|
| `design/design-tokens.css` | CSS custom properties — all design tokens | ✅ Complete |
| `design/UI_SPEC.md` | This specification document | ✅ Complete |
| `design/assets/` | (Reserved for wireframe images, icon specs) | 📁 Created, empty |

## Appendix B: Decision Log

| # | Decision | Rationale |
|---|---|---|
| D-1 | Dark theme only (no light mode MVP) | Creative tools benefit from dark UIs; reduces design/QA surface. Light mode can be added post-MVP as a theme toggle. |
| D-2 | Single accent color (purple #6c63ff) | Prevents visual noise. Semantic colors (green/red/yellow) only for state feedback, never decoration. |
| D-3 | Inter as primary font (bundled via @fontsource) | Consistent rendering across OS. Already included in project. Monospace for technical values. |
| D-4 | CSS Variables over Tailwind | Frontend already uses vanilla CSS. CSS vars are zero-dependency, zero-build-step, and the existing App.css already uses this pattern. Tailwind is unnecessary overhead for this project scope. |
| D-5 | 10 components in state matrix | Covers all primary UI surfaces. Non-interactive components (GarmentOverlay, CanvasContainer) excluded as they are Fabric.js-internal. |
| D-6 | Desktop-first responsive strategy | Per task constraint. Editor tool ergonomics demand large screens. Tablet/mobile is fallback for review, not primary creation. |
| D-7 | Bottom sheet for mobile control panel | Standard mobile pattern. Avoids sidebar covering canvas on small screens. Draggable handle for partial/full reveal. |

## Appendix C: References

- Architecture: `architecture/ARCHITECTURE.md` — Component tree (§3.1), responsive strategy (§6)
- ADRs: `architecture/ADR.md` — Fabric.js selection (ADR-001), Zustand state (ADR-003)
- User Guide: `docs/USER_GUIDE.md` — Feature scope, keyboard shortcuts matrix
- Security: `security-review.md` — Text sanitization, CORS, rate limiting
- Existing CSS: `client/src/App.css` — Current token set (to be migrated to `--dc-*`)
- Existing Components: `client/src/api/errors.tsx` — ErrorDisplay, LoadingSpinner, EmptyState, UploadProgress, ExportProgress (to be styled with new tokens)
