create or replace function public.jwt_role()
returns text
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '')
$$;

create or replace function public.current_business_id()
returns uuid
language sql
stable
as $$
  select nullif(auth.jwt() -> 'app_metadata' ->> 'business_id', '')::uuid
$$;

drop policy if exists "Businesses are viewable by everyone" on public.businesses;
create policy "Businesses are viewable by everyone"
  on public.businesses for select
  using (active = true or public.is_platform_admin());

drop policy if exists "Platform admins can manage businesses" on public.businesses;
create policy "Platform admins can manage businesses"
  on public.businesses for insert
  with check (public.is_platform_admin());

drop policy if exists "Platform admins can update businesses" on public.businesses;
create policy "Platform admins can update businesses"
  on public.businesses for update
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

drop policy if exists "Platform admins can delete businesses" on public.businesses;
create policy "Platform admins can delete businesses"
  on public.businesses for delete
  using (public.is_platform_admin());

insert into public.businesses (
  id,
  name,
  slug,
  description,
  earn_rate,
  tax_rate,
  currency,
  active
) values (
  '00000000-0000-4000-8000-000000000001',
  'Mystic Coffee',
  'mystic-coffee',
  'A mystical coffee experience with ethically sourced beans, herbal infusions, and enchanted blends.',
  8,
  0.0925,
  'USD',
  true
)
on conflict (slug) do nothing;
