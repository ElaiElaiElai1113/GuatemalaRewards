alter table public.profiles
  add column if not exists member_qr_token text;

update public.profiles
set member_qr_token = replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')
where member_qr_token is null;

alter table public.profiles
  alter column member_qr_token set default replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');

create unique index if not exists profiles_member_qr_token_key
  on public.profiles (member_qr_token)
  where member_qr_token is not null;

alter table public.businesses
  add column if not exists reward_rate_percent numeric not null default 20 check (reward_rate_percent >= 0),
  add column if not exists commission_rate_percent numeric not null default 10 check (commission_rate_percent >= 10);

do $$
begin
  if not exists (
    select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'member_transaction_commission_status'
  ) then
    create type public.member_transaction_commission_status as enum ('commission_unpaid', 'commission_paid');
  end if;
end;
$$;

create table if not exists public.member_transactions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  purchase_amount numeric(12,2) not null check (purchase_amount > 0),
  reward_rate_percent numeric not null check (reward_rate_percent >= 0),
  reward_value numeric(12,2) not null check (reward_value >= 0),
  points_awarded integer not null check (points_awarded >= 0),
  commission_rate_percent numeric not null check (commission_rate_percent >= 10),
  commission_amount numeric(12,2) not null check (commission_amount >= 0),
  commission_status public.member_transaction_commission_status not null default 'commission_unpaid',
  commission_paid_at timestamptz,
  commission_paid_by uuid references public.profiles(id) on delete set null,
  commission_payment_note text,
  recorded_by uuid references public.profiles(id) on delete set null,
  note text,
  client_request_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists member_transactions_recorded_by_client_request_id_key
  on public.member_transactions (recorded_by, client_request_id)
  where client_request_id is not null;

create index if not exists idx_member_transactions_profile_id on public.member_transactions(profile_id);
create index if not exists idx_member_transactions_business_id on public.member_transactions(business_id);
create index if not exists idx_member_transactions_commission_status on public.member_transactions(commission_status);
create index if not exists idx_member_transactions_created_at on public.member_transactions(created_at desc);

drop trigger if exists set_member_transactions_updated_at on public.member_transactions;
create trigger set_member_transactions_updated_at
  before update on public.member_transactions
  for each row execute function public.handle_updated_at();

alter table public.member_transactions enable row level security;

drop policy if exists "Members can view own member transactions" on public.member_transactions;
create policy "Members can view own member transactions"
  on public.member_transactions for select
  using (profile_id = auth.uid());

drop policy if exists "Business staff can view own business member transactions" on public.member_transactions;
create policy "Business staff can view own business member transactions"
  on public.member_transactions for select
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('business-owner', 'business-staff')
        and p.business_id = public.member_transactions.business_id
    )
  );

drop policy if exists "Platform admins can view all member transactions" on public.member_transactions;
create policy "Platform admins can view all member transactions"
  on public.member_transactions for select
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'platform-admin'
    )
  );

