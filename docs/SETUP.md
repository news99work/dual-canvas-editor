# Hướng dẫn Cài đặt — Dual Canvas Editor

> **Dành cho developer muốn chạy và phát triển dự án**

---

## 1. Yêu cầu hệ thống

| Công cụ | Phiên bản tối thiểu | Kiểm tra |
|---------|-------------------|----------|
| **Node.js** | ≥ 20.0.0 | `node --version` |
| **pnpm** | ≥ 9.0.0 | `pnpm --version` |
| **Git** | ≥ 2.30 | `git --version` |

### Cài Node.js + pnpm (nếu chưa có)

```bash
# macOS (Homebrew)
brew install node@20 pnpm

# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g pnpm

# Windows (Scoop)
scoop install nodejs-lts
npm install -g pnpm
```

---

## 2. Clone & cài đặt

```bash
# Clone repo
git clone <repo-url>
cd dual-canvas-editor

# Cài dependencies
pnpm install
```

Kết quả mong đợi:
```
Done in 15s
```

---

## 3. Biến môi trường (Environment Variables)

### Server (`server/.env`)

Tạo file `server/.env` (không bắt buộc — có sẵn default cho development):

```bash
# Server port
PORT=4000

# CORS — client URL được phép gọi API
CORS_ORIGIN=http://localhost:5173

# Trust proxy — bật khi chạy sau reverse proxy (Nginx, Vercel, Cloudflare)
TRUST_PROXY=false
```

> **Mặc định:** Không cần file `.env`. Server chạy ở port 4000, chấp nhận CORS từ `localhost:5173`.

### Client (`client/.env`)

```bash
# API base URL (mặc định: http://localhost:4000)
VITE_API_BASE=http://localhost:4000
```

> **Mặc định:** Không cần file `.env`. Client gọi API đến `localhost:4000` qua Vite proxy.

---

## 4. Chạy local development

### Chạy đồng thời client + server (khuyên dùng)

```bash
pnpm dev
```

Kết quả:

```
🔧 Dual Canvas Editor server running at http://localhost:4000
   CORS origin: http://localhost:5173
   Upload size limit: 10 MB
   Export dimensions: 2400×3600

  VITE v6.3.5  ready in 320 ms
  ➜  Local:   http://localhost:5173/
```

| Thành phần | URL |
|-----------|-----|
| **Client (React)** | http://localhost:5173 |
| **Server (API)** | http://localhost:4000 |
| **API Health** | http://localhost:4000/api/v1/health |

### Chạy riêng từng phần

```bash
# Terminal 1 — Server
pnpm dev:server    # → http://localhost:4000

# Terminal 2 — Client
pnpm dev:client    # → http://localhost:5173
```

---

## 5. Kiểm tra hệ thống

### Verify server hoạt động

```bash
# Health check
curl http://localhost:4000/api/v1/health
# → {"ok":true,"service":"dual-canvas-editor","version":"0.1.0","timestamp":"2026-..."}

# Kiểm tra font
curl http://localhost:4000/api/v1/fonts
# → {"data":[{"family":"Inter",...}, ...]}
```

### Chạy toàn bộ test

```bash
pnpm test
```

Kết quả mong đợi:
```
✓ |server|  middleware/request-id.test.ts      (2 tests)   ✓
✓ |server|  middleware/error-handler.test.ts    (3 tests)   ✓
✓ |server|  middleware/rate-limiter.test.ts     (5 tests)   ✓
✓ |server|  middleware/validate.test.ts         (5 tests)   ✓
✓ |server|  routes/health.test.ts              (1 test)    ✓
✓ |server|  routes/fonts.test.ts               (3 tests)   ✓
✓ |server|  services/asset.service.test.ts     (9 tests)   ✓
✓ |server|  services/export.service.test.ts    (10 tests)  ✓
✓ |server|  services/upload.service.test.ts    (4 tests)   ✓
✓ |server|  services/cleanup.service.test.ts   (2 tests)   ✓
✓ |client|  __tests__/api-contracts.test.ts    (30+ tests) ✓

Test Files  11 passed (11)
     Tests  44 passed (44)  [server] + contract tests [client]
```

### Lint + TypeScript check

```bash
pnpm check
# → Lint: OK
# → TypeScript: No errors
```

### Build production

```bash
pnpm build
# → client/dist/  (Vite build)
# → server/dist/  (tsc build)
```

---

## 6. Cấu trúc thư mục quan trọng

