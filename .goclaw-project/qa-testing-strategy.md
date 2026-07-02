# QA Testing Strategy — Dual Canvas Editor

**Version:** 1.0 | **Date:** 2026-07-02 UTC  
**Author:** pa-code-reviewer (reassigned from pa-qa-automation)  
**Status:** Evaluation & Recommendation

---

## 1. Executive Summary

The codebase has progressed significantly since the initial code review finding M-03 ("No test framework, no CI test step"). Vitest is now installed and configured in both `client/` and `server/`, with **7 test files** covering middleware, routes, services, and API client contracts. This strategy evaluates what exists, identifies remaining gaps, and recommends next actions.

---

## 2. Current State Assessment

### 2.1 What Exists

| Layer  | Test File                          | Type                     | Status                     |
| ------ | ---------------------------------- | ------------------------ | -------------------------- |
| Server | `middleware/request-id.test.ts`    | Unit                     | ✅ Written                 |
| Server | `middleware/error-handler.test.ts` | Unit                     | ✅ Written                 |
| Server | `routes/health.test.ts`            | Integration (supertest)  | ✅ Written                 |
| Server | `routes/fonts.test.ts`             | Integration (filesystem) | ✅ Written                 |
| Server | `services/asset.service.test.ts`   | Unit                     | ✅ Written                 |
| Server | `services/export.service.test.ts`  | Unit                     | ✅ Written                 |
| Client | `__tests__/api-contracts.test.ts`  | Contract                 | ✅ Written (comprehensive) |

### 2.2 Vitest Configuration

| Config              | Client                    | Server                    |
| ------------------- | ------------------------- | ------------------------- |
| File                | `client/vitest.config.ts` | `server/vitest.config.ts` |
| Environment         | `node`                    | `node`                    |
| Globals             | `true`                    | `true`                    |
| Coverage provider   | `v8`                      | `v8`                      |
| Coverage thresholds | 80% (api layer)           | Not set                   |
| Path alias          | `@` → `./src`             | None                      |

### 2.3 Package Scripts

| Script       | Client       | Server       |
| ------------ | ------------ | ------------ |
| `test`       | `vitest run` | `vitest run` |
| `test:watch` | `vitest`     | `vitest`     |
| CI test step | ❌ Not in CI | ❌ Not in CI |

---

## 3. Framework Evaluation

### 3.1 Vitest — Verdict: ✅ Correct Choice

**Verdict:** Vitest is the right framework. No alternative needed.

**Reasons:**

| Criterion          | Vitest                                        | Jest                               | Mocha + Chai      |
| ------------------ | --------------------------------------------- | ---------------------------------- | ----------------- |
| Vite compatibility | ✅ Native (same transform pipeline)           | ⚠️ Needs `ts-jest` or `babel-jest` | ⚠️ Separate setup |
| Speed (ESM)        | ✅ Fast (esbuild transform)                   | ⚠️ Slower (no native ESM in Jest)  | ⚠️ Manual config  |
| TypeScript         | ✅ Zero-config with `tsx`                     | ⚠️ Needs `ts-jest`                 | ❌ Manual         |
| Watch mode         | ✅ Smart (only changed files)                 | ✅ Good                            | ⚠️ Basic          |
| Coverage (v8)      | ✅ Built-in v8 provider                       | ✅ Built-in                        | ⚠️ Needs `nyc`    |
| Snapshot testing   | ✅ Built-in                                   | ✅ Built-in                        | ❌ Needs plugin   |
| API compatibility  | ✅ Jest-compatible (`describe`/`it`/`expect`) | ✅ Native                          | ❌ Different      |

**Bottom line:** The team already chose correctly. Vitest is the natural choice for a Vite-based React project. It shares the same transform pipeline (no double-config), is faster in ESM mode, and the API is near-identical to Jest.

### 3.2 Gaps in Current Vitest Setup

| Gap                                       | Impact                               | Priority  |
| ----------------------------------------- | ------------------------------------ | --------- |
| Client environment is `node`, not `jsdom` | Can't test React components / DOM    | 🔴 HIGH   |
| `@testing-library/react` not installed    | No component render tests            | 🔴 HIGH   |
| CI has no `test` step                     | Tests run locally only               | 🔴 HIGH   |
| Server coverage thresholds not set        | No enforcement on server code        | 🟡 MEDIUM |
| No `vitest` workspace config at root      | Can't run all tests with one command | 🟡 MEDIUM |

---

## 4. Coverage Target Evaluation

### 4.1 Proposed vs Current

