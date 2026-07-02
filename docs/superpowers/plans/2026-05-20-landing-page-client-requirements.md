# Landing Page Client Requirements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Spanish-first `/landing-page` that clearly covers why people should join, early subscriber benefits, the rewards system, and membership advantages.

**Architecture:** Reuse the existing `LandingPage` component and content-module pattern. Put structured copy in `src/features/auth/landing-content.ts`, render it from `src/features/auth/pages/landing-page.tsx`, and expose it through a new router entry.

**Tech Stack:** React 19, React Router, TypeScript, Tailwind utility classes, existing `useLanguage()` translation system, existing `tests/run-tests.ts` static test suite.

---

## File Map

- Modify `src/features/auth/landing-content.ts`: add structured content arrays for the four client-required sections and expanded FAQ.
- Modify `src/features/auth/pages/landing-page.tsx`: render the improved Spanish-first landing page sections using existing UI patterns.
- Modify `src/routes/router.tsx`: add `/landing-page` route.
- Modify `src/lib/language.tsx`: add Spanish translations for all new strings.
- Modify `tests/run-tests.ts`: add static coverage for route exposure, client-required section content, CTA targets, and translation coverage.

---

### Task 1: Add Failing Coverage For `/landing-page`

**Files:**
- Modify: `tests/run-tests.ts`

- [ ] **Step 1: Add a failing router test**

Add this test near the existing route tests:

```ts
runTest('client landing page is available at /landing-page', () => {
  const router = readFileSync('src/routes/router.tsx', 'utf8')

  assert.match(router, /path: '\/landing-page'/)
  assert.match(router, /element: <LandingPage \/>/)
})
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```bash
cmd /c npm.cmd test
```

Expected: FAIL because `/landing-page` does not exist yet.

---

### Task 2: Add The Route

**Files:**
- Modify: `src/routes/router.tsx`

- [ ] **Step 1: Import `LandingPage`**

Change:

```ts
import { AuthPage } from '@/features/auth/pages/landing-page'
```

To:

```ts
import { AuthPage, LandingPage } from '@/features/auth/pages/landing-page'
```

- [ ] **Step 2: Add route**

Add this route near `/early-access`:

```tsx
{
  path: '/landing-page',
  element: <LandingPage />,
},
```

- [ ] **Step 3: Run tests**

Run:

```bash
cmd /c npm.cmd test
```

Expected: new router test passes.

---

### Task 3: Define Client-Required Landing Content

**Files:**
- Modify: `src/features/auth/landing-content.ts`
- Modify: `tests/run-tests.ts`

- [ ] **Step 1: Add failing content test**

Add this test:

```ts
runTest('landing page content covers the client requested topics', () => {
  const landingContent = readFileSync('src/features/auth/landing-content.ts', 'utf8')

  assert.match(landingContent, /landingWhyJoinItems/)
  assert.match(landingContent, /landingEarlySubscriberBenefits/)
  assert.match(landingContent, /landingRewardsSteps/)
  assert.match(landingContent, /landingMembershipAdvantages/)
})
```

- [ ] **Step 2: Add content exports**

Add these exports to `src/features/auth/landing-content.ts`:

```ts
export const landingClientHero = {
  eyebrow: 'Guatemala Rewards membership',
  headline: 'Turn everyday spending into member rewards across the Guatemala Rewards network',
  body: 'Join early to earn rewards from eligible purchases, access launch benefits, and keep your member value connected in one verified account.',
  primaryCta: 'Join as an early subscriber',
  secondaryCta: 'See how rewards work',
} as const

export const landingWhyJoinItems = [
  {
    title: 'Earn from everyday spending',
    body: 'Use purchases you already make to build reward value with participating businesses.',
  },
  {
    title: 'Support participating businesses',
    body: 'Shop, dine, and buy services inside a growing local rewards network.',
  },
  {
    title: 'Build toward bigger perks',
    body: 'Small eligible purchases can add up toward offers, experiences, and larger member benefits over time.',
  },
] as const

export const landingEarlySubscriberBenefits = [
  {
    title: 'First access before public launch',
    body: 'Early subscribers are invited in before the broader public launch.',
  },
  {
    title: 'Launch updates first',
    body: 'Be among the first to hear when new businesses, rewards, and benefits go live.',
  },
  {
    title: 'Exclusive launch benefits',
    body: 'Early subscribers can qualify for selected launch offers and member-only opportunities.',
  },
  {
    title: 'Early reward opportunities',
    body: 'Get access to first-version reward opportunities as the network opens.',
  },
] as const