```
dual-canvas-editor/
├── server/
│   ├── src/
│   │   ├── config.ts              # ⚙️ Mọi config tập trung ở đây
│   │   ├── index.ts               # 🚀 Express app entry
│   │   └── assets/fonts/          # 🔤 7 file WOFF2
│   ├── uploads/                   # 📁 Ảnh upload (tự tạo khi chạy)
│   ├── exports/                   # 📁 File export (tự tạo khi chạy)
│   └── temp/                      # 🗑️ File tạm (tự dọn sau 1h)
├── client/
│   └── src/
│       ├── api/                   # 🌐 API client (fetch wrapper)
│       └── __tests__/             # 🧪 Contract tests
└── .github/workflows/ci.yml       # 🔄 CI pipeline
```

Các thư mục `uploads/`, `exports/`, `temp/` được **tự động tạo** khi server khởi động lần đầu. Không cần tạo thủ công.

---

## 7. Troubleshooting

### ❌ `pnpm: command not found`

```bash
npm install -g pnpm
# hoặc
corepack enable && corepack prepare pnpm@latest --activate
```

### ❌ `Error: Cannot find module 'sharp'`

```bash
pnpm install --filter server
# Nếu vẫn lỗi trên macOS Apple Silicon:
npm rebuild sharp --platform=darwin --arch=arm64
```

### ❌ Port 4000 đã được sử dụng

```bash
# Tìm process đang dùng port 4000
lsof -i :4000           # macOS
netstat -ano | findstr :4000   # Windows
sudo fuser 4000/tcp     # Linux

# Giải phóng port
kill -9 <PID>

# Hoặc dùng port khác
PORT=4001 pnpm dev:server
```

Lưu ý: nếu đổi port server, cập nhật `VITE_API_BASE` hoặc `vite.config.ts` proxy target tương ứng.

### ❌ Port 5173 đã được sử dụng

```bash
# Vite tự động dùng port tiếp theo (5174, 5175...)
# Hoặc chỉ định port:
pnpm dev:client -- --port 3000
```

### ❌ `TypeScript error: Cannot find module './config.js'`

```bash
# Xóa cache TypeScript + build lại
pnpm clean
pnpm build
```

### ❌ Test fails — `Cannot find module 'vitest'`

```bash
pnpm install
# Đảm bảo vitest có trong devDependencies của cả client và server
```

### ❌ Font test fails — `Missing WOFF2 files`

```bash
# Font files bị thiếu trong server/src/assets/fonts/
ls server/src/assets/fonts/
# Phải có các file .woff2 (7 files)
# Nếu thiếu → chạy lại script tải font hoặc copy từ backup
```

### ❌ `ECONNREFUSED ::1:4000` khi client gọi API

Server chưa chạy. Chạy:
```bash
pnpm dev:server
```

### ❌ `CORS error` trong browser console

Đảm bảo `CORS_ORIGIN` trong `server/.env` khớp với URL client:
```bash
# Mặc định cho Vite dev:
CORS_ORIGIN=http://localhost:5173
```

---

## 8. Dev workflow

### Quy trình làm việc hàng ngày

```bash
# 1. Pull code mới nhất
git pull origin main

# 2. Cài dependencies (nếu có thay đổi)
pnpm install

# 3. Chạy dev
pnpm dev

# 4. Code...

# 5. Trước khi commit
pnpm check        # Lint + TypeScript
pnpm test         # Tests

# 6. Commit (Husky tự chạy lint-staged)
git commit -m "feat: mô tả thay đổi"
```

### Pre-commit hook

Husky + lint-staged tự động chạy khi commit:
- ESLint fix trên các file `.ts`, `.tsx`
- Prettier format trên `.ts`, `.tsx`, `.json`, `.css`, `.md`

Không cần chạy thủ công. Nếu có lỗi, commit sẽ bị từ chối.

---

## 9. CI/CD Pipeline

GitHub Actions workflow (`.github/workflows/ci.yml`) chạy khi push/PR lên `main`:

1. `pnpm lint` — ESLint check
2. `pnpm typecheck` — TypeScript check
3. `pnpm build` — Build client + server
4. `pnpm format:check` — Prettier check

> ⚠️ CI chưa có bước `pnpm test`. Sẽ được thêm ở Phase tiếp theo.

---

## 10. Links nhanh

| Tài liệu | Đường dẫn |
|----------|----------|
| Project overview | [docs/README.md](README.md) |
| Hướng dẫn sử dụng | [docs/USER_GUIDE.md](USER_GUIDE.md) |
| Kiến trúc hệ thống | [architecture/ARCHITECTURE.md](../architecture/ARCHITECTURE.md) |
| ADRs | [architecture/ADR.md](../architecture/ADR.md) |
| UI Spec | [design/UI_SPEC.md](../design/UI_SPEC.md) |
| Code review checklist | [CR-CHECKLIST.md](../CR-CHECKLIST.md) |
| Backend status | [T-051_STATUS.md](../T-051_STATUS.md) |
