# Code Review — Dual Canvas Editor MVP

**Project:** dual-canvas-editor  
**Task:** Code review – bugs, perf, security, maintainability  
**Role:** pa-code-reviewer  
**Date:** 2026-07-02 UTC

---

## 1) Review Scope & Methodology

Reviewed every source file, config, and CI artifact in the monorepo:

| Package | Files reviewed                                                                                                                                 |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Root    | `package.json`, `tsconfig.base.json`, `eslint.config.js`, `.prettierrc`, `.husky/pre-commit`, `.gitignore`, `README.md`, `pnpm-workspace.yaml` |
| Client  | `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/App.css`, `vite-env.d.ts`                 |
| Server  | `package.json`, `tsconfig.json`, `src/index.ts`                                                                                                |
| CI      | `.github/workflows/ci.yml`                                                                                                                     |

**Important context:** the README explicitly states _"Canvas library decision is pending research outcome."_ There is **no Fabric.js/Konva.js integration, no canvas rendering logic, no dual-canvas sync, no file upload/export, and no state management** in this codebase. The review therefore covers the **monorepo scaffold and server foundation** that will host these features. Findings focus on security/config defects that would **compound in severity** once canvas/file features land.

---

## 2) Findings by Severity

---

### 🔴 CRITICAL

#### C-01 — CORS wide open to all origins

**File:** `server/src/index.ts:8`  
**Code:** `app.use(cors());`

`cors()` with zero options allows **any origin**, any method, any headers, and **does not send credentials**. While credentials are currently disabled (the safer default), the wildcard origin means:

- Any external page can read API responses from the server.
- Once auth/cookies/sessions are added, this becomes a 0-day SSRF/CORS misconfig.
- No preflight restrictions on methods (`POST`, `DELETE`, `PUT` all wide open).

**Fix:** Restrict to known origins via env config:

```ts
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
  }),
);
```

---

#### C-02 — No error-handling middleware; unhandled rejections crash silently

**File:** `server/src/index.ts` (entire file)

Express 5 does **not** auto-catch async errors thrown inside route handlers (unlike Express 4 with certain patterns). There is **no global error handler** registered. When canvas file uploads, image processing with `sharp`, or async DB operations land, any unhandled rejection will:

- Leak a raw stack trace in production (if response has been started) or hang the request indefinitely.
- Crash the Node process on unhandled promise rejection if `--unhandled-rejections=strict` is ever set.

**Fix:** Add normalized error middleware before `app.listen`:

```ts
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[error]', err.message);
  res.status(500).json({ error: 'Internal Server Error' });
});
```

Also wrap route handlers in a `try/catch` or a thin `asyncHandler` utility for any async route.

---

#### C-03 — `express-rate-limit` is a dependency but **never wired**

**File:** `server/package.json:17` (listed), `server/src/index.ts` (absent)

The package is installed but never `app.use(rateLimit(...))`. The `/api/health` endpoint has no rate protection. Once auth, canvas save, or file upload endpoints are added, brute-force, DDoS, or runaway retry loops will have zero server-side throttling.

**Fix:** Add a base limiter early in the middleware stack:

```ts
import rateLimit from 'express-rate-limit';
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
```

And stricter per-route limits for auth and upload endpoints when they land.

---

### 🟠 HIGH

#### H-01 — Unused dependencies shipped in production

**File:** `server/package.json`

| Package              | Status           |
| -------------------- | ---------------- |
| `multer`             | Imported nowhere |
| `sharp`              | Imported nowhere |
| `uuid`               | Imported nowhere |
| `zod`                | Imported nowhere |
| `express-rate-limit` | Imported nowhere |

These packages add ~25MB+ to `node_modules`, increase the Docker image/Cold start surface, and expand the supply-chain attack footprint. `sharp` in particular ships platform-native binaries.

**Fix:** Remove unused dependencies now. Re-add each only when the feature that needs it is implemented and code-reviewed.

---

#### H-02 — No React error boundary

**File:** `client/src/main.tsx`

