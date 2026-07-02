# Nghiên cứu So sánh Fabric.js vs Konva.js

> **Dự án**: Dual Canvas Editor MVP — T-Shirt Designer
> **Ngày**: 2026-07-02
> **Vai trò**: Solution Architect (pa-solution-architect)
> **Nhiệm vụ**: #22 — Discovery Research

---

## 1. Tổng quan

### 1.1 Giới thiệu

Cả Fabric.js và Konva.js đều là thư viện JavaScript mạnh mẽ giúp làm việc với HTML5 Canvas thông qua mô hình đối tượng (object model). Thay vì thao tác trực tiếp với pixel, cả hai cho phép developer tạo, chỉnh sửa và tương tác với các đối tượng đồ họa như shape, image, text.

Tuy nhiên, hai thư viện có triết lý thiết kế và kiến trúc khác biệt đáng kể, dẫn đến các trade-off khác nhau về hiệu năng, trải nghiệm phát triển và tính năng.

### 1.2 Bảng so sánh nhanh

| Tiêu chí                   | Fabric.js                 | Konva.js                                |
| -------------------------- | ------------------------- | --------------------------------------- |
| **Phiên bản mới nhất**     | v6.6.6                    | v9.3.18                                 |
| **Ngày tạo**               | 2010-06-09 (15+ năm)      | 2015-01-09 (10+ năm)                    |
| **GitHub Stars**           | ~31,280                   | ~14,592                                 |
| **Forks**                  | ~3,628                    | ~1,057                                  |
| **Open Issues**            | ~460                      | ~19                                     |
| **Ngôn ngữ**               | TypeScript                | TypeScript                              |
| **License**                | MIT                       | MIT (modified)                          |
| **Cập nhật gần nhất**      | 2026-07-01 (rất tích cực) | 2026-06-15                              |
| **Bundle size (minified)** | ~309.6 kB                 | ~170 kB (ước tính)                      |
| **Bundle size (gzip)**     | ~91.3 kB                  | ~55 kB (ước tính)                       |
| **React wrapper**          | Không chính thức (manual) | react-konva (chính thức)                |
| **Kiến trúc**              | Object model đơn khối     | Scene graph phân cấp (Stage→Layer→Node) |
| **SVG support**            | Native import/export      | Hạn chế (JSON tốt hơn)                  |

---

## 2. So sánh chi tiết

### 2.1 Kiến trúc và Mô hình Đối tượng

#### Fabric.js — Retained Mode, Monolithic Canvas

Fabric sử dụng kiến trúc retained mode với canvas instance là trung tâm. Mọi đối tượng (shape, image, text) được thêm trực tiếp vào canvas và Fabric quản lý toàn bộ trạng thái.

```js
const canvas = new fabric.Canvas('c');
const rect = new fabric.Rect({ left: 50, top: 50, fill: 'red', width: 100, height: 100 });
canvas.add(rect);
canvas.renderAll();
```

**Đặc điểm**:

- Mọi thứ gắn vào một canvas instance duy nhất
- Render lại toàn bộ canvas khi có thay đổi
- Có thể dùng object caching để cải thiện hiệu năng
- Phù hợp với editor có vài trăm object

#### Konva.js — Scene Graph phân cấp

Konva sử dụng kiến trúc scene graph với 3 tầng: **Stage (sân khấu) → Layer (lớp) → Node (đối tượng)**. Mỗi Layer là một canvas riêng biệt.

```js
const stage = new Konva.Stage({ container: 'container', width: 400, height: 400 });
const layer = new Konva.Layer();
stage.add(layer);
const rect = new Konva.Rect({ x: 50, y: 50, width: 100, height: 100, fill: 'red' });
layer.add(rect);
layer.draw();
```

**Đặc điểm**:

- Phân tách static content và interactive content qua các layer
- Background layer render một lần, interactive layer redraw thường xuyên
- Batch drawing tự động — tối ưu draw calls
- Hit detection tự động (pixel-perfect cho shape phức tạp)
- Hỗ trợ dirty region detection — chỉ vẽ lại vùng thay đổi

