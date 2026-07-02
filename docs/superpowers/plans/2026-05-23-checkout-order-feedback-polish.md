# Checkout Order Feedback Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve customer feedback across cart, checkout, order confirmation, and order history without changing purchase behavior.

**Architecture:** Update existing page components only. Keep hooks, routes, schemas, payment feature flags, and backend behavior unchanged.

**Tech Stack:** React, TypeScript, React Router, existing UI components, Node source-inspection tests.

---

## Task 1: Source Tests

**Files:**
- Modify: `tests/run-tests.ts`

- [ ] Add source-level tests for cart empty-state copy, checkout summary labels, order confirmation next actions, and orders empty-state copy.
- [ ] Run `npm test` and confirm the new test fails before implementation.

## Task 2: Cart And Orders Empty States

**Files:**
- Modify: `src/features/shop/pages/cart-page.tsx`
- Modify: `src/features/shop/pages/orders-page.tsx`

- [ ] Update cart empty-state description and CTA to `Start shopping`.
- [ ] Update orders empty-state description while keeping `/shop` action.

## Task 3: Checkout Feedback

**Files:**
- Modify: `src/features/shop/pages/checkout-page.tsx`

- [ ] Add a `Checkout summary` panel near the form.
- [ ] Include item count, estimated total, estimated reward impact, and verification blocker copy.

## Task 4: Confirmation Next Actions And Translations

**Files:**
- Modify: `src/features/shop/pages/order-confirmation-page.tsx`
- Modify: `src/lib/language.tsx`

- [ ] Add `View rewards` action to confirmation.
- [ ] Add Spanish translations for new strings.

## Task 5: Verification

**Files:**
- Existing modified files.

- [ ] Run `npm test`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run build`.
- [ ] Run `git diff --check`.
