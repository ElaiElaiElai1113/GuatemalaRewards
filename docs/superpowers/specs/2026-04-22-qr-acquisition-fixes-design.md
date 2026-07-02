# QR Acquisition — Bug Fixes & Robustness (Option B)

**Date:** 2026-04-22  
**Scope:** Referral QR flow + Credit Code redemption flow  
**Approach:** Fix all identified bugs and add robustness improvements

---

## Context

The QR acquisition system has two flows:
1. **Referral QR** — Customer shares a QR code linking new users to a referral signup page. After a barista approves the referral, both users receive 1 credit.
2. **Credit Code** — Customer with available credits generates a 6-digit PIN shown to the barista at POS. Barista enters the code to redeem a free item and decrements the customer's credits.

An end-to-end audit identified 2 HIGH bugs (RLS INSERT bypass, referral timing race), 3 MEDIUM bugs (silent failure, concurrent credit decrement, double-click race), and 2 LOW issues (expired code status staleness, pending referrals never expire).

---

## Fix 1 — Remove Direct INSERT Policy on Referrals Table (HIGH)

**Problem:** The RLS policy `"Customers can create own referral"` allows any authenticated customer to INSERT directly into `public.referrals`, bypassing the `create_referral` RPC and its referrer-existence validation. A malicious user could insert a referral with a fake or non-existent `referrer_id`.

**Fix:** Drop the direct INSERT policy. All legitimate inserts go through `create_referral()` which is `SECURITY DEFINER` and handles all validation internally.

**File:** New migration  
`supabase/migrations/20260422000000_fix_referral_insert_policy.sql`

```sql
drop policy if exists "Customers can create own referral" on public.referrals;
```

No replacement policy needed — `create_referral()` is the only insert path.

---

## Fix 2 — Move Referral Creation Into signUp() (MEDIUM)

**Problem:** `createPendingReferralForProfile()` runs in a `useEffect` in `auth-provider.tsx` that fires after profile state is set. The `useEffect` dependency is `[profile]`, meaning it can re-fire on any profile update, and it reads from `sessionStorage` which may have already been cleared or could be stale. If the user navigates away after signup but before the effect fires, the referral is never created.

**Fix:** Move the referral creation call directly into the `signUp()` function in `auth-provider.tsx`, executed synchronously after the profile is returned by `authService.signUp()`, before calling `setProfile()`. Remove the `useEffect` entirely.

**File:** `src/features/auth/auth-provider.tsx`

- Inside the `signUp` method: read `sessionStorage.getItem('referralCode')` and `'referralBusinessId'`, call `referralsService.createReferral(...)`, clear sessionStorage keys, then call `setProfile(profile)`.
- Delete the `createPendingReferralForProfile` function and the `useEffect` that calls it.

---

## Fix 3 — Make redeem_credit_code Idempotent (MEDIUM)

**Problem:** In `redeem_credit_code()`, the `UPDATE credit_redemptions SET status = 'used'` can execute twice if two concurrent requests both pass the `SELECT ... FOR UPDATE`. The lock is held per-row, but two requests with the same code arriving simultaneously could both complete the SELECT before either UPDATE runs.

**Fix:** Add `AND status = 'pending'` to the UPDATE statement, then check `GET DIAGNOSTICS row_count = ROW_COUNT` to verify exactly one row was changed. If zero rows updated, raise an exception. This makes the operation idempotent under concurrency.

**File:** New migration  
`supabase/migrations/20260422000001_fix_credit_code_idempotency.sql`

Replace the `redeem_credit_code` RPC with an updated version that:
1. Keeps the `SELECT ... FOR UPDATE` (already correct)
2. Changes the UPDATE to `WHERE id = redemption_row.id AND status = 'pending'`
3. After the UPDATE, uses `GET DIAGNOSTICS` to assert exactly 1 row was changed
4. If 0 rows changed (code was already redeemed by concurrent request), raises `'Code already redeemed'`

---

## Fix 4 — User-Facing Feedback on Referral Creation Failure (MEDIUM)

**Problem:** `createReferral()` currently swallows errors silently. If the referral code is invalid or the call fails, the user lands on the "Your referral is pending" screen in `referral-register-page.tsx` even though no referral exists. The user expects a free coffee but the barista finds nothing to approve.

