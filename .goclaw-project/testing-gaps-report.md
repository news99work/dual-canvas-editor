# Testing Gaps Report — Dual Canvas Editor

**Version:** 1.0 | **Date:** 2026-07-02 UTC  
**Author:** pa-code-reviewer (reassigned T-019v2)  
**Inputs:** code-review.md findings, CR-CHECKLIST.md, codebase snapshot (T-051 server + T-064 Fabric.js)

---

## 1. Current Test Coverage Snapshot

### 1.1 Tests That Exist (✅)

| # | Test File | Type | Covered Source |
|---|----------|------|----------------|
| 1 | `server/.../middleware/request-id.test.ts` | Unit | `request-id.ts` |
| 2 | `server/.../middleware/error-handler.test.ts` | Unit | `error-handler.ts` |
| 3 | `server/.../middleware/rate-limiter.test.ts` | Unit | `rate-limiter.ts` |
| 4 | `server/.../middleware/validate.test.ts` | Unit | `validate.ts` |
| 5 | `server/.../routes/health.test.ts` | Integration | `health.ts` |
| 6 | `server/.../routes/fonts.test.ts` | Integration | `fonts.ts` |
| 7 | `server/.../services/asset.service.test.ts` | Unit | `asset.service.ts` |
| 8 | `server/.../services/cleanup.service.test.ts` | Unit | `cleanup.service.ts` |
| 9 | `server/.../services/export.service.test.ts` | Unit | `export.service.ts` |
| 10 | `server/.../services/upload.service.test.ts` | Unit | `upload.service.ts` |
| 11 | `client/.../__tests__/api-contracts.test.ts` | Contract | `client/src/api/*` |

**Total:** 11 test files. Server middleware/services well-covered. API contract layer well-covered.

### 1.2 Source Files Without Tests (❌)

| # | Untested File | Why Missing | Priority |
|---|--------------|-------------|----------|
| A | `server/src/routes/assets.ts` | No route integration test | 🔴 HIGH |
| B | `server/src/routes/export.ts` | No route integration test | 🔴 HIGH |
| C | `server/src/routes/upload.ts` | No route integration test | 🔴 HIGH |
| D | `server/src/schemas/upload.schema.ts` | No Zod validation test | 🟡 MEDIUM |
| E | `server/src/schemas/export-request.schema.ts` | No Zod validation test | 🟡 MEDIUM |
| F | `server/src/schemas/canvas-state.schema.ts` | No Zod validation test (complex!) | 🔴 HIGH |
| G | `server/src/schemas/asset-query.schema.ts` | No Zod validation test | 🟡 MEDIUM |
| H | `server/src/config.ts` | No config validation test | 🟢 LOW |
| I | `client/src/api/errors.tsx` | No component test (5 components!) | 🔴 HIGH |
| J | `client/src/App.tsx` | No component test (3 states: loading/error/connected) | 🟡 MEDIUM |
| K | `client/src/main.tsx` | No smoke test | 🟢 LOW |

---

## 2. CR Finding → Test Gap Mapping

Each CR finding from `code-review.md` is mapped to the test gap(s) that would catch regression on it.