| Target         | CODING-STANDARDS.md | Current Effective                             | Evaluation                    |
| -------------- | ------------------- | --------------------------------------------- | ----------------------------- |
| Utils/Services | 80%                 | Server services written but threshold not set | ✅ Appropriate                |
| Components     | 60%                 | 0% — no component tests exist                 | ✅ Appropriate (once started) |
| Integration    | 70%                 | Health + fonts routes tested                  | ✅ Appropriate                |
| Client API     | Not specified       | 80% threshold configured                      | ✅ Good addition              |

### 4.2 Adjustment Recommendation

The 60% component threshold is **appropriate for MVP** but should increase to **75% for production**. For canvas-heavy apps:

- **Canvas rendering logic** → treat as "utility" (80% target), not "component"
- **UI chrome** (toolbar, panels) → 60% is fine
- **State management** (Zustand store) → 80% (pure logic, easy to test)

---

## 5. Missing Test Types — Gap Analysis

### 5.1 🔴 Critical Gaps

| Gap                        | What's Needed                                       | Tools                              |
| -------------------------- | --------------------------------------------------- | ---------------------------------- |
| **Component render tests** | React component smoke tests, user interaction tests | `@testing-library/react` + `jsdom` |
| **CI test step**           | GitHub Actions step: `pnpm test`                    | CI workflow update                 |
| **Error boundary tests**   | Verify fallback UI renders on canvas failure        | `@testing-library/react`           |

### 5.2 🟡 High Priority (Before Canvas Code)

| Gap                             | What's Needed                                                | Tools              |
| ------------------------------- | ------------------------------------------------------------ | ------------------ |
| **Client jsdom environment**    | `environment: 'jsdom'` in client vitest config               | `vitest` + `jsdom` |
| **API route integration tests** | Upload route test (supertest + temp file), export route test | `supertest`        |
| **Schema validation tests**     | Zod schema tests for canvas-state, export-request, upload    | Vitest unit tests  |
| **Rate limiter tests**          | Verify rate limiting returns 429                             | `supertest` + loop |

### 5.3 🟡 Medium Priority (When Canvas Lands)

| Gap                           | What's Needed                                                       | Tools                                  |
| ----------------------------- | ------------------------------------------------------------------- | -------------------------------------- |
| **Canvas sync logic**         | State reconciliation: layer add/delete/reorder across dual canvases | Vitest unit tests with state snapshots |
| **Undo/redo stack**           | Immutable state snapshot tests                                      | Vitest                                 |
| **Image processing pipeline** | `sharp` transform tests: resize, format convert, color replacement  | Vitest + fixture images                |
| **Export pipeline**           | End-to-end: canvas state → export job → file output                 | Vitest + temp dirs                     |
| **Accessibility tests**       | `jest-axe` static checks on components                              | `jest-axe` + `@testing-library/react`  |
| **Visual regression**         | Screenshot comparison for canvas render output                      | Storybook + Chromatic (or Percy)       |

### 5.4 🟢 Low Priority (Post-MVP)

| Gap                      | What's Needed                                | Tools                       |
| ------------------------ | -------------------------------------------- | --------------------------- |
| **E2E smoke test**       | Upload → edit → export user flow             | Playwright                  |
| **Performance tests**    | Canvas render FPS budget, bundle size budget | Vitest + BundleWatch        |
| **i18n tests**           | Key coverage for Vietnamese/English          | Vitest + i18n mock          |
| **Mobile/tablet layout** | Viewport-specific tests                      | Playwright device emulation |

---

## 6. Canvas-Specific Testing Strategy

Canvas apps present unique testing challenges because Fabric.js/Konva.js rely on browser Canvas API, which is not available in `jsdom`. Recommended approach:

### 6.1 Three-Layer Strategy

```
┌─────────────────────────────────────┐
│  Layer 1: Logic (Vitest + node)     │  ← State, sync, undo/redo, schemas
│  ✅ Runs in CI, fast, reliable      │
├─────────────────────────────────────┤
│  Layer 2: Rendering (jsdom mock)    │  ← Canvas surface setup, event wiring
│  ⚠️ Mock canvas API calls           │
├─────────────────────────────────────┤
│  Layer 3: Visual (real browser)     │  ← Actual canvas rendering, export
│  🐢 Playwright with headed browser  │
└─────────────────────────────────────┘
```

### 6.2 Layer 1 — Pure Logic Tests (CI-friendly)

```typescript
// Example: dual-canvas sync reducer
describe('canvasSyncReducer', () => {
  it('adds layer to both canvases when synced', () => {
    const state = createInitialState();
    const next = canvasSyncReducer(state, addLayer('nam', { type: 'text', content: 'Hello' }));
    expect(next.canvases.nam.layers).toHaveLength(1);
    expect(next.canvases.nu.layers).toHaveLength(1); // synced
  });
});
```

