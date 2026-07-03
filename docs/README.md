# Dual Canvas Editor

> **Nền tảng thiết kế áo thun đôi (Nam/Nữ) — MVP**

Dual Canvas Editor là ứng dụng web cho phép người dùng thiết kế hình in lên áo thun với hai canvas song song (Nam/Nữ). Người dùng upload ảnh, thêm text, tùy chỉnh màu sắc, và xuất file in chất lượng cao (PNG/PDF).

**Trạng thái:** 🟡 MVP Phase 1 đang phát triển (~65% hoàn thành)

---

## Tính năng chính

- 🎨 **Dual Canvas Editor** — Thiết kế đồng thời trên hai canvas Nam/Nữ với chế độ Mirror
- 🖼️ **Image Upload** — Upload ảnh, tự động resize & tạo thumbnail (Sharp)
- ✏️ **Text Editor** — Thêm text với font, màu sắc, kích thước tùy chỉnh (Fabric.js IText)
- 📦 **Asset Library** — Thư viện ảnh đã upload, phân loại, tìm kiếm
- 📤 **Export Chất Lượng Cao** — Xuất PNG 2400×3600 qua server-side Sharp
- 📱 **Responsive** — Hoạt động trên mobile/tablet/desktop
- 🔄 **Undo/Redo** — 50 bước lịch sử chỉnh sửa

---

## Stack Công nghệ

| Lớp | Công nghệ |
|---|---|
| **Client** | React 19, TypeScript 5.8, Vite 6, Fabric.js 7.4+ |
| **Server** | Express 5, TypeScript, Sharp 0.35 |
| **State** | Zustand + Zod |
| **Testing** | Vitest 4, Supertest |
| **Tooling** | ESLint 9 (flat config), Prettier 3, Husky 9 |
| **Package Manager** | pnpm 9 |
| **Runtime** | Node.js 20+ |

---

## Bắt đầu nhanh

### Yêu cầu hệ thống

- **Node.js** >= 20.0.0
- **pnpm** >= 9.0.0

### Cài đặt

```bash
git clone <repo-url>
cd dual-canvas-editor
pnpm install
```

### Chạy development

```bash
# Chạy cả client + server (2 cổng)
pnpm dev

# Hoặc chạy riêng
pnpm dev:client   # → http://localhost:3000
pnpm dev:server   # → http://localhost:4000
```

### Kiểm tra

```bash
pnpm check        # Lint + TypeScript check
pnpm build        # Build cả hai packages
pnpm test         # Chạy toàn bộ tests
```

---

## Cấu trúc dự án