| CR Finding | Severity | CR Check # | Test Gap ID | Test Type | Status After Fix |
|-----------|----------|-----------|-------------|-----------|-----------------|
| C-01 (CORS wide open) | CRITICAL | 3.1 | TG-01 | Integration (supertest) | ✅ Fixed in code |
| C-02 (No error middleware) | CRITICAL | — | TG-02 | Unit (middleware) | ✅ Fixed, has test |
| C-03 (No rate limiting) | CRITICAL | 3.2 | TG-03 | Integration (rate limiter) | ✅ Fixed, has test |
| H-01 (Unused deps) | HIGH | 7.1 | TG-04 | Audit | ⚠️ Deps now used |
| H-02 (No error boundary) | HIGH | 2.8 | TG-05 | Component (React) | ❌ No error boundary |
| H-03 (No body size limit) | HIGH | — | TG-06 | Integration (large payload) | ✅ Fixed in code |
| H-04 (No trust proxy) | HIGH | 3.10 | TG-07 | Config test | ✅ Fixed in code |
| H-05 (No security headers) | HIGH | 3.3, 3.4 | TG-08 | Integration (headers) | ✅ Fixed (helmet) |
| M-01 (.tsbuildinfo committed) | MEDIUM | 7.9 | TG-09 | Git hygiene check | Unknown |
| M-02 (tsc -b + noEmit) | MEDIUM | 1.10 | TG-10 | Build verification | Unknown |
| M-03 (No CI test step) | MEDIUM | 6.8 | TG-11 | CI config | ❌ No CI test step |
| M-04 (PORT=0 edge case) | MEDIUM | — | TG-12 | Config unit test | ❌ Not fixed |
| M-05 (Canvas unlabeled) | MEDIUM | 5.1 | TG-13 | Accessibility (jest-axe) | ❌ Not fixed |
| M-06 (No request logging) | MEDIUM | 7.7 | TG-14 | Integration (request ID test) | ✅ Fixed, has test |
| L-01 (lang="en") | LOW | 5.8 | TG-15 | HTML validation | Unknown |
| L-02 (Vite open:true) | LOW | — | TG-16 | Config check | Unknown |

---

## 3. Priority Matrix

### Classification Logic

| Priority | Criteria | Action |
|----------|---------|--------|
| 🔴 Critical | Security regression, data loss, crash in prod | Must have test before merge |
| 🟠 High | Route/schema not tested, core business logic uncovered | Add test before feature complete |
| 🟡 Medium | Maintainability, component UI, edge cases | Add test in next sprint |
| 🟢 Low | DX polish, config hygiene | Nice to have |

### Matrix

| Priority | Count | Gap IDs |
|----------|-------|---------|
| 🔴 Critical | 0 | All CRITICAL findings from code-review are now FIXED in code + have tests |
| 🟠 High | 5 | A (routes/assets), B (routes/export), C (routes/upload), F (canvas-state.schema), I (errors.tsx) |
| 🟡 Medium | 6 | D (upload.schema), E (export-request.schema), G (asset-query.schema), J (App.tsx), TG-05 (error boundary), TG-13 (a11y) |
| 🟢 Low | 6 | H (config.ts), K (main.tsx), TG-11 (CI test step), TG-12 (PORT=0), TG-15 (lang), TG-16 (vite open) |

---

## 4. Top 8 Test Case Specs

### GAP-A — `routes/assets.ts` Integration Test (🟠 HIGH)

**File to create:** `server/src/routes/assets.test.ts`  
**Why missing:** Only the service layer is tested (`asset.service.test.ts`), but the HTTP route (query parsing → service call → response) is untested.  
**Source code:** `routes/assets.ts` uses `validate({ query: assetQuerySchema })` then calls `listAssets()`.

#### Test Cases

| # | Scenario | Input | Expected |
|---|----------|-------|----------|
| A1 | GET without params returns asset list | `GET /api/v1/assets` | `200`, body shape `{ data: Asset[], cursor: string|null, hasMore: boolean }` |
| A2 | Filter by category | `GET /api/v1/assets?category=clipart` | `200`, all items have `category === 'clipart'` |
| A3 | Filter by tags (comma-separated) | `GET /api/v1/assets?tags=summer,beach` | `200`, items match any tag |
| A4 | Search by filename | `GET /api/v1/assets?search=sunset` | `200`, only matching items |
| A5 | Pagination with cursor | Seed 5 assets, `GET /api/v1/assets?limit=2` → get cursor → `GET /api/v1/assets?limit=2&cursor=<cursor>` | Page 1 has 2 items + cursor; Page 2 has 2 items; Page 3 has 1 item + `hasMore: false` |
| A6 | Invalid category (Zod rejection) | `GET /api/v1/assets?category=___invalid___` | `400`, error body `{ error: { code: 'VALIDATION_ERROR' } }` |
| A7 | Limit exceeds max (Zod rejection) | `GET /api/v1/assets?limit=999` | `400` or clamped to max |
| A8 | Empty result | `GET /api/v1/assets?search=nonexistent` | `200`, `data: []`, `hasMore: false`, `cursor: null` |

