# Deploy Runbook — Dual Canvas Editor MVP

> **Trạng thái:** ✅ Ready (chờ Integration E2E verify hoàn tất)
> **Ngày:** 2026-07-03
> **Vai trò:** DevOps/SRE Engineer (pa-devops-sre)

---

## 1. Tổng quan deploy topology

```
                        ┌─────────────────────┐
                        │    Client (Vite)     │
                        │  React 19 + Fabric   │
                        │  Vercel / Static     │
                        └──────────┬──────────┘
                                   │ /api/*
                                   ▼
                        ┌─────────────────────┐
                        │   Server (Express 5) │
                        │  Sharp + Rate Limit  │
                        │  Railway / Render    │
                        └─────────────────────┘
```

### Deploy targets

| Thành phần | Target khuyến nghị | Lý do |
|-----------|-------------------|-------|
| **Frontend** (client/) | **Vercel** | Zero config cho Vite, global CDN, edge cache |
| **Backend** (server/) | **Railway** | Native dep support (Sharp), auto HTTPS, staging env |
| Alt: Single-server | **Render** | Cả server + static trong một service |

> **Khuyến nghị MVP:** Backend trên Railway, Frontend trên Vercel (phân tách, dễ rollback riêng).

---

## 2. Pre-deploy checklist

### 2.1 Build verification

```bash
# Từ repo root
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm build

# Verify build output
ls -la server/dist/                    # routes/, services/, middleware/, schemas/, types/
ls -la client/dist/                    # index.html, assets/
ls server/src/assets/fonts/            # 7 file WOFF2
```

### 2.2 Smoke test

```bash
# Khởi động server
node server/dist/index.js &

# Đợi server ready
sleep 2

# Health check
curl http://localhost:4000/api/v1/health
# Expected: {"ok":true,"service":"dual-canvas-editor","version":"0.1.0"}

# Fonts
curl http://localhost:4000/api/v1/fonts | head -c 200

# Upload test
curl -X POST http://localhost:4000/api/v1/upload \
  -F "file=@server/src/assets/fonts/inter-regular.woff2" \
  -F "category=test"

# Assets list
curl http://localhost:4000/api/v1/assets

# Kill test server
kill %1
```

### 2.3 Environment variables check

| Variable | Mặc định | Bắt buộc | Ghi chú |
|----------|---------|---------|---------|
| `PORT` | `4000` | ❌ | Railway tự set (dùng `process.env.PORT`) |
| `CORS_ORIGIN` | `http://localhost:5173` | ✅ PROD | URL frontend production |
| `TRUST_PROXY` | `false` | ✅ PROD | `true` khi deploy sau reverse proxy |
| `VITE_API_BASE` | `http://localhost:4000` | ✅ PROD | URL backend production (cho client build) |

---

## 3. Deploy — Backend (Railway)

### 3.1 Railway setup

```bash
# 1. Push code lên GitHub
git add -A
git commit -m "chore: deploy prep"
git push origin main

# 2. Railway: New Project → Deploy from GitHub repo
#     Repo: news99work/dual-canvas-editor
#     Branch: main
```

### 3.2 Railway configuration

**Build command:**
```bash
cd server && pnpm install && pnpm build
```

**Start command:**
```bash
cd server && node dist/index.js
```

**Root directory (nếu Railway hỗ trợ Nixpacks):** để `server/`

**Environment variables (Railway):**
```
PORT=4000
CORS_ORIGIN=https://your-frontend-domain.vercel.app
TRUST_PROXY=true
```

### 3.3 Railway health check

Railway health check path: `/api/v1/health`

### 3.4 Verify backend

```bash
curl https://<railway-app>.up.railway.app/api/v1/health
# → 200 OK
```

---

## 4. Deploy — Frontend (Vercel)

### 4.1 Vercel setup

```bash
# 1. Vercel dashboard → Add New Project
#     Import GitHub repo
```

### 4.2 Vercel configuration

| Setting | Value |
|---------|-------|
| **Framework preset** | Vite |
| **Root directory** | `client/` |
| **Build command** | `pnpm install && pnpm build` |
| **Output directory** | `client/dist` (hoặc `dist` nếu root là client/) |
| **Node version** | 20.x |

**Environment variables (Vercel):**
```
NEXT_PUBLIC_APP_NAME=Dual Canvas Editor
```

> **Lưu ý:** VITE_API_BASE không cần nếu dùng Vite proxy. Nếu deploy riêng biệt, set:
> ```
> VITE_API_BASE=https://<railway-app>.up.railway.app
> ```
> và build lại (hoặc dùng runtime env injection).

### 4.3 Vercel rewrites (SPA fallback)

```json
// vercel.json (trong client/)
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### 4.4 Verify frontend

```bash
curl -I https://<vercel-app>.vercel.app/
# → 200 OK, Content-Type: text/html
```

---

## 5. Deploy — Single-server option (Render)

### 5.1 Render Web Service

```bash
# Render dashboard → New Web Service
#     Connect GitHub repo
```

### 5.2 Render configuration

| Setting | Value |
|---------|-------|
| **Name** | dual-canvas-editor |
| **Runtime** | Node |
| **Build command** | `pnpm install && pnpm build` |
| **Start command** | `node server/dist/index.js` |
| **Health check path** | `/api/v1/health` |

**Environment variables:**
```
PORT=10000
CORS_ORIGIN=https://<render-app>.onrender.com
TRUST_PROXY=true
NODE_ENV=production
```

### 5.3 Static serving (từ Express)

Thêm vào `server/src/index.ts` trước khi start:

```typescript
// Serve frontend static files trong production
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  // SPA fallback
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}
```

---

## 6. Post-deploy verification

### 6.1 Health check

```bash
# Backend health
curl https://<domain>/api/v1/health
# → {"ok":true,"service":"dual-canvas-editor","version":"0.1.0","timestamp":"..."}
```

### 6.2 E2E flow

```bash
# 1. Upload
UPLOAD_RESP=$(curl -s -X POST https://<domain>/api/v1/upload \
  -F "file=@test-image.png" \
  -F "category=upload")
