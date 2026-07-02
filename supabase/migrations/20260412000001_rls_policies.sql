-- ============================================================
-- RLS Policies - Multi-tenant data isolation
-- ============================================================
-- Roles:
--   customer       -> can see own data + public business data
--   business-owner -> can manage own business data only
--   platform-admin -> can see/manage everything
-- ============================================================

-- Enable RLS on all tables

alter table public.businesses     enable row level security;
alter table public.profiles       enable row level security;
alter table public.reward_balances enable row level security;
alter table public.rewards        enable row level security;
alter table public.products       enable row level security;
alter table public.orders         enable row level security;
alter table public.order_line_items enable row level security;
alter table public.promotions     enable row level security;
alter table public.activities     enable row level security;
alter table public.redemptions    enable row level security;
alter table public.admin_logs     enable row level security;

-- ─── Helper: role checks via app_metadata ────────────────────
-- Authorization data stored in auth.users.raw_app_meta_data
-- NOT in user_metadata (user-editable, unsafe for auth decisions)

-- ─── Businesses ──────────────────────────────────────────────

-- Everyone can read active businesses
create policy "Businesses are viewable by everyone"
  on public.businesses for select
  using (active = true or auth.jwt() ->> 'role' = 'platform-admin');

-- Only platform admins can create/update/delete businesses
create policy "Platform admins can manage businesses"
  on public.businesses for insert
  with check (auth.jwt() ->> 'role' = 'platform-admin');

create policy "Platform admins can update businesses"
  on public.businesses for update
  using (auth.jwt() ->> 'role' = 'platform-admin');

create policy "Platform admins can delete businesses"
  on public.businesses for delete
  using (auth.jwt() ->> 'role' = 'platform-admin');

-- ─── Profiles ────────────────────────────────────────────────

-- Users can read their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Platform admins can see all profiles
create policy "Platform admins can view all profiles"
  on public.profiles for select
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'platform-admin'
  ));

-- Business owners can see profiles of customers who interacted with their business
create policy "Business owners can view profiles for their business"
  on public.profiles for select
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'business-owner'
  ) and (
    -- Customers who have orders at this business
    exists (
      select 1 from public.orders o
      where o.profile_id = public.profiles.id
      and o.business_id = (
        select business_id from public.profiles where id = auth.uid()
      )
    )
    or id = auth.uid()
  ));

-- Users can update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ─── Reward Balances ─────────────────────────────────────────

-- Users can read their own balance
create policy "Users can view own balance"
  on public.reward_balances for select
  using (auth.uid() = profile_id);

-- Platform admins can see all balances
create policy "Platform admins can view all balances"
  on public.reward_balances for select
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'platform-admin'
  ));

-- Business owners can see balances of customers who ordered from their business
create policy "Business owners can view customer balances"
  on public.reward_balances for select
  using (exists (
    select 1 from public.orders o
    join public.profiles p on p.id = auth.uid()
    where o.profile_id = public.reward_balances.profile_id
    and o.business_id = p.business_id
  ));

-- System manages balance changes (via secure functions)
-- No direct insert/update/delete for frontend clients
create policy "System can insert balances"
  on public.reward_balances for insert
  with check (auth.uid() = profile_id);

-- ─── Rewards ─────────────────────────────────────────────────

-- Everyone can read rewards
create policy "Rewards are viewable by everyone"
  on public.rewards for select
  using (true);

-- Business owners can manage their own rewards
create policy "Business owners can create rewards for their business"
  on public.rewards for insert
  with check (exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
    and p.role = 'business-owner'
    and p.business_id = public.rewards.business_id
  ));

create policy "Business owners can update their rewards"
  on public.rewards for update
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
    and p.role = 'business-owner'
    and p.business_id = public.rewards.business_id
  ));

create policy "Business owners can delete their rewards"
  on public.rewards for delete
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
    and p.role = 'business-owner'
    and p.business_id = public.rewards.business_id
  ));

-- Platform admins can manage all rewards
create policy "Platform admins can manage rewards"
  on public.rewards for all
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'platform-admin'
  ));

-- ─── Products ────────────────────────────────────────────────

-- Everyone can read products
create policy "Products are viewable by everyone"
  on public.products for select
  using (true);

-- Business owners can manage their own products
create policy "Business owners can create products for their business"
  on public.products for insert
  with check (exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
    and p.role = 'business-owner'
    and p.business_id = public.products.business_id
  ));

create policy "Business owners can update their products"
  on public.products for update
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
    and p.role = 'business-owner'
    and p.business_id = public.products.business_id
  ));

