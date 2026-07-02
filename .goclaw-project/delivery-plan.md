# Dual Canvas Editor MVP — Delivery Plan

**Project:** Dual Canvas Editor MVP  
**Role:** pa-implementation-planner (reassigned from pa-delivery-pm)  
**Date:** 2026-07-02  
**Status:** DRAFT — for Director review

---

## 1. Project Snapshot

| Dimension            | Detail                                                                                 |
| -------------------- | -------------------------------------------------------------------------------------- |
| **Stack**            | React (Vite) + Fabric.js / Express 5 + Sharp / pnpm monorepo                           |
| **Repo**             | `dual-canvas-editor/` — client/ + server/                                              |
| **MVP Scope**        | Image upload, asset library, dual-canvas editor, export (PNG/JPEG/WebP), font selector |
| **Auth Model**       | No-auth MVP (ADR-005)                                                                  |
| **Overall Progress** | ~65% (CURRENT_STATUS.md)                                                               |
| **State**            | 🟡 Phase 1 (Implementation) nearly done; Critical path BLOCKED at T-051                |

---

## 2. Milestone Plan

### M1: Discovery & Foundation ✅ COMPLETE (2026-07-02 ~15:45–17:10)

| Task ID     | Task                                 | Owner                     | Outcome                                                                      |
| ----------- | ------------------------------------ | ------------------------- | ---------------------------------------------------------------------------- |
| T-043       | Repo bootstrap + toolchain           | pa-devops-sre             | ✅ Monorepo pnpm, Vite + Express 5 scaffold                                  |
| T-041/T-014 | PRD + User Stories                   | pa-brief-ba               | ✅ 4 module scope: upload, canvas, assets, export                            |
| T-042/T-015 | MVP definition + strategy            | pa-product-strategist     | ✅ MVP shape, non-goals, metrics                                             |
| T-044       | Architecture + ADRs (7 decisions)    | pa-solution-architect     | ✅ Fabric.js, Sharp, Zustand, local→S3, no-auth, monorepo, idempotent export |
| T-063/T-013 | UX personas, journeys, touch UX      | pa-ux-researcher          | ✅ 2 personas, task flows, mobile touch guidance                             |
| T-047       | API/Data schemas + contracts         | pa-data-api-architect     | ✅ 5 endpoints, 4 schemas, error envelope                                    |
| T-048       | Security review                      | pa-security-architect     | ✅ 15 action items (conditional sign-off)                                    |
| T-020       | API schema architecture review       | pa-solution-architect     | ✅                                                                           |
| T-021       | API schema security review           | pa-security-architect     | ✅ 4 HIGH findings (must-fix before T-051)                                   |
| T-049       | Implementation plan + task breakdown | pa-implementation-planner | ✅ 29 tasks across 4 phases                                                  |
| T-007       | Toolchain reconciliation             | pa-devops-sre             | ✅ pnpm install green, lint/typecheck/build passing                          |

**Gate:** All discovery artifacts recorded. Architecture lock-in on Fabric.js + Sharp.

---

### M2: Core Implementation 🔄 IN PROGRESS (~80% complete)

| Task ID | Task                                       | Owner                   | Progress | Status            |
| ------- | ------------------------------------------ | ----------------------- | -------- | ----------------- |
| T-051   | Backend API + image processing             | pa-backend-engineer     | 75%      | 🔄 ⚠️ **STALLED** |
| T-052   | Frontend Canvas Editor (React + Fabric.js) | pa-frontend-engineer    | 100%     | ✅                |
| T-008   | Route/runtime reconciliation               | pa-integration-engineer | 100%     | ✅                |
| T-011   | Dashboard wiring với dữ liệu thật          | pa-frontend-engineer    | 100%     | ✅                |

**M2 Gate — Blockers:**

- T-051 unfinished: 4 items remain (see §4 Critical Path)

---

### M3: Integration & Quality 🔄 IN PROGRESS (~50% complete)

| Task ID     | Task                              | Owner                   | Progress | Status                  |
| ----------- | --------------------------------- | ----------------------- | -------- | ----------------------- |
| T-054       | Wire frontend ↔ backend, E2E flow | pa-integration-engineer | 60%      | ⛔ **BLOCKED by T-051** |
| T-053       | QA Test Plan                      | pa-qa-automation        | 100%     | ✅                      |
| T-055/T-018 | Code review                       | pa-code-reviewer        | 100%     | ✅                      |
| T-025       | QA testing gaps from code review  | pa-code-reviewer        | —        | 🔄 In progress          |

**M3 Gate — Requirements:**

- T-051 Ship (backend buildable + runnable)
- T-054 E2E flow verification (upload→canvas, asset sync, export roundtrip, font selector)
- T-025 QA gaps identified and addressed

---

### M4: Polish & Discovery Gap ⏳ PENDING