echo "$UPLOAD_RESP" | jq .
ASSET_ID=$(echo "$UPLOAD_RESP" | jq -r '.data.id')

# 2. Assets list
curl -s https://<domain>/api/v1/assets | jq .

# 3. Fonts
curl -s https://<domain>/api/v1/fonts | jq .

# 4. Export
EXPORT_RESP=$(curl -s -X POST https://<domain>/api/v1/export \
  -H "Content-Type: application/json" \
  -d '{
    "side": "nam",
    "layers": [{"type":"image","src":"","x":0,"y":0,"width":400,"height":600}]
  }')
echo "$EXPORT_RESP" | jq .

# 5. Frontend
curl -I https://<frontend-domain>/
# → 200 OK
```

### 6.3 Rate limiting check

```bash
# Gọi nhanh >120 lần /api/health để test rate limiter
for i in $(seq 1 130); do
  curl -s -o /dev/null -w "%{http_code}\n" https://<domain>/api/v1/health
done | sort | uniq -c
# Expected: 120× 200, 10× 429
```

---

## 7. Rollback plan

### 7.1 Rollback triggers

| Tình huống | Action |
|-----------|--------|
| Server 5xx > 1% trong 5 phút | Rollback backend |
| Client blank page / 404 | Rollback frontend |
| Upload/Export failures | Rollback backend |
| CORS errors | Kiểm tra env vars trước, rollback nếu cần |
| Memory leak / OOM | Rollback + PM2 memory cap |

### 7.2 Rollback procedure

```bash
# ── Backend (Railway) ──
# Option A: Deploy previous commit
railway up --detach
# or: Railway dashboard → Deploy → Rollback to previous deployment

# ── Backend (Render) ──
# Dashboard → Deploys → Select last known good → Manual Rollback

# ── Frontend (Vercel) ──
# Vercel dashboard → Deployments → ... → Promote to Production
```

### 7.3 Rollback verification

```bash
# Verify sau rollback
curl -f https://<domain>/api/v1/health && echo "Backend OK"
curl -f -I https://<frontend-domain>/ && echo "Frontend OK"
```

### 7.4 Recovery time targets

| Tình huống | Target | Method |
|-----------|--------|--------|
| Server crash | < 5s | Railway auto-restart |
| Bad deploy (config) | < 2min | Rollback deployment |
| Bad deploy (code) | < 10min | Revert commit + rebuild |
| Full platform outage | < 30min | Switch to alt platform |

---

## 8. Monitoring & alerting (MVP)

### 8.1 Built-in

| Cơ chế | Chi tiết |
|--------|---------|
| Health endpoint | `GET /api/v1/health` — public, no auth |
| Rate limiting | 120 req/min general, 10/min upload, 5/min export |
| Cleanup cron | 15-min interval, purges temp/exports > 1h |
| Request IDs | `X-Request-Id` header trên mọi response |
| Error handler | Centralized, no stack traces in production |

### 8.2 External (khuyến nghị)

| Dịch vụ | Usage | Free tier |
|---------|-------|-----------|
| **Better Stack** | Uptime monitoring (every 30s → `/api/v1/health`) | 3 URLs free |
| **Sentry** | Error tracking | 5k events/month free |

---

## 9. CI/CD pipeline

### 9.1 Current CI (GitHub Actions)

File: `.github/workflows/ci.yml`

| Step | Command | Ghi chú |
|------|---------|---------|
| 1 | `pnpm install --frozen-lockfile` | Cài deps |
| 2 | `pnpm lint` | ESLint |
| 3 | `pnpm typecheck` | TypeScript |
| 4 | `pnpm build` | Build client + server |
| 5 | `pnpm format:check` | Prettier |

### 9.2 CI improvement suggestions

| Improvement | Priority | Effort |
|------------|---------|--------|
| Add `pnpm test` step | 🟡 SHOULD | ~5 min |
| Auto-deploy to Railway on `main` push | 🟡 SHOULD | ~15 min |
| Auto-deploy to Vercel preview on PR | 🟢 NICE | ~10 min |
| Parallelize build (client/server separate jobs) | 🟢 NICE | ~15 min |

---

## 10. Quick reference

### Deploy checklist (tối thiểu trước GO LIVE)

```markdown
- [ ] pnpm install --frozen-lockfile → PASS
- [ ] pnpm lint → no errors
- [ ] pnpm typecheck → no errors
- [ ] pnpm build → client dist/ + server dist/
- [ ] Smoke test (health, fonts, upload, assets) → PASS
- [ ] CORS_ORIGIN set đúng production URL
- [ ] TRUST_PROXY=true (nếu sau reverse proxy)
- [ ] Server health endpoint public
- [ ] Client SPA fallback configured
- [ ] Rollback plan ready
```

### Useful commands

```bash
# Local full check
pnpm install --frozen-lockfile && pnpm lint && pnpm typecheck && pnpm build

# Production build + start (single server)
NODE_ENV=production CORS_ORIGIN=https://example.com PORT=4000 node server/dist/index.js

# View logs (Railway)
railway logs

# View logs (Render)
# Dashboard → Service → Logs
```
