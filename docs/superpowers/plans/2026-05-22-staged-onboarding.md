# Staged Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let customers create accounts without ID upload, then complete ID verification from profile before value actions unlock.

**Architecture:** Keep the existing auth provider, Supabase auth trigger, profile verification RPC, and verification gates. Narrow signup types/forms/service calls to account-only fields, and leave ID document upload in `profileService.submitVerification()`.

**Tech Stack:** React 19, TypeScript, React Hook Form, Zod, Supabase Auth/Storage/RPC, Vite, Node assertion tests.

---

## File Map

- Modify `src/types/forms.ts`: split lightweight member signup from member verification submission.
- Modify `src/integrations/supabase/services/auth-service.ts`: remove verification upload from signup.
- Modify `src/features/auth/auth-context.ts`: keep context typed to the lightweight signup submission.
- Modify `src/features/auth/auth-provider.tsx`: preserve attribution behavior with the lighter signup payload.
- Modify `src/features/join/pages/join-rewards-page.tsx`: remove ID fields and document state from initial signup.
- Modify `src/features/referrals/pages/referral-register-page.tsx`: remove ID fields and document state from invite signup.
- Modify `supabase/migrations/20260512000000_member_identity_verification.sql`: allow new customer profiles without verification metadata.
- Modify `tests/run-tests.ts`: add regression assertions for staged onboarding.

## Task 1: Add Failing Regression Tests

**Files:**
- Modify: `tests/run-tests.ts`

- [ ] Add tests that assert signup is lightweight and profile verification remains separate.

```ts
runTest('member signup schema no longer requires ID verification fields', () => {
  const forms = readFileSync('src/types/forms.ts', 'utf8')
  const joinPage = readFileSync('src/features/join/pages/join-rewards-page.tsx', 'utf8')
  const referralPage = readFileSync('src/features/referrals/pages/referral-register-page.tsx', 'utf8')
  const authService = readFileSync('src/integrations/supabase/services/auth-service.ts', 'utf8')

  assert.match(forms, /export const memberSignUpSchema = authSchema\.extend\(\{[\s\S]*role: z\.literal\('customer'\)/)
  assert.match(forms, /export type MemberSignUpSubmission = MemberSignUpFormValues/)
  assert.doesNotMatch(forms, /MemberSignUpSubmission = MemberSignUpFormValues & \{\s*verificationDocument: File/)
  assert.doesNotMatch(joinPage, /verificationDocument/)
  assert.doesNotMatch(joinPage, /verificationIdNumber/)
  assert.doesNotMatch(referralPage, /verificationDocument/)
  assert.doesNotMatch(referralPage, /verificationIdNumber/)
  assert.doesNotMatch(authService, /validateVerificationDocument\(input\.verificationDocument\)/)
  assert.doesNotMatch(authService, /MEMBER_VERIFICATION_BUCKET/)
})

runTest('profile verification remains the ID upload path after signup', () => {
  const profilePage = readFileSync('src/features/profile/pages/profile-page.tsx', 'utf8')
  const profileService = readFileSync('src/integrations/supabase/services/profile-service.ts', 'utf8')
  const forms = readFileSync('src/types/forms.ts', 'utf8')

  assert.match(forms, /export const memberVerificationSchema/)
  assert.match(forms, /export type MemberVerificationSubmission = MemberVerificationFormValues & \{\s*verificationDocument: File\s*\}/)
  assert.match(profilePage, /Submit ID/)
  assert.match(profilePage, /verificationForm\.register\('verificationIdNumber'\)/)
  assert.match(profileService, /validateVerificationDocument\(values\.verificationDocument\)/)
  assert.match(profileService, /submit_member_verification/)
})

runTest('new customer auth trigger allows account creation before ID submission', () => {
  const migration = readFileSync('supabase/migrations/20260512000000_member_identity_verification.sql', 'utf8')

  assert.doesNotMatch(migration, /Verification ID is required for member signup/)
  assert.doesNotMatch(migration, /Verification document is required for member signup/)
  assert.match(migration, /else 'not_submitted'/)
})
```

- [ ] Run: `npm test`

Expected: the new tests fail because current signup still requires ID fields.

## Task 2: Update Types And Auth Service

**Files:**
- Modify: `src/types/forms.ts`
- Modify: `src/integrations/supabase/services/auth-service.ts`
- Modify: `src/features/auth/auth-context.ts`
- Modify: `src/features/auth/auth-provider.tsx`

- [ ] In `src/types/forms.ts`, change member signup to account-only:

```ts
export const memberSignUpSchema = authSchema.extend({
  fullName: z.string().trim().min(2, 'Enter your full name'),
  role: z.literal('customer'),
})

export type MemberSignUpFormValues = z.infer<typeof memberSignUpSchema>
export type MemberSignUpSubmission = MemberSignUpFormValues
```

- [ ] In `src/integrations/supabase/services/auth-service.ts`, remove verification imports and document upload logic from `signUp()`. The `options.data` object should contain only:

```ts
data: {
  full_name: name,
},
```

- [ ] Keep `AuthContextValue.signUp` and `AuthProvider.signUp` accepting `MemberSignUpSubmission`; no attribution logic should be removed.

- [ ] Run: `npm test`

Expected: type tests still fail until UI and migration are updated.

## Task 3: Simplify Signup UI

**Files:**
- Modify: `src/features/join/pages/join-rewards-page.tsx`
- Modify: `src/features/referrals/pages/referral-register-page.tsx`

- [ ] Remove `verificationIdNumber` from both `defaultValues` objects.
- [ ] Remove `verificationDocument` state and file validation from both submit handlers.
- [ ] Submit with:

```ts
const result = await signUp({ ...values, role: 'customer' })
```

- [ ] Remove ID number and file upload fields from both forms.
- [ ] Update success/help copy to say verification happens after account creation. Use these messages:

```ts
'Your account is created. Sign in, then verify your ID from your profile to unlock earning, redemption, memberships, gift cards, and QR rewards.'
'Account created. Verification unlocks rewards.'
```

- [ ] Run: `npm test`

Expected: UI/type tests pass except database migration test if not yet updated.

## Task 4: Relax New User Trigger

**Files:**
- Modify: `supabase/migrations/20260512000000_member_identity_verification.sql`

- [ ] Remove the two exception blocks that require customer verification ID and document during `handle_new_user()`.
- [ ] Preserve document path validation only when a path is present.
- [ ] Keep profile insert fields, but ensure status falls back to `not_submitted`:

```sql
case
  when new_verification_id is not null and new_verification_document_path is null then 'pending_document'
  when new_verification_document_path is not null then 'submitted'
  else 'not_submitted'
end
```

- [ ] Run: `npm test`

Expected: all source-inspection tests pass.

## Task 5: Full Verification

**Files:**
- Existing modified files above.

- [ ] Run: `npm run typecheck`

Expected: TypeScript project references compile without errors.

- [ ] Run: `npm run build`

Expected: Vite production build completes.

- [ ] Run: `git diff --check`

Expected: no whitespace errors.

- [ ] Review `git diff --stat` and ensure only planned files changed.
