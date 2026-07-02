# Architecture Review Notes — Dual Canvas Editor

**Version:** 1.0 | **Last updated:** 2026-07-02 UTC  
**Status:** ⚠️ **Preliminary** — Solution Architect's ADRs (T-044) **still in progress**

---

## 1. ADR Status

| ADR                       | Status     | Notes                                                            |
| ------------------------- | ---------- | ---------------------------------------------------------------- |
| Canvas library selection  | ⏳ Pending | Fabric.js vs Konva.js — research task T-062 failed. Needs retry. |
| State management approach | ⏳ Pending | Redux vs Zustand vs Context — not yet decided                    |
| Export strategy           | ⏳ Pending | Client-side canvas export vs server-side rendering               |
| Component architecture    | ⏳ Pending | Not yet documented                                               |
| Data flow / serialization | ⏳ Pending | Canvas state JSON schema not defined                             |
| API design                | ⏳ Pending | Route outline pending                                            |

**⚠️ This document will be updated once T-044 completes. Current notes are based on the T-044 scope description and existing codebase analysis.**

---

## 2. Current Architecture Assessment

### 2.1 What Exists

```
dual-canvas-editor/
├── client/                    # React 19 + Vite (frontend host)
│   └── src/
│       ├── main.tsx           # Entry: StrictMode, no error boundary
│       ├── App.tsx            # Shell: header + two canvas slots
│       └── App.css            # Dark theme, CSS custom properties
├── server/                    # Express 5 (API + processing)
│   └── src/
│       ├── index.ts           # Entry: cors, json, /api/health
│       ├── config.ts          # Centralized config (port, upload, export, rate limit)
│       ├── middleware/         # Empty — no auth, logging, or error middleware
│       ├── routes/             # Empty — no API routes beyond health
│       ├── services/           # Empty — no business logic
│       ├── types/              # Empty — no shared types
│       └── assets/             # Empty dirs: fonts/, samples/
└── pnpm-workspace.yaml        # Monorepo root
```

### 2.2 Architecture Observations

#### ✅ Aligned with T-044 Scope

| T-044 Requirement                | Current State                                                                      | Assessment                                        |
| -------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------- |
| React frontend for canvas editor | `client/` with React 19 + Vite                                                     | ✅ Foundation correct                             |
| Node.js backend                  | `server/` with Express 5                                                           | ✅ Foundation correct                             |
| Monorepo structure               | `pnpm workspaces` with `client/` and `server/`                                     | ✅ Well-organized                                 |
| Image upload pipeline            | `config.ts` defines max upload size, allowed MIME types, sharp/multer dependencies | ⚠️ Dependencies present but **not yet wired**     |
| Export pipeline                  | `config.ts` defines export dimensions (2400×3600), temp file TTL, cleanup interval | ⚠️ Config present but **no implementation**       |
| Rate limiting                    | `config.ts` defines rate limit window + max, `express-rate-limit` installed        | ⚠️ Config present but **not wired** in `index.ts` |
| Asset library                    | `assets/` directories exist (fonts, samples)                                       | ⚠️ Empty — no assets                              |

#### 🔴 Architecture Gaps (Blockers)

1. **No ADRs recorded.** Every T-044 decision (canvas lib, state management, export strategy) is undocumented. This is **blocking implementation** — engineers are building without architectural guidance.

2. **Canvas library undecided.** The README says "pending research outcome" and T-062 (research task) **failed**. No retry scheduled. This blocks:
   - Component architecture (Fabric.js wrapper ≠ Konva.js wrapper)
   - State management (each library has different state models)
   - Export strategy (Fabric.js has built-in export; Konva.js may need server-side)
   - Accessibility strategy (different ARIA approaches)

3. **State management undecided.** The T-044 scope explicitly asks for "Redux/Zustand/Context" decision. Without it:
   - Dual-canvas sync model can't be implemented
   - Serialization/deserialization schema can't be designed
   - Undo/redo strategy is unknown

4. **API contract undefined.** T-044 scope includes API route outline but `routes/` is empty. `config.ts` hints at upload/export endpoints but no contracts exist. Backend engineers (T-010, T-051) need this.

---

## 3. Preliminary Architecture Recommendations

These are **opinions for the Solution Architect to consider**, not binding decisions:

### 3.1 Canvas Library

| Factor                     | Fabric.js                                  | Konva.js                                  |
| -------------------------- | ------------------------------------------ | ----------------------------------------- |
| Learning curve             | Moderate (object model)                    | Low (similar to HTML5 Canvas)             |
| Export built-in            | ✅ `canvas.toDataURL()`, `canvas.toJSON()` | ✅ `stage.toDataURL()`, `stage.toJSON()`  |
| Text editing               | ✅ Built-in IText with rich text           | ⚠️ Limited, needs custom                  |
| Image filters              | ✅ Built-in (grayscale, brightness, etc.)  | ✅ Via `Konva.Filters`                    |
| Color replacement          | ⚠️ Per-object, not per-pixel               | ⚠️ Per-object, not per-pixel              |
| Performance (many objects) | Good                                       | Good (layered approach)                   |
| React wrapper              | `react-fabricjs` (community)               | `react-konva` (official-like)             |
| Bundle size                | ~200KB gzipped                             | ~170KB gzipped                            |
| Garment color replacement  | Possible via pixel manipulation + overlay  | Possible via pixel manipulation + overlay |

