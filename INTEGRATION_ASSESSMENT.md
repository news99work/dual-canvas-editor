# Integration Assessment — T-054: Wire Frontend ↔ Backend

**Date:** 2026-07-02  
**Author:** Integration Engineer (pa-integration-engineer)  
**Project:** Dual Canvas Editor MVP

---

## 1. Backend Readiness (server/)

After inspecting all 22 server source files, the backend is **substantially complete**:

| Layer      | Files                                                                              | Status                                                                                |
| ---------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Entrypoint | `server/src/index.ts`                                                              | ✅ Express 5 wired: helmet, CORS, rate-limit, request-id, body-limit, storage serving |
| Config     | `server/src/config.ts`                                                             | ✅ All paths, limits, MIME types, dimensions defined                                  |
| Routes     | `health.ts`, `upload.ts`, `assets.ts`, `export.ts`, `fonts.ts`                     | ✅ All 6 endpoints implemented                                                        |
| Services   | `upload.service.ts`, `asset.service.ts`, `export.service.ts`, `cleanup.service.ts` | ✅ Full logic: Sharp processing, cursor pagination, compositing, idempotency          |
| Middleware | `error-handler.ts`, `rate-limiter.ts`, `request-id.ts`, `validate.ts`              | ✅ AppError class, Zod validation, per-endpoint rate limits                           |
| Validation | 4 Zod schemas (upload, export-request, canvas-state, asset-query)                  | ✅ Runtime validation for all endpoints                                               |
| Types      | `asset.ts`, `canvas.ts`, `export.ts`                                               | ✅ TypeScript interfaces for all data shapes                                          |

**T-051 blocker (API Schema review):** 1 HIGH issue — MIME type policy conflict. Config.ts already uses the recommended subset (`image/png, image/jpeg, image/webp`). SVG is rejected at both multer (MIME filter) and content level (magic byte check in upload.service.ts).

**Conclusion:** Backend is ready for integration. Only pending is BE engineer's bug-fix sign-off (export URL, rate limiter wiring).

---

## 2. Frontend Readiness (client/)

| Area           | Files                            | Status                                                      |
| -------------- | -------------------------------- | ----------------------------------------------------------- |
| App scaffold   | `App.tsx`, `App.css`, `main.tsx` | ❌ Placeholder only — 2 empty canvas slots                  |
| Canvas library | —                                | ❌ Not chosen (waiting on T-044 ADR: Fabric.js vs Konva.js) |
| API client     | —                                | ❌ Does not exist                                           |
| Components     | —                                | ❌ None                                                     |
| Shared types   | —                                | ❌ Client has no type definitions                           |

**Conclusion:** Frontend is at scaffold stage. No components, no API calls, no canvas.

---

## 3. Integration Scope — Feasibility Breakdown

| Flow                                                             | Backend Ready | Frontend Ready |   Can Wire Now?    |
| ---------------------------------------------------------------- | :-----------: | :------------: | :----------------: |
| **Upload**: file picker → POST /api/v1/upload → canvas           |      ✅       |       ❌       | ⚠️ API client only |
| **Assets**: GET /api/v1/assets → grid → drag to canvas           |      ✅       |       ❌       | ⚠️ API client only |
| **Export**: canvas state → POST /api/v1/export → poll → download |      ✅       |       ❌       | ⚠️ API client only |
| **Fonts**: GET /api/v1/fonts → font selector                     |      ✅       |       ❌       | ⚠️ API client only |

⚠️ = Can write the API client layer + contract tests now. Full E2E wiring requires canvas components.

---

## 4. Phase Plan (Unblocked Work)

### Phase 1 — Frontend API Client Layer (NOW, 0 dependencies)

- `client/src/api/client.ts` — Base fetch wrapper
- `client/src/api/types.ts` — Shared TypeScript types
- `client/src/api/upload.ts` — Upload API
- `client/src/api/assets.ts` — Assets API
- `client/src/api/export.ts` — Export API
- `client/src/api/fonts.ts` — Fonts API

### Phase 2 — Contract Tests (parallel with Phase 1)

- `client/src/__tests__/api-contracts.test.ts` — Mock-based contract verification
- Validate request shapes, response shapes, error handling

### Phase 3 — Error Handling Patterns (parallel with Phase 1)

- Network retry logic
- Error display components
- Loading/empty state renderers

### Phase 4 — Full E2E Wiring (after T-044 canvas library + T-051 backend sign-off)

- Upload → canvas drop integration
- Asset library → drag to canvas
- Export → collect canvas state → trigger → poll → download
- Font selector population
- Live server E2E verification

---

## 5. Decisions Made

1. **API client will be raw `fetch`** — No axios dependency. Consistent with current zero-dependency pattern.
2. **Shared types will mirror server types** — Manual alignment until a shared package is extracted post-MVP.
3. **Contract tests use Vitest** — Already available via Vite toolchain (no additional dep).
4. **Error handling follows api-schema error envelope** — `{ error: { code, message, details? } }`.
