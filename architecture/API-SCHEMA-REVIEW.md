# API Schema Review — Dual Canvas Editor MVP

**Review:** T-020 — API schema + data contracts review  
**Artifact reviewed:** `api-schema.md` v1.0.0 (2026-07-02) by Data/API Architect (T-047)  
**Reviewer:** Solution Architect (pa-solution-architect)  
**Date:** 2026-07-02  
**Disposition:** 🔄 **Changes Requested** — 1 HIGH issue must be resolved before T-051 Backend implementation

---

## 1. Summary

The API schema is well-structured, follows industry conventions, and covers the MVP scope comprehensively. Five endpoints, four data schemas, error format, storage strategy, and rate limiting are all clearly defined. The schema is intentionally library-agnostic (does not depend on Fabric.js vs Konva.js decision), which is a smart design choice that prevents the API contract from being blocked by the pending architecture ADRs (T-044).

**One blocker-level issue found:** MIME type policy conflict between api-schema, server config, and security review. See §2.1.

---

## 2. Findings

### 2.1 🔴 HIGH — MIME Type Policy Conflict (3-way)

**Severity:** HIGH  
**Impact:** Backend implementation blocked until resolved — upload endpoint behavior is ambiguous

Three artifacts specify conflicting allowed MIME types for upload:

| Source                  | Allowed MIME Types                                                             |
| ----------------------- | ------------------------------------------------------------------------------ |
| `api-schema.md` §5.1    | `image/png`, `image/jpeg`, `image/webp`, `image/svg+xml`                       |
| `server/src/config.ts`  | `image/png`, `image/jpeg`, `image/webp`, `image/gif`                           |
| `security-review.md` F3 | Recommends **blocking SVG** explicitly (XSS via `<script>`, `<foreignObject>`) |

**Specific conflicts:**

| Conflict                      | Detail                                                                                                  |
| ----------------------------- | ------------------------------------------------------------------------------------------------------- |
| SVG: api-schema says YES      | Security review says BLOCK (CVE risk: script injection, event handlers)                                 |
| SVG: api-schema says YES      | Server config.ts does NOT include SVG                                                                   |
| GIF: config.ts says YES       | api-schema omits GIF                                                                                    |
| SVG: api-schema assumption #3 | "SVG uploads allowed; rasterized server-side for export" — assumes a decision that security contradicts |

**Resolution required:** The three agents (Data/API Architect, Security Architect, Solution Architect) must align on a single MIME type policy. Recommended path:

```
Allowed for MVP: image/png, image/jpeg, image/webp
Blocked: image/svg+xml (security risk, no strong MVP use case)
Optional (defer to v2): image/gif (animated stickers/decals)
```

This would mean:

1. api-schema.md §5.1 drops `image/svg+xml`, optionally adds `image/gif`
2. config.ts drops `image/gif` (or keeps if adopted)
3. security-review.md F3 moves from recommendation to satisfied requirement

---

### 2.2 🟡 MEDIUM — Missing Request Body Size Limit

**Severity:** MEDIUM  
**Impact:** Export endpoint may fail silently if canvas state exceeds default Express JSON limit

- `POST /api/v1/export` sends full `CanvasState` object in body
- Security review A4 requires explicit `express.json({ limit })`
- api-schema never specifies max CanvasState size or body limit
- Default Express JSON limit is 100KB — a complex canvas state with multiple layers could exceed this

**Recommendation:** Add to §3 Common Conventions or §5.3:

> Request body limit: 5 MB for JSON endpoints (sufficient for CanvasState with up to 50 layers)

---

### 2.3 🟡 MEDIUM — Zod Validation Not Referenced

**Severity:** MEDIUM  
**Impact:** Backend engineer may implement ad-hoc validation instead of using the project-standard Zod

- Security review A3: "Zod schemas for all API endpoints" is a critical action item
- api-schema uses TypeScript interfaces (compile-time only) — never mentions Zod for runtime validation
- `zod` is already installed as a server dependency

**Recommendation:** Add a note in §3 Common Conventions:

> All request bodies, query parameters, and route parameters are validated at runtime using Zod schemas corresponding to the TypeScript interfaces defined in §4 and §5.

---

### 2.4 🟡 MEDIUM — `TextEffect.curve` Underspecified

**Severity:** MEDIUM  
**Impact:** Backend cannot validate curve params; frontend may produce incompatible state

```typescript
interface TextEffect {
  type: 'outline' | 'shadow' | 'curve';
  params: Record<string, unknown>; // Effect-specific params
}
```

`"outline"` and `"shadow"` have well-understood parameters. `"curve"` does not — is it a circular arc, bezier, wave? What params: radius, amplitude, wavelength, direction?

**Recommendation:** Either:

- Define curve params explicitly (e.g., `{ radius: number; angle: number }`), or
- Remove `"curve"` from MVP scope and add to v2

---

### 2.5 🟡 MEDIUM — `CanvasState.version` = 2 Without Explanation

