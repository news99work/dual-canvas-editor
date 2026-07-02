# Code Review Checklist — Dual Canvas Editor

**Version:** 1.0 | **Last updated:** 2026-07-02 UTC  
**Applies to:** All PRs in the `dual-canvas-editor` monorepo

---

## How To Use

For each PR, go through every section. Mark each item with one of:

| Mark | Meaning                                      |
| ---- | -------------------------------------------- |
| ✅   | Pass — no concerns                           |
| ⚠️   | Flag — non-blocking note / minor improvement |
| 🔴   | **Block** — must fix before merge            |
| N/A  | Not applicable to this change                |

A single 🔴 in any category **blocks** the PR.

---

## 1. TypeScript Best Practices

| #    | Check                                         | Guidance                                                                                   |
| ---- | --------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 1.1  | `strict: true` overridden anywhere?           | Must remain `true` everywhere. No per-file `// @ts-nocheck`.                               |
| 1.2  | Any `any` or `as` casts?                      | Justify each one. Prefer `unknown → narrowed` over `as`.                                   |
| 1.3  | Any `// @ts-ignore`?                          | 🔴 Always block. Use `@ts-expect-error` with a comment if truly needed.                    |
| 1.4  | Imports use `.js` extensions where needed?    | Server uses `NodeNext` module resolution — dynamic imports may need `.js` extensions.      |
| 1.5  | Exported types public but used nowhere?       | Remove or mark `@internal`. Every public type adds to API surface.                         |
| 1.6  | `enum` vs `const` object / union?             | Prefer `as const` + union type for tree-shaking. Only use `enum` if required by a library. |
| 1.7  | Array/object mutability appropriate?          | Review `readonly` usage on props, config objects, and return types.                        |
| 1.8  | Generic constraints tight enough?             | `<T>` with no constraint is a smell. Use `extends` to narrow.                              |
| 1.9  | Discriminated unions used for state machines? | Every switch on `status`/`kind` should exhaust via `never` check.                          |
| 1.10 | `tsc` passes with `--noEmit`?                 | CI guarantees this, but verify locally.                                                    |

---

## 2. React Patterns

| #    | Check                                        | Guidance                                                                                                     |
| ---- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 2.1  | Component files: one component per file?     | Exception: small private sub-components colocated.                                                           |
| 2.2  | `useEffect` dependencies complete?           | No missing deps. If intentional, comment why.                                                                |
| 2.3  | Any `useEffect` that should be event-driven? | Effects for data fetching → prefer React Query / SWR or Suspense. Effects for derived state → use `useMemo`. |
| 2.4  | `useCallback` / `useMemo` justified?         | Only when passed to memoized children or heavy computation. Not for premature optimization.                  |
| 2.5  | Keys stable and unique?                      | No index keys on dynamic lists. Use stable IDs.                                                              |
| 2.6  | State colocated at closest ancestor?         | No prop drilling past 2 levels without composition/context.                                                  |
| 2.7  | Loading / error / empty states handled?      | Every data-dependent component must handle all three.                                                        |
| 2.8  | Error boundary present?                      | At least one per major feature area (canvas, controls, preview).                                             |
| 2.9  | Memoization strategy consistent?             | `React.memo` only on components that re-render with same props.                                              |
| 2.10 | Hooks follow rules of hooks?                 | No conditional hooks, hooks called at top level only.                                                        |

---

## 3. Security

| #    | Check                                             | Guidance                                                                                   |
| ---- | ------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 3.1  | CORS restricted to known origins?                 | 🔴 `cors()` with no options = block. Must use env-based config.                            |
| 3.2  | Rate limiting wired on all routes?                | 🔴 Missing rate limit on any route = block. Stricter for auth/export.                      |
| 3.3  | CSP headers configured?                           | At minimum: `default-src 'self'`. Canvas needs `img-src` for uploads.                      |
| 3.4  | Security headers present?                         | `X-Content-Type-Options`, `X-Frame-Options`, `HSTS` in production.                         |
| 3.5  | User input sanitized before render?               | 🔴 Any `dangerouslySetInnerHTML` or raw `innerHTML` = block without sanitizer (DOMPurify). |
| 3.6  | File uploads validated by MIME + magic bytes?     | Check both. No trusting `Content-Type` header alone.                                       |
| 3.7  | Upload file size limited?                         | Server-side limit with `multer` `limits.fileSize`. Client-side limit as UX guard only.     |
| 3.8  | Path traversal prevented on file paths?           | Sanitize filenames. No user-controlled path segments in `fs` calls.                        |
| 3.9  | Secrets/env vars not exposed to client?           | 🔴 `process.env` in client code = block (Vite-safe `import.meta.env` only).                |
| 3.10 | Trust proxy configured for reverse-proxy deploys? | `app.set('trust proxy', 1)` required for `X-Forwarded-For`.                                |
| 3.11 | Helmet or equivalent security headers middleware? | Required before production deploy.                                                         |

---

## 4. Performance