#### Edge Cases
- Cursor from deleted asset → graceful fallback
- Tags with special characters → URL-encoded, server decodes correctly
- `limit=0` → Zod error or defaults to 1

**Estimated effort:** 2-3 hours

---

### GAP-B — `routes/export.ts` Integration Test (🟠 HIGH)

**File to create:** `server/src/routes/export.test.ts`  
**Why missing:** Export route is the critical user path (canvas → server → file). Only the service layer is tested.  
**Source code:** `routes/export.ts` has `POST /api/v1/export` (trigger) and `GET /api/v1/export/:id` (poll).

#### Test Cases

| # | Scenario | Input | Expected |
|---|----------|-------|----------|
| B1 | Trigger export with valid canvas state | `POST /api/v1/export` with `{ canvasState: valid, format: 'png', quality: 'draft' }` | `202`, body `{ data: { id, hash, status: 'pending', ... } }` |
| B2 | Idempotent request (same canvas state) | Same POST twice | First → `202` + `isNew: true`; Second → `200` + same job id |
| B3 | Different formats create different jobs | POST with `format: 'png'`, then `format: 'pdf'` | Different job IDs |
| B4 | Poll existing job | `GET /api/v1/export/<id>` | `200`, body `{ data: { id, status, progress, ... } }` |
| B5 | Poll nonexistent job | `GET /api/v1/export/nonexistent` | `404`, `{ error: { code: 'NOT_FOUND' } }` |
| B6 | Invalid format (Zod rejection) | `POST /api/v1/export` with `format: 'bmp'` | `400`, validation error |
| B7 | Missing required fields | `POST /api/v1/export` with `{}` | `400`, validation error |
| B8 | Rate limit exceeds export limit | Send 21+ POST within 1 minute | `429` on the 21st request |

#### Edge Cases
- Canvas state with max layers (50) → should accept
- Canvas state with layer count exceed max → should reject
- Concurrent export requests with different canvases → each gets unique job

**Estimated effort:** 2-3 hours

---

### GAP-C — `routes/upload.ts` Integration Test (🟠 HIGH)

**File to create:** `server/src/routes/upload.test.ts`  
**Why missing:** Upload is the primary data ingestion path. Only the service layer (`upload.service.ts`) is tested.  
**Source code:** `routes/upload.ts` handles multipart file → metadata parsing → processUpload → createAsset.

#### Test Cases

| # | Scenario | Input | Expected |
|---|----------|-------|----------|
| C1 | Upload valid PNG with metadata | Multipart: file=png + category=clipart + tags=summer,t-shirt | `201`, body `{ data: Asset }` with UUID filename, thumbnail URL |
| C2 | Upload without file | POST without `file` field | `400`, `{ error: { code: 'VALIDATION_ERROR' } }` |
| C3 | Upload invalid MIME type | Multipart: file with `Content-Type: text/plain` | `400` or multer rejection |
| C4 | Upload SVG disguised as PNG | Multipart: SVG file with `Content-Type: image/png` | `400`, `{ error: { code: 'SVG_REJECTED' } }` |
| C5 | Upload corrupted image | Multipart: random bytes with `Content-Type: image/png` | `400`, `{ error: { code: 'INVALID_IMAGE' } }` |
| C6 | Upload exceeds size limit | Multipart: >10MB file | `413` or multer error |
| C7 | Default category when not specified | Upload without category field | Asset has `category: 'upload'` |
| C8 | Rate limit exceeds upload limit | Rapid successive uploads | `429` after threshold |
| C9 | Thumbnail generated | Upload valid image | Response includes `thumbnailUrl` pointing to 200px thumb |

#### Edge Cases
- Unicode filename (`ảo-áo-dài.png`) → handled correctly
- Very large image dimension (>5000px) → should still process or reject with clear error
- Zero-byte file → reject

**Estimated effort:** 3-4 hours

---

### GAP-F — `canvas-state.schema.ts` Zod Validation Test (🟠 HIGH)

**File to create:** `server/src/schemas/canvas-state.schema.test.ts`  
**Why missing:** This is the most complex schema in the app — validates entire dual-canvas design state. Rejection bugs here = silent data loss or crashes downstream.  
**Source code:** `canvas-state.schema.ts` — discriminated union layers, max layer count, coordinate validation.

