# Customer Wallet Summary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a compact customer wallet summary to the dashboard with state-driven next actions.

**Architecture:** Create a focused `CustomerWalletSummary` component under dashboard components and wire it into `DashboardPage` using existing hooks. Remove duplicated dashboard balance metric cards so the new wallet panel becomes the primary balance surface.

**Tech Stack:** React, TypeScript, React Router, lucide-react, existing UI components, Node source-inspection tests.

---

## Task 1: Source Tests

**Files:**
- Modify: `tests/run-tests.ts`

- [ ] Add a source-level test that reads `DashboardPage` and `CustomerWalletSummary`.
- [ ] Assert the dashboard imports and renders `CustomerWalletSummary`.
- [ ] Assert props include `verificationStatus`, `isMembershipActive`, `points`, `availableCredits`, and `activeGiftCardCount`.
- [ ] Assert state-driven actions exist: `Verify ID`, `Activate membership`, `Redeem rewards`, `Browse businesses`.
- [ ] Assert routes exist: `/profile#id-verification`, `/membership`, `/rewards`, `/shop`.
- [ ] Assert the old repeated dashboard metric section is removed.
- [ ] Run `npm test` and confirm the new test fails before implementation.

## Task 2: Wallet Component

**Files:**
- Create: `src/features/dashboard/components/customer-wallet-summary.tsx`

- [ ] Implement `CustomerWalletSummary` with props for verification status, membership state, points, available credits, and active gift card count.
- [ ] Derive the primary action in the documented priority order.
- [ ] Render points, reward credits, gift cards, and membership state.
- [ ] Use existing `Button`, `Badge`, `Link`, `useLanguage`, `formatCurrency`, and `formatPoints` patterns.

## Task 3: Dashboard Wiring

**Files:**
- Modify: `src/features/dashboard/pages/dashboard-page.tsx`

- [ ] Import and render `CustomerWalletSummary`.
- [ ] Pass `verificationStatus`, `isMembershipActive`, `points`, `(balance?.availableCredits ?? 0)`, and `activeGiftCardCount`.
- [ ] Remove the standalone points card and three repeated `MetricCard` balance cards.
- [ ] Keep quick actions, featured rewards, promotions, and activity unchanged.

## Task 4: Translations

**Files:**
- Modify: `src/lib/language.tsx`

- [ ] Add Spanish translations for new wallet strings.
- [ ] Reuse existing translation keys where possible to avoid duplicates.

## Task 5: Verification

**Files:**
- Existing modified files.

- [ ] Run `npm test`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run build`.
- [ ] Run `git diff --check`.
