# Mobile Customer Navigation Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the existing customer bottom nav into a complete mobile navigation surface with verification status.

**Architecture:** Modify the existing `CustomerBottomNav` component and pass profile verification status from `CustomerLayout`. Keep desktop header navigation untouched and use source-level tests for route/status coverage.

**Tech Stack:** React, TypeScript, React Router, lucide-react, existing UI classes, Node source-inspection tests.

---

## Task 1: Source Tests

**Files:**
- Modify: `tests/run-tests.ts`

- [ ] Add tests for five mobile nav routes, five-column layout, mobile-only class, active route matching, verification status labels, layout prop wiring, and bottom padding.
- [ ] Run `npm test` and confirm the new test fails before implementation.

## Task 2: Bottom Nav Upgrade

**Files:**
- Modify: `src/components/customer-bottom-nav.tsx`

- [ ] Add `verificationStatus` prop typed from `Profile['verificationStatus']`.
- [ ] Replace three tabs with Home, Rewards, Shop, Activity, Profile.
- [ ] Add route matching for `/dashboard`, `/rewards`, `/redeem`, `/shop`, `/activity`, and `/profile`.
- [ ] Render a compact mobile verification status row above the tabs.

## Task 3: Layout Wiring

**Files:**
- Modify: `src/layouts/customer-layout.tsx`

- [ ] Pass `profile?.verificationStatus` to `CustomerBottomNav`.
- [ ] Increase mobile bottom padding on `main` to avoid fixed-nav overlap.

## Task 4: Translations

**Files:**
- Modify: `src/lib/language.tsx`

- [ ] Add any missing Spanish translations for labels introduced by the mobile nav.

## Task 5: Verification

**Files:**
- Existing modified files.

- [ ] Run `npm test`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run build`.
- [ ] Run `git diff --check`.