#### Test Cases

| # | Scenario | Input | Expected |
|---|----------|-------|----------|
| F1 | Valid minimal canvas state | `{ version: 2, canvases: { nam: { layers: [], width: 800, height: 1200 }, nu: { layers: [], width: 800, height: 1200 } } }` | `success: true` |
| F2 | Valid state with text layer | Add one text layer to `nam.layers` | `success: true` |
| F3 | Valid state with image layer | Add one image layer to `nu.layers` | `success: true` |
| F4 | Missing `version` field | `{ canvases: { ... } }` | `success: false`, error on `version` |
| F5 | Wrong version number | `{ version: 1, ... }` | `success: false` (only `2` accepted) |
| F6 | Missing `nu` canvas | `{ version: 2, canvases: { nam: {...} } }` | `success: false` |
| F7 | Layer count exceeds max (50) | `nam.layers` with 51 layers | `success: false` |
| F8 | Text layer with negative font size | `fontSize: -10` | `success: false` |
| F9 | Image layer with missing `url` | `{ type: 'image', id: '1', ... }` without `url` | `success: false` |
| F10 | Layer with unknown `type` | `{ type: 'shape', ... }` | `success: false` |
| F11 | Canvas width exceeds max (5000) | `width: 6000` | `success: false` |
| F12 | Text content length exceeds max (10000) | `content` string of 10001 chars | `success: false` |
| F13 | Opacity out of range | `opacity: 1.5` | `success: false` |
| F14 | Rotation in valid range | `rotation: 360` | `success: true` |
| F15 | Font weight must be 100–900 | `fontWeight: 50` | `success: false` |

#### Edge Cases
- Empty `layers` array with valid canvas dimensions → should pass
- `zIndex` as float instead of int → should reject
- Very large coordinate values (>10000) → should accept (no max on x/y)

**Estimated effort:** 3-4 hours

---

### GAP-I — `client/src/api/errors.tsx` Component Tests (🟠 HIGH)

**File to create:** `client/src/api/errors.test.tsx` (or `client/src/__tests__/errors.test.tsx`)  
**Why missing:** Five reusable UI components with zero tests. These handle all error/loading/empty states across the app.  
**Components to test:** `ErrorDisplay`, `LoadingSpinner`, `EmptyState`, `UploadProgress`, `ExportProgress`  
**Prerequisite:** `@testing-library/react` + `jsdom` must be installed (currently missing — `client/vitest.config.ts` has `environment: 'node'`).

#### Test Cases — ErrorDisplay

| # | Scenario | Input | Expected |
|---|----------|-------|----------|
| I1 | Renders ApiError with code and message | `{ error: new ApiError(400, 'VALIDATION_ERROR', 'Bad input'), title: 'Upload Failed' }` | Shows title "Upload Failed", message "Bad input", code "VALIDATION_ERROR" |
| I2 | Renders details list | ApiError with `details: ['field1: required', 'field2: too long']` | Renders `<ul>` with two `<li>` items |
| I3 | Renders retry button when onRetry provided | `{ error: ..., onRetry: vi.fn() }` | Retry button visible; click calls `onRetry` |
| I4 | Returns null when error is null | `{ error: null }` | Renders nothing (`null`) |
| I5 | Renders generic Error (not ApiError) | `{ error: new Error('Network failure') }` | Shows message "Network failure", no details list |
| I6 | Has `role="alert"` | Render with error | Element has `role="alert"` |

#### Test Cases — LoadingSpinner

| # | Scenario | Input | Expected |
|---|----------|-------|----------|
| I7 | Renders with label | `{ label: 'Uploading...' }` | Shows label text |
| I8 | Renders without label | `{}` | Shows spinner circle, no label paragraph |
| I9 | Size variants | `size: 'small'`, `size: 'large'` | Correct CSS class applied |
| I10 | Has `role="status"` | Render | Element has `role="status"` |

#### Test Cases — EmptyState