```
dual-canvas-editor/
├── client/                          # React 19 SPA (Vite)
│   ├── src/
│   │   ├── main.tsx                  # Entry point
│   │   ├── App.tsx                   # Root component (kết nối API + canvas)
│   │   ├── App.css                   # Dark theme CSS
│   │   ├── api/                      # API client layer
│   │   │   ├── client.ts            # Base HTTP client (apiRequest, apiUpload)
│   │   │   ├── errors.tsx           # Error/loading/empty components
│   │   │   ├── types.ts             # Shared TypeScript types
│   │   │   ├── upload.ts            # Upload API wrapper
│   │   │   ├── assets.ts            # Assets API wrapper
│   │   │   ├── export.ts            # Export API wrapper
│   │   │   └── fonts.ts             # Fonts API wrapper
│   │   └── __tests__/
│   │       └── api-contracts.test.ts # API contract tests (42+ tests)
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── server/                          # Express 5 REST API
│   ├── src/
│   │   ├── index.ts                  # Express bootstrap + middleware
│   │   ├── config.ts                 # Centralized configuration
│   │   ├── middleware/
│   │   │   ├── rate-limiter.ts       # Per-endpoint rate limiting
│   │   │   ├── validate.ts           # Zod validation middleware
│   │   │   ├── error-handler.ts      # Centralized error handler
│   │   │   └── request-id.ts         # X-Request-Id tracking
│   │   ├── routes/
│   │   │   ├── health.ts             # GET /api/health
│   │   │   ├── upload.ts             # POST /api/v1/upload
│   │   │   ├── assets.ts             # GET /api/v1/assets
│   │   │   ├── export.ts             # POST /api/v1/export + GET /api/v1/export/:id
│   │   │   └── fonts.ts              # GET /api/v1/fonts
│   │   ├── services/
│   │   │   ├── upload.service.ts     # Multer + Sharp upload processing
│   │   │   ├── export.service.ts     # Sharp render pipeline (canvas→PNG/PDF)
│   │   │   ├── asset.service.ts      # Asset metadata management
│   │   │   └── cleanup.service.ts    # Temp file cleanup cron (15min)
│   │   ├── schemas/
│   │   │   ├── canvas-state.schema.ts     # CanvasState Zod schema
│   │   │   ├── export-request.schema.ts   # Export request validation
│   │   │   ├── upload.schema.ts           # Upload metadata validation
│   │   │   └── asset-query.schema.ts      # Asset query validation
│   │   ├── types/                    # Shared TypeScript interfaces
│   │   └── assets/                   # Static: fonts/, clipart/, garments/
│   └── package.json
├── architecture/                     # Architecture artifacts
│   ├── ARCHITECTURE.md               # System architecture document
│   └── ADR.md                        # Architecture Decision Records (7 ADRs)
├── .goclaw-project/                  # Team project artifacts
│   ├── canvas-library-research.md    # Fabric.js vs Konva.js research
│   ├── delivery-plan.md              # Milestone plan + risk register
│   ├── qa-testing-strategy.md        # QA test strategy
│   └── ui-design.md                  # Visual system + component states
├── docs/                             # Documentation (bạn đang ở đây!)
│   ├── README.md                     # ← File này
│   ├── DEVELOPER_GUIDE.md            # Hướng dẫn developer
│   └── USER_GUIDE.md                 # Hướng dẫn người dùng
├── .github/workflows/ci.yml          # CI pipeline (lint + typecheck + build)
├── .husky/pre-commit                 # Pre-commit hook (lint-staged)
├── eslint.config.mjs                 # Shared ESLint flat config
├── .prettierrc                       # Shared Prettier config
├── tsconfig.base.json                # Shared TypeScript compiler base
├── package.json                      # Root workspace config
└── pnpm-workspace.yaml
```

---

## Kiến trúc tổng quan

```
┌──────────────────────────────────────────────────────────┐
│                    USER'S BROWSER                         │
│  ┌──────────────────────────────────────────────────┐    │
│  │              React SPA (client/)                  │    │
│  │                                                   │    │
│  │  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │    │
│  │  │ Nam      │  │  Nữ      │  │ Control Panel │  │    │
│  │  │ Canvas   │  │  Canvas  │  │ Layers/Props  │  │    │
│  │  │ (Fabric) │  │ (Fabric) │  │ Assets/Export │  │    │
│  │  └──────────┘  └──────────┘  └───────────────┘  │    │
│  │                                                   │    │
│  │  ┌────────────────────────────────────────────┐  │    │
│  │  │        Zustand Store                       │  │    │
│  │  │  canvasState | assets | exportJob | undo   │  │    │
│  │  └────────────────────────────────────────────┘  │    │
│  └──────────────────┬───────────────────────────────┘    │
└─────────────────────┼────────────────────────────────────┘
                      │  HTTPS (REST API)
┌─────────────────────┼────────────────────────────────────┐
│  Express 5 API (server/)                                 │
│  ┌──────────────────┼──────────────────────────────────┐ │
│  │ POST /api/v1/upload   │ Multer + Sharp (thumbnail)  │ │
│  │ POST /api/v1/export   │ Sharp Render (2400×3600)    │ │
│  │ GET  /api/v1/assets   │ Asset listing + pagination  │ │
│  │ GET  /api/v1/fonts    │ Font catalog                │ │
│  │ GET  /api/health      │ Health check                │ │
│  └──────────────────┼──────────────────────────────────┘ │
└─────────────────────┼────────────────────────────────────┘
          ┌───────────┴───────────┐
          ▼                       ▼
     uploads/                  exports/
  (user images)           (PNG/PDF, 1h TTL)
```

---

## API Endpoints

| Method | Endpoint | Mô tả | Rate Limit |
|---|---|---|---|
| `GET` | `/api/health` | Health check (trả về version + timestamp) | 1000/h |
| `POST` | `/api/v1/upload` | Upload ảnh (multipart, field "file") | 30/h |
| `GET` | `/api/v1/assets` | Danh sách assets (query: category, tags, search, cursor, limit) | 300/h |
| `GET` | `/api/v1/fonts` | Danh sách font có sẵn | 300/h |
| `POST` | `/api/v1/export` | Tạo export job (idempotent — SHA-256 hash) | 30/h |
| `GET` | `/api/v1/export/:id` | Poll trạng thái export job | 300/h |
| `GET` | `/api/v1/storage/*` | Serve static files (uploads, exports, fonts) | — |

