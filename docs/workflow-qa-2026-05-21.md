# Workflow QA - 2026-05-21

## Scope

Reviewed the customer, business owner, business staff, and admin workflow surfaces after the Spanish-first landing page work.

## Fresh Verification

- `npm test` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `.env` has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` keys present.

Build note: Vite reports the main JS chunk is larger than 500 kB after minification. This is not a functional failure, but it should be handled before production polish.

## Route Coverage

### Public And Acquisition

- `/` renders the early access letter page.
- `/early-access` renders the early access lead capture page.
- `/landing-page` renders the client-focused landing page.
- `/signin` is the customer login page.
- `/business/login` is the business/staff login page.
- `/admin` is the admin login page.
- `/promo`, `/promo/register`, `/ambassadors`, `/join`, `/business`, `/shop`, `/rewards`, and `/promotions` are public or customer-aware routes.

### Customer

- `/dashboard`
- `/shop`
- `/rewards`
- `/promotions`
- `/gift-cards`
- `/wallet/gift-cards`
- `/wallet/gift-cards/:id`
- `/cart`
- `/checkout`
- `/order-confirmation`
- `/orders`
- `/membership`
- `/redeem/:rewardId`
- `/activity`
- `/profile`

Critical behavior observed in code:

- Customer reward value actions require `verificationStatus === 'verified'`.
- Checkout normalizes cart items and rejects mixed-business carts.
- Reward redemption validates supported pickup windows.
- Gift card issuance is blocked unless the customer is verified.

### Business Owner And Staff

- `/business/dashboard`
- `/business/products`
- `/business/rewards`
- `/business/redemptions`
- `/business/promotions`
- `/business/members`
- `/business/partners`
- `/business/settings`
- `/business/gift-cards` is owner-only in the sidebar.

Critical behavior observed in code:

- Business owner and business staff share the same protected route and business workspace.
- Business staff are operational users: they can use dashboard, redemptions, member QR sale, members, partners, referral approval, and credit validation workflows.
- Business staff cannot manage products, rewards, promotions, gift-card catalog, or settings. Those sections are owner-only in navigation and direct-route access.
- Business data loads only after the signed-in profile has a `businessId`.

### Admin

- `/admin/portal`
- `/admin/gift-cards`

Critical behavior observed in code:

- Admin routes require `platform-admin`.
- Admin can manage users, businesses, owner/staff assignment, early access leads, ambassador leads, rewards, products, promotions, verification reviews, referrals, and gift card catalog/admin views.

## Launch Blockers

1. Legal pages are placeholder copy.
   - The app explicitly says terms, privacy, reward terms, and verification policy should be reviewed before launch.

2. Membership subscription is still mock-based.
   - Membership service uses `mock_subscribe`, `mock_renew`, and `mock_cancel`.
   - This is acceptable for demos, but not for a paid launch unless intentional.

3. Checkout is documented as a demo flow with no real payment processing.
   - `README.md` states no real payment is processed.
   - Checkout is always available in-app, but points remain pending until partner staff scan the member QR.
   - If launch requires paid customer orders, payment work is still pending.

4. No browser-level E2E suite exists for role workflows.
   - Current tests are useful static/unit checks, but they do not log in as each role and click through the app.

## Role Workflow Risks

1. Business staff permissions are intentionally operational.
   - Staff can handle redemptions, member QR sales, members, partners, referrals, and credit validation.
   - Staff cannot manage products, rewards, promotions, gift-card catalog, or settings.
   - Run `npm run test:e2e:workflows` after `npx supabase db reset` to verify staff direct URLs remain blocked.

2. Some business/staff pages depend directly on Supabase table reads.
   - If RLS or profile claims differ between local and production, those pages may fail even when build/tests pass.

3. Spanish coverage exists for `t(...)` strings, but many placeholders and some operational labels remain English.
   - This affects admin/business/staff/customer polish, not compilation.

4. Production bundle is large.
   - Consider route-level lazy loading before launch.

## Recommended Next Implementation Slice

Build a role workflow QA suite and fix failures found by it.

Initial E2E automation has been planned around Playwright and deterministic local Supabase seed users. Once Docker Desktop is running, use:

```bash
npx supabase db reset
npm run test:e2e:workflows
```

Use `npm run test:e2e` for the public smoke suite. Authenticated role workflow specs are skipped there unless `E2E_AUTH_ENABLED=true` is set.

Use the launch checklist suite to replace the spreadsheet's manual pass/fail process:

```bash
npx supabase db reset
npm run test:launch
```

The launch checklist maps directly to PT001 through PT008. Use Playwright pass, fail, and skipped output to update the platform testing log. PT001 and PT002 annotate payment settlement as pending until a real payment gateway exists. PT007 is skipped until a dedicated k6 or Artillery stress-test slice is added.

Use focused workflow suites when you want to replace additional manual passes:

```bash
npm run test:referrals
npm run test:onboarding
npm run test:gift-cards
npm run test:rewards
npm run test:agreements
npm run test:load
```

These suites cover partner referral attribution and duplicate protection, first-run onboarding states, gift-card issue/redeem operations, reward redemption fulfillment, required agreement signing, admin signed/unsigned agreement reporting, and a 100-request public launch load smoke. They use the same seeded accounts and Supabase browser/client assertions as `test:launch`.

The agreement suite signs through the real `sign-agreement` Supabase Edge Function. Before running `npm run test:agreements` locally, reset/seed Supabase and serve or deploy that Edge Function for the configured `VITE_SUPABASE_URL`.

The local seed accounts use password `demo1234`:

- `customer@Guatemala.test`
- `unverified@Guatemala.test`
- `staff@velvetbrew.test`
- `owner@velvetbrew.test`
- `admin@Guatemala.test`
- `agreement-pending-customer@Guatemala.test`
- `agreement-pending-owner@velvetbrew.test`
- `agreement-unsigned-customer@Guatemala.test`

Minimum E2E scenarios:

1. Customer
   - Sign in.
   - Open dashboard.
   - Browse shop.
   - Add item to cart.
   - Attempt checkout as unverified customer and confirm the verification gate.
   - Submit verification details.
   - Browse rewards.
   - Attempt reward redemption.
   - Open membership and gift card wallet.

2. Business Staff
   - Sign in through `/business/login`.
   - Confirm redirect to `/business/dashboard`.
   - Validate redemption screen.
   - Confirm operational access to redemptions, members, partners, and member QR sale workflows.
   - Search customer/member.
   - Award or validate credits if permitted.
   - Confirm owner-only sections are hidden and direct URLs for products, rewards, promotions, gift-card catalog, and settings redirect back to dashboard.

3. Business Owner
   - Sign in through `/business/login`.
   - Manage products.
   - Manage rewards.
   - Manage promotions.
   - View members and redemptions.
   - Manage gift card catalog.
   - Review settings.

4. Admin
   - Sign in through `/admin`.
   - Review early access leads.
   - Review member verification.
   - Create or update a business.
   - Assign owner/staff.
   - Review referrals and gift card catalog/admin views.

Recommended order:

1. Confirm staff permissions.
2. Add browser E2E tooling and seeded test users.
3. Run customer workflow first, because it drives signups and value actions.
4. Run staff/business owner workflows second, because they support fulfillment.
5. Run admin workflow third, because it controls launch operations.
6. Replace legal placeholder copy and decide whether paid membership/checkout are launch requirements.
