# Mobile Customer Navigation Polish Design

## Goal

Make customer navigation easier on phones by turning the existing three-item bottom nav into a complete mobile navigation surface.

## Design

Update `CustomerBottomNav` to show five core customer routes:

- `Home` -> `/dashboard`
- `Rewards` -> `/rewards`
- `Shop` -> `/shop`
- `Activity` -> `/activity`
- `Profile` -> `/profile`

Keep the desktop header navigation unchanged. The bottom nav remains mobile-only with `md:hidden`.

Add a compact mobile verification status row inside the bottom nav. It should link unverified, submitted, and rejected states to `/profile#id-verification`; verified state links to `/profile`. The labels should match the desktop pill:

- `Verification required`
- `Under review`
- `Needs resubmission`
- `Verified`

Pass `profile?.verificationStatus` from `CustomerLayout` into `CustomerBottomNav`, and increase mobile bottom content padding so fixed navigation does not cover customer page actions.

## Data

Use existing frontend data only:

- `profile.verificationStatus`
- `useLocation()` route matching
- existing customer routes

No database, route, RPC, or backend changes.

## Testing

Add source-level regression tests that confirm:

- `CustomerBottomNav` has the five core customer routes.
- The nav uses a five-column grid and remains `md:hidden`.
- Active matching covers `/redeem` for rewards and core route prefixes.
- `CustomerBottomNav` accepts a verification status prop and renders the four status labels.
- `CustomerLayout` passes `profile?.verificationStatus` and reserves larger mobile bottom padding.
