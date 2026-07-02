create or replace function public.can_manage_business_catalog(p_business_id uuid)
returns boolean
language sql
stable
as $$
  select public.is_platform_admin()
    or (
      public.jwt_role() = 'business-owner'
      and public.current_business_id() = p_business_id
    )
$$;

drop policy if exists "Business owners can create rewards for their business" on public.rewards;
create policy "Business owners can create rewards for their business"
  on public.rewards for insert
  with check (public.can_manage_business_catalog(business_id));

drop policy if exists "Business owners can update their rewards" on public.rewards;
create policy "Business owners can update their rewards"
  on public.rewards for update
  using (public.can_manage_business_catalog(business_id))
  with check (public.can_manage_business_catalog(business_id));

drop policy if exists "Business owners can delete their rewards" on public.rewards;
create policy "Business owners can delete their rewards"
  on public.rewards for delete
  using (public.can_manage_business_catalog(business_id));

drop policy if exists "Business owners can create products for their business" on public.products;
create policy "Business owners can create products for their business"
  on public.products for insert
  with check (public.can_manage_business_catalog(business_id));

drop policy if exists "Business owners can update their products" on public.products;
create policy "Business owners can update their products"
  on public.products for update
  using (public.can_manage_business_catalog(business_id))
  with check (public.can_manage_business_catalog(business_id));

drop policy if exists "Business owners can delete their products" on public.products;
create policy "Business owners can delete their products"
  on public.products for delete
  using (public.can_manage_business_catalog(business_id));

drop policy if exists "Business owners can create promotions" on public.promotions;
create policy "Business owners can create promotions"
  on public.promotions for insert
  with check (public.can_manage_business_catalog(business_id));

drop policy if exists "Business owners can update promotions" on public.promotions;
create policy "Business owners can update promotions"
  on public.promotions for update
  using (public.can_manage_business_catalog(business_id))
  with check (public.can_manage_business_catalog(business_id));

drop policy if exists "Business owners can delete promotions" on public.promotions;
create policy "Business owners can delete promotions"
  on public.promotions for delete
  using (public.can_manage_business_catalog(business_id));

drop policy if exists "Business teams can create gift card catalog" on public.gift_card_catalog;
create policy "Business teams can create gift card catalog"
  on public.gift_card_catalog for insert
  with check (public.can_manage_business_catalog(business_id));

drop policy if exists "Business teams can update gift card catalog" on public.gift_card_catalog;
create policy "Business teams can update gift card catalog"
  on public.gift_card_catalog for update
  using (public.can_manage_business_catalog(business_id))
  with check (public.can_manage_business_catalog(business_id));

drop policy if exists "Business teams can delete gift card catalog" on public.gift_card_catalog;
create policy "Business teams can delete gift card catalog"
  on public.gift_card_catalog for delete
  using (public.can_manage_business_catalog(business_id));

drop policy if exists "Business owners can update own business settings" on public.businesses;
create policy "Business owners can update own business settings"
  on public.businesses for update
  using (public.can_manage_business_catalog(id))
  with check (public.can_manage_business_catalog(id));
