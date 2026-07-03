# Developer Guide — Dual Canvas Editor

> **Hướng dẫn dành cho developer muốn đóng góp hoặc maintain Dual Canvas Editor**

---

## Mục lục

1. [Tổng quan Kiến trúc](#1-tổng-quan-kiến-trúc)
2. [Cấu trúc Code](#2-cấu-trúc-code)
3. [Development Setup](#3-development-setup)
4. [Quy trình Development](#4-quy-trình-development)
5. [API Architecture](#5-api-architecture)
6. [Testing](#6-testing)
7. [Debugging](#7-debugging)
8. [Contributing](#8-contributing)

---

## 1. Tổng quan Kiến trúc

### 1.1 High-level Architecture

Dual Canvas Editor theo kiến trúc **thin-client + server-side export pipeline**:

```
Browser (React SPA)                  Server (Express 5)
┌─────────────────────┐              ┌──────────────────────────┐
│ Fabric.js Canvas ×2 │              │ REST API                 │
│ Zustand Store       │◄────REST────►│ Sharp Image Processing   │
│ API Client Layer    │              │ File Storage (local/S3)  │
└─────────────────────┘              └──────────────────────────┘
```

- **Client**: React 19 SPA, Fabric.js cho canvas editing, Zustand cho state
- **Server**: Express 5 REST API, Sharp cho xử lý ảnh/export
- **Communication**: REST JSON API qua HTTP, CORS restricted
- **No Auth (MVP)**: Rate limiting per-IP là primary guardrail

### 1.2 Data Flow

```
1. User upload ảnh
   Client → POST /api/v1/upload (multipart) → Multer → Sharp validate → save + thumbnail → asset metadata

2. User thiết kế
   Fabric.js events → Zustand store → canvasState JSON

3. User export
   Client → POST /api/v1/export (canvasState JSON) → SHA-256 hash check → Sharp compositing → PNG/PDF → URL

4. Client poll kết quả
   Client → GET /api/v1/export/:id → job status → download URL khi done
```

### 1.3 Key Design Decisions

| Decision | Rationale |
|---|---|
| **Fabric.js, không Konva.js** | IText WYSIWYG editing, SVG export native, JSON serialization mạnh (ADR-001) |
| **Sharp, không Puppeteer** | Nhẹ hơn (~20 MB vs ~300 MB), attack surface nhỏ hơn (ADR-002) |
| **Zustand, không Redux** | 1 KB bundle, imperative API tốt cho Fabric.js (ADR-003) |
| **Local storage (MVP)** | Single-instance, no-auth → local disk đủ. URL abstraction cho S3 migration (ADR-004) |
| **No auth** | MVP scope tradeoff — không có user identity, session, CSRF (ADR-005) |
| **pnpm monorepo** | Strict deps, workspace protocol, toolchain consistency (ADR-006) |
| **SHA-256 idempotent export** | Tránh duplicate export jobs lãng phí server (ADR-007) |

---

## 2. Cấu trúc Code

### 2.1 Monorepo Layout

```
dual-canvas-editor/
├── client/                     # React 19 SPA (port 3000 dev)
│   ├── src/
│   │   ├── main.tsx            # React entry — createRoot + StrictMode
│   │   ├── App.tsx             # Root: health check → canvas area + toolbar
│   │   ├── App.css             # Dark theme styles (~8 KB)
│   │   ├── api/                # API client layer
│   │   │   ├── client.ts       # apiRequest<T>() + apiUpload<T>()
│   │   │   │                   # - Auto X-Request-Id
│   │   │   │                   # - Timeout handling (15s default, 30s upload)
│   │   │   │                   # - Error normalization (ApiError class)
│   │   │   ├── errors.tsx      # LoadingSpinner, ErrorDisplay, EmptyState
│   │   │   ├── types.ts        # Shared TS interfaces (mirror of server types)
│   │   │   ├── upload.ts       # uploadImage(file, category, tags, onProgress?)
│   │   │   ├── assets.ts       # listAssets(query: AssetQuery)
│   │   │   ├── export.ts       # startExport(state, format, quality) + pollJob(id)
│   │   │   └── fonts.ts        # listFonts()
│   │   └── __tests__/
│   │       └── api-contracts.test.ts  # 42 contract tests (mock fetch)
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── server/                     # Express 5 API (port 4000)
│   ├── src/
│   │   ├── index.ts            # Express bootstrap
│   │   │                       # - helmet, cors, rate-limit, static, routes
│   │   ├── config.ts           # Central config — all magic numbers here
│   │   ├── middleware/
│   │   │   ├── rate-limiter.ts # Per-endpoint rate limits
│   │   │   ├── validate.ts     # Zod validation middleware factory
│   │   │   ├── error-handler.ts# AppError class + Express error handler
│   │   │   └── request-id.ts   # X-Request-Id injection + response echo
│   │   ├── routes/
│   │   │   ├── health.ts       # GET /api/health
│   │   │   ├── upload.ts       # POST /api/v1/upload (multipart)
│   │   │   ├── assets.ts       # GET /api/v1/assets (paginated)
│   │   │   ├── export.ts       # POST /api/v1/export + GET /api/v1/export/:id
│   │   │   └── fonts.ts        # GET /api/v1/fonts
│   │   ├── services/
│   │   │   ├── upload.service.ts   # Multer config, Sharp validate, thumbnail
│   │   │   ├── export.service.ts   # Sharp render: CanvasState → PNG/PDF
│   │   │   ├── asset.service.ts    # Asset metadata CRUD (JSON file store)
│   │   │   └── cleanup.service.ts  # Cron: purge temp/exports > 1h
│   │   ├── schemas/
│   │   │   ├── canvas-state.schema.ts     # Zod: CanvasState validation
│   │   │   ├── export-request.schema.ts   # Zod: format + quality enum
│   │   │   ├── upload.schema.ts           # Zod: category + tags
│   │   │   └── asset-query.schema.ts      # Zod: pagination params
│   │   ├── types/               # Shared TypeScript interfaces
│   │   │   ├── canvas.ts        # CanvasState, Layer, GarmentInfo
│   │   │   ├── export.ts        # ExportJob, ExportOutput
│   │   │   └── asset.ts         # Asset, Font, AssetCategory
│   │   └── assets/
│   │       └── fonts/
│   │           └── fonts.json   # Font catalog metadata
│   └── package.json
├── architecture/                # Durable architecture artifacts
│   ├── ARCHITECTURE.md          # Full system architecture doc (480 lines)
│   └── ADR.md                   # 7 Architecture Decision Records
├── .goclaw-project/             # Team project artifacts
│   ├── canvas-library-research.md
│   ├── delivery-plan.md
│   ├── qa-testing-strategy.md
│   └── ui-design.md
└── docs/                        # Documentation (bạn đang ở đây!)
    ├── README.md
    ├── DEVELOPER_GUIDE.md       # ← File này
    └── USER_GUIDE.md
```

### 2.2 Component Tree (Client)

```
<App>
├── Header: Logo | Status dot | API version | Font count
├── Main (3 states: connecting | error | connected)
│   ├── Connecting → <LoadingSpinner "Connecting to backend...">
│   ├── Error → <ErrorDisplay> with retry button (reload)
│   └── Connected →
│       ├── <section.canvas-area>
│       │   ├── <div.canvas-slot--active>  → "Canvas A (Nam)" placeholder
│       │   └── <div.canvas-slot>          → "Canvas B (Nữ)" placeholder
│       └── <section.toolbar-placeholder>
│           ├── <div.toolbar-group> → API endpoints list
│           └── <div.toolbar-group> → Contract test info
```

**Lưu ý**: Canvas Fabric.js chưa được tích hợp vào App.tsx (T-052 đã hoàn thành frontend components nhưng cần merge). Hiện tại App chỉ hiển thị connection status + placeholder.

### 2.3 Những file quan trọng cần biết

| File | Vai trò | Khi nào sửa |
|---|---|---|
| `server/src/config.ts` | **Central config** — tất cả hằng số: ports, paths, limits | Thay đổi cấu hình server |
| `server/src/schemas/canvas-state.schema.ts` | **Source of truth** — CanvasState Zod schema | Thay đổi data model canvas |
| `client/src/api/types.ts` | **Client types** — mirror của server types | Thêm field mới vào API response |
| `client/src/api/client.ts` | **HTTP client** — apiRequest/apiUpload | Thay đổi cách gọi API |
| `architecture/ADR.md` | **Quyết định kiến trúc** | Quyết định architectural mới |
| `.goclaw-project/ui-design.md` | **Thiết kế UI** | Thêm component mới, thay đổi style |

---

## 3. Development Setup

### 3.1 Prerequisites

```bash
# Kiểm tra version
node --version   # >= 20.0.0
pnpm --version   # >= 9.0.0
```

### 3.2 First-time Setup

```bash
git clone <repo-url>
cd dual-canvas-editor
pnpm install
pnpm check        # Xác nhận mọi thứ OK: lint + typecheck
```

### 3.3 Dev Workflow

```bash
# Terminal 1: Chạy cả client + server
pnpm dev

# Hoặc chạy riêng trong 2 terminal
pnpm dev:client   # http://localhost:3000 — Vite HMR
pnpm dev:server   # http://localhost:4000 — tsx watch (auto restart)
```

**Hot Reload:**
- Client: Vite HMR (instant, giữ state)
- Server: tsx watch (auto restart khi file thay đổi)

### 3.4 Before Commit

```bash
pnpm check        # ESLint + TypeScript check
pnpm test         # Chạy toàn bộ tests
```

Pre-commit hook (Husky) sẽ tự chạy lint-staged:
```json
// package.json → lint-staged
"*.{ts,tsx,js,jsx}": ["eslint --fix", "prettier --write"]
"*.{json,css,md}":   ["prettier --write"]
```

---

## 4. Quy trình Development

### 4.1 Adding a New API Endpoint

1. **Define Zod schema** trong `server/src/schemas/`
2. **Define TypeScript types** trong `server/src/types/`
3. **Implement route** trong `server/src/routes/`
4. **Implement service** trong `server/src/services/`
5. **Add rate limiter** trong `server/src/middleware/rate-limiter.ts`
6. **Register route** trong `server/src/index.ts`
7. **Add client wrapper** trong `client/src/api/`
8. **Update client types** trong `client/src/api/types.ts`
9. **Add contract test** trong `client/src/__tests__/api-contracts.test.ts`

### 4.2 Adding a New Canvas Feature

1. **Update CanvasState schema** (`server/src/schemas/canvas-state.schema.ts`) nếu thêm layer properties mới
2. **Update client types** (`client/src/api/types.ts`) — mirror schema changes
3. **Implement Fabric.js logic** — fabric event handlers → Zustand store
4. **Update UI** — control panel, toolbar, modals theo UI design spec
5. **Update export service** (`server/src/services/export.service.ts`) nếu feature mới ảnh hưởng đến export render

### 4.3 Code Style

Tuân thủ **[CODING-STANDARDS.md](CODING-STANDARDS.md)** trong repo gốc. Highlights:

- **TypeScript strict mode** (`"strict": true`), không `@ts-nocheck`
- **Named exports** (không default exports trừ React components)
- **Kebab-case cho files**: `error-handler.ts`, `canvas-state.schema.ts`
- **PascalCase cho React components**: `LoadingSpinner`, `ErrorDisplay`
- **camelCase cho functions/variables**: `apiRequest`, `generateRequestId`
- **Dùng Zod cho validation** (client + server nếu cần)
- **Imports sắp xếp**: Node builtins → external deps → internal modules

### 4.4 Monorepo Conventions

```bash
# Install dep cho client
pnpm --filter client add <package>

# Install devDep cho server
pnpm --filter server add -D <package>

# Install shared dep ở root
pnpm add -D <package> -w

# Chạy script cho 1 package
pnpm --filter client test
pnpm --filter server build
```

---

## 5. API Architecture

### 5.1 Response Envelope

Tất cả API responses theo format:

```json
// Thành công
{
  "data": { ... }
}

// Lỗi
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable error",
    "details": ["field: constraint"]
  }
}
```

### 5.2 Error Codes

| Code | HTTP Status | Ý nghĩa |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Request body/params không hợp lệ |
| `NOT_FOUND` | 404 | Resource không tồn tại (job, asset) |
| `RATE_LIMITED` | 429 | Vượt quá rate limit |
| `TIMEOUT` | 408 | Request timeout (client-side) |
| `NETWORK_ERROR` | 0 | Network failure (client-side) |
| `UPLOAD_ERROR` | 400 | Upload thất bại (file invalid/corrupt) |
| `EXPORT_ERROR` | 500 | Export processing lỗi |
| `INTERNAL_ERROR` | 500 | Server error không xác định |

### 5.3 Rate Limits (MVP)

| Endpoint | Limit | Window |
|---|---|---|
| `/api/health` | 1000 req | 1 hour |
| `/api/v1/upload` | 30 req | 1 hour |
| `/api/v1/export` | 30 req | 1 hour |
| `/api/v1/export/:id` | 300 req | 1 hour |
| `/api/v1/assets` | 300 req | 1 hour |
| `/api/v1/fonts` | 300 req | 1 hour |

### 5.4 Export Pipeline Flow

```
POST /api/v1/export
  ├── Validate request (Zod: canvasState, format, quality)
  ├── Compute SHA-256(canvasState JSON) — idempotency key
  ├── Check existence:
  │   ├── Job exists (processing/done) → 200 OK (return existing)
  │   └── Job doesn't exist / failed → 202 Accepted (create new)
  └── Async processing:
      ├── Parse CanvasState → layer array sorted by zIndex
      ├── Render garment base color (Sharp .tint())
      ├── Composite each layer (text via SVG→Sharp, images via Sharp .composite())
      └── Output PNG (2400×3600) + optional PDF wrapper
          └── Job status → 'done' with download URLs

GET /api/v1/export/:id
  └── Return job status: { status, progress, outputs[], error }
```

### 5.5 Upload Pipeline Flow

```
POST /api/v1/upload (multipart)
  ├── Multer: receive file (max 10 MB)
  ├── Sharp: validate it's a valid image
  ├── Sharp: strip EXIF metadata (security)
  ├── Sharp: generate 300px thumbnail
  ├── UUID rename: originalName preserved as metadata
  └── Save metadata → JSON file store
```

### 5.6 CanvasState Data Model

```typescript
// Source of truth: server/src/schemas/canvas-state.schema.ts
interface CanvasState {
  version: 2;                      // Schema version for migration
  canvases: {
    nam: CanvasDescriptor;         // Male garment canvas
    nu: CanvasDescriptor;          // Female garment canvas
  };
  metadata?: {
    name?: string;                 // Design name
    createdBy?: string;            // Creator (future auth)
    template?: string;             // Template ID
  };
}

interface CanvasDescriptor {
  layers: CanvasLayer[];           // Ordered by zIndex
  garment?: {
    imageUrl: string;              // Garment base template
    color?: string;                // Hex color replacement
    tint?: { hue: number; saturation: number };
  };
  width: number;                   // Canvas pixel width
  height: number;                  // Canvas pixel height
  backgroundColor?: string;
}

interface CanvasLayer {
  id: string;                      // UUID
  type: 'text' | 'image';         // Layer type discriminator
  // Position & transform
  x: number; y: number;
  width?: number; height?: number;
  rotation: number;                // Degrees
  scaleX: number; scaleY: number;
  opacity: number;                 // 0-1
  visible: boolean;
  zIndex: number;
  locked?: boolean;
  // Text-specific
  content?: string;                // Text string
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  fontStyle?: string;
  fill?: string;                   // Text color
  stroke?: string;                 // Text outline color
  strokeWidth?: number;
  textAlign?: string;
  // Image-specific
  url?: string;                    // Image URL (for image type layers)
}
```

---

## 6. Testing

### 6.1 Test Stack

- **Framework**: Vitest 4
- **Client tests**: Vitest + mock fetch (contract tests)
- **Server tests**: Vitest + Supertest (integration tests)

### 6.2 Running Tests

```bash
# Chạy toàn bộ tests
pnpm test

# Chạy test cho 1 package
pnpm --filter client test
pnpm --filter server test

# Watch mode
pnpm --filter server test:watch
pnpm --filter client test:watch
```

### 6.3 Test Structure

**Client** (`client/src/__tests__/`):
```
api-contracts.test.ts   # 42 tests: API response shapes, error handling, edge cases
```

**Server** (`server/src/`):
```
routes/health.test.ts   # Health endpoint test
routes/fonts.test.ts    # Fonts endpoint test
middleware/*.test.ts    # Error handler + request ID tests
services/asset.service.test.ts
services/export.service.test.ts
services/upload.service.test.ts  # (cần implement)
services/cleanup.service.test.ts
```

### 6.4 Writing Tests

```typescript
// Client contract test pattern
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('POST /api/v1/upload', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should return 201 with asset on successful upload', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: () => Promise.resolve({ data: { id: 'abc', url: '/storage/uploads/abc.png' } }),
    });

    const result = await uploadImage(file, 'upload');
    expect(result.id).toBe('abc');
  });
});
```

### 6.5 CI Pipeline

```
.github/workflows/ci.yml:
  install → lint → typecheck → build
```

---

## 7. Debugging

### 7.1 Common Issues

#### "Cannot connect to API" (client)

```bash
# Kiểm tra server đang chạy
curl http://localhost:4000/api/health

# Kiểm tra CORS origin match
# server/src/config.ts → corsOrigin
# client/src/api/client.ts → VITE_API_BASE
```

#### "Build failed — dist/ incomplete"

```bash
# Xóa cache và rebuild
pnpm clean
pnpm build

# Kiểm tra cấu trúc dist/
ls -la server/dist/
ls -la server/dist/routes/
```

#### "ESLint error: Cannot find module 'xxx'"

```bash
# Cài lại dependencies
pnpm install
```

### 7.2 Debug Tools

| Tool | Usage |
|---|---|
| `pnpm typecheck` | Kiểm tra TypeScript errors |
| `pnpm lint` | Kiểm tra ESLint errors |
| `curl http://localhost:4000/api/health` | Test server đang chạy |
| `console.log(zustandStore.getState())` | Debug state trong browser console |
| `fabricCanvas.toJSON()` | Debug Fabric.js canvas state |
| Redux DevTools | Debug Zustand store (compatible) |

### 7.3 Server Logs

Server sử dụng `console.log` cho startup messages. Error logging qua centralized error handler (`server/src/middleware/error-handler.ts`).

Trong development, tất cả errors hiển thị stack trace. Trong production (`NODE_ENV=production`), stack traces bị ẩn.

---

## 8. Contributing

### 8.1 Workflow

```
1. Tạo branch mới từ master
   git checkout -b feature/your-feature

2. Implement + test
   pnpm dev           # Start dev servers
   pnpm test          # Run tests
   pnpm check         # Lint + typecheck

3. Commit với message rõ ràng
   feat: add xxx
   fix: fix xxx
   docs: update xxx

4. Push + tạo PR
   git push origin feature/your-feature

5. CI phải pass (lint + typecheck + build)
```

### 8.2 Commit Conventions

```
feat:     Tính năng mới
fix:      Sửa bug
docs:     Thay đổi documentation
style:    Format, whitespace (không thay đổi logic)
refactor: Refactor code
test:     Thêm/sửa tests
chore:    Build, CI, tooling
```

### 8.3 Review Checklist

Trước khi tạo PR, xác nhận:

- [ ] `pnpm check` pass (lint + typecheck)
- [ ] `pnpm test` pass
- [ ] Thêm tests cho logic mới
- [ ] Cập nhật docs nếu thay đổi API/public interface
- [ ] Không có `console.log` debug còn sót
- [ ] Không có `@ts-ignore` hoặc `any` không cần thiết
- [ ] Responsive không bị vỡ trên mobile (nếu thay đổi UI)

### 8.4 Getting Help

- **Architecture questions**: Xem [`architecture/ARCHITECTURE.md`](../architecture/ARCHITECTURE.md) hoặc ADRs
- **API design**: Xem [`server/src/schemas/`](../server/src/schemas/) — Zod schemas là source of truth
- **UI design**: Xem [`.goclaw-project/ui-design.md`](../.goclaw-project/ui-design.md)
- **Coding standards**: Xem [`CODING-STANDARDS.md`](../CODING-STANDARDS.md)
- **Security**: Xem [`security-review.md`](../security-review.md)

---

**Last updated**: 2026-07-02
