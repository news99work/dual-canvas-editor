# Security Review — Dual Canvas Editor (MVP)

| Field    | Detail                                                                     |
| -------- | -------------------------------------------------------------------------- |
| Project  | Dual Canvas Editor MVP                                                     |
| Reviewer | Security Architect (pa-security-architect)                                 |
| Date     | 2026-07-02                                                                 |
| Scope    | Upload, XSS, export pipeline, API security, dependency audit, threat model |
| Status   | **Draft — review required before backend implementation**                  |

---

## 1. Executive Summary

The Dual Canvas Editor is in early bootstrap (React 19 + Vite client, Express 5 + TypeScript server). The server skeleton exists with configuration (`config.ts`) already defining reasonable security defaults for MIME-type restrictions, upload size limits, and rate-limiting parameters.

**Overall risk: MODERATE** for MVP (no auth, public access). Key risks center on:

- Malicious file uploads (polyglot images, MIME spoofing)
- XSS via canvas text layers and Fabric.js SVG serialization
- Server-side resource exhaustion during export (Sharp memory/CPU)
- Multer orphaned temp files (DoS) — mitigated by 2.2.0 patch

---

## 2. File Upload Security

### 2.1 Current State

`config.ts` defines:

- Allowed MIME types: `image/png`, `image/jpeg`, `image/webp`, `image/gif`
- Max upload size: 10 MB
- Multer 2.2.0 (latest, patched for CVE-2026-5038)

### 2.2 Findings

| #   | Finding                                        | Severity  | Detail                                                                                                                                                                                                                          |
| --- | ---------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1  | **MIME-only validation is insufficient**       | 🔴 HIGH   | `config.ts` restricts by MIME type only. An attacker can upload a polyglot file (e.g., PHP payload embedded in PNG) or spoof `Content-Type` to bypass checks. Malicious content survives in storage even if not executable.     |
| F2  | **No file magic byte / content inspection**    | 🔴 HIGH   | No `file-type` or `sharp` metadata validation is configured. Image libraries like Sharp will still process polyglot files, potentially triggering CVEs in image decoders.                                                       |
| F3  | **SVG upload not explicitly blocked**          | 🟡 MEDIUM | While `image/svg+xml` is not in `allowedMimeTypes`, SVG can be submitted as `image/png` with embedded XML. SVG is executable XML — can contain `<script>`, `<foreignObject>`, event handlers. Must be blocked at content level. |
| F4  | **Upload storage isolation unclear**           | 🟡 MEDIUM | Per-session or per-IP isolation is not yet implemented. In MVP without auth, all uploads land in a shared `uploads/` directory. An attacker could enumerate uploaded files.                                                     |
| F5  | **Upload filename sanitization not defined**   | 🟡 MEDIUM | No filename sanitization strategy documented. Path traversal via `../../../etc/passwd` filenames, or null-byte injection, must be handled by multer config or post-processing.                                                  |
| F6  | **Multer orphaned temp files (CVE-2026-5038)** | 🟢 LOW    | Project uses multer 2.2.0 (patched). However, the vulnerability class (incomplete cleanup on aborted uploads) suggests a complementary cleanup cron should be implemented as defense-in-depth.                                  |

### 2.3 Recommendations

1. **Add content-based validation**: Use `sharp` (already a dependency) to read image metadata on upload. Verify actual MIME type matches declared type. Reject if mismatch.
   ```
   const metadata = await sharp(buffer).metadata();
   if (!allowedFormats.includes(metadata.format)) reject();
   ```
2. **Explicitly reject SVG content**: Detect SVG magic bytes (`<svg`, `<?xml`) in upload buffer and reject even if MIME type is declared as `image/*`.
3. **Sanitize filenames**: Use `uuid` (already a dependency) to generate unique storage filenames. Store original name as metadata only, never use in filesystem paths.
4. **Storage isolation**: Prefix upload paths by a session ID (UUID generated on first visit, stored client-side in sessionStorage) or IP hash. This limits enumeration but does not prevent it entirely.
5. **Periodic cleanup**: Implement the cleanup cron already hinted at in `config.ts` (`cleanupIntervalMs`). Remove uploads and exports older than `tempFileTtlMs`.

---

