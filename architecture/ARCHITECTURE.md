# System Architecture — Dual Canvas Editor MVP

**Version:** 1.0.0  
**Date:** 2026-07-02  
**Author:** Solution Architect (pa-solution-architect)  
**Status:** Draft — for review by team

---

## 1. Executive Summary

The Dual Canvas Editor is a greenfield web application for designing print-ready garment graphics. Users place text and image layers on two synchronized canvas panels (Nam/Nữ garment bases), apply effects, and export as high-resolution PNG or PDF.

The system follows a **thin-client design editor + server-side export pipeline** architecture. The browser handles all real-time canvas editing via a JavaScript canvas library. The Node.js server handles image upload, asset management, and heavy export rendering via Sharp.

### Key Architecture Decisions (see ADRs)

| ADR                                                | Decision                                   | Rationale                                                                            |
| -------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------ |
| [ADR-001](ADR.md#adr-001-canvas-library-selection) | **Fabric.js >= 7.4.0**                     | Feature maturity, built-in SVG export, JSON serialization, active ecosystem          |
| [ADR-002](ADR.md#adr-002-export-pipeline-strategy) | **Server-side Sharp** (MVP), no Puppeteer  | Lower attack surface, smaller footprint, faster cold start                           |
| [ADR-003](ADR.md#adr-003-state-management)         | **Zustand** with Zod-validated state       | Lightweight, no boilerplate, good React 19 compat, works with canvas imperative APIs |
| [ADR-004](ADR.md#adr-004-storage-strategy)         | **Local disk** (MVP) → **S3 + CDN** (prod) | URL abstraction makes migration seamless                                             |
| [ADR-005](ADR.md#adr-005-no-auth-mvp-model)        | **No authentication in MVP**               | Scope tradeoff; rate limiting per-IP as primary guardrail                            |
| [ADR-006](ADR.md#adr-006-monorepo-structure)       | **pnpm workspace**, `client/` + `server/`  | Already scaffolded; consistent toolchain, shared tsconfig                            |
| [ADR-007](ADR.md#adr-007-idempotent-export)        | **SHA-256 canvas state hash**              | Prevents duplicate export jobs; simple to implement                                  |

---

## 2. System Context Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER'S BROWSER                               │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                   React SPA (client/)                         │   │
│  │                                                               │   │
│  │  ┌──────────┐  ┌──────────────┐  ┌────────────────────────┐  │   │
│  │  │ Nam      │  │  Nữ Canvas   │  │   Control Panel        │  │   │
│  │  │ Canvas   │  │              │  │                        │  │   │
│  │  │ (Fabric) │  │  (Fabric)    │  │  ┌──────────────────┐  │  │   │
│  │  │          │  │              │  │  │ Layer List       │  │  │   │
│  │  │          │  │              │  │  │ Text/Image Add   │  │  │   │
│  │  └──────────┘  └──────────────┘  │  │ Properties Panel │  │  │   │
│  │                                   │  │ Export Button    │  │  │   │
│  │  ┌──────────────────────────────┐ │  │ Color Picker     │  │  │   │
│  │  │  Zustand Store               │ │  │ Font Selector    │  │  │   │
│  │  │  (canvasState, assets,       │ │  │ Asset Gallery    │  │  │   │
│  │  │   exportJob, undoStack)      │ │  └──────────────────┘  │  │   │
│  │  └──────────────────────────────┘ │                         │  │   │
│  └───────────────────────────────────┼─────────────────────────┘  │   │
│                                       │                            │   │
└───────────────────────────────────────┼────────────────────────────┘
                                        │  HTTPS (REST API)
           ┌────────────────────────────▼────────────────────────────┐
           │                Express 5 API (server/)                   │
           │                                                         │
           │  ┌──────────────┐  ┌────────────┐  ┌────────────────┐  │
           │  │ /api/v1/     │  │ /api/v1/   │  │ /api/v1/       │  │
           │  │ upload       │  │ export     │  │ assets, fonts  │  │
           │  └──────┬───────┘  └─────┬──────┘  └────────────────┘  │
           │         │               │                               │
           │  ┌──────▼───────┐  ┌────▼───────────────────────────┐  │
           │  │ Multer +     │  │ Export Queue                    │  │
           │  │ Sharp        │  │  ┌─────────┐  ┌─────────────┐  │  │
           │  │ (thumbnail)  │  │  │ Validate│  │ Sharp Render │  │  │
           │  │              │  │  │ (Zod)   │→ │ (2400×3600)  │  │  │
           │  └──────┬───────┘  │  └─────────┘  └──────┬──────┘  │  │
           │         │          └──────────────────────┼─────────┘  │
           │         │                                 │            │
           └─────────┼─────────────────────────────────┼────────────┘
                     │                                 │
           ┌─────────▼─────────────────────────────────▼────────────┐
           │                  File System                            │
           │                                                         │
           │  uploads/         exports/          src/assets/        │
           │  (user images +   (generated PNG/   (fonts, clipart,   │
           │   thumbnails)      PDF, purged       garment bases)    │
           │                    after 24h)                           │
           └─────────────────────────────────────────────────────────┘
```

---

## 3. Component Architecture

### 3.1 Client Component Tree

```
<App>
├── <Layout>                          // Responsive shell (mobile/desktop)
│   ├── <Header>                      // Logo, project title, save indicator
│   └── <Workspace>                   // Main editing area
│       ├── <CanvasPanel side="nam">  // Left canvas (or top on mobile)
│       │   ├── <CanvasContainer>     // Fabric.js canvas wrapper
│       │   │   └── <fabric.Canvas>   // Fabric instance (imperative)
│       │   ├── <CanvasToolbar>       // Zoom, undo/redo, clear, fit
│       │   └── <GarmentOverlay>      // Semi-transparent garment base
│       ├── <CanvasPanel side="nu">   // Right canvas (or bottom on mobile)
│       │   ├── <CanvasContainer>
│       │   │   └── <fabric.Canvas>
│       │   ├── <CanvasToolbar>
│       │   └── <GarmentOverlay>
│       └── <ControlPanel>            // Sidebar or bottom sheet
│           ├── <TabBar>              // Tabs: Layers | Properties | Assets
│           ├── <LayerList>           // Draggable layer list
│           │   └── <LayerItem>[]     // Per-layer: visibility, lock, select
│           ├── <PropertiesPanel>     // Context-sensitive property editor
│           │   ├── <TextProperties>  // Font, size, color, alignment, effects
│           │   └── <ImageProperties> // Position, crop, filters, opacity
│           ├── <AssetGallery>        // Grid of available images
│           │   ├── <UploadButton>    // Trigger file picker
│           │   ├── <AssetCard>[]     // Thumbnail, name, drag-to-canvas
│           │   └── <SearchBar>       // Filter by name/tag
│           ├── <FontSelector>        // Font dropdown with preview
│           └── <ExportPanel>         // Format selector + export button
├── <MobileNav>                       // Bottom tab bar (mobile only)
└── <Modals>
    ├── <UploadProgressModal>         // Upload progress + preview
    ├── <ExportProgressModal>         // Polling status + download links
    └── <ColorPickerModal>            // Garment color replacement UI
```

### 3.2 Server Module Structure

```
server/src/
├── index.ts                  // Express app bootstrap
├── config.ts                 // Centralized configuration (exists)
├── middleware/
│   ├── rate-limiter.ts       // Per-IP rate limiter wiring
│   ├── validate.ts           // Zod validation middleware factory
│   ├── error-handler.ts      // Centralized error handler (no stack in prod)
│   └── request-id.ts         // X-Request-Id injection + echo
├── routes/
│   ├── health.ts             // GET /api/health (exists)
│   ├── upload.ts             // POST /api/v1/upload
│   ├── assets.ts             // GET /api/v1/assets
│   ├── export.ts             // POST /api/v1/export, GET /api/v1/export/:id
│   └── fonts.ts              // GET /api/v1/fonts
├── services/
│   ├── upload.service.ts     // Multer config, Sharp validation, thumbnail gen
│   ├── export.service.ts     // Sharp render pipeline, canvas state → PNG/PDF
│   ├── asset.service.ts      // Asset metadata CRUD
│   └── cleanup.service.ts    // Temp file purge cron
├── schemas/
│   ├── canvas-state.schema.ts    // Zod schema for CanvasState
│   ├── export-request.schema.ts  // Zod schema for export request
│   ├── upload.schema.ts          // Zod schema for upload metadata
│   └── asset-query.schema.ts     // Zod schema for asset listing queries
├── types/
│   ├── canvas.ts             // CanvasState, Layer, GarmentInfo types
│   ├── export.ts             // ExportJob type
│   └── asset.ts              // Asset, Font types
└── assets/                   // Static: fonts/, clipart/, garments/
    └── fonts/
        └── fonts.json        // Font metadata catalog
```

---

## 4. Data Flow

### 4.1 Canvas Editing Flow (Browser)

```
User action (type, drag, resize)
       │
       ▼
┌──────────────────┐
│ Fabric.js Canvas  │  Imperative API: add/remove/modify objects
│ (fabric.Canvas)   │
└────────┬─────────┘
         │ on-object:modified, on-text:changed, etc.
         ▼
┌──────────────────┐
│ Canvas Sync Hook  │  Debounced (100ms) — serializes Fabric canvas to
│ (useCanvasSync)   │  CanvasState JSON via fabric.toJSON()
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Zustand Store     │  { canvasState, activeLayer, undoStack, dirty }
│                   │  - canvasState validated against Zod schema
│                   │  - undo stack: last 50 states pushed on each sync
└────────┬─────────┘
         │ React re-render
         ▼
┌──────────────────┐
│ Control Panel     │  Reads from store: layer list, selected properties
│ (LayerList,       │  Writes to store: property changes → sync hook
│  PropertiesPanel) │  applies to Fabric canvas
└──────────────────┘
```

### 4.2 Dual Canvas Sync (Nam ↔ Nữ)

```
┌─────────────────────────────────────────────────────────────┐
│  CanvasState                                                │
│  {                                                          │
│    version: 2,                                              │
│    canvases: {                                              │
│      nam: { layers: [...], garment: {...} },                │
│      nu:  { layers: [...], garment: {...} }                 │
│    }                                                        │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
         │                              │
         ▼                              ▼
┌──────────────────┐          ┌──────────────────┐
│  Nam Canvas       │          │  Nữ Canvas        │
│  (fabric instance)│          │  (fabric instance) │
│                   │          │                    │
│  Each canvas      │          │  Each canvas       │
│  reads from       │          │  reads from        │
│  state.canvases   │          │  state.canvases    │
│  .nam             │          │  .nu               │
└──────────────────┘          └──────────────────┘

Sync Mode Options:
  A. INDEPENDENT (default): Each canvas has independent layers.
     User selects which canvas to edit via tab/toggle.
  B. MIRRORED: Changes to Nam canvas are replicated to Nữ canvas
     (toggleable "Mirror Mode" button).
     Implementation: copy state.canvases.nam → state.canvases.nu.
```

### 4.3 Upload Flow

```
┌──────────┐     ┌──────────────┐     ┌─────────────┐     ┌────────────┐
│  User    │     │  Client      │     │  Server      │     │  Disk      │
│  picks   │────▶│  resize      │────▶│  validate    │────▶│  save      │
│  file    │     │  (Canvas API)│     │  (Sharp)     │     │  +thumb    │
│          │     │  strip EXIF  │     │  reject SVG  │     │            │
│          │     │  → WebP      │     │  magic bytes │     │            │
└──────────┘     └──────────────┘     └──────┬───────┘     └─────┬──────┘
                                              │                   │
                                              ▼                   │
                                        ┌─────────────┐          │
                                        │  Return      │◀─────────┘
                                        │  Asset JSON  │
                                        │  (201)       │
                                        └──────┬───────┘
                                               │
                                               ▼
                                        ┌──────────────┐
                                        │  Zustand      │
                                        │  assets[]     │
                                        │  updated      │
                                        └──────────────┘
```

### 4.4 Export Flow

```
┌──────────┐     ┌──────────────┐     ┌─────────────┐     ┌────────────┐
│  User    │     │  Client      │     │  Server      │     │  Disk      │
│  clicks  │────▶│  Serialize   │────▶│  Validate    │     │            │
│  Export  │     │  CanvasState │     │  (Zod)       │     │            │
│          │     │  (JSON)      │     │              │     │            │
└──────────┘     └──────┬───────┘     └──────┬───────┘     └────────────┘
                         │                   │
                         │ POST /api/v1/export│
                         │                   ▼
                         │            ┌──────────────┐
                         │            │  Compute     │
                         │            │  SHA-256     │
                         │            │  hash        │
                         │            └──────┬───────┘
                         │                   │
                         │            ┌──────▼───────┐
                         │            │  Idempotent? │
                         │            │  Hash exists │──▶ Return existing
                         │            │  in queue?   │    200 OK
                         │            └──────┬───────┘
                         │                   │ new
                         ▼                   ▼
                  ┌──────────────┐    ┌──────────────┐
                  │  Return      │    │  Export Job   │
                  │  202 +       │◀───│  created      │
                  │  jobId       │    │  status:pending│
                  └──────┬───────┘    └──────┬───────┘
                         │                   │
                         │ Poll GET /api/v1/export/:id
                         │ (every 2-3s)       ▼
                         │             ┌──────────────┐
                         │             │  Sharp       │
                         │             │  Render:     │
                         │             │  2400×3600   │
                         │             │  PNG + PDF   │
                         │             └──────┬───────┘
                         │                    │
                         │             ┌──────▼───────┐
                         │             │  Write to    │
                         │             │  exports/    │
                         │             └──────┬───────┘
                         │                    │
                         │             ┌──────▼───────┐
                         │             │  Job status   │
                         ◀─────────────│  → done      │
                                       │  outputs:{}   │
                                       └──────────────┘
```

---

## 5. Integration Boundaries

| Boundary                   | Runs In                   | Details                                                          |
| -------------------------- | ------------------------- | ---------------------------------------------------------------- |
| Canvas rendering           | **Browser**               | Fabric.js renders all 2D layers in real-time on `<canvas>`       |
| Canvas state serialization | **Browser**               | `fabric.toJSON()` + Zod validation before sending                |
| Text rendering             | **Browser**               | Fabric.js IText/Textbox objects                                  |
| Image resizing/EXIF strip  | **Browser** (pre-process) | Canvas API resize before upload; fallback to server-side         |
| Upload validation          | **Server**                | Sharp metadata check, SVG magic byte rejection                   |
| Thumbnail generation       | **Server**                | Sharp `resize(200)` on upload                                    |
| Export rendering           | **Server**                | Sharp compositing pipeline, PNG + PDF output                     |
| Font serving               | **Server** (static)       | WOFF2 files served via Express static                            |
| Asset metadata             | **Server**                | JSON file / SQLite storage of asset records                      |
| Garment color replacement  | **Both**                  | Client: CSS filter preview; Server: Sharp compositing for export |

### Garment Color Replacement Strategy

```
Client (Preview):                    Server (Export):
┌────────────────────┐              ┌────────────────────────┐
│ Garment base image  │              │ Garment base image      │
│ (PNG with alpha)    │              │ (original resolution)   │
│ + CSS mix-blend-mode│              │ + Sharp .tint()         │
│ + CSS filter        │              │   or .modulate({        │
│                     │              │     hue, saturation     │
│ Instant preview     │              │   })                    │
│ Real-time color     │              │                         │
│ picker changes      │              │ Applied server-side     │
└────────────────────┘              └────────────────────────┘
```

---

## 6. Mobile-First Design Strategy

| Concern                | Approach                                                                                  |
| ---------------------- | ----------------------------------------------------------------------------------------- |
| **Layout**             | Vertical stack on mobile (< 768px): Nam canvas on top, Nữ below. Side-by-side on desktop. |
| **Canvas interaction** | Fabric.js touch events enabled (`allowTouchScrolling: true`). Pinch-zoom, two-finger pan. |
| **Control Panel**      | Bottom sheet on mobile; slide-up overlay. Fixed sidebar on desktop (≥ 1024px).            |
| **Toolbar**            | Compact floating toolbar (zoom, undo, redo, mirror toggle).                               |
| **Upload**             | Accept camera capture via `<input capture="environment">`.                                |
| **Text input**         | On-screen keyboard handled; prevent canvas pan when text object is active.                |
| **Export**             | Download triggered via blob URL on mobile; status polling shown in bottom sheet.          |

### Responsive Breakpoints

| Breakpoint | Layout                                                                 |
| ---------- | ---------------------------------------------------------------------- |
| < 768px    | Single column: canvases stacked vertically, bottom-sheet control panel |
| 768–1023px | Side-by-side canvases, collapsible sidebar                             |
| ≥ 1024px   | Full desktop: 2 canvases + persistent sidebar                          |

---

## 7. API Route Outline

Full specification: see `api-schema.md` (Data/API Architect).

```
Base: /api/v1

  GET    /health                          → { ok, service, timestamp }

  POST   /upload                          → { asset }                           [multipart/form-data]
  GET    /assets?category=&tags=&search=  → { data: Asset[], cursor, hasMore }

  POST   /export                          → { job } (202)                       [idempotent]
  GET    /export/:id                      → { job } (200)                       [polling]

  GET    /fonts?category=                 → { data: Font[] }
```

### Server-side Middleware Stack

```
Request
  → Helmet (security headers)
  → CORS (restricted origin)
  → express.json({ limit: '5mb' })
  → Request ID injection
  → Rate limiter (per-IP, endpoint-specific)
  → Zod validation middleware
  → Route handler
  → Error handler (structured JSON, no stack in prod)
Response
```

---

## 8. Security Architecture

Per Security Architect review ([security-review.md](../security-review.md)):

| Priority    | Action                           | Implementation                                   |
| ----------- | -------------------------------- | ------------------------------------------------ |
| 🔴 Critical | Content-based upload validation  | Sharp metadata check in upload.service.ts        |
| 🔴 Critical | Zod validation on all endpoints  | Validation middleware factory                    |
| 🔴 Critical | Restricted CORS                  | `cors({ origin: process.env.CORS_ORIGIN })`      |
| 🔴 Critical | Rate limiting wired              | `express-rate-limit` per endpoint config         |
| 🔴 Critical | Text sanitization                | `DOMPurify` client-side + strip HTML server-side |
| 🟡 High     | Fabric.js >= 7.4.0               | Pin in package.json; audit SVG export            |
| 🟡 High     | Export concurrency cap + timeout | Max 2 concurrent exports, 30s timeout            |
| 🟡 High     | SVG magic byte rejection         | Check buffer[0..4] for `<svg` or `<?xml`         |
| 🟡 High     | UUID storage filenames           | Use `uuid` package; never use original filenames |

All 15 security action items are referenced. See security-review.md §8 for full list.

---

## 9. Technology Stack

| Layer                | Technology         | Version  | Rationale                                                |
| -------------------- | ------------------ | -------- | -------------------------------------------------------- |
| **Client framework** | React              | 19.1.0   | Current stable; team familiarity                         |
| **Build tool**       | Vite               | 6.3.5    | Fast HMR, ESM-native                                     |
| **Canvas library**   | Fabric.js          | >= 7.4.0 | [ADR-001] Feature-rich, SVG export, JSON serialization   |
| **State management** | Zustand            | (to add) | [ADR-003] Minimal boilerplate, good with imperative APIs |
| **HTTP client**      | fetch (native)     | —        | No added dependency for MVP                              |
| **Server framework** | Express            | 5.1.0    | Mature, well-supported                                   |
| **Image processing** | Sharp              | 0.35.3   | Fast, low memory, no browser dependency                  |
| **Validation**       | Zod                | 4.4.3    | Type-safe, isomorphic (shared schemas possible)          |
| **File upload**      | Multer             | 2.2.0    | Standard, CVE-2026-5038 patched                          |
| **Rate limiting**    | express-rate-limit | 8.5.2    | Token bucket, per-IP                                     |
| **Security headers** | helmet             | (to add) | Standard Express security                                |
| **Package manager**  | pnpm               | 9.9.0    | Fast, strict, workspace support                          |
| **Language**         | TypeScript         | 5.8.3    | Type safety end-to-end                                   |

---

## 10. Assumptions & Open Items

| #   | Item                                                     | Status                                 | Owner              |
| --- | -------------------------------------------------------- | -------------------------------------- | ------------------ |
| 1   | No auth in MVP; rate limiting is per-IP                  | **Accepted**                           | Team               |
| 2   | Canvas library = Fabric.js >= 7.4.0                      | **Decided** — [ADR-001]                | Solution Architect |
| 3   | Export → server-side Sharp only (no Puppeteer)           | **Decided** — [ADR-002]                | Solution Architect |
| 4   | State management → Zustand                               | **Decided** — [ADR-003]                | Solution Architect |
| 5   | Storage → local disk MVP, S3 prod                        | **Decided** — [ADR-004]                | Solution Architect |
| 6   | Konva.js vs Fabric.js research (T-062) still in progress | ⚠️ May reinforce or override ADR-001   | Deep Research      |
| 7   | SQLite vs JSON file for asset metadata                   | **Open** — Backend Engineer discretion | Backend            |
| 8   | Fonts are bundled static files (not API-driven)          | **Accepted**                           | Data/API Architect |
| 9   | Export queue: synchronous MVP → async (BullMQ) post-MVP  | **Decided**                            | Solution Architect |
| 10  | Garment images: bundled static files                     | **Assumed** — confirm with Product     | Product            |

---

## 11. Handoff Notes

**For UI Design Lead (T-046):**

- Two-canvas layout with mobile-responsive breakpoints (§6)
- Component tree defined in §3.1
- Canvas placeholder already in App.tsx

**For Implementation Planner (T-049):**

- Module structure for client and server in §3
- Integration boundaries in §5
- 7 ADRs with rationale

**For Backend Engineer (T-051):**

- Server module structure in §3.2
- API outline in §7
- Upload & export flows in §4.3–4.4
- Security implementation items in §8

**For Frontend Engineer (T-052):**

- Component tree in §3.1
- Canvas sync model in §4.2
- Garment color preview strategy in §5
- Mobile-first approach in §6
