# Architecture Decision Records — Dual Canvas Editor MVP

**Version:** 1.0.0  
**Date:** 2026-07-02  
**Author:** Solution Architect (pa-solution-architect)

---

## ADR-001: Canvas Library Selection

**Status:** Decided

**Context:** The dual-canvas editor requires a JavaScript 2D canvas library for:

- Rich text rendering (fonts, sizes, colors, effects)
- Image layer placement, resize, crop, rotation
- Layer z-ordering, visibility, locking
- Real-time manipulation (drag, resize, rotate via handles)
- JSON serialization/deserialization of canvas state
- Export to high-resolution image formats

Two candidates: **Fabric.js** and **Konva.js**.

**Options Considered:**

| Criteria              | Fabric.js 6.x                                   | Konva.js 9.x                     |
| --------------------- | ----------------------------------------------- | -------------------------------- |
| Text editing          | IText/Textbox with inline editing               | Text with limited inline editing |
| Built-in SVG export   | ✅ `toSVG()`                                    | ❌ Requires custom               |
| JSON serialization    | ✅ `toJSON()` / `loadFromJSON()`                | ✅ `toJSON()` / `create()`       |
| Transform handles     | ✅ Built-in Transformer                         | ✅ Built-in Transformer          |
| Object model          | Rich (groups, clipping, patterns)               | Simpler (shapes, groups)         |
| Bundle size           | ~250 KB minified                                | ~170 KB minified                 |
| Touch support         | ✅ Built-in                                     | ✅ Built-in                      |
| Community / Ecosystem | Larger, more plugins                            | Growing, cleaner API             |
| Known CVEs (current)  | CVE-2026-27013, CVE-2026-44311 (fixed >= 7.4.0) | None known                       |
| Active maintenance    | ✅ 7.x active                                   | ✅ 9.x active                    |

**Decision:** **Fabric.js >= 7.4.0**

**Rationale:**

1. **Built-in SVG export** (`fabric.toSVG()`) is critical for the print-ready export pipeline. Konva.js requires custom SVG serialization, adding complexity and risk.
2. **JSON serialization** (`fabric.toJSON()` / `fabric.loadFromJSON()`) maps directly to the `CanvasState` data schema — no translation layer needed.
3. **IText/Textbox** provides WYSIWYG text editing with per-character styling, font selection, alignment — essential for garment design text layers.
4. The two XSS CVEs (CVE-2026-27013, CVE-2026-44311) are **fixed in 7.4.0**. Pinning to >= 7.4.0 eliminates these vectors along with text sanitization at the application level.
5. Larger ecosystem means more examples and community support for garment-design-specific patterns (templates, color replacement).

**Consequences:**

- Must pin to `>= 7.4.0` in package.json.
- Must implement text sanitization (DOMPurify client-side + strip HTML server-side) as defense-in-depth.
- Must audit SVG export output for any remaining unescaped user content.
- Larger bundle (~250 KB) is acceptable for a design tool (not a marketing landing page).

**Reversal:** If T-062 (Deep Research) surfaces critical issues with Fabric.js, we reassess. Konva.js is the fallback — would require building custom SVG export.

---

## ADR-002: Export Pipeline Strategy

**Status:** Decided

**Context:** Users need to export their designs as printable PNG (2400×3600) and PDF. Options:

- **A. Client-side**: Render canvas at high resolution in browser, download via blob.
- **B. Server-side Puppeteer**: Headless Chromium renders an HTML page of the design, captures screenshot/PDF.
- **C. Server-side Sharp**: Parse canvas state JSON, composite layers server-side with Sharp.

**Options Considered:**

| Criteria           | Client-side            | Puppeteer                        | Sharp                               |
| ------------------ | ---------------------- | -------------------------------- | ----------------------------------- |
| Resolution control | Limited by GPU/display | Full (screenshot at any DPI)     | Full (pixel-level control)          |
| PDF output         | ❌ Not possible        | ✅ Native                        | ⚠️ Requires pdfkit/sharp-to-pdf     |
| Server resource    | None                   | 200-500 MB per Chromium instance | 50-150 MB per export                |
| Attack surface     | Minimal                | High (browser CVEs, SSRF)        | Low (image processing only)         |
| Dependency size    | 0                      | ~300 MB (Chromium binary)        | ~20 MB (native libvips)             |
| Cold start speed   | Instant                | 2-5 seconds (launch browser)     | Instant                             |
| Canvas fidelity    | 1:1 (same library)     | Requires HTML recreation         | Requires layer-by-layer compositing |
| Concurrency        | N/A                    | 1-2 per server                   | 2-4 per server                      |