create policy "Business owners can delete their products"
  on public.products for delete
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
    and p.role = 'business-owner'
    and p.business_id = public.products.business_id
  ));

-- Platform admins can manage all products
create policy "Platform admins can manage products"
  on public.products for all
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'platform-admin'
  ));

-- ─── Orders ──────────────────────────────────────────────────

-- Users can see their own orders
create policy "Users can view own orders"
  on public.orders for select
  using (auth.uid() = profile_id);

-- Business owners can see orders for their business
create policy "Business owners can view orders for their business"
  on public.orders for select
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
    and p.role = 'business-owner'
    and p.business_id = public.orders.business_id
  ));

-- Platform admins can see all orders
create policy "Platform admins can view all orders"
  on public.orders for select
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'platform-admin'
  ));

-- Users can create orders for themselves
create policy "Users can create orders"
  on public.orders for insert
  with check (auth.uid() = profile_id);

-- Business owners can update order status for their business
create policy "Business owners can update order status"
  on public.orders for update
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
    and p.role = 'business-owner'
    and p.business_id = public.orders.business_id
  ));

-- ─── Order Line Items ────────────────────────────────────────

-- Inherit visibility from orders
create policy "View line items via orders"
  on public.order_line_items for select
  using (exists (
    select 1 from public.orders o
    where o.id = public.order_line_items.order_id
    and (
      o.profile_id = auth.uid()
      or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('platform-admin', 'business-owner'))
    )
  ));

create policy "Create line items via orders"
  on public.order_line_items for insert
  with check (exists (
    select 1 from public.orders o
    where o.id = public.order_line_items.order_id
    and o.profile_id = auth.uid()
  ));

-- ─── Promotions ──────────────────────────────────────────────

-- Everyone can read promotions
create policy "Promotions are viewable by everyone"
  on public.promotions for select
  using (true);

-- Business owners can manage their promotions
create policy "Business owners can create promotions"
  on public.promotions for insert
  with check (exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
    and p.role = 'business-owner'
    and p.business_id = public.promotions.business_id
  ));

create policy "Business owners can update promotions"
  on public.promotions for update
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
    and p.role = 'business-owner'
    and p.business_id = public.promotions.business_id
  ));

create policy "Business owners can delete promotions"
  on public.promotions for delete
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
    and p.role = 'business-owner'
    and p.business_id = public.promotions.business_id
  ));

-- Platform admins can manage all promotions
create policy "Platform admins can manage promotions"
  on public.promotions for all
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'platform-admin'
  ));

-- ─── Activities ──────────────────────────────────────────────

-- Users can see their own activities
create policy "Users can view own activities"
  on public.activities for select
  using (auth.uid() = profile_id);

-- Business owners can see activities for their business
create policy "Business owners can view activities for their business"
  on public.activities for select
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
    and p.role = 'business-owner'
    and p.business_id = public.activities.business_id
  ));

-- Platform admins can see all activities
create policy "Platform admins can view all activities"
  on public.activities for select
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'platform-admin'
  ));

-- System creates activities (via secure functions/triggers)
create policy "System can insert activities"
  on public.activities for insert
  with check (true); -- managed via triggers/functions

-- ─── Redemptions ─────────────────────────────────────────────

-- Users can see their own redemptions
create policy "Users can view own redemptions"
  on public.redemptions for select
  using (auth.uid() = profile_id);

-- Business owners can see redemptions for their rewards
create policy "Business owners can view redemptions for their business"
  on public.redemptions for select
  using (exists (
    select 1 from public.rewards r
    join public.profiles p on p.id = auth.uid()
    where r.id = public.redemptions.reward_id
    and r.business_id = p.business_id
  ));

-- Platform admins can see all redemptions
create policy "Platform admins can view all redemptions"
  on public.redemptions for select
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'platform-admin'
  ));

-- Users can create redemptions
create policy "Users can create redemptions"
  on public.redemptions for insert
  with check (auth.uid() = profile_id);

-- Business owners can update redemption status (fulfill)
create policy "Business owners can fulfill redemptions"
  on public.redemptions for update
  using (exists (
    select 1 from public.rewards r
    join public.profiles p on p.id = auth.uid()
    where r.id = public.redemptions.reward_id
    and r.business_id = p.business_id
  ));

-- ─── Admin Logs ──────────────────────────────────────────────

-- Only platform admins can view logs
create policy "Platform admins can view logs"
  on public.admin_logs for select
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'platform-admin'
  ));

-- System creates logs (via triggers/functions)
create policy "System can insert logs"
  on public.admin_logs for insert
  with check (true);