| #    | Check                                        | Guidance                                                                                        |
| ---- | -------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| 4.1  | Canvas re-renders bounded?                   | No full canvas redraw on every keystroke. Use dirty-rect or layer caching.                      |
| 4.2  | Large lists virtualized?                     | Asset library, layer list → use `react-window` or `@tanstack/virtual`.                          |
| 4.3  | Images lazy-loaded?                          | `loading="lazy"` on thumbnail assets.                                                           |
| 4.4  | Bundle size checked?                         | Client-side deps must be tree-shakeable. No full Fabric.js / Konva.js without analyzing impact. |
| 4.5  | Debounce/throttle on rapid inputs?           | Color picker, slider, text input → debounce canvas update to 16ms (60fps).                      |
| 4.6  | No synchronous blocking in event handlers?   | Canvas operations → Web Worker or `requestAnimationFrame`.                                      |
| 4.7  | Server responses compressed?                 | Express `compression` middleware or reverse-proxy gzip.                                         |
| 4.8  | API responses paginated?                     | Asset lists, design history → paginate, don't return all.                                       |
| 4.9  | Memory leaks?                                | Clean up canvas references, event listeners, intervals, subscriptions in `useEffect` return.    |
| 4.10 | `sharp` streaming used for image processing? | Prefer pipes over buffering entire image in memory.                                             |

---

## 5. Accessibility (a11y)

| #    | Check                                        | Guidance                                                                  |
| ---- | -------------------------------------------- | ------------------------------------------------------------------------- |
| 5.1  | Canvas surfaces have `role` + `aria-label`?  | 🔴 Unlabeled canvas = block. `role="application"` with descriptive label. |
| 5.2  | All interactive elements keyboard-reachable? | Tab order logical. No `tabindex` > 0.                                     |
| 5.3  | Focus visible on all interactive elements?   | `:focus-visible` styles present. No `outline: none` without replacement.  |
| 5.4  | Color contrast meets WCAG AA (4.5:1)?        | Verify with devtools. Dark theme accent (#6c63ff) on #0f1117 → check.     |
| 5.5  | Form inputs have labels?                     | Every input associated with a `<label>` or `aria-labelledby`.             |
| 5.6  | Error messages conveyed to screen readers?   | Use `role="alert"` or `aria-live` region for form errors.                 |
| 5.7  | Touch targets ≥ 44×44px?                     | Mobile canvas tools → minimum touch target size.                          |
| 5.8  | `lang` attribute correct?                    | `lang="vi"` if Vietnamese UI, `lang="en"` if English.                     |
| 5.9  | Reduced motion respected?                    | Check `prefers-reduced-motion` for animations.                            |
| 5.10 | Semantically correct HTML?                   | `<button>` for buttons, not `<div onclick>`.                              |

---

## 6. Testing Coverage

| #    | Check                             | Guidance                                                           |
| ---- | --------------------------------- | ------------------------------------------------------------------ |
| 6.1  | Unit tests for business logic?    | Zod schemas, config, image processing, state reducers.             |
| 6.2  | Component smoke tests?            | Each component renders without error.                              |
| 6.3  | API route tests?                  | Health, upload, export endpoints tested with supertest or similar. |
| 6.4  | Canvas sync logic tested?         | Dual-canvas state reconciliation → unit test with state snapshots. |
| 6.5  | Image processing pipeline tested? | `sharp` transforms, color replacement → test with fixtures.        |
| 6.6  | Error states tested?              | Test 4xx/5xx responses, network failures, file-too-large.          |
| 6.7  | Accessibility tests?              | `jest-axe` or `@axe-core/playwright` integrated.                   |
| 6.8  | CI runs tests?                    | 🔴 No test step in CI = block once tests exist.                    |
| 6.9  | Coverage threshold set?           | Target: 80% lines for utils/services, 60% for components.          |
| 6.10 | E2E smoke test for critical path? | Upload → edit → export flow.                                       |

---

## 7. Maintainability

| #    | Check                                 | Guidance                                                                   |
| ---- | ------------------------------------- | -------------------------------------------------------------------------- |
| 7.1  | Unused dependencies?                  | 🔴 Dependencies installed but not imported = block. Remove.                |
| 7.2  | Magic numbers extracted to constants? | Named constants or config entries.                                         |
| 7.3  | Function length < 40 lines?           | Flag if longer. Single responsibility.                                     |
| 7.4  | File length < 300 lines?              | Flag if longer. Split by concern.                                          |
| 7.5  | Comments explain "why", not "what"?   | Remove redundant comments. Code should be self-documenting.                |
| 7.6  | Error messages user-friendly?         | Production errors: no stack traces. Use error codes for debugging.         |
| 7.7  | Logging structured?                   | `console.log` → structured logger with levels (info, warn, error).         |
| 7.8  | Config externalized?                  | No hardcoded ports, URLs, keys. Use env vars with defaults in `config.ts`. |
| 7.9  | Build artifacts in `.gitignore`?      | `dist`, `.tsbuildinfo`, `node_modules`, `coverage`.                        |
| 7.10 | Consistent naming convention?         | PascalCase components, camelCase functions/vars, UPPER_SNAKE constants.    |

---

## 8. CSS / Styling

| #   | Check                               | Guidance                                                |
| --- | ----------------------------------- | ------------------------------------------------------- |
| 8.1 | CSS custom properties used?         | Design tokens in `:root`. No magic color values.        |
| 8.2 | Responsive breakpoints defined?     | Mobile-first media queries.                             |
| 8.3 | No `!important`?                    | Flag and justify every occurrence.                      |
| 8.4 | `z-index` values managed?           | Define a z-index scale (e.g., 1-100). No random values. |
| 8.5 | `box-sizing: border-box` universal? | Already in reset — don't override.                      |

---

## Quick Reference: Blockers (🔴 = auto-reject)

1. `cors()` without restricted origins
2. No rate limiting on API routes
3. `dangerouslySetInnerHTML` without DOMPurify
4. Any `ts-ignore` or `any` without justification
5. Unlabeled canvas surfaces (a11y)
6. Unused production dependencies
7. Secrets exposed to client bundle
8. Missing error boundary in new feature areas
9. File upload without server-side size/MIME validation
10. No CI test step once test files exist