**Decision:** **C. Server-side Sharp (MVP), with client-side preview fallback**

**Rationale:**

1. **Lower attack surface**: Sharp has 0 known CVEs (as of 0.35.3). Puppeteer introduces a full browser attack surface (per security review §4.2, finding E5).
2. **Smaller footprint**: Sharp (~20 MB) vs Puppeteer (~300 MB). Faster cold starts, lower memory.
3. **Sufficient for MVP**: The canvas state JSON schema (ADR-007) fully describes all layers. Sharp can composite text (via SVG overlay), images, and effects deterministically.
4. **Security review explicitly endorses**: "The project uses Sharp only, which has a much smaller attack surface than a headless browser. This is the right choice for MVP." (§4.2, E5)
5. Client-side preview at screen resolution gives instant feedback; server-side handles the final high-res output.

**Consequences:**

- Export pipeline must implement: parse CanvasState → render layers in order (zIndex) → composite with Sharp → output PNG + PDF.
- Text layers: render via Sharp's SVG text support or `text-to-svg` package.
- PDF: use `sharp` to generate PNG, then wrap in PDF via `pdfkit` or `pdf-lib`.
- Must enforce: concurrency cap (2), timeout (30s), max 50 layers, memory limits.
- Garment color replacement: Sharp's `.tint()` or `.modulate()` for server-side, CSS filters for client preview.

**Reversal:** If Sharp proves insufficient for complex text effects (outlines, shadows, curves), add a thin Puppeteer path for text-heavy exports only. Not needed for MVP.

---

## ADR-003: State Management

**Status:** Decided

**Context:** The dual-canvas editor needs client-side state management for:

- Canvas state (layers, garment info, dimensions) — synchronized with Fabric.js instances
- Asset library (loaded images with metadata)
- Export job tracking (polling status)
- UI state (active tab, selected layer, undo/redo)
- Responsive layout mode (mobile/desktop)

**Options Considered:**

| Criteria                       | Redux Toolkit                                        | Zustand                                  | React Context + useReducer  |
| ------------------------------ | ---------------------------------------------------- | ---------------------------------------- | --------------------------- |
| Boilerplate                    | High (slices, actions, reducers)                     | Minimal                                  | Moderate                    |
| Bundle size                    | ~12 KB                                               | ~1 KB                                    | 0 (built-in)                |
| TypeScript DX                  | Good (RTK Query)                                     | Excellent                                | Good                        |
| DevTools                       | Redux DevTools                                       | Redux DevTools compatible                | React DevTools only         |
| Imperative API access          | Via store.dispatch()                                 | Via store.getState() / store.setState()  | ❌ Component-only           |
| Middleware (logging, persist)  | Built-in                                             | Simple to add                            | Manual                      |
| Performance (frequent updates) | Good (selectors)                                     | Good (selectors)                         | Poor (full tree re-renders) |
| Fabric.js integration          | Awkward (Fabric is imperative, Redux is declarative) | Natural (store can be read imperatively) | Difficult                   |

**Decision:** **Zustand**

**Rationale:**

1. **Imperative Fabric.js integration**: Fabric.js instances are imperative objects (not React components). Zustand allows `useCanvasStore.getState()` for reading state inside Fabric event handlers without prop-drilling or HOC patterns.
2. **Minimal boilerplate**: Canvas editing generates frequent updates (every drag, every keystroke). Zustand's direct `set()` with immer middleware is far less code than Redux slices.
3. **Performance**: Zustand selectors (`useStore(state => state.canvases.nam.layers)`) prevent unnecessary re-renders across the component tree.
4. **DevTools**: Redux DevTools compatible for time-travel debugging of canvas state changes.
5. **1 KB bundle**: Adding Redux Toolkit (~12 KB) for a design tool is unnecessary overhead.

**Store Shape:**