create or replace function public.get_member_by_qr_token(p_token text)
returns table (
  id uuid,
  full_name text,
  email text,
  verification_status text,
  member_qr_token text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_profile public.profiles%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select *
    into actor_profile
  from public.profiles
  where profiles.id = auth.uid();

  if actor_profile.role not in ('business-owner', 'business-staff', 'platform-admin') then
    raise exception 'Permission denied';
  end if;

  return query
  select
    p.id,
    p.full_name,
    p.email,
    p.verification_status::text,
    p.member_qr_token
  from public.profiles p
  where p.member_qr_token = p_token
    and p.role = 'customer'
  limit 1;
end;
$$;

create or replace function public.record_member_transaction(
  p_member_qr_token text,
  p_purchase_amount numeric,
  p_note text default null,
  p_client_request_id uuid default null
)
returns public.member_transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  actor_profile public.profiles%rowtype;
  business_row public.businesses%rowtype;
  member_profile public.profiles%rowtype;
  existing_transaction public.member_transactions%rowtype;
  inserted_transaction public.member_transactions%rowtype;
  purchase_amount_value numeric(12,2);
  reward_value_value numeric(12,2);
  points_awarded_value integer;
  commission_amount_value numeric(12,2);
begin
  if actor_id is null then
    raise exception 'Authentication required';
  end if;

  if p_client_request_id is not null then
    select *
      into existing_transaction
    from public.member_transactions
    where recorded_by = actor_id
      and client_request_id = p_client_request_id
    limit 1;

    if found then
      return existing_transaction;
    end if;
  end if;

  select *
    into actor_profile
  from public.profiles
  where id = actor_id;

  if actor_profile.role not in ('business-owner', 'business-staff') or actor_profile.business_id is null then
    raise exception 'Permission denied';
  end if;

  select *
    into business_row
  from public.businesses
  where id = actor_profile.business_id
    and active = true
  for share;

  if not found then
    raise exception 'Business not found.';
  end if;

  select *
    into member_profile
  from public.profiles
  where member_qr_token = p_member_qr_token
    and role = 'customer';

  if not found then
    raise exception 'Member not found.';
  end if;

  if member_profile.verification_status::text <> 'verified' then
    raise exception 'identity_verification_required';
  end if;

  if p_purchase_amount is null or p_purchase_amount <= 0 then
    raise exception 'Purchase amount must be greater than 0.';
  end if;

  purchase_amount_value := round(p_purchase_amount::numeric, 2);
  reward_value_value := round((purchase_amount_value * business_row.reward_rate_percent / 100)::numeric, 2);
  points_awarded_value := floor(reward_value_value * 100);
  commission_amount_value := round((purchase_amount_value * business_row.commission_rate_percent / 100)::numeric, 2);

  insert into public.member_transactions (
    profile_id,
    business_id,
    purchase_amount,
    reward_rate_percent,
    reward_value,
    points_awarded,
    commission_rate_percent,
    commission_amount,
    recorded_by,
    note,
    client_request_id
  )
  values (
    member_profile.id,
    business_row.id,
    purchase_amount_value,
    business_row.reward_rate_percent,
    reward_value_value,
    points_awarded_value,
    business_row.commission_rate_percent,
    commission_amount_value,
    actor_id,
    nullif(trim(coalesce(p_note, '')), ''),
    p_client_request_id
  )
  returning *
    into inserted_transaction;

  insert into public.reward_balances (profile_id)
  values (member_profile.id)
  on conflict (profile_id) do nothing;

  update public.reward_balances
  set points = points + points_awarded_value
  where profile_id = member_profile.id;

  insert into public.activities (
    profile_id,
    business_id,
    type,
    title,
    description,
    points,
    status
  )
  values (
    member_profile.id,
    business_row.id,
    'earned',
    format('Purchase at %s - $%s', business_row.name, to_char(purchase_amount_value, 'FM999999990.00')),
    format('$%s reward value issued from scanned member purchase.', to_char(reward_value_value, 'FM999999990.00')),
    points_awarded_value,
    'posted'
  );

  insert into public.admin_logs (
    actor_id,
    actor_name,
    action,
    details
  )
  values (
    actor_id,
    coalesce(actor_profile.full_name, 'Business staff'),
    'Member QR transaction recorded',
    format('Recorded $%s for %s at %s. Awarded %s points. Commission owed: $%s.',
      to_char(purchase_amount_value, 'FM999999990.00'),
      member_profile.full_name,
      business_row.name,
      points_awarded_value,
      to_char(commission_amount_value, 'FM999999990.00')
    )
  );

  return inserted_transaction;
exception
  when unique_violation then
    if p_client_request_id is not null then
      select *
        into existing_transaction
      from public.member_transactions
      where recorded_by = actor_id
        and client_request_id = p_client_request_id
      limit 1;

      if found then
        return existing_transaction;
      end if;
    end if;

    raise;
end;
$$;

create or replace function public.mark_member_transaction_commission_paid(
  p_transaction_id uuid,
  p_note text default null
)
returns public.member_transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_profile public.profiles%rowtype;
  updated_transaction public.member_transactions%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select *
    into actor_profile
  from public.profiles
  where id = auth.uid();

  if actor_profile.role <> 'platform-admin' then
    raise exception 'Permission denied';
  end if;

  update public.member_transactions
  set commission_status = 'commission_paid',
      commission_paid_at = now(),
      commission_paid_by = auth.uid(),
      commission_payment_note = nullif(trim(coalesce(p_note, '')), '')
  where id = p_transaction_id
  returning *
    into updated_transaction;

  if not found then
    raise exception 'Transaction not found.';
  end if;

  insert into public.admin_logs (
    actor_id,
    actor_name,
    action,
    details
  )
  values (
    auth.uid(),
    coalesce(actor_profile.full_name, 'Platform Admin'),
    'Commission marked paid',
    format('Marked commission paid for member transaction %s.', p_transaction_id)
  );

  return updated_transaction;
end;
$$;

revoke all on function public.get_member_by_qr_token(text) from public;
revoke all on function public.record_member_transaction(text, numeric, text, uuid) from public;
revoke all on function public.mark_member_transaction_commission_paid(uuid, text) from public;

grant execute on function public.get_member_by_qr_token(text) to authenticated;
grant execute on function public.record_member_transaction(text, numeric, text, uuid) to authenticated;
grant execute on function public.mark_member_transaction_commission_paid(uuid, text) to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'member_transactions'
  ) then
    alter publication supabase_realtime add table public.member_transactions;
  end if;
end;
$$;
