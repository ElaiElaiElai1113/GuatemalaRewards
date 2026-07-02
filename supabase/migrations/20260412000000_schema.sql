-- ============================================================
-- Guatemala Rewards - Database Schema
-- Multi-tenant SaaS with RLS for data isolation
-- ============================================================

-- ─── Custom Types ────────────────────────────────────────────

create type public.user_role as enum (
  'customer',
  'platform-admin',
  'business-owner'
);

create type public.order_status as enum (
  'confirmed',
  'processing',
  'delivered'
);

create type public.points_status as enum (
  'pending',
  'posted'
);

create type public.activity_type as enum (
  'earned',
  'redeemed',
  'bonus',
  'adjustment'
);

create type public.redemption_status as enum (
  'ready',
  'fulfilled'
);

create type public.reward_category as enum (
  'Drink',
  'Pastry',
  'Merch',
  'Experience'
);

create type public.product_category as enum (
  'Coffee',
  'Pastry',
  'Merch',
  'Equipment'
);

-- ─── Businesses ──────────────────────────────────────────────

create table public.businesses (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text not null default '',
  earn_rate   numeric not null default 10 check (earn_rate >= 0),
  tax_rate    numeric not null default 0 check (tax_rate >= 0 and tax_rate <= 0.5),
  currency    text not null default 'USD',
  active      boolean not null default true,
  logo_url    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── Profiles (linked to auth.users) ─────────────────────────

create table public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  full_name      text not null,
  email          text not null,
  phone          text not null default '',
  location       text not null default '',
  favorite_order text not null default '',
  role           public.user_role not null default 'customer',
  business_id    uuid references public.businesses(id) on delete set null,
  referral_code  text not null unique,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create or replace function public.generate_referral_code()
returns text
language plpgsql
as $$
declare
  candidate text;
begin
  loop
    candidate := upper(substr(md5(gen_random_uuid()::text), 1, 8));
    exit when not exists (
      select 1
      from public.profiles
      where referral_code = candidate
    );
  end loop;

  return candidate;
end;
$$;

-- ─── Reward Balances ─────────────────────────────────────────

create table public.reward_balances (
  id                 uuid primary key default gen_random_uuid(),
  profile_id         uuid not null references public.profiles(id) on delete cascade unique,
  points             integer not null default 0 check (points >= 0),
  next_reward_points integer not null default 300,
  available_credits  integer not null default 0 check (available_credits >= 0),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ─── Rewards ─────────────────────────────────────────────────

create table public.rewards (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  title        text not null,
  description  text not null default '',
  category     public.reward_category not null default 'Drink',
  points_cost  integer not null default 0 check (points_cost >= 0),
  inventory    integer not null default 0 check (inventory >= 0),
  featured     boolean not null default false,
  highlight    text not null default '',
  image_url    text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ─── Products ────────────────────────────────────────────────

create table public.products (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  title        text not null,
  description  text not null default '',
  category     public.product_category not null default 'Coffee',
  price        numeric not null default 0 check (price >= 0),
  inventory    integer not null default 0 check (inventory >= 0),
  featured     boolean not null default false,
  highlight    text not null default '',
  image_url    text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ─── Orders ──────────────────────────────────────────────────

create table public.orders (
  id             uuid primary key default gen_random_uuid(),
  profile_id     uuid not null references public.profiles(id) on delete cascade,
  business_id    uuid not null references public.businesses(id) on delete cascade,
  subtotal       numeric not null default 0,
  tax            numeric not null default 0,
  total          numeric not null default 0,
  points_earned  integer not null default 0,
  points_status  public.points_status not null default 'pending',
  payment_method text not null default '',
  status         public.order_status not null default 'confirmed',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ─── Order Line Items ────────────────────────────────────────

create table public.order_line_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders(id) on delete cascade,
  product_id    uuid not null references public.products(id) on delete restrict,
  product_title text not null,
  unit_price    numeric not null default 0,
  quantity      integer not null default 1 check (quantity > 0),
  subtotal      numeric not null default 0
);

-- ─── Promotions ──────────────────────────────────────────────

create table public.promotions (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  title        text not null,
  description  text not null default '',
  badge        text not null default '',
  cta          text not null default '',
  expires_at   timestamptz not null,
  audience     text not null default '',
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ─── Activities ──────────────────────────────────────────────

create table public.activities (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references public.profiles(id) on delete cascade,
  business_id  uuid references public.businesses(id) on delete set null,
  type         public.activity_type not null,
  title        text not null,
  description  text not null default '',
  points       integer not null default 0,
  status       public.points_status not null default 'posted',
  created_at   timestamptz not null default now()
);

-- ─── Redemptions ─────────────────────────────────────────────

create table public.redemptions (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null references public.profiles(id) on delete cascade,
  reward_id     uuid not null references public.rewards(id) on delete restrict,
  reward_title  text not null,
  points_cost   integer not null default 0,
  notes         text,
  status        public.redemption_status not null default 'ready',
  redeemed_at   timestamptz not null default now()
);

-- ─── Admin Logs ──────────────────────────────────────────────

create table public.admin_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references public.profiles(id) on delete set null,
  actor_name  text not null,
  action      text not null,
  details     text not null default '',
  created_at  timestamptz not null default now()
);

-- ─── Indexes ─────────────────────────────────────────────────

create index idx_profiles_role        on public.profiles(role);
create index idx_profiles_business_id on public.profiles(business_id);
create index idx_rewards_business_id  on public.rewards(business_id);
create index idx_products_business_id on public.products(business_id);
create index idx_orders_profile_id    on public.orders(profile_id);
create index idx_orders_business_id   on public.orders(business_id);
create index idx_activities_profile_id on public.activities(profile_id);
create index idx_activities_business_id on public.activities(business_id);
create index idx_activities_created_at on public.activities(created_at desc);
create index idx_redemptions_profile_id on public.redemptions(profile_id);
create index idx_promotions_business_id on public.promotions(business_id);
create index idx_admin_logs_created_at on public.admin_logs(created_at desc);

-- ─── Updated_at Trigger ──────────────────────────────────────

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_businesses_updated_at
  before update on public.businesses
  for each row execute function public.handle_updated_at();

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger set_reward_balances_updated_at
  before update on public.reward_balances
  for each row execute function public.handle_updated_at();

create trigger set_rewards_updated_at
  before update on public.rewards
  for each row execute function public.handle_updated_at();

create trigger set_products_updated_at
  before update on public.products
  for each row execute function public.handle_updated_at();

create trigger set_orders_updated_at
  before update on public.orders
  for each row execute function public.handle_updated_at();

create trigger set_promotions_updated_at
  before update on public.promotions
  for each row execute function public.handle_updated_at();

-- ─── Realtime ────────────────────────────────────────────────

alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.activities;
alter publication supabase_realtime add table public.reward_balances;