```typescript
interface EditorStore {
  // Canvas state (the source of truth for both Fabric instances)
  canvasState: CanvasState | null;

  // Which canvas is active for editing
  activeSide: 'nam' | 'nu';

  // Currently selected layer ID
  selectedLayerId: string | null;

  // Undo stack (last 50 canvas states)
  undoStack: CanvasState[];
  redoStack: CanvasState[];

  // Asset library
  assets: Asset[];
  assetsCursor: string | null;
  assetsHasMore: boolean;

  // Export job
  exportJob: ExportJob | null;

  // UI state
  controlPanelTab: 'layers' | 'properties' | 'assets';
  mirrorMode: boolean; // ADR: §4.2 mirror mode toggle
  isDirty: boolean; // Unsaved changes indicator

  // Actions
  setCanvasState: (state: CanvasState) => void;
  pushUndo: () => void;
  undo: () => void;
  redo: () => void;
  setActiveSide: (side: 'nam' | 'nu') => void;
  selectLayer: (id: string | null) => void;
  updateLayer: (side: 'nam' | 'nu', layerId: string, patch: Partial<Layer>) => void;
  addLayer: (side: 'nam' | 'nu', layer: Layer) => void;
  removeLayer: (side: 'nam' | 'nu', layerId: string) => void;
  reorderLayer: (side: 'nam' | 'nu', layerId: string, newIndex: number) => void;
  toggleMirrorMode: () => void;
  // Asset actions
  setAssets: (assets: Asset[], cursor: string, hasMore: boolean) => void;
  appendAssets: (assets: Asset[], cursor: string, hasMore: boolean) => void;
  // Export actions
  setExportJob: (job: ExportJob) => void;
  updateExportJob: (patch: Partial<ExportJob>) => void;
}
```

**Consequences:**

- Add `zustand` and `immer` to client dependencies.
- Canvas sync hook (`useCanvasSync`) bridges Fabric events → Zustand store.
- Undo/redo limited to 50 states to cap memory (50 × ~100 KB = ~5 MB).
- Zustand middleware for `persist` (localStorage) can be added later for draft recovery.

---

## ADR-004: Storage Strategy

**Status:** Decided

**Context:** The application stores: user-uploaded images, generated export files (PNG/PDF), static assets (fonts, clipart, garment bases), and metadata (asset records, export jobs).

**Decision:** **Local disk (MVP) with S3-compatible object storage migration path (production)**

**Rationale:**

1. MVP is single-instance, no auth, no multi-tenancy — local disk is sufficient.
2. API schema designs `url` fields as relative paths (`/storage/uploads/...`). Migrating to S3 means swapping URL generators from local paths to CDN URLs — no data model change.
3. S3 signed URLs enable direct browser-to-S3 uploads, offloading the Node.js process.
4. CDN (CloudFront/Cloudflare) in front of S3 for read-heavy asset serving.
5. Lifecycle policies auto-expire exports (24h TTL matched exactly).

**MVP Structure:**

```
storage/
  uploads/       # User uploads + Sharp-generated thumbnails
  exports/       # Generated PNG/PDF, purged after 24h
  fonts/         # Bundled WOFF2 static files
  clipart/       # Built-in clipart library
  garments/      # Garment base template images
```

**Metadata Storage (MVP):**

- **Recommended**: SQLite (via `better-sqlite3`) for asset metadata and export jobs.
- **Fallback**: JSON file — simpler but no querying, no pagination.
- **Open decision**: Backend Engineer selects based on implementation effort.

**Production Target:**

```
s3://dual-canvas-editor-{env}/
  uploads/       → CDN: https://assets.dualcanvas.app/uploads/
  exports/       → CDN: https://assets.dualcanvas.app/exports/
                 → Lifecycle rule: delete after 24h
  fonts/         → CDN: https://assets.dualcanvas.app/fonts/
  clipart/       → CDN: https://assets.dualcanvas.app/clipart/
  garments/      → CDN: https://assets.dualcanvas.app/garments/
```

**Consequences:**

- `url` generation must be centralized through a `storage.getUrl(key)` function.
- Express static middleware serves `/storage/*` in MVP → replaced with CDN redirects in prod.
- Cleanup cron needed for local `exports/` directory (24h TTL).

---

## ADR-005: No-Auth MVP Model

**Status:** Accepted (Product decision, not architecture)

**Context:** The MVP has no authentication. Users access the editor directly without login. This is a deliberate scope tradeoff.

**Architecture Implications:**