| Task ID | Task                                  | Owner                                                | Status     |
| ------- | ------------------------------------- | ---------------------------------------------------- | ---------- |
| T-022   | Research Fabric.js vs Konva.js        | pa-solution-architect (reassigned)                   | 🔄 10%     |
| T-023   | UI Visual System + responsive layouts | pa-solution-architect (reassigned, blocked by T-022) | ⏳ Pending |
| T-056   | Docs: README, dev guide, API docs     | pa-tech-writer                                       | ⏳ Pending |
| T-061   | Release readiness                     | pa-release-captain                                   | ⏳ Pending |

**Note on reassignments:**

- T-022 (originally pa-deep-research, kimi-k2.5) & T-023 (originally pa-ui-design-lead, MiniMax-M3) both reassigned to pa-solution-architect due to platform bug (MiniMax/kimi models not receiving dispatch).
- **Risk:** pa-solution-architect already handled Architecture (T-044) + API review (T-020). Research task is scope-creep for this role. T-023 (UI design) is typically pa-ui-design-lead specialty.

---

### M5: Release ⏳ PENDING

| Task ID | Task                           | Owner              | Dependencies       |
| ------- | ------------------------------ | ------------------ | ------------------ |
| T-061   | Final readiness, release notes | pa-release-captain | All above complete |
| T-056   | Complete documentation         | pa-tech-writer     | T-051 + T-054 ship |

---

## 3. Dependency Graph

```
M1 (Discovery)
 │
 ├── T-044 Architecture ────┬── T-047 Schemas ──┬── T-048 Security
 │                          │                    ├── T-020 Arch Review
 │                          │                    └── T-021 Security Review
 │                          │
 │                          ├── T-049 Impl Plan
 │                          └── T-043 Repo Bootstrap ── T-007 Toolchain
 │
 ▼
M2 (Implementation)
 │
 ├── T-051 Backend (75%) ← blocked by T-021 (4 HIGH sec findings)
 │      │
 │      └──⛔ BLOCKS ── T-054 Integration (60%)
 │                            │
 │                            └──⛔ BLOCKS ── M3 Gate
 │
 ├── T-052 Frontend (100% ✅)
 │
 └── T-022 Research (10%) ← reassigned
        │
        └── BLOCKS ── T-023 UI Design
                            │
                            └──⛔ BLOCKS ── Frontend polish decisions
```

---

## 4. Critical Path Analysis

### 🔴 Priority 0 — Unblock Now

