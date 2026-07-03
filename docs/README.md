# Dual Canvas Editor

> **Nền tảng thiết kế áo thun đôi (Nam/Nữ) — MVP v0.1.0**

Dual Canvas Editor là ứng dụng web cho phép thiết kế hình in lên hai mẫu áo Nam và Nữ đồng thời. Upload ảnh, thêm text, tùy chỉnh layer, và xuất file in chất lượng cao (PNG/PDF).

---

## Tính năng

| Tính năng | Trạng thái |
|-----------|-----------|
| 🎨 Dual Canvas (Nam/Nữ) với chế độ Mirror | ✅ |
| ✏️ Text Editor — font, màu, kích thước (Fabric.js IText) | ✅ |
| 🖼️ Upload ảnh — tự động resize + thumbnail (Sharp) | ✅ |
| 📦 Asset Library — phân loại, tìm kiếm, phân trang | ✅ |
| 📤 Export PNG 2400×3600, PDF (server-side Sharp) | ✅ |
| 🔄 Undo/Redo — 50 bước lịch sử | ⏳ Tích hợp canvas |
| 📱 Responsive — mobile/tablet/desktop | ⏳ Tích hợp canvas |
| 🛡️ Validation — Zod schema, rate limiting, CORS | ✅ |

---

## Stack công nghệ

| Lớp | Công nghệ |
|-----|----------|
| **Client** | React 19, TypeScript 5.8, Vite 6, Fabric.js ≥7.4 |
| **Server** | Express 5, TypeScript, Sharp 0.35 |
| **State** | Zustand + Zod |
| **Testing** | Vitest 4, Supertest |
| **Tooling** | ESLint 9 (flat config), Prettier 3, Husky 9 |
| **Package Manager** | pnpm 9 |
| **Runtime** | Node.js ≥20 |

---

## Bắt đầu nhanh

### Yêu cầu

- **Node.js** ≥ 20.0.0
- **pnpm** ≥ 9.0.0

### Cài đặt & chạy

```bash
# Clone repo
git clone <repo-url>
cd dual-canvas-editor

# Cài dependencies
pnpm install

# Chạy dev — client + server đồng thời
pnpm dev
# → Client: http://localhost:5173
# → Server: http://localhost:4000

# Hoặc chạy riêng từng phần
pnpm dev:client   # Chỉ client
pnpm dev:server   # Chỉ server
```

### Kiểm tra

```bash
pnpm check        # Lint + TypeScript
pnpm test         # Chạy test (44 tests server + contract tests client)
pnpm build        # Build production
```

---

## Cấu trúc dự án

```
dual-canvas-editor/
├── client/                      # React 19 SPA (Vite)
│   ├── src/
│   │   ├── main.tsx             # Entry point
│   │   ├── App.tsx              # Root component
│   │   ├── api/                 # API client (fetch wrapper, types)
│   │   └── __tests__/           # Contract tests
│   └── vitest.config.ts
├── server/                      # Express 5 API
│   ├── src/
│   │   ├── index.ts             # Server entry (port 4000)
│   │   ├── config.ts            # Cấu hình tập trung
│   │   ├── routes/              # health, upload, assets, export, fonts
│   │   ├── services/            # upload, asset, export, cleanup
│   │   ├── middleware/          # error-handler, rate-limiter, validate
│   │   ├── schemas/             # Zod: canvas-state, export-request, upload, asset-query
│   │   ├── types/               # asset, canvas, export
│   │   └── assets/fonts/        # 7 font WOFF2 files
│   └── vitest.config.ts
├── architecture/
│   ├── ARCHITECTURE.md          # Kiến trúc hệ thống + component tree
│   └── ADR.md                   # 7 Architecture Decision Records
├── design/
│   └── UI_SPEC.md               # UI spec — tokens, component states, responsive
├── docs/
│   ├── README.md                # File này
│   ├── USER_GUIDE.md            # Hướng dẫn sử dụng
│   └── SETUP.md                 # Hướng dẫn cài đặt dev
├── .github/workflows/ci.yml     # CI pipeline
├── pnpm-workspace.yaml          # Monorepo workspace
└── package.json                 # Root config
```

---

## API Endpoints

Base URL: `http://localhost:4000/api/v1`

| Method | Endpoint | Mô tả |
|--------|---------|-------|
| `GET` | `/health` | Health check — `{"ok":true, "service":"dual-canvas-editor"}` |
| `POST` | `/upload` | Upload ảnh (multipart) — trả về Asset JSON |
| `GET` | `/assets?category=&tags=&search=` | Danh sách asset, có phân trang |
| `POST` | `/export` | Tạo export job (idempotent theo hash canvas state) |
| `GET` | `/export/:id` | Poll trạng thái export job |
| `GET` | `/fonts` | Danh sách font có sẵn |

### Ví dụ nhanh

```bash
# Health check
curl http://localhost:4000/api/v1/health

# Upload ảnh
curl -F "file=@design.png" -F "category=upload" -F "tags=summer,t-shirt" \
  http://localhost:4000/api/v1/upload

# Export
curl -X POST http://localhost:4000/api/v1/export \
  -H "Content-Type: application/json" \
  -d '{"canvasState": {...}, "format": "png", "quality": "standard"}'
```

---

## Tài liệu liên quan

| File | Nội dung |
|------|---------|
| [docs/USER_GUIDE.md](USER_GUIDE.md) | Hướng dẫn sử dụng chi tiết |
| [docs/SETUP.md](SETUP.md) | Cài đặt môi trường dev, env vars, troubleshooting |
| [architecture/ARCHITECTURE.md](../architecture/ARCHITECTURE.md) | Kiến trúc hệ thống |
| [architecture/ADR.md](../architecture/ADR.md) | Architecture Decision Records |
| [design/UI_SPEC.md](../design/UI_SPEC.md) | UI specification — tokens, component states |
| [code-review.md](../code-review.md) | Code review findings |
| [CR-CHECKLIST.md](../CR-CHECKLIST.md) | Code review checklist |
