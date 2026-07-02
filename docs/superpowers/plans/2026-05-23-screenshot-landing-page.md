# Screenshot Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `/landing-page` to match the provided Guatemala Rewards screenshot.

**Architecture:** Keep the current `LandingPage` export and replace its rendered markup with a static screenshot-matched public page. Existing `AuthPage` and route registration stay unchanged, and Playwright verifies the page-level contract.

**Tech Stack:** React 19, React Router, TypeScript, Tailwind CSS v4 utility classes, lucide-react icons, Playwright.

---

## File Map

- Modify `tests/e2e/public.spec.ts`: update the public landing assertion from the previous section IDs to screenshot-specific visible content and navigation.
- Modify `src/features/auth/pages/landing-page.tsx`: replace only `LandingPage` markup and remove no-longer-used imports from that page.
- Verify with `npx playwright test tests/e2e/public.spec.ts --project=chromium`, `npm run typecheck`, and `npm run build`.

### Task 1: Add Failing Screenshot Landing Test

**Files:**
- Modify: `tests/e2e/public.spec.ts`

- [ ] **Step 1: Change the landing assertions**

Replace the `/landing-page` assertions with checks for:

```ts
await expect(page.getByRole('heading', { name: /Earn a free vacation every year/i })).toBeVisible()
await expect(page.getByRole('heading', { name: 'Early adopter monthly subscription' })).toBeVisible()
await expect(page.getByText('$100,000 in Rewards')).toBeVisible()
await expect(page.getByRole('heading', { name: 'How it works' })).toBeVisible()
await expect(page.getByText('Where can I use my rewards?')).toBeVisible()
await expect(page.getByRole('link', { name: /Businesses/i })).toHaveAttribute('href', '/business')
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npx playwright test tests/e2e/public.spec.ts --project=chromium
```

Expected: FAIL because the current landing page still renders the older client-requirements layout.

### Task 2: Replace Landing Page Markup

**Files:**
- Modify: `src/features/auth/pages/landing-page.tsx`

- [ ] **Step 1: Remove old landing-only content imports**

Keep auth/sign-in imports needed by `AuthPage`, but remove content arrays that are only used by the current `LandingPage`.

- [ ] **Step 2: Replace `LandingPage` JSX**

Render the screenshot sections directly:

- Header with `Guatemala Rewards`, `How it works`, `Businesses`, `FAQ`, and `Join now`.
- Hero with the eyebrow, two-line heading, two paragraphs, two benefit rows, four pills, and join CTA.
- Subscription section with the early adopter offer card and agreement button.
- How-it-works section with four cards.
- FAQ section with four question rows.
- Footer with logo, tagline, and legal/contact links.

- [ ] **Step 3: Keep responsive behavior**

Use stacked mobile grids, constrained widths, and `overflow-x-hidden` on the page wrapper.

### Task 3: Verify

**Files:**
- Verify modified files.

- [ ] **Step 1: Run Playwright**

```bash
npx playwright test tests/e2e/public.spec.ts --project=chromium
```

Expected: PASS.

- [ ] **Step 2: Run typecheck**

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 3: Run build**

```bash
npm run build
```

Expected: PASS.

## Self-Review

- The plan covers every screenshot section.
- The test asserts the new visible contract before implementation.
- No router or auth behavior is changed.
- No placeholder steps remain.