| Item                            | Detail                                                                                                        | Impact                                         |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| **T-051.1: Static serving URL** | `upload.service.ts` returns `/api/v1/storage/uploads/` but mount is at `/api/v1/storage` → all asset URLs 404 | Blocks: T-054 E2E (can't load uploaded images) |
| **T-051.4: Build compilation**  | `dist/` only has partial output (config.js + index.js); missing all routes, services, middleware              | Blocks: T-054 live E2E, T-061 release          |

**Estimated time to fix T-051:** ~1-2 hours for remaining 4 items (URL fix + tests + fonts + build)

---

### 🟡 Priority 1 — Soon After Unblock

| Item              | Detail                                                                                      | Impact                               |
| ----------------- | ------------------------------------------------------------------------------------------- | ------------------------------------ |
| **T-054 Phase 4** | Live E2E: upload→canvas, asset sync, export roundtrip, font selector, mobile/desktop sanity | Blocks: M3 Gate complete, T-056 Docs |
| **T-025 QA Gaps** | Testing gaps from code review — may reveal regression surface                               | Must complete before T-061 Release   |

---

### 🟢 Priority 2 — Can Run in Parallel

| Item                | Detail                                | Notes                                                                          |
| ------------------- | ------------------------------------- | ------------------------------------------------------------------------------ |
| **T-022 Research**  | Fabric.js vs Konva.js comparison      | Already late (T-052 built with Fabric.js per ADR-001) — now informational only |
| **T-023 UI System** | Visual tokens, responsive breakpoints | Can be done offline; mostly design artifact                                    |
| **T-056 Docs**      | README, dev guide                     | Can start structure now, fill content after E2E                                |

---

## 5. Risk Register

### 🔴 HIGH — Active Blockers

| ID  | Risk                                                                           | Severity | Mitigation                                                                                                                                                            | Owner                   |
| --- | ------------------------------------------------------------------------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| R1  | **T-051 Backend stalled** — 4 items unfinished; agent unresponsive for ~55 min | 🔴 HIGH  | Director should re-ping pa-backend-engineer or reassign remaining 4 items to pa-solution-architect (who can fix URL/bug and hand off to integration)                  | pa-director             |
| R2  | **T-054 Integration blocked** — 60% complete, waiting on T-051                 | 🔴 HIGH  | Prepare E2E checklist now; execute immediately when T-051 ships                                                                                                       | pa-integration-engineer |
| R3  | **T-022 Research 10%** — slow start, blocks T-023 UI                           | 🔴 HIGH  | T-052 already shipped with Fabric.js (ADR-001 decided). Research is now retrospective — consider canceling or narrowing scope to "Fabric.js best practice supplement" | pa-director             |

### 🟡 MEDIUM — Watch Items

| ID  | Risk                                                                                                                 | Severity  | Mitigation                                                                                                                                                                       |
| --- | -------------------------------------------------------------------------------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R4  | **4 HIGH security findings** from T-021 not yet resolved in T-051 code                                               | 🟡 MEDIUM | Verify T-051 addressed: (1) MIME type policy, (2) upload size limits, (3) path traversal prevention, (4) rate limiting. Confirm in code review T-055                             |
| R5  | **Font asset files** — `fonts.json` references 7 WOFF2 files that don't exist on disk                                | 🟡 MEDIUM | Either generate placeholder font files or stub font endpoint for MVP                                                                                                             |
| R6  | **0 unit tests for backend core** — upload.service, export.service, cleanup.service have NO test files               | 🟡 MEDIUM | Tests exist for route/health, route/fonts, middleware/error-handler, middleware/request-id, services/asset.service, services/export.service. Gap: upload.service.test.ts missing |
| R7  | **Reassignment quality risk** — T-022/T-023 assigned to pa-solution-architect who is not a researcher or UI designer | 🟡 MEDIUM | Accept lower-fidelity output or try pa-deep-research/pa-ui-design-lead again with different model config                                                                         |

### 🟢 LOW — Monitor

| ID  | Risk                                                                                                             | Detail                                                |
| --- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| R8  | **Docs completeness** — T-056 not started; may ship without good README                                          | Acceptable for MVP if code is self-documenting        |
| R9  | **Release checklist** — T-061 not started                                                                        | Standard; should take <1 hour when all tasks complete |
| R10 | **Code review findings** — T-055 identified issues in code-review.md (22K file); need verification all addressed | QA T-025 in progress                                  |

---

## 6. Task Resolution Recommendations

### Immediate Actions for Director

| #   | Action                                                                                                                    | Rationale                                                                         |
| --- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 1   | **Unblock T-051 immediately** — re-ping pa-backend-engineer (deepseek-v4-flash[1m]) or reassign to pa-solution-architect  | Only 4 items remain; backend is 75% done. T-054 and M3-M5 are all blocked on this |
| 2   | **Consider canceling T-022** — Fabric.js already chosen (ADR-001) and T-052 already shipped with it                       | Research is 10% after 15 min. Output now has zero impact on implementation        |
| 3   | **Re-dispatch T-023 to pa-ui-design-lead** if T-022 canceled — or accept pa-solution-architect output as "minimal viable" | UI design needs design eye, not architecture eye                                  |
| 4   | **Start T-056 (Docs) in parallel** — can scaffold structure now                                                           | No dependencies on code changes for structure/README                              |
| 5   | **Start T-025 (QA gaps) now** — already assigned to pa-code-reviewer                                                      | Runs in parallel with unblock                                                     |

### Optimistic Timeline (if T-051 unblocked within 1 hour)

```
Now (19:54)  ──▶  T-051.1 URL fix (15 min)
              ──▶  T-051.4 Build fix (15 min)
              ──▶  T-051.2 + .3 Tests + fonts (60 min)
~21:15        ──▶  T-054 E2E integration (45 min)
~22:00        ──▶  M3 Gate ✅
~22:30        ──▶  T-025 QA gaps review complete
~23:00        ──▶  T-056 Docs complete
~23:30        ──▶  T-061 Release ready ✅
```

---

## 7. Decision Log

| ID  | Decision                                                               | Rationale                                                                           |
| --- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| D1  | M1 gate = COMPLETE                                                     | All discovery artifacts delivered; architecture locked on Fabric.js + Sharp         |
| D2  | M2 gate = NOT MET                                                      | T-051 backend not buildable/runnable; 4 items outstanding                           |
| D3  | T-022 can be canceled without project impact                           | Fabric.js selection is final (ADR-001). Research was pre-decision task now obsolete |
| D4  | T-023 needs UI design expertise, not architecture                      | Output quality risk if pa-solution-architect does visual design                     |
| D5  | No-auth MVP (ADR-005) eliminates auth-related security risks for M1-M3 | Reduces attack surface; acceptable for local-only MVP                               |

---

## 8. Handoff Notes

- This plan is based on CURRENT_STATUS.md snapshot + task board at 2026-07-02 ~19:54 ICT
- The `.goclaw-project/` directory created for durable artifacts per team convention
- pa-solution-architect is overloaded: T-022 (research) + T-023 (UI) on top of completed T-044 + T-020 — monitor for quality degradation
- Security findings (T-021) need explicit verification in T-051 shipped code before M3 gate
- All platform bug reassignments (MiniMax/kimi models) should be tracked as systemic risk across projects