### Ví dụ API request

```bash
# Health check
curl http://localhost:4000/api/health

# Upload ảnh
curl -X POST http://localhost:4000/api/v1/upload \
  -F "file=@design.png" \
  -F "category=upload"

# Lấy danh sách assets
curl "http://localhost:4000/api/v1/assets?category=upload&limit=20"

# Export thiết kế
curl -X POST http://localhost:4000/api/v1/export \
  -H "Content-Type: application/json" \
  -d '{"canvasState": {...}, "format": "png", "quality": "high"}'
```

---

## Scripts

| Script | Mô tả |
|---|---|
| `pnpm dev` | Chạy client:3000 + server:4000 song song |
| `pnpm dev:client` | Chạy riêng client (Vite HMR) |
| `pnpm dev:server` | Chạy riêng server (tsx watch) |
| `pnpm build` | Build cả hai packages |
| `pnpm lint` | ESLint toàn bộ workspace |
| `pnpm typecheck` | TypeScript check toàn bộ |
| `pnpm check` | `lint` + `typecheck` |
| `pnpm test` | Chạy toàn bộ tests (Vitest) |
| `pnpm format` | Prettier format toàn bộ code |
| `pnpm clean` | Xóa dist/ + .tsbuildinfo |

---

## Environment Variables

| Variable | Default | Mô tả |
|---|---|---|
| `PORT` | `4000` | Server port |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed CORS origin |
| `TRUST_PROXY` | `false` | Trust X-Forwarded-For (rate limiting) |
| `VITE_API_BASE` | `http://localhost:4000` | API base URL (client) |

---

## Quyết định Kiến trúc Chính (ADRs)

| ADR | Quyết định | Lý do |
|---|---|---|
| ADR-001 | **Fabric.js >= 7.4.0** | IText editing, SVG export, JSON serialization |
| ADR-002 | **Server-side Sharp export** | Thay vì Puppeteer — nhẹ hơn, bảo mật hơn |
| ADR-003 | **Zustand state management** | Nhẹ (1 KB), tích hợp tốt với Fabric.js imperative |
| ADR-004 | **Local disk → S3+CDN** | MVP local, production migration seamless |
| ADR-005 | **No authentication** | MVP scope tradeoff, rate limit per-IP |
| ADR-006 | **pnpm monorepo** | client/ + server/, toolchain nhất quán |
| ADR-007 | **SHA-256 idempotent export** | Tránh duplicate export jobs |

Xem chi tiết: [`architecture/ADR.md`](architecture/ADR.md)

---

## Tài liệu liên quan

- 📖 **[Developer Guide](docs/DEVELOPER_GUIDE.md)** — Kiến trúc chi tiết, code structure, contribution guide
- 👤 **[User Guide](docs/USER_GUIDE.md)** — Hướng dẫn sử dụng Dual Canvas Editor
- 🏗️ **[Architecture](architecture/ARCHITECTURE.md)** — System architecture document
- 📋 **[Architecture Decisions](architecture/ADR.md)** — 7 ADRs đã quyết định
- 🎨 **[UI Design](.goclaw-project/ui-design.md)** — Visual system + component states
- 📊 **[Delivery Plan](.goclaw-project/delivery-plan.md)** — Milestones + risk register
- ✅ **[QA Strategy](.goclaw-project/qa-testing-strategy.md)** — Test plan + coverage
- 📚 **[Library Research](.goclaw-project/canvas-library-research.md)** — Fabric.js vs Konva.js

---

## Contributing

Xem **[Developer Guide](docs/DEVELOPER_GUIDE.md#contributing)** để biết cách đóng góp.

Yêu cầu:
- Code phải pass `pnpm check` (lint + typecheck) trước khi commit
- Pre-commit hook tự động chạy lint-staged (ESLint + Prettier)
- Viết tests cho logic mới (Vitest)
- Tuân thủ [CODING-STANDARDS.md](CODING-STANDARDS.md)

---

## License

MIT