The app renders a single `<App />` inside `<StrictMode>` with **no error boundary**. Any uncaught render error in a child component (canvas rendering, third-party Fabric.js wrappers) will unmount the entire React tree and show a white screen.

**Fix:** Add at least one boundary:

```tsx
// client/src/components/ErrorFallback.tsx
class ErrorBoundary extends React.Component<{children:ReactNode},{hasError:boolean}> { ... }
```

Wrap `<App />` in `main.tsx`.

---

#### H-03 — No request body size limit

**File:** `server/src/index.ts:9`  
**Code:** `app.use(express.json());`

`express.json()` with no `limit` option defaults to 100kb. While this provides a baseline, it's **not documented or enforced intentionally**. When canvas state payloads or `multer` file uploads land, the default might silently truncate large payloads or crash with confusing errors.

**Fix:** Explicitly set a limit suitable for canvas JSON state:

```ts
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
```

---

#### H-04 — No production trust proxy / rate-limiting headers

**File:** `server/src/index.ts`

Express behind a reverse proxy (Nginx, Vercel, Cloudflare) needs `app.set('trust proxy', 1)` to correctly read `X-Forwarded-For` for rate limiting and logging. Without it, `req.ip` is always `127.0.0.1` in proxy deployments, making `express-rate-limit` (once wired) useless.

**Fix:** Add conditional trust proxy:

```ts
if (process.env.TRUST_PROXY) app.set('trust proxy', 1);
```

---

#### H-05 — No Content-Security-Policy, no helmet, no security headers

**Files:** `server/src/index.ts`, `client/index.html`

Neither the server (Express) nor the client (Vite) sets:

