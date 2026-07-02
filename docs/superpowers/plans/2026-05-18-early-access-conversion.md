# Early Access Conversion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the early access page into a split, conversion-focused waitlist using the approved locked copy and a simplified WhatsApp/email subscribe form.

**Architecture:** Keep the existing `EarlyAccessPage` form, Supabase service, and schema. Add a small content module for locked marketing copy and visible field metadata so tests can verify copy and form scope without requiring a browser test runner.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS, react-hook-form, Zod, Supabase RPC, Node assert tests.

---

### Task 1: Add Locked Copy Test

**Files:**
- Modify: `tests/run-tests.ts`
- Create: `src/features/early-access/early-access-content.ts`
- Modify: `tsconfig.tests.json`

- [ ] **Step 1: Write the failing test**

Add an import and assertions in `tests/run-tests.ts`:

```ts
import {
  earlyAccessMessageLines,
  earlyAccessSubscribeFields,
  earlyAccessSubscribeButtonLabel,
} from '../src/features/early-access/early-access-content.js'

runTest('early access content preserves the approved conversion copy', () => {
  assert.deepEqual(earlyAccessMessageLines, [
    'Hey,',
    'We’re tired of watching people work hard but still struggle to afford the life they want — vacations, freedom, extras.',
    'That’s why we’re building Guatemala Rewards: the highest-paying rewards program. Earn 20-100% back on almost everything you already buy daily.',
    'No extra spending. Just real money back to help you do more of what you love.',
    'As an early adopter, you’ll get exclusive benefits before anyone else.',
    'Ready to earn more?',
    'Let’s make this happen together.',
    'Guatemala Rewards Team',
  ])
})

runTest('early access subscribe form only exposes WhatsApp and email contact fields', () => {
  assert.deepEqual(earlyAccessSubscribeFields.map((field) => field.name), ['whatsapp', 'email'])
  assert.equal(earlyAccessSubscribeButtonLabel, 'Subscribe')
})
```

Update `tsconfig.tests.json` include list:

```json
"include": [
  "src/features/critical-flows/**/*.ts",
  "src/features/early-access/**/*.ts",
  "tests/**/*.ts"
]
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`

Expected: fail because `src/features/early-access/early-access-content.ts` does not exist.

- [ ] **Step 3: Write minimal implementation**

Create `src/features/early-access/early-access-content.ts`:

```ts
export const earlyAccessMessageLines = [
  'Hey,',
  'We’re tired of watching people work hard but still struggle to afford the life they want — vacations, freedom, extras.',
  'That’s why we’re building Guatemala Rewards: the highest-paying rewards program. Earn 20-100% back on almost everything you already buy daily.',
  'No extra spending. Just real money back to help you do more of what you love.',
  'As an early adopter, you’ll get exclusive benefits before anyone else.',
  'Ready to earn more?',
  'Let’s make this happen together.',
  'Guatemala Rewards Team',
] as const

export const earlyAccessSubscribeButtonLabel = 'Subscribe'

export const earlyAccessSubscribeFields = [
  {
    name: 'whatsapp',
    label: 'WhatsApp number',
    placeholder: '+57 300 000 0000',
    type: 'tel',
  },
  {
    name: 'email',
    label: 'Email',
    placeholder: 'you@example.com',
    type: 'email',
  },
] as const
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`

Expected: all tests pass.

### Task 2: Redesign Early Access Page

**Files:**
- Modify: `src/features/early-access/pages/early-access-page.tsx`

- [ ] **Step 1: Update imports**

Use the content constants from `src/features/early-access/early-access-content.ts`, keep existing form/service imports, and remove unused `Textarea`.

- [ ] **Step 2: Replace visible layout**

Render a split hero with:

- locked message lines on the left
- compact subscribe form on the right
- visible contact fields from `earlyAccessSubscribeFields`
- consent checkbox
- button label from `earlyAccessSubscribeButtonLabel`

- [ ] **Step 3: Preserve submit behavior**

Keep `earlyAccessService.createLead(values)`, default optional `fullName` and `notes` values, existing submit error handling, and the success state.

- [ ] **Step 4: Run typecheck**

Run: `npm run typecheck`

Expected: exit code 0.

### Task 3: Final Verification

**Files:**
- Verify only

- [ ] **Step 1: Run test suite**

Run: `npm test`

Expected: all tests pass.

- [ ] **Step 2: Run production build**

Run: `npm run build`

Expected: exit code 0.

- [ ] **Step 3: Review diff**

Run: `git diff -- src/features/early-access tests/run-tests.ts tsconfig.tests.json docs/superpowers/plans/2026-05-18-early-access-conversion.md`

Expected: diff only contains the approved early access redesign, content constants, tests, and plan.