> **Kết luận kiến trúc**: Konva có lợi thế rõ rệt về kiến trúc phân tầng, đặc biệt khi ứng dụng có cả static background (áo thun mẫu) và interactive layer (thiết kế của user).

---

### 2.2 Hiệu năng

| Tình huống           | Fabric.js               | Konva.js                     |
| -------------------- | ----------------------- | ---------------------------- |
| **< 100 objects**    | Xuất sắc                | Xuất sắc                     |
| **100-500 objects**  | Tốt (cần cache)         | Xuất sắc                     |
| **500-5000 objects** | Bắt đầu chậm            | Tốt                          |
| **5000+ objects**    | Không phù hợp           | 60fps với layer optimization |
| **Mobile**           | Có vấn đề (issue #6980) | 60fps ổn định                |
| **Render strategy**  | Redraw toàn bộ canvas   | Layer-based + dirty region   |

**Cơ chế tối ưu của Konva**:

- Dirty region detection: chỉ render vùng thay đổi
- Layer-based rendering: tách static khỏi dynamic
- GPU acceleration
- Batch processing thông minh
- Object pooling & automatic cleanup

**Cơ chế tối ưu của Fabric**:

- Object caching (thủ công): `rect.objectCaching = true`
- Cần developer tự quản lý khi nào invalidate cache
- Render đồng bộ, không có dirty region

> **Kết luận hiệu năng**: Konva vượt trội ở mọi mặt. Với T-shirt designer (số lượng object vừa phải ~50-200), cả hai đều đáp ứng tốt trên desktop. Nhưng nếu MVP hướng tới mobile-first, Konva là lựa chọn an toàn hơn.

---

### 2.3 Tính năng Cốt lõi cho T-Shirt Designer

#### 2.3.1 Free Drawing (Vẽ tự do)

|                          | Fabric.js               | Konva.js                            |
| ------------------------ | ----------------------- | ----------------------------------- |
| **Hỗ trợ**               | Có (fabric.PencilBrush) | Có (Konva.Line + free drawing demo) |
| **Brush types**          | Pencil, Circle, Spray   | Line-based, có thể custom           |
| **Pressure sensitivity** | Hỗ trợ                  | Hỗ trợ qua touch events             |
| **Eraser**               | Có thể implement        | Có thể implement                    |

Fabric có lợi thế nhẹ với Brush system có sẵn, nhưng Konva cũng cung cấp demo free drawing đầy đủ.

#### 2.3.2 Image Manipulation (Xử lý ảnh)

|                   | Fabric.js                                            | Konva.js                       |
| ----------------- | ---------------------------------------------------- | ------------------------------ |
| **Upload ảnh**    | fabric.Image.fromURL()                               | Konva.Image + image loader     |
| **Resize/Rotate** | Built-in controls                                    | Transformer node               |
| **Filters**       | Nhiều filter có sẵn (grayscale, blur, brightness...) | Có filters (blur, pixelate...) |
| **Crop**          | Hỗ trợ                                               | Hỗ trợ qua clip region         |
| **SVG import**    | Native (fabric.loadSVGFromURL)                       | Hạn chế                        |

Fabric có lợi thế rõ rệt về số lượng filter có sẵn và khả năng import SVG native — rất quan trọng nếu app cần import vector art/icon.

#### 2.3.3 Text Rendering (Hiển thị và chỉnh sửa văn bản)

|                         | Fabric.js                                 | Konva.js                    |
| ----------------------- | ----------------------------------------- | --------------------------- |
| **Text object**         | fabric.Text, fabric.IText, fabric.Textbox | Konva.Text                  |
| **In-place editing**    | Có (IText — click để edit)                | Không có sẵn (cần tự build) |
| **Textbox (multiline)** | Có                                        | Cần tự implement            |
| **Font styling**        | Đầy đủ (font, size, weight, align...)     | Đầy đủ                      |
| **Custom fonts**        | Hỗ trợ                                    | Hỗ trợ                      |

**Fabric.js vượt trội về text**: IText cho phép in-place editing ngay trên canvas — user click vào text và gõ trực tiếp. Đây là tính năng rất quan trọng với T-shirt designer (user thường muốn gõ text lên áo).

#### 2.3.4 Zoom/Pan

|                          | Fabric.js                | Konva.js                        |
| ------------------------ | ------------------------ | ------------------------------- |
| **Zoom**                 | canvas.zoomToPoint()     | stage.scale()                   |
| **Pan**                  | canvas.viewportTransform | stage.draggable()               |
| **Pinch zoom (mobile)**  | Cần implement thủ công   | Có demo Multi-touch Scale Stage |
| **Coordinate transform** | Tự quản lý               | Tự động qua scene graph         |

Konva có lợi thế với mobile pinch-to-zoom có sẵn trong demo. Fabric cần code thêm để xử lý gesture.

#### 2.3.5 Export

|                      | Fabric.js                     | Konva.js                      |
| -------------------- | ----------------------------- | ----------------------------- |
| **PNG/JPEG**         | canvas.toDataURL()            | stage.toDataURL()             |
| **SVG**              | canvas.toSVG() — native       | Không native                  |
| **JSON**             | canvas.toJSON()               | stage.toJSON()                |
| **PDF**              | Qua jsPDF (cần tích hợp thêm) | Qua Polotno SDK hoặc tự build |
| **Độ phân giải cao** | multiplier trong toDataURL    | pixelRatio trong Stage config |

Fabric có lợi thế xuất SVG native — quan trọng nếu cần in ấn chất lượng cao (vector output).

---

### 2.4 Mobile Touch Support

Đây là một trong những khác biệt quan trọng nhất giữa hai thư viện.

| Tiêu chí                 | Fabric.js                                       | Konva.js                                                          |
| ------------------------ | ----------------------------------------------- | ----------------------------------------------------------------- |
| **Touch events**         | Hỗ trợ qua event system                         | Native touch events: touchstart, touchmove, touchend, tap, dbltap |
| **Unified API**          | Cần handle riêng mouse + touch                  | Tự động normalize mouse & touch                                   |
| **Multi-touch gestures** | Không có sẵn                                    | Có demo pinch-to-zoom, rotate                                     |
| **Gesture recognition**  | Cần tích hợp thêm (Hammer.js)                   | Tích hợp được Hammer.js                                           |
| **Mobile hiệu năng**     | Có issue report về performance                  | 60fps ổn định với layer system                                    |
| **Known issues**         | Issue #6980: brushes, text, gesture trên mobile | Ít issue về mobile                                                |

**Vấn đề của Fabric.js trên mobile** (từ GitHub issue #6980):

> "Mobile and touch support has multiple issues: the brushes, the text handling, gesture recognition, pencil and finger recognition, and other interactions that will bring up."

**Konva.js mobile docs** xác nhận hỗ trợ đầy đủ: tap, touchstart, touchmove, touchend, dragstart, dragmove, dragend trên mobile.

> **Kết luận Mobile**: Konva.js vượt trội về mobile touch support. Nếu MVP có yêu cầu hoạt động trên mobile browser, Konva là lựa chọn an toàn hơn nhiều.

---

### 2.5 React Integration

| Tiêu chí            | Fabric.js                   | Konva.js                       |
| ------------------- | --------------------------- | ------------------------------ |
| **React wrapper**   | Không chính thức            | react-konva (chính thức, 18.x) |
| **Declarative API** | Không — phải dùng useEffect | Có — JSX declarative           |
| **State sync**      | Manual (tự quản lý)         | Tự động                        |
| **Hooks**           | Không có                    | useStrictMode, refs...         |
| **Community React** | Có hướng dẫn của bên thứ 3  | First-class support            |

```tsx
// react-konva — Declarative, React-native
import { Stage, Layer, Rect, Transformer } from 'react-konva';

function Editor() {
  return (
    <Stage width={800} height={600}>
      <Layer>
        <Rect x={50} y={50} width={100} height={100} fill="red" draggable />
      </Layer>
    </Stage>
  );
}
```

```tsx
// fabric.js — Manual, imperative trong useEffect
import { useEffect, useRef } from 'react';
import { Canvas, Rect } from 'fabric';

function Editor() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = new Canvas('canvas-id');
    const rect = new Rect({ left: 50, top: 50, width: 100, height: 100, fill: 'red' });
    canvas.add(rect);
    return () => canvas.dispose();
  }, []);
  return <canvas id="canvas-id" />;
}
```

Dự án Dual Canvas Editor đang dùng React + TypeScript. react-konva cho phép tích hợp mượt với hệ sinh thái React hiện tại.

---

### 2.6 Bundle Size & Tree-Shaking

|                     | Fabric.js v6.6.6              | Konva.js v9.3.18             |
| ------------------- | ----------------------------- | ---------------------------- |
| **Minified**        | ~309.6 kB                     | ~170 kB                      |
| **Gzip**            | ~91.3 kB                      | ~55 kB                       |
| **Tree-shakeable**  | Có (v6 modular, import riêng) | Có (import riêng shape)      |
| **+ react wrapper** | —                             | react-konva thêm ~30 kB gzip |

Ví dụ tree-shaking:

```ts
// Fabric v6 — import named
import { Canvas, Rect, Circle } from 'fabric';

// Konva — import từng phần
import Konva from 'konva/lib/Core';
import { Rect, Circle } from 'konva/lib/shapes/Rect';
```

Cả hai đều hỗ trợ tree-shaking với bundler hiện đại (Vite, Webpack 5). Konva nhẹ hơn đáng kể, đặc biệt quan trọng cho mobile-first.

---

### 2.7 Cộng đồng & Bảo trì

| Tiêu chí                      | Fabric.js                         | Konva.js                    |
| ----------------------------- | --------------------------------- | --------------------------- |
| **Tuổi đời**                  | 15+ năm (2010)                    | 10+ năm (2015)              |
| **Stars**                     | ~31,280                           | ~14,592                     |
| **Open issues**               | 460 (cao)                         | 19 (thấp)                   |
| **Tần suất commit**           | Rất tích cực (v6 đang phát triển) | Ổn định                     |
| **Documentation**             | Đầy đủ, có kitchensink demo       | Rất tốt, nhiều sandbox demo |
| **Ecosystem**                 | Nhiều plugin bên thứ 3            | Polotno SDK, react-konva    |
| **T-shirt designer examples** | Nhiều (3+ repo GitHub)            | Có (1-2 repo GitHub)        |
| **Breaking changes**          | v5→v6 có thay đổi API             | Ổn định qua các version     |

Fabric có cộng đồng lớn hơn và nhiều T-shirt designer examples hơn. Tuy nhiên, 460 open issues là con số cần lưu ý — có thể có bug tồn đọng lâu.

Konva có ít open issues (19), cho thấy codebase được maintain tốt và ổn định.

---

## 3. Phân tích theo Use Case: T-Shirt Designer

### 3.1 Yêu cầu điển hình của T-Shirt Designer

1. **Canvas hiển thị áo thun mẫu** (static/bán static background)
2. **Upload ảnh** từ máy user vào canvas
3. **Di chuyển, resize, rotate** ảnh và text trên áo
4. **Thêm text** với custom font, màu sắc, kích thước
5. **Vẽ tự do** (free drawing/brush)
6. **Zoom/Pan** để xem chi tiết
7. **Layer management** (z-index, bring to front/back)
8. **Export** ảnh chất lượng cao (in ấn)
9. **Undo/Redo**
10. **Hoạt động trên mobile browser**

### 3.2 Fabric.js phù hợp khi nào?

**Ưu điểm cho T-shirt designer**:

- ✅ **In-place text editing** (IText) — user gõ text trực tiếp
- ✅ **SVG import/export** — quan trọng cho in ấn vector chất lượng cao
- ✅ **Nhiều filter có sẵn** — grayscale, sepia, blur, brightness...
- ✅ **Built-in controls** — resize/rotate handle có sẵn, không cần code thêm
- ✅ **JSON serialization mạnh** — save/load thiết kế
- ✅ **Nhiều T-shirt designer examples** — tham khảo triển khai

**Nhược điểm**:

- ❌ React integration thủ công, dễ gây bug state sync
- ❌ Mobile touch còn nhiều issue
- ❌ Hiệu năng thấp hơn với scene phức tạp
- ❌ Bundle size lớn hơn
- ❌ Không có dirty region rendering

### 3.3 Konva.js phù hợp khi nào?

**Ưu điểm cho T-shirt designer**:

- ✅ **react-konva** — declarative API, state sync tự động
- ✅ **Mobile-first** — touch event native, 60fps mobile
- ✅ **Layer architecture** — tách áo nền (static) khỏi thiết kế (interactive)
- ✅ **Hiệu năng cao** — batch drawing, dirty region
- ✅ **Bundle nhẹ hơn** — tốt cho mobile
- ✅ **Polotno SDK** — có thể dùng design editor có sẵn nếu cần accelerate

**Nhược điểm**:

- ❌ Không có in-place text editing — phải tự build
- ❌ SVG support hạn chế
- ❌ Interaction cần setup thủ công (Transformer)
- ❌ Ít T-shirt designer examples hơn

---

## 4. Khuyến nghị

### 4.1 Đề xuất: **Konva.js + react-konva**

**Lý do**:

1. **Dự án dùng React + TypeScript** — react-konva cho declarative API, giảm boilerplate, dễ maintain
2. **Mobile-first** — Konva có mobile touch support native, quan trọng nếu MVP hướng tới mobile browser
3. **Kiến trúc Layer** — tách áo thun nền (static) khỏi phần thiết kế (interactive) giúp tối ưu render và giảm bug
4. **Bundle nhẹ hơn** — quan trọng cho UX trên mobile
5. **Ít breaking changes** — API ổn định qua các version
6. **Polotno SDK** — nếu cần accelerate, có thể dùng editor có sẵn thay vì build từ đầu

### 4.2 Những thứ cần tự build khi chọn Konva

| Tính năng               | Mức độ phức tạp | Ghi chú                                      |
| ----------------------- | --------------- | -------------------------------------------- |
| In-place text editing   | Trung bình-Cao  | Cần HTML overlay hoặc custom Konva node      |
| SVG import              | Trung bình      | Có thể dùng thư viện parse SVG → Konva nodes |
| Brush/Pencil tool       | Thấp-Trung bình | Konva có demo Free Drawing                   |
| Export độ phân giải cao | Thấp            | Dùng `pixelRatio` trong config               |
| Undo/Redo               | Trung bình      | Dùng stage.toJSON() + history stack          |

### 4.3 Khi nào nên chọn Fabric.js thay thế

- Nếu **in-place text editing** là tính năng **bắt buộc và không thể trade-off**
- Nếu cần **SVG export chất lượng vector** cho in ấn thương mại
- Nếu team có kinh nghiệm Fabric.js từ trước
- Nếu mobile support **không phải ưu tiên** trong MVP
- Nếu cần **nhiều filter ảnh có sẵn** (Fabric có bộ filter phong phú hơn)

### 4.4 Risk Assessment

| Rủi ro                           | Mức độ     | Mitigation                                              |
| -------------------------------- | ---------- | ------------------------------------------------------- |
| Konva text editing cần build lại | Cao        | Dùng HTML overlay cho text input, hoặc dùng Polotno SDK |
| Fabric.js mobile issues          | Cao        | Cần test kỹ mobile, có thể phải fork/patch              |
| Fabric.js 460 open issues        | Trung bình | Có thể gặp bug khó fix                                  |
| Konva SVG export hạn chế         | Thấp       | In ấn thường dùng PNG 300DPI, không nhất thiết cần SVG  |

---

## 5. Tài liệu tham khảo

### Nguồn chính

1. **Velt.dev** — "Best Canvas Library for Web and Mobile Apps (Jan 2026)" — So sánh React Flow, Konva.js, Fabric.js về hiệu năng và use case
   https://velt.dev/blog/best-canvas-library-web-mobile-apps

2. **npm-compare.com** — "fabric vs konva" — So sánh chi tiết API, architecture, serialization, React integration
   https://npm-compare.com/fabric,konva

3. **TheNote.App** — "Konva.js vs Fabric.js: In-Depth Technical Comparison" — Phân tích kỹ thuật sâu về rendering, animation, memory management
   https://thenote.app/post/en/konva-js-vs-fabric-js-in-depth-technical-comparison-and-use-case-analysis-y9mlu7q9k0

4. **Konva.js Sandbox** — Canvas Editor demo với Konva + Polotno SDK
   https://konvajs.org/docs/sandbox/Canvas_Editor.html

5. **Fabric.js GitHub** — stars, issues, commit activity
   https://github.com/fabricjs/fabric.js

6. **Konva.js GitHub** — stars, issues, commit activity
   https://github.com/konvajs/konva

### T-shirt Designer Examples

- **Fabric.js T-shirt Designer** (luciferreeves): https://github.com/luciferreeves/TShirtDesigner
- **Fabric.js T-shirt Designer** (NeetishRaj/Angular): https://github.com/NeetishRaj/TshirtDesigner
- **Konva.js T-shirt Designer** (EhsanKinux/React): https://github.com/EhsanKinux/konva-tshirt-designer
- **Fabric.js T-shirt Designer** (CodeSandbox): https://codesandbox.io/s/fabricjs-t-shirt-designer-ei7up

### Mobile Touch Issues

- Fabric.js Mobile Support Issue #6980: https://github.com/fabricjs/fabric.js/issues/6980
- Konva.js Mobile Events Docs: https://konvajs.org/docs/events/Mobile_Events.html
- Konva.js Multi-touch Scale Stage: https://konvajs.org/docs/sandbox/Multi-touch_Scale_Stage.html

### Bundle Size

- Bundlephobia — fabric v6.6.6: ~309.6 kB min / ~91.3 kB gzip
- Bundlephobia — react-konva v18.2.10 (bao gồm konva): https://bundlephobia.com/package/react-konva

---

## 6. Quyết định Kiến trúc (ADRs)

### ADR: Chọn Konva.js + react-konva làm Canvas Engine

**Context**: Dual Canvas Editor MVP — T-shirt designer cần canvas library cho React + TypeScript, hỗ trợ free drawing, image manipulation, text rendering, zoom/pan, export.

**Decision**: Sử dụng Konva.js + react-konva làm canvas rendering engine.

**Rationale**:

1. React-native integration qua react-konva với declarative API
2. Mobile touch support native, quan trọng cho mobile-first MVP
3. Layer architecture phù hợp tách static content (áo nền) và interactive content (thiết kế)
4. Bundle size nhẹ hơn Fabric ~40%
5. API ổn định, ít breaking changes
6. Có Polotno SDK làm fallback nếu cần accelerate development

**Trade-off**: Mất in-place text editing có sẵn (cần tự build HTML overlay), mất SVG export native.

**Consequences**:

- Cần implement text editing qua HTML overlay hoặc custom node
- Cần tự setup Transformer cho resize/rotate controls
- Có thể cần parse SVG thủ công nếu cần import vector art

---

## Kết quả

**Project**: Dual Canvas Editor MVP
**Task**: #22 — Discovery Research: Fabric.js vs Konva.js
**Role**: pa-solution-architect
**Summary**: Đã nghiên cứu và so sánh toàn diện Fabric.js vs Konva.js trên các tiêu chí: kiến trúc, hiệu năng, tính năng (free drawing, image manipulation, text rendering, zoom/pan, export), mobile touch support, bundle size, React integration, cộng đồng. Khuyến nghị chọn **Konva.js + react-konva** cho MVP với rationale dựa trên React-native integration, mobile-first support, layer architecture, và bundle size.
**Artifacts created**: canvas-library-research.md
**Durable repo paths**: dual-canvas-editor/.goclaw-project/canvas-library-research.md
**Verification**: Đã đối chiếu từ 8+ nguồn bao gồm GitHub API, so sánh kỹ thuật từ Velt.dev, npm-compare, TheNote.app, và các T-shirt designer examples thực tế.
**Decisions made**: ADR — Chọn Konva.js + react-konva, với text editing sẽ implement qua HTML overlay.
**Risks/blockers**:

- Text editing cần build từ đầu (HTML overlay approach)
- SVG export hạn chế — cân nhắc dùng PNG 300DPI cho in ấn thay vì SVG
  **Recommended next task**: Tạo task cho pa-implementation-planner để lên kế hoạch tích hợp Konva.js vào project, hoặc giao pa-frontend-engineer prototype Canvas Editor với react-konva.
