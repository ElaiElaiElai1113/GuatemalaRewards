# Activity Feedback Polish Design

## Goal

Make customer feedback clearer after earning, redeeming, issuing gift cards, or hitting a locked state.

## Design

Improve `ActivityList` so each row has a short human-readable activity kind in addition to the existing title, description, points, and date. The labels are:

- `Earned`
- `Redeemed`
- `Bonus`
- `Adjusted`
- `Gift card issued`
- `Gift card redeemed`

Activity rows should also distinguish pending items with a visible `Pending` badge while posted items continue to read as completed history.

For customer-facing empty activity lists, add an optional action that can point users to `/shop` with `Browse businesses`. Keep the action optional so admin activity lists do not show customer routes.

Improve locked gift-card copy from the generic `Verify ID` to `Verify ID to issue`, matching the clearer reward-card copy from Slice A.

## Data

Use existing frontend data only:

- `Activity.type`
- `Activity.status`
- Existing `ActivityList` consumers
- Existing gift-card locked state props

No database, route, RPC, or backend changes.

## Testing

Add source-level regression tests that confirm:

- `ActivityList` contains all activity-kind labels.
- `ActivityList` renders a `Pending` badge for pending activity.
- `ActivityList` supports optional empty-state action props without forcing a customer link into admin usage.
- Customer dashboard and activity page pass `/shop` / `Browse businesses` empty activity actions.
- Gift card tiles use `Verify ID to issue`.
- New translatable strings have Spanish entries.
