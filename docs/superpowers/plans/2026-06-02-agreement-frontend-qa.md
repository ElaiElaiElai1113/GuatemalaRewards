# Agreement Frontend QA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add automated frontend QA coverage for the required-agreement e-signature gate, drawn signature workflow, and admin signed/unsigned reporting.

**Architecture:** Reuse the existing Playwright workflow suite and deterministic Supabase seed accounts. Keep seeded customer and business-owner smoke accounts signed so existing workflow tests continue to reach dashboards, and add separate unsigned/pending accounts for agreement-gate tests.

**Tech Stack:** Playwright, React/Vite, Supabase local seed data, existing `tests/run-tests.ts` repository assertions.

---

### Task 1: Add Repository-Level Failing Checks

**Files:**
- Modify: `tests/run-tests.ts`

- [ ] **Step 1: Add checks for the agreement QA suite**

Add tests that require:
- `package.json` exposes `test:agreements`.
- `tests/e2e/helpers/env.ts` enables workflow auth for `test:agreements`.
- `tests/e2e/agreements.spec.ts` contains `AGR001`, `AGR002`, and `AGR003`.
- `supabase/seed.sql` includes signed agreement acceptance rows and dedicated unsigned agreement users.

- [ ] **Step 2: Run red check**

Run: `npm test`

Expected: fail because the new script/spec/seed entries do not exist yet.

### Task 2: Add Seed and Helper Support

**Files:**
- Modify: `supabase/seed.sql`
- Modify: `tests/e2e/helpers/env.ts`
- Modify: `tests/e2e/helpers/auth.ts`
- Modify: `tests/e2e/helpers/supabase.ts`

- [ ] **Step 1: Seed signed and unsigned agreement users**

Add signed agreement acceptances for the existing E2E customer, unverified customer, and business owner. Add separate unsigned/pending agreement customer and business-owner users without acceptances.

- [ ] **Step 2: Add test helper APIs**

Add sign-in helpers that expect `/agreements/required`, and add an agreement acceptance lookup helper for post-signature assertions.

### Task 3: Add Playwright Agreement QA

**Files:**
- Create: `tests/e2e/agreements.spec.ts`
- Modify: `package.json`

- [ ] **Step 1: Add `test:agreements` script**

Run only `tests/e2e/agreements.spec.ts`.

- [ ] **Step 2: Add workflow tests**

Add:
- `AGR001`: unsigned customer is redirected to agreement gate, cannot submit without drawn signature, can draw/sign, then lands on `/dashboard`, and Supabase records `signature_svg`.
- `AGR002`: unsigned business owner signs the affiliate agreement and lands on `/business/dashboard`.
- `AGR003`: admin `#agreements` view shows signed and unsigned rows, including a signature preview for signed rows.

### Task 4: Verify and Publish

**Files:**
- All files above.

- [ ] **Step 1: Run repository verification**

Run:
- `npm test`
- `npm run test:unit`
- `npm run lint`
- `npm run build`

- [ ] **Step 2: Attempt agreement E2E command**

Run: `npm run test:agreements`

Expected: pass if local Supabase is running and reset/seeded; otherwise report the local service blocker.

- [ ] **Step 3: Commit and push**

Commit message: `test: add agreement frontend qa`
