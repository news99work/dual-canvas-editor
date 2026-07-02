# Review Criteria — Dual Canvas Editor

**Version:** 1.0 | **Last updated:** 2026-07-02 UTC  
**Purpose:** Defines what gets **Approved**, **Changes Requested**, or **Blocked** in code review.

---

## Review Tiers

Every PR receives one of four dispositions:

| Decision                 | Meaning                                                                                                       | SLA                            |
| ------------------------ | ------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| **✅ Approved**          | All checklist items pass. Merge at author's discretion.                                                       | Review within 4 business hours |
| **💬 Commented**         | Minor observations only. No blocking issues. Merge allowed.                                                   | Review within 4 business hours |
| **🔄 Changes Requested** | Non-critical issues found (MEDIUM severity or below). Author must address or justify, then re-request review. | Review within 8 business hours |
| **🔴 Blocked**           | At least one CRITICAL or HIGH-severity issue found. Merge prohibited until resolved.                          | Flag immediately               |

---

## What Gets Approved (✅)

A PR qualifies for **immediate approval** when:

1. **Zero** CRITICAL severity findings
2. **Zero** HIGH severity findings
3. **Zero** 🔴 checklist blockers (see CR-CHECKLIST.md Quick Reference)
4. All MEDIUM findings are either:
   - Addressed in the PR, or
   - Documented with a follow-up ticket (linked in PR description or comment)
5. CI is green (lint + typecheck + build + format:check)
6. Test coverage meets threshold (once CI test step exists)

---

## What Gets Commented (💬)

**Comment-only** when all blocking checks pass but:

1. One or more LOW severity findings exist, or
2. Style/naming suggestions that don't affect correctness, or
3. Alternative approaches worth discussing (non-blocking)

Example: "Consider extracting this constant to `config.ts` for consistency — not blocking."

---

## What Gets Changes Requested (🔄)

**Changes requested** when:

1. One or more MEDIUM severity findings without CRITICAL/HIGH
2. Missing tests on new logic (once test framework exists)
3. Minor a11y issues (missing aria-label, wrong role)
4. Inconsistent patterns (e.g., mixing state management approaches)
5. Magic numbers not extracted
6. Missing loading/error/empty states
7. Build artifacts committed (.tsbuildinfo, dist)
8. Port/config edge cases unhandled

Author must reply to each comment: either fix (with new commit) or justify with reasoning.

---

## What Gets Blocked (🔴)

**Immediate block** when:

1. Any CRITICAL severity finding (see severity definitions below)
2. Any HIGH severity finding
3. Any item from the 🔴 Blocker quick-reference in CR-CHECKLIST.md
4. CI is red or incomplete
5. PR introduces a regression in existing tests
6. PR mixes unrelated changes (scope creep)

Blocked PRs get a comment with the exact fix required and a link to the relevant standard.

---

## Severity Definitions

| Severity     | Definition                                                                                                    | Examples                                                                        |
| ------------ | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| **CRITICAL** | Security vulnerability, data loss, crash in production, PII exposure                                          | CORS wide open, SQL injection, file path traversal, missing auth check          |
| **HIGH**     | Likely to cause bugs in production, significant maintainability debt, missing error handling in critical path | No error middleware, unused deps in prod, no error boundary, missing CSP        |
| **MEDIUM**   | Degrades maintainability, performance, or UX; edge-case bug potential                                         | Missing tests, no pagination, unlabeled canvas, logging gaps, `tsc -b` mismatch |
| **LOW**      | Cosmetic, DX polish, non-critical config edge cases                                                           | `lang` attribute, `open: true` in Vite, watcher debounce, missing `.nvmrc`      |

---

## Review Scope Boundaries

| In Scope                                                            | Out of Scope (for code review)                     |
| ------------------------------------------------------------------- | -------------------------------------------------- |
| Code correctness & logic errors                                     | Product strategy / feature prioritization          |
| Security (XSS, injection, CORS, ACL)                                | Visual design polish (defer to pa-ui-design-lead)  |
| Type safety & TypeScript usage                                      | Market fit / user research validity                |
| Performance (rendering, bundle size, memory)                        | Project timeline / estimates                       |
| Accessibility (WCAG AA minimum)                                     | Pricing / business model                           |
| Test coverage & test quality                                        | Branding / marketing copy                          |
| Maintainability & dependency hygiene                                | DevOps environment config (defer to pa-devops-sre) |
| Error handling & resilience                                         | Deployment strategy                                |
| API contract compliance (defer to pa-data-api-architect for schema) |                                                    |
| Architecture compliance (defer to pa-solution-architect for ADRs)   |                                                    |

When a finding crosses into another role's territory, flag it in a comment and @mention the relevant team member. Do not block on out-of-scope concerns.

---

## Review Workflow

```
PR Opened → Reviewer assigned → Checklist run → Decision → Author acts
```

1. **PR opened**: Author self-reviews first using CR-CHECKLIST.md
2. **Reviewer assigned**: pa-code-reviewer for all PRs (or delegate for overflow)
3. **Checklist run**: Go through every applicable section
4. **Decision posted**: Clear disposition + itemized findings with severity
5. **Author acts**: Fix blocking issues → push → re-request review
6. **Re-review**: Only check changed files. Previous ✅ items don't need re-check.

---

## Re-review Policy

- After a 🔴 Block or 🔄 Changes Requested, only **one re-review** is required.
- If the same issue recurs in re-review, escalate to pa-director with a blocker comment.
- Nitpicking cycles (3+ rounds of LOW-only comments) are prohibited. File a LOW-findings ticket instead.

---

## Speed vs Thoroughness

| PR Size       | Expected Review Time           | Depth          |
| ------------- | ------------------------------ | -------------- |
| < 50 lines    | 15 min                         | Full checklist |
| 50–200 lines  | 30 min                         | Full checklist |
| 200–500 lines | 60 min                         | Full checklist |
| > 500 lines   | Request split into smaller PRs | N/A            |

PRs over 500 lines are strongly discouraged. If unavoidable, focus review on:

1. Security-critical paths
2. New public API surfaces
3. Complex state logic
4. Error handling
5. Test coverage of changed paths

---

## Exceptions & Overrides

The pa-director can override any review decision. Document the override in the PR with:

```
@pa-director override: [reason]. Risk accepted: [what risk is accepted].
```
