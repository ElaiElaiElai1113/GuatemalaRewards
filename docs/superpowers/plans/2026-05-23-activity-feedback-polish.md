# Activity Feedback Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve customer feedback in activity history, empty activity states, and locked gift-card actions.

**Architecture:** Extend the existing reusable `ActivityList` with activity-kind labels and optional empty-state action props. Wire the optional action only from customer dashboard/activity pages, and update gift-card locked copy in the existing tile component.

**Tech Stack:** React, TypeScript, React Router, lucide-react, existing UI components, Node source-inspection tests.

---

## Task 1: Source Tests

**Files:**
- Modify: `tests/run-tests.ts`

- [ ] Add tests for activity labels, pending badge, optional empty action props, customer page wiring, and gift-card locked copy.
- [ ] Run `npm test` and confirm the new test fails before implementation.

## Task 2: Activity List Feedback

**Files:**
- Modify: `src/features/activity/components/activity-list.tsx`

- [ ] Add `emptyActionTo` and `emptyActionLabel` optional props.
- [ ] Add a `getActivityKind` helper that maps every `Activity.type` to a label.
- [ ] Render the kind label in each row.
- [ ] Render `Pending` for pending activity status.
- [ ] Render an optional empty-state action button when both empty action props are passed.

## Task 3: Customer Wiring

**Files:**
- Modify: `src/features/dashboard/pages/dashboard-page.tsx`
- Modify: `src/features/activity/pages/activity-page.tsx`

- [ ] Pass `emptyActionTo="/shop"` and `emptyActionLabel="Browse businesses"` to customer activity lists.
- [ ] Leave admin usage unchanged.

## Task 4: Gift Card Locked Copy And Translations

**Files:**
- Modify: `src/features/gift-cards/components/gift-card-tile.tsx`
- Modify: `src/lib/language.tsx`

- [ ] Change locked gift-card action copy to `Verify ID to issue`.
- [ ] Add Spanish translations for all new activity and gift-card copy.

## Task 5: Verification

**Files:**
- Existing modified files.

- [ ] Run `npm test`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run build`.
- [ ] Run `git diff --check`.
