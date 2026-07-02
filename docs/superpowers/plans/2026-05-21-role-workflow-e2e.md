# Role Workflow E2E Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add automated Playwright smoke tests that verify the public, customer, business staff, business owner, and admin workflows work together against deterministic local Supabase seed data.

**Architecture:** Playwright will start the Vite dev server, load `.env`, and run browser tests against seeded local Supabase users. The seed file will create deterministic auth users so role-based login tests do not depend on manual dashboard setup.

**Tech Stack:** React, Vite, Supabase local CLI via `npx supabase`, Playwright, TypeScript.

---

## Files

- Modify: `package.json` for Playwright scripts and dev dependency.
- Modify: `package-lock.json` through npm.
- Create: `playwright.config.ts` for browser test config.
- Create: `tests/e2e/helpers/env.ts` for shared account/base URL config.
- Create: `tests/e2e/helpers/auth.ts` for login helpers.
- Create: `tests/e2e/public.spec.ts` for public acquisition smoke checks.
- Create: `tests/e2e/customer.spec.ts` for customer smoke checks.
- Create: `tests/e2e/business-staff.spec.ts` for business staff smoke checks.
- Create: `tests/e2e/business-owner.spec.ts` for business owner smoke checks.
- Create: `tests/e2e/admin.spec.ts` for admin smoke checks.
- Modify: `supabase/seed.sql` to add deterministic E2E auth users and profiles through the auth trigger.
- Modify: `docs/workflow-qa-2026-05-21.md` to document the new E2E command.

## Task 1: Add Playwright Smoke Tests First

- [ ] Create E2E helper files and specs that import `@playwright/test`.
- [ ] Run `npm run test:e2e`.
- [ ] Expected result: fail because Playwright and/or `test:e2e` are not configured yet.

## Task 2: Add Playwright Configuration

- [ ] Install `@playwright/test` as a dev dependency.
- [ ] Add `test:e2e` and `test:e2e:ui` scripts.
- [ ] Create `playwright.config.ts` with Vite web server startup.
- [ ] Run `npm run test:e2e`.
- [ ] Expected result: tests start but fail if local Supabase seed users are missing.

## Task 3: Seed Deterministic Local Users

- [ ] Add auth user rows for:
  - `customer@Guatemala.test`
  - `unverified@Guatemala.test`
  - `staff@velvetbrew.test`
  - `owner@velvetbrew.test`
  - `admin@Guatemala.test`
- [ ] Add matching `auth.identities` rows.
- [ ] Let the existing auth trigger create `profiles` and `reward_balances`.
- [ ] Add updates for verified and unverified customer profile states.
- [ ] Run `npx supabase db reset` if local Supabase is running.
- [ ] Run `npm run test:e2e`.

## Task 4: Verify Full Test Suite

- [ ] Run `npm test`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Run `npm run test:e2e` when local Supabase is running.
- [ ] If local Supabase is not running, document that E2E setup is installed but could not be fully exercised locally.

## Task 5: Commit The Work

- [ ] Stage only intended files.
- [ ] Leave unrelated `.claude/settings.local.json` and `supabase/.temp/cli-latest` changes unstaged.
- [ ] Commit with `Add role workflow e2e tests`.