## 3. Canvas / XSS Risks

### 3.1 Current State

Canvas library is **not yet selected** — Fabric.js vs Konva.js pending research (T-062). No canvas implementation exists yet.

### 3.2 Fabric.js Known Vulnerabilities

| CVE            | Severity  | Affected | Fixed | Detail                                                                                           |
| -------------- | --------- | -------- | ----- | ------------------------------------------------------------------------------------------------ |
| CVE-2026-27013 | 🟡 MEDIUM | < 7.2.0  | 7.2.0 | Missing `escapeXml()` on user-controlled strings in SVG attribute markup (not just text content) |
| CVE-2026-44311 | 🟡 MEDIUM | < 7.4.0  | 7.4.0 | Improper escaping in `fabric.Gradient` during SVG serialization                                  |

**Bottom line**: If Fabric.js is selected, **pin to >= 7.4.0**. These are stored XSS vectors — malicious canvas state JSON can inject scripts into exported SVG, which executes when viewed in a browser.

### 3.3 General Canvas XSS Risks

| #   | Finding                               | Severity  | Detail                                                                                                                                                                                                                                                                          |
| --- | ------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| X1  | **Text layer HTML injection**         | 🔴 HIGH   | If canvas text layers allow arbitrary user input and that input is later rendered as HTML (e.g., in a preview panel or export), stored XSS is possible. Even if Fabric.js escapes for SVG, any custom rendering of text content outside the canvas needs separate sanitization. |
| X2  | **Image source URL injection**        | 🟡 MEDIUM | If users can specify image URLs (e.g., for image layers), those URLs must be validated. `javascript:` URIs, data URIs with scripts, or external URLs pointing to attacker-controlled content are risks.                                                                         |
| X3  | **Canvas state JSON deserialization** | 🟡 MEDIUM | The canvas state is serialized as JSON. If deserialized without validation, malformed or oversized state objects could cause client-side DoS or prototype pollution.                                                                                                            |
| X4  | **Garment color replacement**         | 🟢 LOW    | The task mentions a "garment color replacement" image pipeline. If this involves CSS filters or canvas compositing, ensure no user-controlled CSS is interpolated without sanitization.                                                                                         |

### 3.4 Recommendations

1. **Pin Fabric.js >= 7.4.0** if chosen; if Konva.js is selected, audit its SVG export path similarly.
2. **Sanitize all text layer content**: Before storing or rendering, strip HTML tags from text layer strings. Use `DOMPurify` on the client for preview, and validate server-side that text content contains no markup.
3. **Validate image URLs**: Allowlist schemes (`https:` only). Block `javascript:`, `data:`, `file:`. Validate that URLs point to known domains (own API, approved CDN).
4. **Validate canvas state JSON on server**: Use `zod` (already a dependency) to define a strict schema for canvas state. Reject unknown keys, enforce type/length constraints on all string fields.
5. **CSP headers**: Serve with `Content-Security-Policy: default-src 'self'; img-src 'self' https:; script-src 'self'` to limit impact of any XSS that does slip through.

---

## 4. Export Pipeline Security

### 4.1 Current State

Export pipeline is not yet built. `config.ts` defines:

- Export dimensions: 2400 × 3600
- Export directory: `server/exports/`
- Stricter rate limit for exports: 20 req/min vs 100 general
- Sharp 0.35.3 for image processing

### 4.2 Findings

| #   | Finding                                  | Severity  | Detail                                                                                                                                                                                                      |
| --- | ---------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E1  | **Sharp memory exhaustion**              | 🔴 HIGH   | Exporting a 2400×3600 canvas with multiple layers can consume 100-500 MB+ of memory per request. At 20 req/min, concurrent exports could exhaust server memory. Sharp is efficient but not a silver bullet. |
| E2  | **No export timeout / size cap**         | 🔴 HIGH   | No timeout defined for export processing. A malicious canvas state with thousands of layers or enormous dimensions could cause indefinite processing.                                                       |
| E3  | **Temp file exposure**                   | 🟡 MEDIUM | Exported PNG/PDF files written to `exports/` are accessible until cleaned up. Predictable filenames (UUIDs are fine) but the directory should not be served statically.                                     |
| E4  | **Server-side rendering trust boundary** | 🟡 MEDIUM | If canvas compositing happens server-side (Sharp), any image URL in the layer data will be fetched. This is a potential SSRF vector — an attacker could make the server fetch internal resources.           |
| E5  | **No Puppeteer usage (good)**            | 🟢 NONE   | The task spec mentions Puppeteer as a possible risk. The project uses Sharp only, which has a much smaller attack surface than a headless browser. This is the right choice for MVP.                        |

