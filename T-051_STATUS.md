# T-051 Dual Canvas Editor Backend — Status Snapshot

**Date:** 2026-07-02  
**Current:** 75% (4 items remaining)

## Items Status

| #   | Item                                      | Status  | Notes                                                                                                         |
| --- | ----------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------- |
| 1   | Fix static serving URL bug                | ❌ OPEN | `upload.service.ts` uses `/api/v1/storage/uploads/` but mount is at `/api/v1/storage` — 404 on all asset URLs |
| 2   | Unit tests (8 endpoints + Sharp pipeline) | ❌ OPEN | No test files exist                                                                                           |
| 3   | Font asset files (WOFF2) verification     | ❌ OPEN | `fonts.json` references 7 WOFF2 files, but none exist on disk                                                 |
| 4   | Build compilation + smoke test            | ❌ OPEN | `dist/` only has partial output (config.js + index.js — missing all routes, services, middleware)             |

## Backend Source Map

| File                                     | Lines   | Purpose                                                              |
| ---------------------------------------- | ------- | -------------------------------------------------------------------- |
| `server/src/index.ts`                    | ~60     | Express 5 entry: middleware chain, static mounts, route registration |
| `server/src/config.ts`                   | ~40     | All paths, limits, MIME, dimensions                                  |
| `server/src/routes/health.ts`            | ~15     | GET /api/health                                                      |
| `server/src/routes/upload.ts`            | ~50     | POST /api/v1/upload (multipart)                                      |
| `server/src/routes/assets.ts`            | ~30     | GET /api/v1/assets (cursor pagination)                               |
| `server/src/routes/export.ts`            | ~50     | POST /api/v1/export + GET /api/v1/export/:id                         |
| `server/src/routes/fonts.ts`             | ~25     | GET /api/v1/fonts                                                    |
| `server/src/services/upload.service.ts`  | ~100    | Sharp validation, EXIF strip, thumbnail, magic byte check            |
| `server/src/services/asset.service.ts`   | ~75     | In-memory + JSON persistence, cursor pagination, filters             |
| `server/src/services/export.service.ts`  | ~220    | Sharp compositing pipeline, idempotency, async processing            |
| `server/src/services/cleanup.service.ts` | ~75     | Temp file + expired job purge cron                                   |
| `server/src/middleware/error-handler.ts` | ~55     | AppError class + catch-all handler                                   |
| `server/src/middleware/rate-limiter.ts`  | ~45     | 4 rate limiters (general, upload, export, poll)                      |
| `server/src/middleware/validate.ts`      | ~50     | Zod validation middleware factory                                    |
| `server/src/middleware/request-id.ts`    | ~15     | X-Request-Id injection                                               |
| `server/src/schemas/*.ts`                | 4 files | Upload, asset-query, export-request, canvas-state Zod schemas        |
| `server/src/types/*.ts`                  | 3 files | Asset, Canvas, Export TypeScript interfaces                          |
