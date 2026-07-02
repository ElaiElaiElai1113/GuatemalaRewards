# Supabase Setup Guide

## Quick Start

### 1. Create a Supabase Project

Create a new Supabase project in the dashboard and keep the project ref handy for CLI linking.

### 2. Link and Push Migrations

Use the Supabase CLI so the remote schema and migration history stay in sync:

```bash
# Link this repo to your Supabase project
supabase link --project-ref your-project-ref

# Push all repo migrations to the linked remote database
supabase db push
```

If the remote database already contains schema changes that were applied manually, repair the migration history before pushing again:

```bash
supabase migration list --linked
supabase migration repair <version> --status applied
supabase db push
```

### 3. Seed Local Data

Use a reset when you want the full local schema plus seed data:

```bash
supabase db reset
```

### 4. Create Demo Users

In Supabase Dashboard -> Authentication -> Users, create these users:

| Email | Password | app_metadata |
|-------|----------|-------------|
| `ava@example.com` | `demo1234` | `{ "role": "customer" }` |
| `admin@guatemalarewards.com` | `demo1234` | `{ "role": "platform-admin" }` |
| `owner@velvetbrew.co` | `demo1234` | `{ "role": "business-owner", "business_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11" }` |
| `owner@mysticcoffee.co` | `demo1234` | `{ "role": "business-owner", "business_id": "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22" }` |

Set `role` in `app_metadata`, not `user_metadata`. The auth trigger reads from `app_metadata` when creating the profile row.

### 5. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials from Dashboard -> Settings -> API:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

### 6. Verify

```bash
npm run dev
npm run lint
npm run test
npm run build
```

If `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set, the app uses Supabase. Otherwise it falls back to the localStorage mock store.

---

## Database Schema

### Tables

| Table | Purpose | RLS |
|-------|---------|-----|
| `businesses` | Multi-tenant businesses | Everyone reads, admins manage |
| `profiles` | User profiles linked to auth.users | Own profile + admin/owner access |
| `reward_balances` | Points balances per user | Own balance + admin/owner access |
| `rewards` | Redeemable rewards per business | Everyone reads, owners manage own |
| `products` | Purchasable products per business | Everyone reads, owners manage own |
| `orders` | Customer orders | Own orders + owner sees their business |
| `order_line_items` | Items within orders | Inherits from orders |
| `promotions` | Promotional campaigns | Everyone reads, owners manage own |
| `activities` | Points activity log | Own activities + owner sees their business |
| `redemptions` | Reward redemption records | Own redemptions + owner sees their business |
| `admin_logs` | Audit trail | Platform admins only |

### Role-Based Access

| Action | Customer | Business Owner | Platform Admin |
|--------|----------|---------------|----------------|
| View businesses | Yes | Yes | Yes |
| Manage businesses | No | No | Yes |
| View own profile | Yes | Yes | Yes |
| View all profiles | No | No | Yes |
| View own balance | Yes | Yes | Yes |
| View all balances | No | No | Yes |
| View rewards/products | Yes | Yes | Yes |
| Manage own rewards | No | Yes | Yes |
| Manage all rewards | No | No | Yes |
| Place orders | Yes | No | Yes |
| View own orders | Yes | No | Yes |
| View business orders | No | Yes | Yes |
| View admin logs | No | No | Yes |

---

## Using Supabase CLI

```bash
# Link to your project
supabase link --project-ref your-project-ref

# See local vs remote migration history
supabase migration list --linked

# Push new migrations
supabase db push

# Reset and re-seed locally
supabase db reset
```

Avoid mixing manual SQL execution in the dashboard with CLI-managed migrations unless you also repair the remote migration history afterward.

---

## Migration Path from Mock Store

The app still supports a localStorage mock store fallback. To use Supabase end-to-end:

1. Set up Supabase with the CLI workflow above.
2. Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. Create the demo users or real tenant users in Supabase Auth.
4. Verify the critical flows against the linked database.

The service layer in `src/integrations/supabase/services/` is already structured to preserve the same frontend interface while swapping storage backends.
