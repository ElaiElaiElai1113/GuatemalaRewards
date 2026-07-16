alter table public.memberships
  alter column price_cents set default 2500;

update public.memberships
set price_cents = 2500
where provider = 'mock'
  and currency = 'USD'
  and price_cents = 1000;

create or replace function public.mock_subscribe()
returns public.memberships
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  existing_membership public.memberships%rowtype;
  membership_row public.memberships%rowtype;
begin
  if actor_id is null then
    raise exception 'Authentication required';
  end if;

  select *
    into existing_membership
  from public.memberships
  where profile_id = actor_id
  for update;

  if found and existing_membership.status = 'active' and existing_membership.current_period_end > now() then
    return existing_membership;
  end if;

  insert into public.memberships (
    profile_id,
    status,
    current_period_start,
    current_period_end,
    cancel_at_period_end,
    price_cents,
    currency,
    provider,
    provider_subscription_id,
    last_credit_at
  )
  values (
    actor_id,
    'active',
    now(),
    now() + interval '30 days',
    false,
    2500,
    'USD',
    'mock',
    null,
    null
  )
  on conflict (profile_id) do update
  set status = 'active',
      current_period_start = now(),
      current_period_end = now() + interval '30 days',
      cancel_at_period_end = false,
      price_cents = 2500,
      currency = 'USD',
      provider = 'mock',
      provider_subscription_id = null,
      last_credit_at = null
  returning *
    into membership_row;

  perform public.grant_membership_credit(actor_id, 1000);

  return membership_row;
end;
$$;

create or replace function public.mock_renew()
returns public.memberships
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  existing_membership public.memberships%rowtype;
  membership_row public.memberships%rowtype;
  period_base timestamptz;
begin
  if actor_id is null then
    raise exception 'Authentication required';
  end if;

  select *
    into existing_membership
  from public.memberships
  where profile_id = actor_id
  for update;

  if found and existing_membership.last_credit_at is not null
    and existing_membership.last_credit_at::date = now()::date then
    return existing_membership;
  end if;

  period_base := greatest(coalesce(existing_membership.current_period_end, now()), now());

  insert into public.memberships (
    profile_id,
    status,
    current_period_start,
    current_period_end,
    cancel_at_period_end,
    price_cents,
    currency,
    provider,
    provider_subscription_id,
    last_credit_at
  )
  values (
    actor_id,
    'active',
    now(),
    now() + interval '30 days',
    false,
    2500,
    'USD',
    'mock',
    null,
    now()
  )
  on conflict (profile_id) do update
  set status = 'active',
      current_period_start = case
        when public.memberships.current_period_end > now() then public.memberships.current_period_start
        else now()
      end,
      current_period_end = period_base + interval '30 days',
      cancel_at_period_end = false,
      price_cents = 2500,
      currency = 'USD',
      provider = 'mock',
      provider_subscription_id = null,
      last_credit_at = now()
  returning *
    into membership_row;

  perform public.grant_membership_credit(actor_id, 1000);

  return membership_row;
end;
$$;

revoke all on function public.mock_subscribe() from public;
revoke all on function public.mock_renew() from public;

grant execute on function public.mock_subscribe() to authenticated;
grant execute on function public.mock_renew() to authenticated;
