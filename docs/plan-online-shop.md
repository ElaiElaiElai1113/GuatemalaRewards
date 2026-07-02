# Plan: Shop + Rewards Catalog + Multi-Business

## Context

The platform needs two separate tabs for customers:
1. **Shop** — browse and buy products with real money (cash/card)
2. **Rewards Catalog** — browse and redeem rewards with points

Both tabs must be **filterable by business** (e.g. Velvet Brew, Cafe Luna, etc.). Points are **shared across all businesses** — earn at one, redeem at any. This is a multi-tenant SaaS loyalty platform.

Currently the app only has a single "Catalog" page for points-based rewards with no business concept.

## Design Decisions

- **Multi-tenant via `businessId`** — every product, reward, promotion, and order belongs to a business. One Supabase instance, filtered by business.
- **Shared points balance** — one unified balance per customer, not per business. Points earned anywhere, spendable anywhere.
- **Business filter on both tabs** — dropdown or pill selector to filter products/rewards by business (with an "All" option).
- **Demo checkout** — mock checkout is clearly labeled; no real payment processing
- **Configurable earn rate** — each business sets its own points-per-dollar rate
- **Immediate availability, "processing" display** — points added immediately, Activity shows as `pending` with "Processing - available within 24 hours" badge
- **Cart in separate localStorage** — ephemeral cart state, not mixed with domain data
- **Products (Shop) are separate from Rewards (Catalog)** — products have dollar prices, rewards have point costs

## New Data Models

```
Business       — id, name, slug, description, earnRate, taxRate, currency, active
Product        — id, businessId, title, description, category, price, inventory, featured, highlight
CartItem       — productId, quantity (separate localStorage key)
Order          — id, profileId, businessId, items[], subtotal, tax, total, pointsEarned, pointsStatus, paymentMethod, status, createdAt
OrderLineItem  — productId, productTitle, unitPrice, quantity, subtotal
```

Existing models that gain a `businessId`:
```
Reward         — add businessId
Promotion      — add businessId
```

Balance stays **global per customer** (no businessId) — points are shared.

## Seed Data: Two Businesses

```
Business 1: Velvet Brew (coffee shop) — earnRate: 10 pts/$1
Business 2: Cafe Luna (bakery/cafe) — earnRate: 8 pts/$1
```

Each gets its own set of products, rewards, and promotions.

## Customer Navigation (updated)

```
Dashboard | Shop | Rewards | Promotions | History | Profile
                ↑ cash      ↑ points
```

## Files to Create (13 new)

### Services (5)
1. `src/integrations/supabase/services/business-service.ts`
2. `src/integrations/supabase/services/products-service.ts`
3. `src/integrations/supabase/services/cart-service.ts`
4. `src/integrations/supabase/services/orders-service.ts`
5. `src/integrations/supabase/services/settings-service.ts`

### Components (3)
6. `src/features/shop/components/product-card.tsx`
7. `src/features/shop/components/cart-item-row.tsx`
8. `src/components/business-filter.tsx` (shared between Shop + Rewards)

### Pages (5)
9. `src/features/shop/pages/shop-page.tsx` — `/shop`
10. `src/features/shop/pages/cart-page.tsx` — `/cart`
11. `src/features/shop/pages/checkout-page.tsx` — `/checkout`
12. `src/features/shop/pages/order-confirmation-page.tsx` — `/order-confirmation`
13. `src/features/shop/pages/orders-page.tsx` — `/orders`

## Files to Modify (10 existing)

| File | Change |
|------|--------|
| `src/types/domain.ts` | Add Business, Product, CartItem, Order, OrderLineItem. Add `businessId` to Reward, Promotion. Extend MockStore |
| `src/lib/mock-store.ts` | Seed 2 businesses, products/rewards per business, cart utilities |
| `src/types/forms.ts` | Add productDraftSchema, checkoutSchema, businessSettingsSchema |
| `src/hooks/use-customer-data.ts` | Add hooks for businesses, products, cart, orders. Update reward/promo hooks with businessId filter |
| `src/hooks/use-admin-data.ts` | Add hooks for product CRUD, business settings |
| `src/routes/router.tsx` | Add 5 new customer routes |
| `src/layouts/customer-layout.tsx` | Add Shop nav, rename Catalog → Rewards, cart badge |
| `src/features/rewards/pages/rewards-page.tsx` | Add business filter |
| `src/features/admin/pages/admin-page.tsx` | Add Businesses + Products tabs |
| `src/features/rewards/components/reward-card.tsx` | Show business name badge |

## Verification
1. `npm run dev` — no build errors
2. Shop shows products from both businesses, filterable
3. Rewards shows rewards from both businesses, filterable
4. Purchase at Velvet Brew → points earned at Velvet Brew's rate
5. Redeem those points on a Cafe Luna reward → works (shared balance)
6. Admin can manage businesses and products per business
