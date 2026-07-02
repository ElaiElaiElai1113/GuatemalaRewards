# Customer QoL Slice A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add dashboard next-step guidance, a header verification pill, and clearer locked reward copy.

**Architecture:** Add two focused customer UI components and wire them into existing customer dashboard/layout data. Keep all behavior frontend-only and use existing profile, membership, balance, and activity data.

**Tech Stack:** React, TypeScript, React Router, lucide-react, existing UI components, Node source-inspection tests.

---

## Task 1: Tests

**Files:**
- Modify: `tests/run-tests.ts`

- [ ] Add tests for `CustomerOnboardingChecklist`, `VerificationStatusPill`, dashboard wiring, and reward locked copy.
- [ ] Run `npm test` and confirm the new tests fail because the components/copy do not exist.

## Task 2: Customer Onboarding Checklist

**Files:**
- Create: `src/features/dashboard/components/customer-onboarding-checklist.tsx`
- Modify: `src/features/dashboard/pages/dashboard-page.tsx`

- [ ] Build `CustomerOnboardingChecklist` with five steps: account created, verify ID, activate membership, unlock member QR, earn first reward.
- [ ] Use direct links for incomplete steps: `/profile#id-verification`, `/membership`, `/profile`, `/shop`.
- [ ] Wire it into the dashboard after membership and verification notices.

## Task 3: Header Verification Pill

**Files:**
- Create: `src/features/membership/components/verification-status-pill.tsx`
- Modify: `src/layouts/customer-layout.tsx`

- [ ] Add a compact pill with labels `Verification required`, `Under review`, `Verified`, `Needs resubmission`.
- [ ] Link non-verified states to `/profile#id-verification` and verified state to `/profile`.
- [ ] Render it near the customer avatar in the header.

## Task 4: Locked Copy And Translations

**Files:**
- Modify: `src/features/rewards/components/reward-card.tsx`
- Modify: `src/lib/language.tsx`

- [ ] Change reward-card locked button copy to `Verify ID to redeem`.
- [ ] Add Spanish translations for all new literal `t(...)` strings.

## Task 5: Verification

**Files:**
- Existing modified files.

- [ ] Run `npm test`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run build`.
- [ ] Run `git diff --check`.