**Recommendation to evaluate:** For a garment editor with dual-canvas sync, Fabric.js may be preferred due to:

- Better text editing for garment labels
- More mature export pipeline
- Larger community for fashion-tech use cases

### 3.2 State Management

For dual-canvas sync with real-time garment preview:

```
┌─────────────────────────────────────────────┐
│                 Design Store                  │
│  (Zustand — lightweight, no boilerplate)      │
│                                                │
│  {                                             │
│    layers: Layer[],        // all design layers│
│    activeTool: string,     // select/brush/... │
│    selectedLayer: string,  // current layer ID │
│    canvasState: {          // per-canvas state │
│      male: CanvasState,                       │
│      female: CanvasState,                     │
│    },                                         │
│    undoStack: Snapshot[],                     │
│    redoStack: Snapshot[],                     │
│  }                                             │
└────────────┬───────────────┬──────────────────┘
             │               │
      ┌──────▼──────┐ ┌──────▼──────┐
      │  Canvas A    │ │  Canvas B    │
      │  (Nam/Male)  │ │  (Nữ/Female) │
      │  Fabric.js   │ │  Fabric.js   │
      └──────────────┘ └──────────────┘
```

**Why Zustand over Redux/Context:**

- Context re-renders all consumers on any change — problematic for dual-canvas perf
- Redux requires significant boilerplate for this scale
- Zustand is minimal, works outside React (useful for canvas imperative APIs), and supports middleware for undo/redo

### 3.3 Export Strategy

Recommended hybrid approach:

1. **Quick preview** (client-side): `fabric.Canvas.toDataURL()` → PNG/JPEG with current viewport resolution
2. **Print-ready export** (server-side): Send canvas JSON state → server reconstructs with `fabric.node` (or `sharp` for compositing) at high resolution (2400×3600 as configured)
3. **Color-separated export** (server-side): For production/factory use, export each color layer separately

### 3.4 API Route Outline (Draft)

Based on `config.ts` hints and T-044 scope:

```
GET    /api/health                    # Health check (exists)
POST   /api/assets/upload             # Upload garment image
GET    /api/assets                    # List available assets
GET    /api/assets/:id                # Get asset metadata
DELETE /api/assets/:id                # Remove asset
GET    /api/fonts                     # List available fonts (fonts.json)
POST   /api/export/image              # Export design as image
POST   /api/export/pdf                # Export design as print-ready PDF
```

### 3.5 Security Architecture Notes

From T-048 scope (in progress by pa-security-architect):

- File upload validation: MIME type + magic bytes + size limit
- Export pipeline: no path traversal, temp file cleanup
- XSS: no `dangerouslySetInnerHTML` on canvas text content
- CORS: restrict to known origins (currently wide open — see code-review.md C-01)

---

## 4. Architecture Compliance Checklist

For future code review, verify every PR against these architecture rules:

| #     | Rule                                                                    | Source                |
| ----- | ----------------------------------------------------------------------- | --------------------- |
| AR-01 | Canvas library choice matches approved ADR                              | T-044                 |
| AR-02 | State management approach matches approved ADR                          | T-044                 |
| AR-03 | Export uses approved strategy (client-side preview + server-side print) | T-044                 |
| AR-04 | API routes follow approved route outline                                | T-044 / T-047         |
| AR-05 | Image processing uses `sharp` (already installed)                       | `server/package.json` |
| AR-06 | Upload validation uses MIME + magic bytes                               | T-048                 |
| AR-07 | Client proxies `/api` to server (Vite config already set)               | `vite.config.ts`      |
| AR-08 | Configuration centralized in `config.ts` (already established)          | Convention            |
| AR-09 | Error middleware registered before `app.listen()`                       | Coding Standards §4.2 |
| AR-10 | Rate limiting active on all routes                                      | Coding Standards §4.3 |

---

## 5. Blockers & Next Steps

| Blocker                              | Impact                                            | Owner                 | Action                  |
| ------------------------------------ | ------------------------------------------------- | --------------------- | ----------------------- |
| T-044 ADRs not delivered             | Cannot validate architecture compliance           | pa-solution-architect | Expedite T-044          |
| T-062 (canvas research) failed       | Canvas library undecided                          | pa-director           | Retry T-062 or delegate |
| T-044 component architecture missing | Frontend engineers blocked on component structure | pa-solution-architect | Priority deliverable    |
| T-047 (API contracts) in progress    | Backend engineers need route contracts            | pa-data-api-architect | Coordinate with T-044   |

---

## 6. Document Updates

This document will be revised when:

- [ ] T-044 ADRs are delivered (full architecture review)
- [ ] Canvas library decision is made (update §3.1 recommendation → binding)
- [ ] State management decision is made (update §3.2 recommendation → binding)
- [ ] API contracts are delivered (update §3.4 draft → approved)
- [ ] Security review (T-048) completes (update §3.5 notes → binding)