**Fix:** In `referral-register-page.tsx`, after `signUp()` resolves, check if the referral was created (the auth provider will now return the result). If not, show an inline warning: *"We couldn't link your referral code — your account was created successfully, but you won't receive the referral credit."* This uses the existing error state in the form.

**File:** `src/features/referrals/pages/referral-register-page.tsx`  
**File:** `src/features/auth/auth-provider.tsx` (expose referral result from `signUp()` return value or context)

---

## Fix 5 — Debounce "Redeem Free Coffee" Button (MEDIUM)

**Problem:** Rapid double-clicks on the "Redeem Free Coffee" button trigger two concurrent `generateCreditCode()` calls. The first code gets expired by the second call's cleanup step, but in the window between those two operations both codes are simultaneously 'pending' and redeemable.

**Fix:** Disable the button while `generateCreditCode` mutation is in-flight. React Query's `isPending` from `useMutation` already provides this — wire it to the button's `disabled` prop.

**File:** `src/features/dashboard/pages/dashboard-page.tsx`

---

## Fix 6 — Auto-Expire Stale Pending Codes (LOW)

**Problem:** Credit codes with `status = 'pending'` and `expires_at < now()` remain in the DB with the wrong status. The RPC's `expires_at > now()` check means they can't be redeemed (functionally safe), but the `status` column is misleading for data queries and admin views.

**Fix:** Add a DB trigger that fires `BEFORE INSERT OR UPDATE` on `credit_redemptions` and sets `status = 'expired'` when `expires_at <= now()`. Also add a cleanup function that can be run manually or via pg_cron.

**File:** New migration  
`supabase/migrations/20260422000002_auto_expire_credit_codes.sql`

---

## Improvement Recommendations (Post-Fix)

These are enhancements beyond bug fixes, for a follow-up sprint:

1. **Real scannable QR at POS** — Replace the 6-digit PIN with a customer QR code that baristas scan with a camera/tablet. The QR encodes the customer's `profile_id` and a timestamp-signed token. Eliminates manual typing errors. Would require a QR scanner component on the business dashboard.

2. **Real-time referral status push** — When a barista approves a referral, use Supabase Realtime on the `referrals` table to push a notification to the customer's dashboard immediately ("Your referral was approved! 1 free coffee added.") instead of waiting for the next page load.

3. **Referral expiry** — Add an `expires_at` column to `referrals` (e.g., 90 days). Auto-reject via pg_cron. Prevents indefinite pending accumulation for baristas.

4. **Points-for-referral** — Currently referrals only award `available_credits`, not `points`. Consider awarding a points bonus (e.g., 50 pts) to the referrer in addition to or instead of credits, depending on business goals.

5. **Barista validation UX** — Show the redeemed customer's name and avatar after a successful code validation, so the barista can confirm it's the right person.

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/migrations/20260422000000_fix_referral_insert_policy.sql` | NEW — drop direct INSERT policy |
| `supabase/migrations/20260422000001_fix_credit_code_idempotency.sql` | NEW — idempotent redeem RPC |
| `supabase/migrations/20260422000002_auto_expire_credit_codes.sql` | NEW — auto-expire trigger |
| `src/features/auth/auth-provider.tsx` | Move referral creation into signUp(), remove useEffect |
| `src/features/referrals/pages/referral-register-page.tsx` | Show feedback on referral failure |
| `src/features/dashboard/pages/dashboard-page.tsx` | Disable button during mutation |

---

## Verification

1. **Referral RLS fix:** Attempt a direct `supabase.from('referrals').insert(...)` from a customer session with a fake `referrer_id` — should be rejected with RLS violation.
2. **Referral timing fix:** Sign up via the referral register page, confirm `create_referral` is called before profile state is set, confirm sessionStorage is cleared.
3. **Credit idempotency:** Simulate two concurrent calls to `redeem_credit_code` with the same code — only one should succeed, credits should decrement by exactly 1.
4. **User feedback:** Sign up with an invalid referral code — should see the warning message on the success screen.
5. **Button debounce:** Rapidly click "Redeem Free Coffee" twice — only one code should be generated.
6. **Auto-expire:** Insert a `credit_redemptions` row with `expires_at` in the past — trigger should mark it as 'expired' immediately.