**Severity:** MEDIUM  
**Impact:** Minor confusion for implementors — why start at version 2?

```typescript
interface CanvasState {
  version: 2;  // Why not 1?
```

No explanation in the schema or assumptions section. If there was a v1 that was discarded, that's fine — just document it.

**Recommendation:** Add a brief note:

> Version 2 reflects the current schema; version 1 was an internal prototype format and is not used in production.

---

### 2.6 🟡 MEDIUM — Export 409 Error Code Redundant

**Severity:** MEDIUM  
**Impact:** Minor spec inconsistency — may cause unnecessary error handling code

The error table lists `409 EXPORT_IN_PROGRESS` for "Duplicate export request for same state". However, §5.3 idempotency design already handles this: re-submitting the same canvas state returns `200 OK` with the existing job (or the completed result).

If idempotency via canvas state hash always routes to the existing job, the `409` case never fires. If there's a scenario where `409` does fire (e.g., same user, different canvas state hash, but resource contention), it should be specified.

**Recommendation:** Either:

- Remove `409 EXPORT_IN_PROGRESS` from the error table (idempotency covers it), or
- Document the specific scenario where `409` fires (e.g., "same user already has a pending export, regardless of canvas state hash")

---

### 2.7 🟡 MEDIUM — GarmentInfo.imageUrl External Reference Risk

**Severity:** MEDIUM  
**Impact:** Potential SSRF vector during server-side export (per security review E4)

```typescript
interface GarmentInfo {
  imageUrl: string; // Base garment image URL
}
```

If server-side export fetches this URL for compositing, it's an SSRF vector (security review E4 flags this). The api-schema should clarify whether `imageUrl` is restricted to same-origin paths (`/storage/garments/...`) or can be external.

**Recommendation:** Add constraint to §4.1:

> `imageUrl` must be a relative path within `/storage/garments/`. External URLs are not supported in MVP.

---

### 2.8 🟢 LOW — No DELETE Assets Endpoint

**Severity:** LOW  
**Impact:** Without delete, enumeration concern (security review F4) is amplified

Users can upload but never remove assets. Combined with no auth (all uploads in shared namespace), this makes the asset list a growing public gallery. Not a blocker for MVP, but the security review flags upload enumeration as a risk.

**Recommendation:** Note in §8 Assumptions:

> `DELETE /api/v1/assets/:id` is deferred to post-MVP. MVP accepts that uploaded assets are effectively append-only.

---

### 2.9 🟢 LOW — Fonts Endpoint Has No Pagination

**Severity:** LOW  
**Impact:** None for MVP (fonts are a small static set). Add pagination note for future.

**Recommendation:** Add note to §5.5:

> MVP serves all fonts in a single response. If font count exceeds ~20 in future versions, add cursor-based pagination consistent with §3.

---

### 2.10 🟢 LOW — CORS Assumed But Not Specified

**Severity:** LOW  
**Impact:** Backend engineer may not implement CORS restrictions

The security review requires explicit CORS origin. The api-schema mentions "no CORS concerns" for fonts (§5.5) but never specifies CORS policy for the API as a whole.

**Recommendation:** Add to §3 Common Conventions:

> All endpoints include CORS headers restricted to the configured origin (default: `http://localhost:3000`). Production must set `CORS_ORIGIN` env var.

---

## 3. Cross-Reference Validation

### 3.1 Alignment with Security Review (T-048)

| Topic                | api-schema    | Security Review  | Status                                                     |
| -------------------- | ------------- | ---------------- | ---------------------------------------------------------- |
| UUID filenames       | ✅            | ✅ (A9)          | Aligned                                                    |
| Rate limiting        | ✅            | ✅ (A2/A4)       | Aligned (different limit values — schema is more granular) |
| Sharp for processing | ✅            | ✅               | Aligned                                                    |
| Export 24h purge     | ✅            | ✅ (A11)         | Aligned                                                    |
| SVG upload           | ✅ Allowed    | 🔴 Block         | **Conflict** — §2.1                                        |
| Zod validation       | Not mentioned | 🔴 Required (A3) | **Gap** — §2.3                                             |
| Body size limit      | Not specified | Required (A4)    | **Gap** — §2.2                                             |
| CORS policy          | Not specified | Required (A1)    | **Gap** — §2.10                                            |
| Text sanitization    | Not covered   | Required         | Out of scope for API schema                                |

### 3.2 Alignment with Server Codebase

| Topic                | api-schema        | config.ts        | Status                                                    |
| -------------------- | ----------------- | ---------------- | --------------------------------------------------------- |
| Rate limit (general) | 120/min per IP    | 100/min (window) | Different — schema is more granular per endpoint          |
| Rate limit (export)  | 5/min             | 20/min           | Different — schema is stricter per endpoint               |
| Upload size          | 10 MB             | 10 MB            | Aligned                                                   |
| Export dimensions    | Not specified     | 2400×3600        | Schema should reference                                   |
| MIME types           | +SVG, -GIF        | +GIF, -SVG       | **Conflict** — §2.1                                       |
| Export dir           | /storage/exports/ | server/exports/  | Different paths — schema uses abstract `/storage/` prefix |