| # | Scenario | Input | Expected |
|---|----------|-------|----------|
| I11 | Renders with title and description | `{ title: 'No assets', description: 'Upload your first image' }` | Shows both |
| I12 | Renders action button | `{ title: 'Empty', action: { label: 'Add', onClick: vi.fn() } }` | Button visible; click calls handler |
| I13 | Custom icon | `{ icon: '🎨', title: 'No designs' }` | Shows custom icon |

#### Test Cases — UploadProgress

| # | Scenario | Input | Expected |
|---|----------|-------|----------|
| I14 | Shows percent when uploading | `{ percent: 45, fileName: 'test.png', status: 'uploading' }` | Shows "45%", progress bar width 45% |
| I15 | Shows "Processing..." status | `{ percent: 100, fileName: 'test.png', status: 'processing' }` | Shows "Processing...", no progress bar |
| I16 | Shows done state | `{ percent: 100, fileName: 'test.png', status: 'done' }` | Shows "✅ Complete" |
| I17 | Shows error state | `{ status: 'error', errorMessage: 'File too large' }` | Shows "❌ Failed", error message |
| I18 | Cancel button calls handler | `{ status: 'uploading', onCancel: vi.fn() }` | Click cancel → handler called |

#### Test Cases — ExportProgress

| # | Scenario | Input | Expected |
|---|----------|-------|----------|
| I19 | Shows idle when job is null | `{ job: null }` | Shows "No active export" |
| I20 | Shows progress bar when pending/processing | `{ job: { status: 'processing', progress: 60 } }` | Shows "Exporting...", progress bar 60% |
| I21 | Shows done state | `{ job: { status: 'done', progress: 100 } }` | Shows "✅ Export complete" |
| I22 | Shows error with message | `{ job: { status: 'failed', error: 'Timeout' } }` | Shows "❌ Export failed", error text |

#### Edge Cases
- `percent > 100` → progress bar should clamp to `min(percent, 100%)`
- `percent < 0` → should clamp to 0%
- Rapid status transitions → no console warnings

**Estimated effort:** 3-4 hours

---

### GAP-J — `App.tsx` Component Test (🟡 MEDIUM)

**File to create:** `client/src/App.test.tsx`  
**Why missing:** The root component has 3 states (connecting → connected → error) with conditional rendering.  
**Prerequisite:** `@testing-library/react` + `jsdom` + mock `apiRequest` / `listFonts`.

#### Test Cases

| # | Scenario | Input | Expected |
|---|----------|-------|----------|
| J1 | Shows loading spinner on mount | Render `<App />` | LoadingSpinner visible |
| J2 | Shows connected state after API success | Mock apiRequest returns health + fonts | "API Connected" text + toolbar visible |
| J3 | Shows error state on API failure | Mock apiRequest rejects | ErrorDisplay visible with "Backend Connection Failed" |
| J4 | Shows font count in toolbar | Mock listFonts returns 3 fonts | "Fonts available: 3" visible |
| J5 | Retry button reloads on error | Click retry in error state | `window.location.reload` called |

**Estimated effort:** 1-2 hours

---

### TG-05 — Error Boundary Test (🟡 MEDIUM)

**File to create:** `client/src/components/ErrorBoundary.test.tsx`  
**Why missing:** CR finding H-02 flagged missing error boundary. An error boundary must exist before Fabric.js canvas code lands.  
**Prerequisite:** Create `ErrorBoundary` component first, then test it.

#### Test Cases

| # | Scenario | Input | Expected |
|---|----------|-------|----------|
| E1 | Renders children normally | `<ErrorBoundary><p>Hello</p></ErrorBoundary>` | "Hello" visible |
| E2 | Catches render error and shows fallback | Child that throws on render | Fallback UI visible, not white screen |
| E3 | Fallback receives error info | Same as above | Fallback renders error details |
| E4 | Does not catch errors in event handlers | Child with onClick that throws | Error propagates normally (not caught) |

**Estimated effort:** 1 hour (component + test)

---

### TG-13 — Accessibility Test (🟡 MEDIUM)

**File to create:** `client/src/__tests__/a11y.test.tsx`  
**Why missing:** CR finding M-05 flagged canvas slots unlabeled. Accessibility testing is completely absent.  
**Prerequisite:** `jest-axe` + `@testing-library/react` + `jsdom`.

#### Test Cases

