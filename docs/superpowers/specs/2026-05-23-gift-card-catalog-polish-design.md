# Gift Card Catalog Polish Design

## Goal

Bring the gift-card catalog up to the same clarity level as the rewards catalog by showing claimability, available points, and better empty-state feedback.

## Design

Add a compact gift-card catalog summary below the verification notice and before the promotional gift-card panel. It should show:

- Available points.
- Total gift cards in the current catalog.
- Claimable gift cards.
- Active business filter.

Add a `Claimable` toggle near the business filter. When enabled, the catalog grid should only show gift cards that:

- Cost no more than the member's current points.
- Are not blocked by ID verification.

Featured gift-card carousel remains based on the full selected-business catalog so the page can still preview inventory even if nothing is currently claimable.

Improve empty states:

- If `Claimable` is enabled and no gift cards match, show `No claimable gift cards yet` with copy explaining the member can earn more points, verify ID, or check back later.
- If a business filter is selected and no cards exist, show `No gift cards for this business`.
- If the full catalog is empty, keep `No gift cards yet`.

## Data

Use existing frontend data only:

- `useGiftCardCatalog()`
- `useRewardBalance()`
- `profile.verificationStatus`
- `selectedBusiness`

No database, route, RPC, or backend changes.

## Testing

Add source-level regression tests that confirm:

- Gift-card page derives `claimableGiftCards`.
- Gift-card page has `showClaimableOnly` state.
- Summary includes `Gift card summary`, `Available points`, `Total gift cards`, `Claimable gift cards`, and `Active business`.
- Empty-state copy distinguishes no claimable cards, no business cards, and no cards at all.
- New translatable strings have Spanish entries.
