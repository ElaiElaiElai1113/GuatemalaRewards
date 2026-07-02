# Checkout Order Feedback Polish Design

## Goal

Make the customer purchase flow clearer from cart to checkout to order confirmation and history.

## Design

Improve feedback in four existing pages:

- Cart
- Checkout
- Order confirmation
- Orders

Cart should keep its empty-state action to `/shop`, but use clearer copy: `Start shopping` and `Pick products from participating businesses before checking out.`

Checkout should add a compact `Checkout summary` panel near the form that explains:

- `Items in order`
- `Estimated total`
- `Estimated reward impact`
- `Verification required before earning rewards` when ID verification blocks the order

Order confirmation should add next actions for:

- `View orders`
- `Continue shopping`
- `View rewards`

Orders should keep the empty-state action to `/shop`, but use `Start shopping` consistently and clarify that purchases and points will appear after checkout.

## Data

Use existing frontend data only:

- cart items
- resolved products
- subtotal/tax/total
- estimated points
- `profile.verificationStatus`
- existing order hooks

No database, route, RPC, payment, or backend changes.

## Testing

Add source-level regression tests that confirm:

- Cart empty state uses `Start shopping` and clearer copy.
- Checkout contains `Checkout summary`, `Items in order`, `Estimated total`, `Estimated reward impact`, and verification blocker copy.
- Order confirmation links to `/orders`, `/shop`, and `/rewards`.
- Orders empty state uses `Start shopping` and clearer copy.
- New translatable strings have Spanish entries.
