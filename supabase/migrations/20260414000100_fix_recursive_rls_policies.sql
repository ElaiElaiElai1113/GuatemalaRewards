-- ============================================================
-- Fix recursive RLS policies that query public.profiles
-- from inside other RLS checks. Use JWT claims instead.
-- ============================================================

create or replace function public.jwt_role()
returns text
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'role', '')
$$;

create or replace function public.current_business_id()
returns uuid
language sql
stable
as $$
  select nullif(auth.jwt() ->> 'business_id', '')::uuid
$$;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
as $$
  select public.jwt_role() = 'platform-admin'
$$;

create or replace function public.is_business_owner()
returns boolean
language sql
stable
as $$
  select public.jwt_role() = 'business-owner'
$$;

create or replace function public.has_staff_access()
returns boolean
language sql
stable
as $$
  select public.jwt_role() in ('platform-admin', 'business-owner')
$$;

drop policy if exists "Platform admins can view all profiles" on public.profiles;
create policy "Platform admins can view all profiles"
  on public.profiles for select
  using (public.is_platform_admin());

drop policy if exists "Business owners can view profiles for their business" on public.profiles;
create policy "Business owners can view profiles for their business"
  on public.profiles for select
  using (
    public.is_business_owner()
    and (
      id = auth.uid()
      or exists (
        select 1
        from public.orders o
        where o.profile_id = public.profiles.id
          and o.business_id = public.current_business_id()
      )
    )
  );

drop policy if exists "Platform admins can view all balances" on public.reward_balances;
create policy "Platform admins can view all balances"
  on public.reward_balances for select
  using (public.is_platform_admin());

drop policy if exists "Business owners can view customer balances" on public.reward_balances;
create policy "Business owners can view customer balances"
  on public.reward_balances for select
  using (
    public.is_business_owner()
    and exists (
      select 1
      from public.orders o
      where o.profile_id = public.reward_balances.profile_id
        and o.business_id = public.current_business_id()
    )
  );

drop policy if exists "Business owners can create rewards for their business" on public.rewards;
create policy "Business owners can create rewards for their business"
  on public.rewards for insert
  with check (
    public.is_business_owner()
    and public.current_business_id() = public.rewards.business_id
  );

drop policy if exists "Business owners can update their rewards" on public.rewards;
create policy "Business owners can update their rewards"
  on public.rewards for update
  using (
    public.is_business_owner()
    and public.current_business_id() = public.rewards.business_id
  );

drop policy if exists "Business owners can delete their rewards" on public.rewards;
create policy "Business owners can delete their rewards"
  on public.rewards for delete
  using (
    public.is_business_owner()
    and public.current_business_id() = public.rewards.business_id
  );

drop policy if exists "Platform admins can manage rewards" on public.rewards;
create policy "Platform admins can manage rewards"
  on public.rewards for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

drop policy if exists "Business owners can create products for their business" on public.products;
create policy "Business owners can create products for their business"
  on public.products for insert
  with check (
    public.is_business_owner()
    and public.current_business_id() = public.products.business_id
  );

drop policy if exists "Business owners can update their products" on public.products;
create policy "Business owners can update their products"
  on public.products for update
  using (
    public.is_business_owner()
    and public.current_business_id() = public.products.business_id
  );

drop policy if exists "Business owners can delete their products" on public.products;
create policy "Business owners can delete their products"
  on public.products for delete
  using (
    public.is_business_owner()
    and public.current_business_id() = public.products.business_id
  );

drop policy if exists "Platform admins can manage products" on public.products;
create policy "Platform admins can manage products"
  on public.products for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

drop policy if exists "Business owners can view orders for their business" on public.orders;
create policy "Business owners can view orders for their business"
  on public.orders for select
  using (
    public.is_business_owner()
    and public.current_business_id() = public.orders.business_id
  );

drop policy if exists "Platform admins can view all orders" on public.orders;
create policy "Platform admins can view all orders"
  on public.orders for select
  using (public.is_platform_admin());

drop policy if exists "Business owners can update order status" on public.orders;
create policy "Business owners can update order status"
  on public.orders for update
  using (
    public.is_business_owner()
    and public.current_business_id() = public.orders.business_id
  );

drop policy if exists "View line items via orders" on public.order_line_items;
create policy "View line items via orders"
  on public.order_line_items for select
  using (
    exists (
      select 1
      from public.orders o
      where o.id = public.order_line_items.order_id
        and (
          o.profile_id = auth.uid()
          or public.has_staff_access()
        )
    )
  );

drop policy if exists "Business owners can create promotions" on public.promotions;
create policy "Business owners can create promotions"
  on public.promotions for insert
  with check (
    public.is_business_owner()
    and public.current_business_id() = public.promotions.business_id
  );

drop policy if exists "Business owners can update promotions" on public.promotions;
create policy "Business owners can update promotions"
  on public.promotions for update
  using (
    public.is_business_owner()
    and public.current_business_id() = public.promotions.business_id
  );

drop policy if exists "Business owners can delete promotions" on public.promotions;
create policy "Business owners can delete promotions"
  on public.promotions for delete
  using (
    public.is_business_owner()
    and public.current_business_id() = public.promotions.business_id
  );

drop policy if exists "Platform admins can manage promotions" on public.promotions;
create policy "Platform admins can manage promotions"
  on public.promotions for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

drop policy if exists "Business owners can view activities for their business" on public.activities;
create policy "Business owners can view activities for their business"
  on public.activities for select
  using (
    public.is_business_owner()
    and public.current_business_id() = public.activities.business_id
  );

drop policy if exists "Platform admins can view all activities" on public.activities;
create policy "Platform admins can view all activities"
  on public.activities for select
  using (public.is_platform_admin());

drop policy if exists "Business owners can view redemptions for their business" on public.redemptions;
create policy "Business owners can view redemptions for their business"
  on public.redemptions for select
  using (
    public.is_business_owner()
    and exists (
      select 1
      from public.rewards r
      where r.id = public.redemptions.reward_id
        and r.business_id = public.current_business_id()
    )
  );

drop policy if exists "Platform admins can manage redemptions" on public.redemptions;
create policy "Platform admins can manage redemptions"
  on public.redemptions for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

drop policy if exists "Business owners can fulfill redemptions" on public.redemptions;
create policy "Business owners can fulfill redemptions"
  on public.redemptions for update
  using (
    public.is_business_owner()
    and exists (
      select 1
      from public.rewards r
      where r.id = public.redemptions.reward_id
        and r.business_id = public.current_business_id()
    )
  );

drop policy if exists "Platform admins can view logs" on public.admin_logs;
create policy "Platform admins can view logs"
  on public.admin_logs for select
  using (public.is_platform_admin());
