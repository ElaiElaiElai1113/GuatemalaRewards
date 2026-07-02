# Staged Onboarding Design

## Goal

Reduce signup friction while preserving the existing identity-verification security model for reward value actions.

New members should be able to create an account with only basic account details. ID verification moves to the post-signup account experience, and earning, redeeming, subscriptions, gift cards, QR sale rewards, and credit activation remain locked until admin approval.

## Current Problem

The current `/join` and `/promo/register` flows require a verification ID number and ID document before an account can be created. This protects the reward system, but it asks for sensitive information before the user has entered the product or understood why verification is needed.

## Recommended Flow

1. User signs up from `/join` or `/promo/register` with full name, email, and password.
2. Supabase creates the auth user, profile, and initial reward balance.
3. New customer profiles start with `verification_status = 'not_submitted'`.
4. If signup came from a referral or partner link, attribution is still attached immediately after profile creation.
5. The post-signup success state sends users to sign in and explains that ID verification unlocks rewards.
6. Signed-in unverified members can browse the dashboard, shop, rewards, promotions, profile, and public/customer pages.
7. Value actions stay blocked until verification is approved:
   - memberships
   - orders
   - reward redemptions
   - reward balance value changes
   - gift card activation/redemption
   - credit redemptions
   - member QR transactions
8. Members submit verification from profile with ID number and an ID document.
9. Platform admins approve or reject verification from the admin member view.

## Architecture

### Signup Forms

Update both member signup entry points:

- `src/features/join/pages/join-rewards-page.tsx`
- `src/features/referrals/pages/referral-register-page.tsx`

These forms should use the lightweight signup schema and remove required ID inputs. Copy should make verification a later unlock step, not an immediate signup requirement.

### Auth Service

Update:

- `src/types/forms.ts`
- `src/integrations/supabase/services/auth-service.ts`
- `src/features/auth/auth-context.ts`
- `src/features/auth/auth-provider.tsx`

`signUp()` should accept only full name, email, password, and role. It should no longer upload verification documents during account creation. Referral and partner attribution behavior remains in `AuthProvider.signUp()`.

### Database

Update the latest `handle_new_user()` migration behavior so customer signup does not require verification metadata. For customer accounts without verification data, the profile should be created with:

- `verification_id_number = null`
- `verification_document_path = null`
- `verification_document_filename = null`
- `verification_submitted_at = null`
- `verification_status = 'not_submitted'`

Existing `submit_member_verification()` and `review_member_verification()` behavior remains the source of truth for verification submission and admin approval.

### Verification Gate

Keep existing database enforcement for value actions. Add or preserve frontend notices that explain why actions are locked and route the user to profile verification.

The existing `VerificationStatusNotice`, membership page lock, profile verification form, and database triggers already support this model.

### Referral Status

Keep the existing sessionStorage referral handoff. Improve success messaging:

- If attribution succeeds or there was no referral, show the normal success message.
- If attribution fails, show the existing warning but clarify that account creation succeeded.
- Referral credit is still pending staff/admin approval.

## Error Handling

- Duplicate email still shows “That email already exists. Try signing in instead.”
- Missing profile after signup still falls back to the existing “account created, please sign in” success path.
- Verification document validation remains only in profile verification submission.
- Referral and partner attribution failures never block account creation.

## Testing

Add focused tests that cover:

- Signup schema accepts full name, email, password, and `role: 'customer'` without ID fields.
- Signup service sends Supabase auth metadata without verification fields.
- `/join` and `/promo/register` no longer render required ID upload fields.
- Profile verification submission still requires ID number and document.
- Existing verification-gated value actions remain locked for `not_submitted`, `submitted`, and `rejected` members.

Run the existing build and test suite after implementation.

## Non-Goals

- Do not remove identity verification.
- Do not change admin approval semantics.
- Do not change business/admin login onboarding.
- Do not add payment processing.
- Do not redesign the full dashboard.