export const landingRewardsSteps = [
  {
    title: 'Join',
    body: 'Create your member account and subscribe when you are ready.',
  },
  {
    title: 'Spend',
    body: 'Make eligible purchases with participating businesses in the network.',
  },
  {
    title: 'Earn',
    body: 'Earn 20% to 100% in rewards on eligible spending, depending on the offer.',
  },
  {
    title: 'Redeem',
    body: 'Use rewards for available offers, gift-card value, experiences, and member perks.',
  },
] as const

export const landingMembershipAdvantages = [
  {
    title: 'One verified account',
    body: 'Your rewards stay connected to one member profile.',
  },
  {
    title: 'Member-only access',
    body: 'Membership unlocks earning, redemption, and selected subscriber benefits.',
  },
  {
    title: 'Protected reward value',
    body: 'Verification helps keep rewards fair and protected for real members.',
  },
] as const
```

- [ ] **Step 3: Run tests**

Run:

```bash
cmd /c npm.cmd test
```

Expected: content topic test passes; translation audit may fail until Task 5.

---

### Task 4: Render Improved Landing Page Sections

**Files:**
- Modify: `src/features/auth/pages/landing-page.tsx`

- [ ] **Step 1: Import new content**

Add these imports from `../landing-content`:

```ts
landingClientHero,
landingWhyJoinItems,
landingEarlySubscriberBenefits,
landingRewardsSteps,
landingMembershipAdvantages,
```

- [ ] **Step 2: Update header nav**

Use anchors:

```tsx
<a href="#why-join">{t('Why join')}</a>
<a href="#early-benefits">{t('Early benefits')}</a>
<a href="#rewards-system">{t('Rewards system')}</a>
<a href="#membership">{t('Membership')}</a>
<a href="#faq">{t('FAQ')}</a>
```

Keep a visible `LanguagePicker`.

- [ ] **Step 3: Replace hero copy**

Render `landingClientHero` with primary CTA to `/early-access` and secondary anchor to `#rewards-system`.

- [ ] **Step 4: Add four sections**

Render each content array in a compact grid:

```tsx
{landingWhyJoinItems.map((item) => (
  <article key={item.title}>
    <h3>{t(item.title)}</h3>
    <p>{t(item.body)}</p>
  </article>
))}
```

Repeat for early benefits, rewards steps, and membership advantages.

- [ ] **Step 5: Keep rewards disclaimer**

Add:

```tsx
<p>{t('Rewards are program credits and offers, not automatic cash payouts.')}</p>
```

- [ ] **Step 6: Run tests**

Run:

```bash
cmd /c npm.cmd test
```

Expected: static layout/content tests pass after translation entries are added in Task 5.

---

### Task 5: Add Spanish Translations

**Files:**
- Modify: `src/lib/language.tsx`

- [ ] **Step 1: Add translations for every new string**

Add entries for all new content strings from Tasks 3 and 4, including nav labels and disclaimer.

- [ ] **Step 2: Run translation audit**

Run:

```bash
cmd /c npm.cmd test
```

Expected: `all literal translated UI strings have Spanish entries` passes.

---

### Task 6: Verify And Commit

**Files:**
- Verify all modified files.

- [ ] **Step 1: Run test suite**

```bash
cmd /c npm.cmd test
```

Expected: all tests pass.

- [ ] **Step 2: Run production build**

```bash
cmd /c npm.cmd run build
```

Expected: build succeeds.

- [ ] **Step 3: Check staged diff**

```bash
git status --short
git diff --stat
```

Expected: only route, landing page, landing content, language, and tests changed.

- [ ] **Step 4: Commit**

```bash
git add src/routes/router.tsx src/features/auth/pages/landing-page.tsx src/features/auth/landing-content.ts src/lib/language.tsx tests/run-tests.ts
git commit -m "Add client-focused landing page"
```

- [ ] **Step 5: Push if requested**

```bash
git push origin main
```

---

## Self-Review

- Covers why people should join: Task 3 `landingWhyJoinItems`, Task 4 render.
- Covers early subscriber benefits: Task 3 `landingEarlySubscriberBenefits`, Task 4 render.
- Covers rewards system: Task 3 `landingRewardsSteps`, Task 4 render.
- Covers membership advantages: Task 3 `landingMembershipAdvantages`, Task 4 render.
- Keeps `/` early-access letter untouched.
- Adds `/landing-page` as requested.
- Keeps Spanish-first behavior and translation audit.