### 4.3 Recommendations

1. **Memory limits**: Run export in a child process with `--max-old-space-size` or use a worker pool with concurrency cap (e.g., 2 concurrent exports max).
2. **Timeout**: Set a 30-second timeout per export job. If Sharp hasn't completed by then, terminate and return error.
3. **Max layer count**: Validate canvas state JSON server-side — reject states with > 50 layers or unreasonably large dimensions.
4. **SSRF protection**: If server-side image fetching is needed (for compositing), validate all image URLs against an allowlist. Never fetch from private IP ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.0/8`).
5. **Export directory**: Serve exports only through the `/api/export/:id` endpoint with UUID-based access, never as a static directory.
6. **Temp file cleanup**: Implement the `cleanupIntervalMs` cron from `config.ts` to delete exports older than `tempFileTtlMs` (1 hour).

---

## 5. API Security

### 5.1 Current State

- Express 5.1.0 with `cors`, `express-rate-limit`, `multer`, `zod`
- Single route: `GET /api/health`
- CORS middleware applied without explicit origin restriction
- Rate limiting configured but not yet wired into routes

### 5.2 Findings

| #   | Finding                               | Severity  | Detail                                                                                                                                                                                                         |
| --- | ------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | **CORS is wide open**                 | 🔴 HIGH   | `app.use(cors())` with no options allows any origin. For a public API this may be intentional for MVP, but it enables CSRF-style attacks where any website can trigger uploads/exports on behalf of a visitor. |
| A2  | **Rate limiting not wired**           | 🟡 MEDIUM | `config.ts` defines rate limit parameters but `express-rate-limit` is not configured in `index.ts`. Without it, upload/export endpoints have no cost protection.                                               |
| A3  | **No input validation on API**        | 🔴 HIGH   | `zod` is installed but no schemas are defined and no validation middleware is wired. All endpoints need strict input validation.                                                                               |
| A4  | **No request body size limit**        | 🟡 MEDIUM | `express.json()` has no `limit` option. Default is 100kb, which may be too small for canvas state JSON, but should be set explicitly.                                                                          |
| A5  | **No helmet / security headers**      | 🟡 MEDIUM | Missing security headers: no `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security` (for production).                                                                                        |
| A6  | **No error information leak control** | 🟢 LOW    | Express default error handler may leak stack traces. Should use custom error handler in production.                                                                                                            |

### 5.3 Recommendations

1. **CORS policy**: For MVP, restrict to known origins via env var:
   ```ts
   app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }));
   ```
2. **Wire rate limiting**: Apply `express-rate-limit` to all `/api/*` routes. Use stricter limits for `/api/upload` and `/api/export`.
3. **Zod validation middleware**: Define schemas for all request bodies, query params, and route params. Validate before any business logic executes.
4. **Set body size limits**: `app.use(express.json({ limit: '5mb' }))` — sufficient for canvas state JSON with multiple layers.
5. **Add Helmet**: Install and configure `helmet` for security headers.
6. **Custom error handler**: Catch-all middleware that returns structured errors without stack traces in production.

---

## 6. Dependency Audit

### 6.1 Server Dependencies

| Package            | Version | Latest | Known CVEs              | Notes                      |
| ------------------ | ------- | ------ | ----------------------- | -------------------------- |
| express            | 5.1.0   | ✅     | None critical           | Mature, well-maintained    |
| cors               | 2.8.5   | ✅     | None                    | Simple, stable             |
| express-rate-limit | 8.5.2   | ✅     | None                    | Needs wiring               |
| multer             | 2.2.0   | ✅     | CVE-2026-5038 (patched) | v2.2.0 is the fix version  |
| sharp              | 0.35.3  | ✅     | None in this version    | 0 vulnerabilities per Snyk |
| uuid               | 14.0.1  | ✅     | None                    |                            |
| zod                | 4.4.3   | ✅     | None                    | Type-safe validation       |

### 6.2 Client Dependencies

| Package              | Version | Notes          |
| -------------------- | ------- | -------------- |
| react, react-dom     | 19.1.0  | Current stable |
| vite                 | 6.3.5   | No known CVEs  |
| @vitejs/plugin-react | 4.4.2   | No known CVEs  |

### 6.3 Canvas Library (pending selection)

| Library       | Risk                                             | Recommendation                                               |
| ------------- | ------------------------------------------------ | ------------------------------------------------------------ |
| **Fabric.js** | 🟡 Two XSS CVEs (CVE-2026-27013, CVE-2026-44311) | Pin >= 7.4.0, audit SVG export path                          |
| **Konva.js**  | 🟢 No known CVEs                                 | Simpler API, no built-in SVG export → smaller attack surface |

**Recommendation**: Konva.js has a smaller security surface for MVP. If Fabric.js is chosen for feature richness, the two XSS CVEs must be mitigated at the application level (text sanitization, SVG output validation).

---

## 7. Threat Model Summary

### 7.1 Assets

| Asset               | Value                      | Exposure                                  |
| ------------------- | -------------------------- | ----------------------------------------- |
| Uploaded images     | User content               | Public (no auth)                          |
| Canvas design state | User intellectual property | JSON serialized, stored temporarily       |
| Exported PNG/PDF    | Final product              | Generated server-side, temporarily stored |
| Server resources    | CPU/memory/disk            | DoS target                                |

### 7.2 Threat Actors & Vectors

| Actor                      | Motivation                 | Vector                                                     |
| -------------------------- | -------------------------- | ---------------------------------------------------------- |
| **Opportunistic attacker** | Defacement, resource abuse | Mass upload of malicious files, DoS via concurrent exports |
| **Malicious user**         | XSS against other users    | Stored XSS in canvas design state, SVG export              |
| **Automated scanner**      | Vulnerability discovery    | Probing open API endpoints, testing file upload            |

### 7.3 Top Threats (Risk Matrix)

| ID  | Threat                                | Likelihood | Impact | Risk | Mitigation                              |
| --- | ------------------------------------- | ---------- | ------ | ---- | --------------------------------------- |
| T1  | Polyglot/malicious image upload       | High       | High   | 🔴   | Content-based validation with Sharp     |
| T2  | Stored XSS via text layers            | Medium     | High   | 🔴   | Text sanitization, Fabric >= 7.4.0      |
| T3  | DoS via export resource exhaustion    | Medium     | High   | 🔴   | Concurrency cap, timeout, max layers    |
| T4  | Unrestricted file upload (SVG as PNG) | Medium     | Medium | 🟡   | SVG magic byte detection                |
| T5  | SSRF via image URL in export          | Low        | Medium | 🟡   | URL allowlist, private IP block         |
| T6  | Upload enumeration (no auth)          | High       | Low    | 🟡   | UUID filenames, session-scoped prefixes |
| T7  | CSRF via CORS misconfiguration        | Medium     | Low    | 🟢   | Restricted CORS origins                 |
| T8  | Prototype pollution via canvas JSON   | Low        | Medium | 🟢   | Zod strict schema validation            |

### 7.4 Trust Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│  Browser (Client)                                            │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ Text Input   │  │ Image Upload │  │ Canvas State JSON │  │
│  │ (untrusted)  │  │ (untrusted)  │  │ (untrusted)       │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬──────────┘  │
└─────────┼────────────────┼───────────────────┼──────────────┘
          │                │                   │
     ┌────▼────────────────▼───────────────────▼──────────────┐
     │               TRUST BOUNDARY                           │
     │  ┌─────────────────────────────────────────────────┐   │
     │  │  Express API (server)                            │   │
     │  │  ┌──────────┐ ┌───────────┐ ┌───────────────┐   │   │
     │  │  │ Validate  │ │ Sanitize  │ │ Rate Limit    │   │   │
     │  │  │ (zod)     │ │ (strip    │ │ (rate-limit)  │   │   │
     │  │  │           │ │  markup)  │ │               │   │   │
     │  │  └─────┬─────┘ └─────┬─────┘ └───────┬───────┘   │   │
     │  │        │             │               │           │   │
     │  │  ┌─────▼─────────────▼───────────────▼───────┐   │   │
     │  │  │  Business Logic + Sharp export            │   │   │
     │  │  └──────────────────┬───────────────────────┘   │   │
     │  └────────────────────┼───────────────────────────┘   │
     │                       │                               │
     │  ┌────────────────────▼───────────────────────────┐   │
     │  │  File System (uploads/, exports/)              │   │
     │  └────────────────────────────────────────────────┘   │
     └───────────────────────────────────────────────────────┘
```

All data crossing the trust boundary must be validated, sanitized, and rate-limited.

---

## 8. Action Items & Prioritization

### Critical (before any deployment)

| ID  | Action                                                      | Owner              |
| --- | ----------------------------------------------------------- | ------------------ |
| A1  | Wire content-based upload validation (Sharp metadata check) | Backend (T-051)    |
| A2  | Implement Zod schemas for all API endpoints                 | Backend (T-051)    |
| A3  | Configure CORS with explicit origin                         | Backend (T-051)    |
| A4  | Wire rate limiting on upload/export routes                  | Backend (T-051)    |
| A5  | Text sanitization strategy for canvas layers                | Frontend + Backend |

### High (before MVP release)

| ID  | Action                                                                 | Owner           |
| --- | ---------------------------------------------------------------------- | --------------- |
| A6  | Pin canvas library to secure version (Fabric >= 7.4.0 or Konva latest) | Frontend        |
| A7  | Export concurrency cap + timeout (30s)                                 | Backend (T-051) |
| A8  | SVG magic byte rejection on upload                                     | Backend (T-051) |
| A9  | UUID-based storage filenames                                           | Backend (T-051) |
| A10 | Security headers (Helmet or manual)                                    | Backend (T-051) |

### Medium (before production)

| ID  | Action                                         | Owner           |
| --- | ---------------------------------------------- | --------------- |
| A11 | Temp file cleanup cron (uploads + exports)     | Backend (T-051) |
| A12 | CSP headers                                    | Backend (T-051) |
| A13 | SSRF protection for server-side image fetching | Backend (T-051) |
| A14 | Add `npm audit` to CI pipeline                 | DevOps (T-043)  |
| A15 | Custom error handler (no stack traces in prod) | Backend (T-051) |

---

## 9. Dependency Snapshot (for `npm audit` baseline)

Run and verify:

```bash
cd server && npm audit --audit-level=high
cd client && npm audit --audit-level=high
```

Expected result: **0 high/critical vulnerabilities** based on current lockfile review.

---

## Appendices

### A. OWASP Top 10 (2021) Coverage

| OWASP Category                 | Covered    | Notes                                       |
| ------------------------------ | ---------- | ------------------------------------------- |
| A01: Broken Access Control     | ⚠️ Partial | No auth in MVP — accept as design choice    |
| A02: Cryptographic Failures    | N/A        | No sensitive data stored                    |
| A03: Injection                 | ✅         | XSS (canvas), file upload addressed         |
| A04: Insecure Design           | ⚠️         | Threat model provided, needs review         |
| A05: Security Misconfiguration | ⚠️         | CORS, headers, error handling items open    |
| A06: Vulnerable Components     | ✅         | Dependency audit clear (when canvas pinned) |
| A07: Auth Failures             | N/A        | No auth in MVP                              |
| A08: Software & Data Integrity | ⚠️         | Add `npm audit` to CI                       |
| A09: Logging & Monitoring      | ❌         | Not in MVP scope                            |
| A10: SSRF                      | ✅         | Addressed in export pipeline review         |

### B. Configuration Checklist

- [ ] `CORS_ORIGIN` env var set in production
- [ ] Rate limiting wired (general + export tiers)
- [ ] Body size limits explicit (`express.json({ limit })`)
- [ ] Multer configured with `limits.fileSize`, custom `fileFilter`
- [ ] Export timeout enforced
- [ ] Temp file cleanup cron active
- [ ] Security headers (helmet) enabled
- [ ] `NODE_ENV=production` disables stack traces
- [ ] Canvas library version pinned in package.json
