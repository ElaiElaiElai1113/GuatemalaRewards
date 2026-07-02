create table public.credit_redemptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  code text not null check (code ~ '^[0-9]{6}$'),
  status text not null default 'pending' check (status in ('pending', 'used', 'expired')),
  expires_at timestamptz not null,
  used_at timestamptz,
  used_by_business_id uuid references public.businesses(id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index credit_redemptions_profile_code_pending_key
  on public.credit_redemptions (profile_id, code)
  where status = 'pending';

create unique index credit_redemptions_code_pending_key
  on public.credit_redemptions (code)
  where status = 'pending';

create index idx_credit_redemptions_code_status
  on public.credit_redemptions (code, status, expires_at);

create index idx_credit_redemptions_profile_id
  on public.credit_redemptions (profile_id);

alter table public.credit_redemptions enable row level security;

create policy "Users can view own credit redemptions"
  on public.credit_redemptions for select
  using (auth.uid() = profile_id);

create policy "Users can create own credit redemptions"
  on public.credit_redemptions for insert
  with check (auth.uid() = profile_id);

create policy "Users can expire own pending credit redemptions"
  on public.credit_redemptions for update
  using (auth.uid() = profile_id and status = 'pending')
  with check (auth.uid() = profile_id and status = 'expired');

create policy "Business owners can view credit redemptions"
  on public.credit_redemptions for select
  using (public.has_staff_access());

create policy "Business owners can update credit redemption status"
  on public.credit_redemptions for update
  using (public.has_staff_access())
  with check (public.has_staff_access());
