alter table public.profiles
  add column if not exists registered_by_business_id uuid references public.businesses(id);

drop policy if exists "Staff can link customers to their business" on public.profiles;
create policy "Staff can link customers to their business"
  on public.profiles for update
  using (public.has_staff_access() and public.profiles.role = 'customer')
  with check (public.has_staff_access() and public.profiles.role = 'customer');

drop policy if exists "Business owners can view profiles for their business" on public.profiles;
create policy "Business owners can view profiles for their business"
  on public.profiles for select
  using (
    public.is_business_owner()
    and (
      id = auth.uid()
      or exists (
        select 1 from public.orders o
        where o.profile_id = public.profiles.id
          and o.business_id = public.current_business_id()
      )
      or registered_by_business_id = public.current_business_id()
    )
  );

drop policy if exists "Business owners can view customer balances" on public.reward_balances;
create policy "Business owners can view customer balances"
  on public.reward_balances for select
  using (
    public.is_business_owner()
    and (
      exists (
        select 1 from public.orders o
        where o.profile_id = public.reward_balances.profile_id
          and o.business_id = public.current_business_id()
      )
      or exists (
        select 1 from public.profiles p
        where p.id = public.reward_balances.profile_id
          and p.registered_by_business_id = public.current_business_id()
      )
    )
  );