- `Content-Security-Policy`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security`

When canvas text rendering allows user-generated content (text tool, labels), XSS risk increases. Without CSP, injected scripts execute freely.

**Fix:** Add `helmet` middleware to Express, or at minimum set headers manually. For Vite dev, configure `server.headers` in `vite.config.ts` for development parity.

---

### 🟡 MEDIUM

#### M-01 — `.tsbuildinfo` files committed to git

**Files:** `client/tsconfig.tsbuildinfo`, `server/tsconfig.tsbuildinfo`

These are build artifacts — auto-generated, machine-specific, and cause merge conflicts. They're not listed in `.gitignore`.

**Fix:** Add `*.tsbuildinfo` to root `.gitignore` and remove committed files.

---

#### M-02 — `tsc -b` build command mismatch with `noEmit: true`

**File:** `client/package.json:7`  
**Code:** `"build": "tsc -b && vite build"`  
**File:** `client/tsconfig.json:13`  
**Code:** `"noEmit": true`

The client tsconfig extends `tsconfig.base.json` which sets `"composite": true`. Then the client overrides with `"noEmit": true`. The `tsc -b` (build mode) command expects composite projects to emit `.tsbuildinfo` and declaration files. With `noEmit: true`, `tsc -b` may behave unexpectedly or fail in some TypeScript versions.

**Fix:** Use `tsc --noEmit` for typechecking and let `vite build` handle the production build. Separate scripts: `"typecheck": "tsc --noEmit"`, `"build": "vite build"`.

---

#### M-03 — No CI test/smoke step

**File:** `.github/workflows/ci.yml`

CI runs `lint`, `typecheck`, `build`, and `format:check` — but **no test step**. There are also no test files in the repo. Once canvas logic and dual-sync state management arrive, the absence of automated tests means:

- No regression guard for sync bugs.
- No performance budget enforcement for canvas re-renders.
- No security regression tests.

**Fix:** Add a test framework (Vitest is already compatible with the Vite setup). Add at minimum: unit tests for server routes, component smoke tests, and canvas sync integration tests.

---

#### M-04 — Port parsing edge case: `PORT=0` resolves to 4000

**File:** `server/src/index.ts:5`  
**Code:** `const PORT = Number(process.env.PORT) || 4000;`

`Number("0")` returns `0` which is falsy, so `|| 4000` activates. Port 0 is a valid convention (OS assigns random available port), useful for CI/test environments. This edge case silently overrides that behavior.

**Fix:**

```ts
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
```

---

#### M-05 — Canvas slots have zero accessibility markup

**Files:** `client/src/App.tsx`, `client/src/App.css`

The two canvas placeholders are `<div>` elements with no:

- `role` (should be `role="region"` or `role="application"` for canvas surfaces)
- `aria-label` or `aria-labelledby`
- `tabindex`
- Keyboard event handlers

When real canvas rendering lands, screen-reader users and keyboard-only users will have **no way to interact** with the editor.

**Fix:** Plan ARIA strategy now. Canvas surfaces need at minimum:

```html
<div role="application" aria-label="Canvas A — drawing area" tabindex="0"></div>
```

Plus a focus ring visible on `:focus-visible`.

---

#### M-06 — No structured logging or request ID

**File:** `server/src/index.ts`

The server has a single `console.log` on startup and no request logging middleware. In production, debugging canvas sync errors, file upload failures, or auth issues requires structured logs with correlation IDs.

**Fix:** Add `morgan` or a simple request logger. Assign a request ID early:

```ts
app.use((req, _res, next) => {
  (req as any).requestId = crypto.randomUUID();
  next();
});
```

---

### 🟢 LOW

#### L-01 — `lang="en"` in HTML but app targets Vietnamese audience

**File:** `client/index.html:2`

The `<html lang="en">` should be `lang="vi"` if the UI will be Vietnamese. Screen readers use this for pronunciation.

---

#### L-02 — Vite `open: true` in config inconvenient for headless/CI

**File:** `client/vite.config.ts:14`

`server.open: true` auto-opens the browser on every `vite` / `pnpm dev`. This is annoying for developers who already have a tab open and breaks CI/headless environments.

**Fix:** Gate behind an env var:

```ts
open: process.env.VITE_OPEN === 'true',
```

---

#### L-03 — Server dev script uses `tsx watch` with no debounce

**File:** `server/package.json:6`  
**Code:** `"dev": "tsx watch src/index.ts"`

`tsx watch` restarts the process on every file change. With no debounce or ignore patterns, rapid successive saves (e.g., auto-format on save from Prettier) trigger multiple restarts in a second, causing port-bind collisions and unnecessary churn.

**Fix:** Add `--clear-screen=false` and consider `nodemon` for more granular watch control, or add `ignore` patterns for `node_modules` and `dist`.

---

#### L-04 — No `.nvmrc` or `.node-version`

**File:** (absent)

`package.json` specifies `"node": ">=20.0.0"` in engines, but there's no `.nvmrc`/`.node-version` for tooling auto-switching (`nvm`, `fnm`, `asdf`).

**Fix:** Add `.nvmrc` containing `20`.

---

#### L-05 — `start` script assumes `dist/index.js` but ESM `.js` extension may break

**File:** `server/package.json:8`  
**Code:** `"start": "node dist/index.js"`

With `"type": "module"` and `"module": "NodeNext"`, TypeScript compiles imports without rewriting extensions unless configured. When local imports are added (e.g., `import { something } from './routes/canvas'`), emitted JS will need `.js` extensions in import paths. The `start` script will work for the current single-file server but is fragile for future multi-file modules.

**Fix:** Test that `node dist/index.js` works after adding multi-file imports, or configure `tsc` with `allowImportingTsExtensions` + a bundler for production.

---

## 3) Summary Table

| ID   | Severity | Area             | Summary                                         |
| ---- | -------- | ---------------- | ----------------------------------------------- |
| C-01 | CRITICAL | Security         | CORS allows all origins                         |
| C-02 | CRITICAL | Error Handling   | No global error middleware on server            |
| C-03 | CRITICAL | Security         | `express-rate-limit` installed but never wired  |
| H-01 | HIGH     | Maintainability  | 5 unused production dependencies in server      |
| H-02 | HIGH     | Error Boundaries | No React error boundary                         |
| H-03 | HIGH     | API Handlers     | No explicit request body size limit             |
| H-04 | HIGH     | Security/DevOps  | No trust proxy configuration                    |
| H-05 | HIGH     | Security         | No CSP, no security headers                     |
| M-01 | MEDIUM   | Maintainability  | `.tsbuildinfo` files committed to git           |
| M-02 | MEDIUM   | TypeScript/Build | `tsc -b` incompatible with `noEmit: true`       |
| M-03 | MEDIUM   | Tests            | No test framework, no test step in CI           |
| M-04 | MEDIUM   | API Handlers     | `PORT=0` edge case overridden by fallback       |
| M-05 | MEDIUM   | Accessibility    | Canvas slots unlabeled, no focus management     |
| M-06 | MEDIUM   | API Handlers     | No structured logging or request IDs            |
| L-01 | LOW      | Accessibility    | `lang="en"` should be `lang="vi"`               |
| L-02 | LOW      | DX/Config        | `server.open: true` inconvenient for dev/CI     |
| L-03 | LOW      | DX/Config        | `tsx watch` no debounce on restart              |
| L-04 | LOW      | DX/Config        | No `.nvmrc` / `.node-version`                   |
| L-05 | LOW      | Build            | `node dist/index.js` fragile for ESM multi-file |

---

## 4) What's Good

The scaffold is clean and well-structured for a Day-0 monorepo:

- ✅ **Monorepo setup** (`pnpm workspaces`) is correctly configured with shared eslint/prettier/tsconfig.
- ✅ **TypeScript strict mode** enabled in base config — no `any` usage, no loose types.
- ✅ **ESLint flat config** is modern (`typescript-eslint` v8, warn on `no-explicit-any`).
- ✅ **CI pipeline** covers lint, typecheck, build, and format-check in under 15 min.
- ✅ **Husky + lint-staged** pre-commit hook prevents unchecked code from being committed.
- ✅ **Vite proxy** correctly forwards `/api` to the server in development.
- ✅ **React 19 + StrictMode** is correctly bootstrapped.
- ✅ **Dark theme CSS** uses CSS custom properties, consistent token naming.
- ✅ **`packageManager`** field pinned to `pnpm@9.9.0` for deterministic installs.
- ✅ **`engines`** field specifies Node 20+ and pnpm 9+ requirements.
- ✅ **Root `tsconfig.base.json`** with `composite: true` enables project references.

---

## 5) Recommended Remediation Order

1. **Immediate — before adding canvas/upload logic:**
   - Fix C-01 (CORS), C-02 (error middleware), C-03 (rate limiting).
   - Fix H-01 (remove unused deps).
   - Fix H-03 (body size limit), H-04 (trust proxy), H-05 (security headers).

2. **Before integrating Fabric.js/Konva.js:**
   - Fix H-02 (React error boundary).
   - Fix M-05 (canvas ARIA plan).
   - Fix M-03 (add test framework + CI step).

3. **Before production deployment:**
   - Fix M-06 (structured logging).
   - Fix L-01 through L-05 (DX polish).
   - Fix M-01 (remove committed `.tsbuildinfo` files).

---

## 6) Verdict

The scaffold is **sound for a Day-0 foundation** but carries **CRITICAL security/config debt** that will compound severely when canvas rendering, auth, and file upload features land on top of it. The three critical findings (CORS, missing error middleware, missing rate limiting) should be resolved before the first feature PR is merged. Removing the five unused dependencies will also shrink the attack surface immediately.

**Verdict: APPROVED for continuation with CRITICAL findings resolved first.**

---

## 7) Fresh Pass Addendum (2026-07-02, 18:00 UTC)

Reviewed new code introduced since the initial review.

### 7.1 New Files

| File                         | Status    | Notes                                   |
| ---------------------------- | --------- | --------------------------------------- |
| `server/src/config.ts`       | New       | Centralized config — ✅ well-structured |
| `server/src/services/`       | Empty dir | Placeholder                             |
| `server/src/routes/`         | Empty dir | Placeholder                             |
| `server/src/middleware/`     | Empty dir | Placeholder                             |
| `server/src/types/`          | Empty dir | Placeholder                             |
| `server/src/assets/fonts/`   | Empty dir | Placeholder                             |
| `server/src/assets/samples/` | Empty dir | Placeholder                             |

### 7.2 New Finding: config.ts Is Isolated (MEDIUM)

**N-01 — config.ts exists but index.ts doesn't use it**  
**File:** `server/src/config.ts` vs `server/src/index.ts`

`config.ts` correctly defines: `port`, `allowedMimeTypes`, `maxUploadSize`, `rateLimitWindowMs`, `rateLimitMax`, `exportRateLimitMax`, `tempFileTtlMs`, `cleanupIntervalMs`. However, `index.ts` **does not import it**. The server still hardcodes:

- `const PORT = Number(process.env.PORT) || 4000;` (redundant with `config.port`)
- No rate limiting wired even though config provides the values
- No upload size limits wired even though config has them

**Fix:** Import config and use it consistently:

```ts
import { config } from './config.js';
// Then wire rateLimit, body size limits, etc. using config values.
```

### 7.3 Finding Status from Previous Review

Re-checked all previous findings against current code:

| ID           | Severity | Status         | Notes                                                                          |
| ------------ | -------- | -------------- | ------------------------------------------------------------------------------ |
| C-01         | CRITICAL | ❌ Unfixed     | CORS still wide open                                                           |
| C-02         | CRITICAL | ❌ Unfixed     | No error middleware                                                            |
| C-03         | CRITICAL | ❌ Unfixed     | rate-limit still not wired (config.ts has values but unused)                   |
| H-01         | HIGH     | ❌ Unfixed     | 5 unused deps still in `server/package.json`                                   |
| H-02         | HIGH     | ❌ Unfixed     | No error boundary in client                                                    |
| H-03         | HIGH     | ❌ Unfixed     | No body size limit on `express.json()`                                         |
| H-04         | HIGH     | ❌ Unfixed     | No trust proxy config                                                          |
| H-05         | HIGH     | ❌ Unfixed     | No security headers (CSP, etc.)                                                |
| M-01         | MEDIUM   | ❌ Unfixed     | `.tsbuildinfo` likely still committed                                          |
| M-02         | MEDIUM   | ❌ Unfixed     | `tsc -b` + `noEmit` mismatch in client                                         |
| M-03         | MEDIUM   | ❌ Unfixed     | No test framework / CI test step                                               |
| M-04         | MEDIUM   | ❌ Unfixed     | `PORT=0` edge case now in config.ts too (`Number(process.env.PORT) \|\| 4000`) |
| M-05         | MEDIUM   | ❌ Unfixed     | Canvas slots unlabeled                                                         |
| M-06         | MEDIUM   | ❌ Unfixed     | No request logging / request IDs                                               |
| L-01 to L-05 | LOW      | ❌ All unfixed | DX polish items                                                                |

**Status:** 0 of 18 findings resolved. All still active.

### 7.4 Phase 2 Review Status

| Source                  | Task                         | Status      | Code Available                      |
| ----------------------- | ---------------------------- | ----------- | ----------------------------------- |
| pa-frontend-engineer    | T-017 (React setup)          | Completed   | Reviewed in original pass           |
| pa-frontend-engineer    | Additional frontend          | N/A         | No new frontend code since T-017    |
| pa-backend-engineer     | T-010 (error taxonomy)       | In progress | No code landed yet                  |
| pa-backend-engineer     | T-051 (upload/assets/export) | In progress | Empty service/routes/ — no code yet |
| pa-integration-engineer | T-054 (E2E wiring)           | In progress | No code landed yet                  |

**Phase 2 is blocked** on:

1. T-044 ADRs not delivered (no architecture to validate against)
2. T-010, T-051, T-054 still in progress (no code to review)
3. 0 of 18 existing findings resolved (review cycle stalled)

---

### 7.5 Updated Verdict

The codebase has not progressed since the initial review. The new `config.ts` is a positive addition (good structure, proper `as const`, clear documentation) but it's **not wired** to the server. Phase 2 active review cannot proceed until:

- Engineers land code from T-010, T-051, T-054
- The 18 existing findings are addressed (especially C-01, C-02, C-03)

**Verdict: APPROVED for continuation. PR open for 18 findings. config.ts is clean but needs wiring.**
