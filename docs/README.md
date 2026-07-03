# Dual Canvas Editor

> **Nền tảng thiết kế áo thun đôi (Nam/Nữ) — MVP**

Dual Canvas Editor là ứng dụng web cho phép thiết kế hình in lên áo thun với hai canvas song song (Nam/Nữ). Upload ảnh, thêm text, tùy chỉnh màu sắc, xuất file in chất lượng cao.

**Trạng thái:** ✅ MVP Backend hoàn thành — 44 tests pass. Frontend canvas (Fabric.js) đang tích hợp.

---

## Tính năng

| Tính năng | Mô tả |
|-----------|-------|
| 🎨 **Dual Canvas** | Thiết kế đồng thời trên canvas Nam và Nữ, chế độ Mirror đồng bộ |
| 🖼️ **Upload Ảnh** | Upload PNG/JPEG/WebP, tự động resize + thumbnail (Sharp) |
| ✏️ **Text Editor** | Thêm text với font, màu, kích thước tùy chỉnh (Fabric.js IText) |
| 📦 **Asset Library** | Thư viện ảnh đã upload, lọc theo danh mục, tìm kiếm, phân trang |
| 📤 **Export** | Xuất PNG 2400×3600px qua server-side Sharp, idempotent (SHA-256) |
| 📱 **Responsive** | Desktop/tablet/mobile với touch gestures |
| 🔄 **Undo/Redo** | 50 bước lịch sử chỉnh sửa (Zustand) |

---

## Stack Công nghệ

| Lớp | Công nghệ | Version |
|-----|-----------|---------|
| **Client** | React, TypeScript, Vite, Fabric.js | 19 / 5.8 / 6.3 / 7.4+ |
| **Server** | Express, Sharp, Zod | 5.1 / 0.35 / 4.4 |
| **State** | Zustand | — |
| **Testing** | Vitest, Supertest | 4 / 7 |
| **Tooling** | ESLint 9, Prettier 3, Husky 9 | — |
| **Package Manager** | pnpm | 9.9 |
| **Runtime** | Node.js | 20+ |

---

## Bắt đầu nhanh

```bash
# Cài đặt
git clone <repo-url>
cd dual-canvas-editor
pnpm install

# Chạy development (client + server)
pnpm dev
# → Client: http://localhost:5173
# → Server: http://localhost:4000

# Kiểm tra server
curl http://localhost:4000/api/health
# → {"ok":true,"service":"dual-canvas-editor","version":"0.1.0"}
```

### Scripts

| Lệnh | Mô tả |
|------|-------|
| `pnpm dev` | Chạy client + server song song |
| `pnpm dev:client` | Chạy riêng client (port 5173) |
| `pnpm dev:server` | Chạy riêng server (port 4000) |
| `pnpm build` | Build cả hai packages |
| `pnpm check` | Lint + TypeScript check |
| `pnpm test` | Chạy toàn bộ tests (Vitest) |
| `pnpm lint` | ESLint toàn bộ workspace |
| `pnpm format` | Prettier format |

---

## Cấu trúc dự án

```
dual-canvas-editor/
├── client/                      # React 19 SPA (Vite)
│   └── src/
│       ├── App.tsx              # Root component
│       ├── api/                 # API client layer (fetch-based)
│       └── __tests__/           # Contract tests
├── server/                      # Express 5 REST API
│   └── src/
│       ├── index.ts             # Express bootstrap + middleware
│       ├── config.ts            # Centralized configuration
│       ├── routes/              # API endpoints
│       ├── services/            # Business logic (upload, export, assets)
│       ├── middleware/          # Rate-limit, validate, error-handler
│       ├── schemas/             # Zod validation schemas
│       └── types/               # Shared TypeScript interfaces
├── architecture/                # Architecture documents
├── docs/                        # Documentation (bạn đang ở đây!)
└── .goclaw-project/             # Team project artifacts
```

---

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/v1/upload` | Upload ảnh (multipart) |
| `GET` | `/api/v1/assets` | Danh sách assets (phân trang) |
| `GET` | `/api/v1/fonts` | Danh sách font |
| `POST` | `/api/v1/export` | Tạo export job (idempotent) |
| `GET` | `/api/v1/export/:id` | Poll trạng thái export |

### Ví dụ

```bash
# Upload ảnh
curl -X POST http://localhost:4000/api/v1/upload \
  -F "file=@design.png" \
  -F "category=upload"

# Lấy danh sách assets
curl "http://localhost:4000/api/v1/assets?category=upload&limit=20"

# Export thiết kế
curl -X POST http://localhost:4000/api/v1/export \
  -H "Content-Type: application/json" \
  -d '{"canvasState":{...},"format":"png","quality":"high"}'
```

---

## Quyết định Kiến trúc (ADRs)

| ADR | Quyết định |
|-----|-----------|
| ADR-001 | **Fabric.js >= 7.4.0** — IText editing, SVG export, JSON serialization |
| ADR-002 | **Server-side Sharp export** — nhẹ hơn Puppeteer, bảo mật hơn |
| ADR-003 | **Zustand state** — 1KB bundle, tích hợp tốt với Fabric.js |
| ADR-004 | **Local disk (MVP) → S3+CDN (prod)** |
| ADR-005 | **No auth (MVP)** — rate limit per-IP |
| ADR-007 | **SHA-256 idempotent export** — tránh duplicate jobs |

Xem đầy đủ: [`architecture/ADR.md`](../architecture/ADR.md)

---

## Tài liệu

- 👤 **[User Guide](USER_GUIDE.md)** — Hướng dẫn sử dụng
- ⚙️ **[Setup Guide](SETUP.md)** — Cài đặt môi trường dev
- 🏗️ **[Architecture](../architecture/ARCHITECTURE.md)** — Kiến trúc hệ thống
- 🎨 **[UI Design](../.goclaw-project/ui-design.md)** — Visual system + component states
- ✅ **[QA Strategy](../.goclaw-project/qa-testing-strategy.md)** — Test plan

---

## License

MIT