### 3.3 Independence from Pending Architecture ADRs

The api-schema is intentionally library-agnostic for canvas state — it defines generic `Layer[]` with `type: "text" | "image"` rather than Fabric.js or Konva.js specific objects. This is the correct design:

| Pending ADR (T-044)       | Impact on api-schema                                                                             |
| ------------------------- | ------------------------------------------------------------------------------------------------ |
| Canvas library selection  | None — generic layer model works with both                                                       |
| State management approach | None — schema defines wire format, not client state                                              |
| Export strategy           | Relevant — §5.3 assumes server-side; if client-side export is chosen, export endpoint may change |
| Component architecture    | None                                                                                             |

**Risk acknowledged:** If the Architecture ADR (T-044) shifts export to client-side only, the `POST /api/v1/export` endpoint may need revision. The current design assumes server-side rendering (Sharp/Puppeteer). This is acceptable — the idempotency + polling pattern works for both approaches, but the response model (`outputs` with download URLs) assumes server-generated files.

---

## 4. What's Well Done

The following aspects of the schema are excellent and require no changes:

| Area                            | Why it's good                                                                    |
| ------------------------------- | -------------------------------------------------------------------------------- |
| **Error envelope**              | Consistent `error.code` + `error.details[]` pattern; machine-readable            |
| **Standard error codes**        | Comprehensive coverage of HTTP statuses with clear `when` column                 |
| **X-Request-Id**                | Every response traceable — critical for debugging                                |
| **Idempotency via SHA-256**     | Elegant design; prevents duplicate export work without explicit idempotency keys |
| **Cursor-based pagination**     | Standard `cursor` + `hasMore` pattern; avoids offset drift                       |
| **Dual-canvas model**           | `canvases: { nam, nu }` cleanly represents the core product concept              |
| **Layer discriminated union**   | `type: "text"                                                                    | "image"` with TypeScript narrowing is type-safe |
| **Export quality tiers**        | `draft`, `standard`, `high` — allows frontend to trade speed vs quality          |
| **Storage migration path**      | §6.3 explains URL field is migration-ready; no schema change needed              |
| **Rate limiting by endpoint**   | Different limits for upload (10/min), export (5/min), polling (60/min)           |
| **Polling guidance**            | "poll every 2-3 seconds" with 24h retention window                               |
| **Client pre-processing hints** | Resize, strip EXIF, convert to WebP — practical performance guidance             |

---

## 5. Decision Log

| #   | Decision                                                           | Rationale                                                                 |
| --- | ------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| 1   | MIME type policy must be reconciled before T-051 begins            | Three-way conflict between api-schema, config.ts, and security review     |
| 2   | SVG upload blocked for MVP per security review                     | XSS risk (scripts, foreignObject) outweighs marginal use case             |
| 3   | Zod runtime validation must be referenced in api-schema            | TypeScript interfaces are compile-time only; backend needs runtime safety |
| 4   | api-schema is library-agnostic — no Fabric.js/Konva.js dependency  | Prevents API contract from being blocked by pending T-044 ADRs            |
| 5   | Export endpoint assumes server-side rendering — acceptable for MVP | Risk acknowledged if T-044 shifts to client-side export                   |

---

## 6. Required Actions Before Sign-off

| #   | Action                                                     | Owner               | Blocks T-051? |
| --- | ---------------------------------------------------------- | ------------------- | ------------- |
| 1   | Reconcile MIME type policy (SVG, GIF) across all artifacts | Data/API + Security | ✅ Yes        |
| 2   | Add request body size limit to api-schema                  | Data/API Architect  | No            |
| 3   | Reference Zod as the runtime validation layer              | Data/API Architect  | No            |
| 4   | Define or remove `TextEffect.curve` params                 | Data/API Architect  | No            |
| 5   | Clarify `GarmentInfo.imageUrl` origin restriction          | Data/API Architect  | No            |
| 6   | Clarify or remove `409 EXPORT_IN_PROGRESS` error code      | Data/API Architect  | No            |

---

## 7. Sign-off Position

**Current disposition:** 🔄 Changes Requested

**Blocking issue:** Action #1 (MIME type policy) is the only item that should block T-051. All other findings can be addressed in parallel with or during backend implementation.

**Conditional approval:** If the team agrees on the recommended MIME type policy (`image/png, image/jpeg, image/webp` only for MVP), I will upgrade to ✅ Approved and T-051 can proceed.

---

## 8. Recommended Next Steps

1. **Immediate:** Data/API Architect and Security Architect align on MIME types → update api-schema.md
2. **Parallel:** Solution Architect completes T-044 ADRs (canvas library, state management, export strategy)
3. **After sign-off:** T-051 Backend implementation can begin with resolved api-schema
4. **Monitor:** If T-044 export strategy shifts to client-side, revisit §5.3 export endpoint design