1. **No user identity**: Rate limiting is per-IP, not per-user. Users share the same IP (NAT/corporate) will share rate limits.
2. **No data persistence across sessions**: Uploads and exports are temporary (24h max). If user closes browser, work is lost.
3. **Upload isolation**: UUID-based filenames prevent guessing, but all uploads land in a shared directory.
4. **No CSRF protection needed**: No session cookies to protect.
5. **CORS must be restricted**: `cors({ origin: process.env.CORS_ORIGIN })` to prevent arbitrary websites from using the API.

**Security Mitigations (per security review):**

- Content-based upload validation (Sharp)
- SVG magic byte rejection
- Rate limiting per endpoint
- Export concurrency cap
- Security headers (Helmet)
- No stack traces in production

**Future Auth Addition (post-MVP):**

- Add NextAuth.js or Clerk for social login.
- Tie assets/exports to user ID in metadata store.
- Rate limiting keyed on user ID instead of IP.
- Multi-tenant storage isolation: `s3://.../users/{userId}/`.

---

## ADR-006: Monorepo Structure

**Status:** Decided (implemented)

**Context:** The project is already scaffolded as a pnpm workspace monorepo with `client/` and `server/` packages.

**Current Structure:**

```
dual-canvas-editor/
├── package.json            # Root: workspace scripts, lint-staged, prettier, eslint
├── pnpm-workspace.yaml     # packages: ['client', 'server']
├── tsconfig.base.json      # Shared TypeScript config
├── client/                 # React 19 + Vite SPA
│   ├── src/
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
├── server/                 # Express 5 + TypeScript API
│   ├── src/
│   │   ├── index.ts
│   │   └── config.ts
│   └── package.json
└── architecture/           # Architecture artifacts
    ├── ARCHITECTURE.md
    └── ADR.md
```

**Decisions preserved:**

- **pnpm** (not npm/yarn): Strict dependency resolution, workspace protocol, fast installs.
- **client/server split** (not single Next.js app): API is a separate concern; SPA + REST is simpler for a canvas-heavy app than SSR.
- **TypeScript across both packages**: Shared `tsconfig.base.json`, separate `tsconfig.json` per package for build-specific settings.
- **Vite** (not Webpack/CRA): Fast HMR for canvas development, ESM-native.

**Consequences:**

- Keep `pnpm-workspace.yaml` as-is.
- Add `client/src/` subdirectories: `components/`, `store/`, `hooks/`, `schemas/`, `utils/`.
- Add `server/src/` subdirectories per module structure in ARCHITECTURE.md §3.2.
- Option to add a `shared/` workspace package later if Zod schemas need to be shared between client and server.

---

## ADR-007: Idempotent Export via Canvas State Hash

**Status:** Decided (per api-schema.md)

**Context:** Users may click "Export" multiple times with the same design. Without idempotency, each click creates a duplicate export job, wasting server resources.

**Decision:** **SHA-256 hash of the serialized CanvasState JSON as the idempotency key.**

**How it works:**

1. Client sends `POST /api/v1/export` with `{ canvasState, format, quality }`.
2. Server computes `SHA-256(JSON.stringify(canvasState))`.
3. Server checks in-memory map: if hash exists and job is `processing` or `done`, return existing job (200 OK with job details).
4. If hash doesn't exist or existing job `failed`, create new job → 202 Accepted.
5. Jobs expire from map after 24 hours (matching export file TTL).

**Rationale:**

1. SHA-256 is deterministic — same canvas state always produces same hash.
2. JSON serialization order is deterministic (Fabric.js `toJSON()` produces ordered keys).
3. Simple to implement: a `Map<string, ExportJob>` in memory.
4. No external dependency needed (Node.js `crypto` module).
5. Client gets immediate feedback — doesn't need to wait for duplicate processing.

**Edge Cases:**

- **Same design, different format**: If user changes format from `png` to `both`, canvas state is the same → hash matches → returns existing job. This is acceptable for MVP (export both formats server-side if `both` is requested before processing starts).
- **Race condition**: Two requests with same hash arrive simultaneously. Mitigate by using `Map.set()` as the atomic check-and-set (JavaScript Map is single-threaded).

**Consequences:**

- Server must maintain an in-memory `Map<sha256, ExportJob>`.
- Map cleanup runs with the same 24h TTL as export files.
- Client must handle both 200 and 202 responses from the export endpoint (200 = job already exists, 202 = new job created).
