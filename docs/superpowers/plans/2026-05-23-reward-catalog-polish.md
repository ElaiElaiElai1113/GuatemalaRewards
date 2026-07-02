# Reward Catalog Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add claimability-aware filtering, summary feedback, and clearer reward catalog empty states.

**Architecture:** Extend `RewardsPage` state and derived data only. Keep reward cards, redemption RPCs, routes, and backend enforcement unchanged.

**Tech Stack:** React, TypeScript, React Router, existing UI components, Node source-inspection tests.

---

## Task 1: Source Tests

**Files:**
- Modify: `tests/run-tests.ts`

- [ ] Add source-level tests for `Claimable` filter, `claimableRewards`, catalog summary labels, and empty-state branches.
- [ ] Run `npm test` and confirm the new test fails before implementation.

## Task 2: Claimable Filtering

**Files:**
- Modify: `src/features/rewards/pages/rewards-page.tsx`

- [ ] Add `Claimable` to the filters tuple.
- [ ] Add `allRewards`, `claimableRewards`, `categoryFilteredRewards`, and `filteredRewards` derived values.
- [ ] Define claimable as inventory available, enough points, not verification-locked, and membership active.

## Task 3: Catalog Summary

**Files:**
- Modify: `src/features/rewards/pages/rewards-page.tsx`

- [ ] Render a compact `Catalog summary` section before category tiles.
- [ ] Include `Available points`, `Total rewards`, `Claimable rewards`, and `Active filter`.

## Task 4: Empty States And Translations

**Files:**
- Modify: `src/features/rewards/pages/rewards-page.tsx`
- Modify: `src/lib/language.tsx`

- [ ] Add empty-state branches for `No claimable rewards yet`, `No rewards match this filter`, and existing `No rewards yet`.
- [ ] Add Spanish translations for new strings.

## Task 5: Verification

**Files:**
- Existing modified files.

- [ ] Run `npm test`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run build`.
- [ ] Run `git diff --check`.
