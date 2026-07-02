# Gift Card Catalog Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add claimability-aware filtering, summary feedback, and clearer empty states to the customer gift-card catalog.

**Architecture:** Extend `GiftCardsPage` state and derived data only. Keep issue confirmation, hooks, routes, and backend behavior unchanged.

**Tech Stack:** React, TypeScript, existing UI components, Node source-inspection tests.

---

## Task 1: Source Tests

**Files:**
- Modify: `tests/run-tests.ts`

- [ ] Add source-level tests for `showClaimableOnly`, `claimableGiftCards`, summary labels, claimable toggle, and empty-state branches.
- [ ] Run `npm test` and confirm the new test fails before implementation.

## Task 2: Claimable Gift Card Filtering

**Files:**
- Modify: `src/features/gift-cards/pages/gift-cards-page.tsx`

- [ ] Add `showClaimableOnly` state.
- [ ] Add `catalogItems`, `claimableGiftCards`, and `visibleGiftCards` derived values.
- [ ] Define claimable as enough points and not verification-locked.

## Task 3: Gift Card Summary And Toggle

**Files:**
- Modify: `src/features/gift-cards/pages/gift-cards-page.tsx`

- [ ] Render `Gift card summary` with available points, total gift cards, claimable gift cards, and active business.
- [ ] Render a `Claimable` toggle button near the business filter.

## Task 4: Empty States And Translations

**Files:**
- Modify: `src/features/gift-cards/pages/gift-cards-page.tsx`
- Modify: `src/lib/language.tsx`

- [ ] Add empty-state branches for `No claimable gift cards yet`, `No gift cards for this business`, and `No gift cards yet`.
- [ ] Add Spanish translations for new strings.

## Task 5: Verification

**Files:**
- Existing modified files.

- [ ] Run `npm test`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run build`.
- [ ] Run `git diff --check`.