### 6.3 Layer 2 — Mocked Canvas Tests

```typescript
// Example: Fabric.js interaction mock
vi.mock('fabric', () => ({
  Canvas: vi.fn().mockImplementation(() => ({
    add: vi.fn(),
    remove: vi.fn(),
    renderAll: vi.fn(),
    on: vi.fn(),
  })),
}));

describe('CanvasEditor', () => {
  it('initializes fabric canvas on mount', () => {
    render(<CanvasEditor width={800} height={600} />);
    expect(fabric.Canvas).toHaveBeenCalled();
  });
});
```

### 6.4 Layer 3 — Visual Regression (Post-MVP)

Use Playwright screenshots for critical visual paths:

- Garment template renders correctly
- Color replacement produces expected output
- Export PNG matches canvas preview

---

## 7. CI Integration Recommendations

### 7.1 Required CI Changes

Add to `.github/workflows/ci.yml` after the `pnpm install` step:

```yaml
- name: Test
  run: pnpm test

- name: Coverage report
  if: always()
  run: pnpm coverage:report # generates lcov/cobertura
```

### 7.2 Root-Level Test Script

Add to root `package.json`:

```json
{
  "scripts": {
    "test": "pnpm --parallel test",
    "test:watch": "pnpm --parallel test:watch",
    "coverage:report": "pnpm --parallel coverage:report"
  }
}
```

### 7.3 Coverage Upload (Optional, Post-MVP)

- **Codecov** or **Coveralls** for PR comments with coverage diff
- Set minimum coverage gate in CI (fail if drops)

---

## 8. Timing Recommendation

### Phase A — Immediately (before next PR merge)

| Action                                                         | Effort | Owner                |
| -------------------------------------------------------------- | ------ | -------------------- |
| 1. Switch client vitest env to `jsdom`                         | 5 min  | pa-frontend-engineer |
| 2. Install `@testing-library/react` + `jsdom` in client        | 5 min  | pa-frontend-engineer |
| 3. Add `pnpm test` step to CI workflow                         | 5 min  | pa-devops-sre        |
| 4. Add root `test`/`test:watch` scripts                        | 2 min  | pa-devops-sre        |
| 5. Set server coverage thresholds (50% initially, ramp to 70%) | 2 min  | pa-backend-engineer  |

### Phase B — With Canvas Code (TBD after canvas lib decision)

| Action                                        | Effort |
| --------------------------------------------- | ------ |
| Component smoke tests for existing components | 2-4h   |
| Canvas state management unit tests            | 4-6h   |
| Upload/export route integration tests         | 3-4h   |
| Zod schema validation tests                   | 1-2h   |
| Accessibility static checks (jest-axe)        | 1-2h   |

### Phase C — Pre-Production

| Action                         | Effort           |
| ------------------------------ | ---------------- |
| E2E smoke test (Playwright)    | 4-8h             |
| Visual regression setup        | 8-16h (one-time) |
| Performance budget enforcement | 2-4h             |

---

## 9. Quality Gate Checklist

Before approving any PR, verify:

| Gate                      | Check                                   |
| ------------------------- | --------------------------------------- |
| ✅ Unit tests pass        | `pnpm test` exits 0                     |
| ✅ No coverage regression | Coverage does not drop on changed files |
| ✅ New logic has tests    | >0 new test assertions for new behavior |
| ✅ Integration tests pass | API contract tests don't break          |
| ✅ CI green               | All jobs pass                           |
| ⬜ Component tests        | Once `@testing-library/react` is set up |

---

## 10. Summary & Recommendations

### What's Good

- Vitest is correctly chosen and already wired in both packages
- 7 test files with good coverage of middleware, services, routes, and API contracts
- API contract tests are unusually comprehensive (timeouts, network errors, idempotency)
- Coverage infrastructure (v8 provider) is configured

### What's Missing (Blockers)

1. 🔴 **CI has no test step** — tests only run locally
2. 🔴 **Client vitest uses `node` env** — can't test React components; needs `jsdom`
3. 🔴 **`@testing-library/react` not installed** — zero component render tests
4. 🔴 **No canvas-specific testing strategy** — this will block when Fabric.js/Konva.js lands
5. 🟡 **Server coverage thresholds not set**

### Recommended Next Steps

1. Fix the 3 CI/infra blockers (Phase A — ~20 min total)
2. Write component smoke tests for existing App shell (Phase B)
3. Plan Layer 1 canvas logic tests before canvas library integration
4. Defer visual regression (Layer 3) to post-MVP
5. Coordinate with pa-qa-automation for E2E strategy once canvas code lands
