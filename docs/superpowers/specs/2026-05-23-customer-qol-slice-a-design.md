# Customer QoL Slice A Design

## Goal

Make the customer experience clearer after signup by showing next steps, verification status, and explicit locked-action reasons.

## Design

Add a customer onboarding checklist to the dashboard. It should show five steps:

1. Account created
2. Verify ID
3. Activate membership
4. Unlock member QR
5. Earn first reward

Each step has a completed, current, or pending visual state and a direct action for incomplete steps. Verification action goes to `/profile#id-verification`, membership action goes to `/membership`, QR action goes to `/profile`, and earning action goes to `/shop`.

Add a verification status pill to the customer header near the avatar. It displays `Verification required`, `Under review`, `Verified`, or `Needs resubmission`. Non-verified states link to `/profile#id-verification`; verified links to `/profile`.

Update reward card locked copy from `Verify ID` to `Verify ID to redeem`.

## Data

Use existing frontend data only:

- `profile.verificationStatus`
- `profile.verificationRejectionReason`
- `useMembership().isActive`
- `rewardBalance.points`
- `recentActivity`

No database, route, or RPC changes.

## Testing

Add source-level tests that confirm:

- Dashboard renders a customer onboarding checklist.
- Checklist includes all five expected steps and links.
- Customer layout renders a verification status pill linked to verification.
- Reward card uses `Verify ID to redeem`.
- New translatable strings have Spanish entries.