| # | Scenario | Input | Expected |
|---|----------|-------|----------|
| A11 | App renders without a11y violations | Render `<App />` (mock API) | `jest-axe` returns 0 violations |
| A12 | ErrorDisplay has accessible role | Render `<ErrorDisplay error={...} />` | No violations, `role="alert"` |
| A13 | LoadingSpinner announces status | Render with label | `role="status"`, label text present |
| A14 | Canvas slots have accessible labels | Render canvas placeholders | Each canvas-slot has `aria-label` or `role` |
| A15 | Buttons are keyboard accessible | Tab through all interactive elements | All receive focus |

**Estimated effort:** 2-3 hours

---

## 5. Summary Table

| Gap ID | File to Create | Priority | CR Mapping | Est. Effort |
|--------|---------------|----------|-----------|-------------|
| A | `server/.../routes/assets.test.ts` | 🟠 HIGH | 6.3 (route tests) | 2-3h |
| B | `server/.../routes/export.test.ts` | 🟠 HIGH | 6.3 (route tests) | 2-3h |
| C | `server/.../routes/upload.test.ts` | 🟠 HIGH | 6.3, 3.6, 3.7 (upload validation) | 3-4h |
| F | `server/.../schemas/canvas-state.schema.test.ts` | 🟠 HIGH | 6.1 (schema tests) | 3-4h |
| I | `client/.../errors.test.tsx` | 🟠 HIGH | 6.2 (component tests) | 3-4h |
| J | `client/.../App.test.tsx` | 🟡 MEDIUM | 6.2 (component tests) | 1-2h |
| TG-05 | `client/.../ErrorBoundary.test.tsx` | 🟡 MEDIUM | 2.8 (error boundary) | 1h |
| TG-13 | `client/.../a11y.test.tsx` | 🟡 MEDIUM | 5.1 (accessibility) | 2-3h |
| D | `server/.../schemas/upload.schema.test.ts` | 🟡 MEDIUM | 6.1 | 1h |
| E | `server/.../schemas/export-request.schema.test.ts` | 🟡 MEDIUM | 6.1 | 1h |
| G | `server/.../schemas/asset-query.schema.test.ts` | 🟡 MEDIUM | 6.1 | 1h |
| H | `server/.../config.test.ts` | 🟢 LOW | 7.2, M-04 | 0.5h |

**Total effort:** 20-26 hours (all gaps)  
**High-priority effort:** 14-18 hours (gaps A, B, C, F, I only)

---

## 6. Prerequisites (Blockers)

| Blocker | Impact | Owner |
|---------|--------|-------|
| `@testing-library/react` not installed in client | Blocks all component tests (gaps I, J, TG-05, TG-13) | pa-frontend-engineer |
| `jsdom` not installed in client | Blocks component render tests | pa-frontend-engineer |
| Client vitest env is `node`, not `jsdom` | Blocks DOM rendering | pa-frontend-engineer |
| `jest-axe` not installed | Blocks a11y tests (TG-13) | pa-frontend-engineer |
| No `ErrorBoundary` component exists | Blocks TG-05 | pa-frontend-engineer |
| CI has no `pnpm test` step | Tests only run locally (TG-11) | pa-devops-sre |
| `supertest` requires server app export | Verify `export default app` in `index.ts` | ✅ Already exported |

---

## 7. Recommended Execution Order

1. **Unblock infrastructure** (30 min):
   - Install `@testing-library/react`, `jsdom`, `jest-axe` in client
   - Switch client vitest env to `jsdom`
   - Add `pnpm test` to CI workflow

2. **Schema tests** (4h — low risk, high value):
   - GAP-F (canvas-state.schema) first — most complex
   - Then D, E, G (simpler schemas)

3. **Route integration tests** (8h — core business paths):
   - GAP-B (export) — critical user flow
   - GAP-C (upload) — data ingestion, security validation
   - GAP-A (assets) — listing/filtering

4. **Client component tests** (7h):
   - Create ErrorBoundary + test TG-05
   - GAP-I (errors.tsx) — 5 reusable components
   - GAP-J (App.tsx) — root component states
   - TG-13 (a11y) — accessibility audit
