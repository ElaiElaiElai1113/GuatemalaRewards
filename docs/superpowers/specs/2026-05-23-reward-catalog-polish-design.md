# Reward Catalog Polish Design

## Goal

Make the reward catalog easier to browse by showing claimability, available points, and more specific empty-state feedback.

## Design

Add a compact catalog summary bar to the rewards page below the verification/membership notices and above the category tiles. It should show:

- Available points.
- Total rewards currently in the loaded catalog.
- Claimable rewards count.
- The active category/filter.

Add `Claimable` to the existing reward filters. When selected, the catalog should only show rewards that:

- Have inventory.
- Are affordable with the member's current points.
- Are not blocked by ID verification.
- Have active membership available through the existing `EarnRedeemGate` flow.

Improve empty states:

- If `Claimable` is selected and no rewards match, show `No claimable rewards yet` with copy explaining the member can earn more points, verify ID, or check back later.
- If a normal category filter has no results, show `No rewards match this filter`.
- If the whole catalog is empty, keep `No rewards yet`.

This slice is limited to the rewards catalog. Gift-card catalog polish can remain a later slice because the reward page already has more filters and the larger browse surface.

## Data

Use existing frontend data only:

- `useRewards()`
- `rewardBalance.data.points`
- `profile.verificationStatus`
- `useMembership().isActive`
- reward inventory and point cost

No database, route, RPC, or backend changes.

## Testing

Add source-level regression tests that confirm:

- Rewards filters include `Claimable`.
- Rewards page derives `claimableRewards`.
- Rewards page renders a `Catalog summary` bar with `Available points`, `Total rewards`, `Claimable rewards`, and `Active filter`.
- Empty-state copy distinguishes no claimable rewards from no matching filter results.
- New translatable strings have Spanish entries.
