# Private Invitation Route Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/invitation` the public early access URL while keeping `/early-access` as a compatibility redirect.

**Architecture:** Reuse the existing `EarlyAccessPage` and welcome email flow. Routing changes live in `src/routes/router.tsx`, public CTAs are updated where they currently link to `/early-access`, and static tests in `tests/run-tests.ts` lock the new public URL.

**Tech Stack:** React, React Router, Vite, TypeScript, Vercel API route, Node test runner via `tests/run-tests.ts`.

---

### Task 1: Route and CTA Tests

**Files:**
- Modify: `tests/run-tests.ts`

- [ ] **Step 1: Write the failing tests**

Add or update tests so they assert:

```ts
runTest('public invitation route renders the early access page', () => {
  const router = readFileSync('src/routes/router.tsx', 'utf8')
  assert.match(router, /path: '\/invitation'/)
  assert.match(router, /element: <EarlyAccessPage \/>/)
})

runTest('legacy early access route redirects to invitation', () => {
  const router = readFileSync('src/routes/router.tsx', 'utf8')
  assert.match(router, /path: '\/early-access'/)
  assert.match(router, /<Navigate replace to="\/invitation" \/>/)
})

runTest('landing Join CTAs go to invitation', () => {
  const landingMarkup = readFileSync('src/features/auth/pages/landing-page.tsx', 'utf8')
  assert.ok((landingMarkup.match(/to="\/invitation"/g) ?? []).length >= 2)
  assert.doesNotMatch(landingMarkup, /to="\/early-access"/)
})

runTest('welcome email does not expose the legacy early access URL', () => {
  const api = readFileSync('api/send-welcome-email.ts', 'utf8')
  assert.doesNotMatch(api, /\/early-access/)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`

Expected: FAIL because `/invitation` does not exist yet and landing CTAs still use `/early-access`.

### Task 2: Route and CTA Implementation

**Files:**
- Modify: `src/routes/router.tsx`
- Modify: `src/features/auth/pages/landing-page.tsx`
- Modify: `tests/e2e/public.spec.ts`
- Modify: `tests/e2e/load.spec.ts`
- Modify: `tests/e2e/launch-checklist.spec.ts`

- [ ] **Step 1: Implement the route change**

In `src/routes/router.tsx`, add `/invitation` with `EarlyAccessPage` and change `/early-access` to:

```tsx
{
  path: '/early-access',
  element: <Navigate replace to="/invitation" />,
}
```

- [ ] **Step 2: Update public CTAs**

In `src/features/auth/pages/landing-page.tsx`, replace public CTA targets:

```tsx
to="/early-access"
```

with:

```tsx
to="/invitation"
```

- [ ] **Step 3: Update Playwright routes**

Replace direct test visits to `/early-access` with `/invitation` where the test is verifying public access. Keep redirect behavior covered in the static Node tests.

- [ ] **Step 4: Run focused tests**

Run: `npm test`

Expected: PASS for static tests.

### Task 3: Final Verification

**Files:**
- Review all modified files.

- [ ] **Step 1: Run build**

Run: `npm run build`

Expected: PASS with successful Vite build.

- [ ] **Step 2: Review diff**

Run: `git diff -- src/routes/router.tsx src/features/auth/pages/landing-page.tsx api/send-welcome-email.ts tests/run-tests.ts tests/e2e/public.spec.ts tests/e2e/load.spec.ts tests/e2e/launch-checklist.spec.ts docs/superpowers/plans/2026-06-07-private-invitation-route.md`

Expected: Diff contains only the private invitation route implementation and tests.
