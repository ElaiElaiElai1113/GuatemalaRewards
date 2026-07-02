# Customer Wallet Summary Design

## Goal

Make the customer dashboard feel like a guided wallet by putting the member's usable balance, access state, and next best action in one compact section near the top of the page.

## Design

Add a `CustomerWalletSummary` component to the dashboard. It should show:

- Total points.
- Reward credits.
- Active gift card count.
- Membership state.
- One state-driven primary action.

The primary action follows this order:

1. If the member is not ID verified, show `Verify ID` and link to `/profile#id-verification`.
2. If the member is verified but membership is inactive, show `Activate membership` and link to `/membership`.
3. If the member is verified, membership is active, and has points or reward credits, show `Redeem rewards` and link to `/rewards`.
4. If the member is verified, membership is active, and has no points or credits, show `Browse businesses` and link to `/shop`.

The component should be frontend-only and use existing dashboard data. It replaces the current standalone points card and three metric cards on the customer dashboard to reduce repetition.

## Data

Use existing data from `DashboardPage`:

- `profile.verificationStatus`
- `useMembership().isActive`
- `rewardBalance.data.points`
- `rewardBalance.data.availableCredits`
- active gift cards derived from `useMyGiftCards()`

No database, route, RPC, or token changes.

## Testing

Add source-level regression tests that confirm:

- The dashboard renders `CustomerWalletSummary`.
- The component receives verification status, membership state, points, credits, and gift card count.
- The component includes all four state-driven actions and their target routes.
- The old repeated metric-card section is removed from the dashboard.
- New translatable strings have Spanish entries.
