create or replace function public.adjust_member_points(
  p_profile_id uuid,
  p_delta integer,
  p_reason text,
  p_business_id uuid default null
)
returns public.reward_balances
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  actor_profile public.profiles%rowtype;
  target_profile public.profiles%rowtype;
  balance_row public.reward_balances%rowtype;
  updated_balance public.reward_balances%rowtype;
  actual_delta integer;
begin
  if actor_id is null then
    raise exception 'Authentication required';
  end if;

  if nullif(trim(coalesce(p_reason, '')), '') is null then
    raise exception 'Adjustment reason is required.';
  end if;

  select *
    into actor_profile
  from public.profiles
  where id = actor_id;

  if actor_profile.role is null then
    raise exception 'Permission denied';
  end if;

  if actor_profile.role <> 'platform-admin' and (
    actor_profile.role <> 'business-owner'
    or actor_profile.business_id is null
    or actor_profile.business_id is distinct from p_business_id
  ) then
    raise exception 'Permission denied';
  end if;

  select *
    into target_profile
  from public.profiles
  where id = p_profile_id;

  if not found then
    raise exception 'Member not found.';
  end if;

  if actor_profile.role = 'business-owner' and (
    target_profile.business_id is null
    or target_profile.business_id is distinct from actor_profile.business_id
  ) then
    raise exception 'Permission denied';
  end if;

  insert into public.reward_balances (profile_id)
  values (p_profile_id)
  on conflict (profile_id) do nothing;

  select *
    into balance_row
  from public.reward_balances
  where profile_id = p_profile_id
  for update;

  update public.reward_balances
  set points = greatest(0, balance_row.points + p_delta)
  where profile_id = p_profile_id
  returning *
    into updated_balance;

  actual_delta := updated_balance.points - balance_row.points;

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
    p_profile_id,
    coalesce(p_business_id, target_profile.business_id),
    'adjustment',
    case when actual_delta >= 0 then 'XP added by staff' else 'XP deducted by staff' end,
    p_reason,
    actual_delta,
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
    coalesce(actor_profile.full_name, 'Staff'),
    'XP Adjustment',
    format('%s %s XP for member %s. Reason: %s',
      case when actual_delta >= 0 then 'Added' else 'Deducted' end,
      abs(actual_delta),
      p_profile_id,
      p_reason
    )
  );

  return updated_balance;
end;
$$;

create or replace function public.consume_reward_credit(
  p_profile_id uuid
)
returns public.reward_balances
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  actor_profile public.profiles%rowtype;
  target_profile public.profiles%rowtype;
  balance_row public.reward_balances%rowtype;
  updated_balance public.reward_balances%rowtype;
begin
  if actor_id is null then
    raise exception 'Authentication required';
  end if;

  select *
    into actor_profile
  from public.profiles
  where id = actor_id;

  if actor_profile.role not in ('platform-admin', 'business-owner') then
    raise exception 'Permission denied';
  end if;

  select *
    into target_profile
  from public.profiles
  where id = p_profile_id;

  if not found then
    raise exception 'Member not found.';
  end if;

  if actor_profile.role = 'business-owner' and (
    actor_profile.business_id is null
    or target_profile.business_id is null
    or target_profile.business_id is distinct from actor_profile.business_id
  ) then
    raise exception 'Permission denied';
  end if;

  insert into public.reward_balances (profile_id)
  values (p_profile_id)
  on conflict (profile_id) do nothing;

  select *
    into balance_row
  from public.reward_balances
  where profile_id = p_profile_id
  for update;

  if balance_row.available_credits <= 0 then
    raise exception 'No Reward Credits are available for this member.';
  end if;

  update public.reward_balances
  set available_credits = available_credits - 1
  where profile_id = p_profile_id
  returning *
    into updated_balance;

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
    p_profile_id,
    coalesce(target_profile.business_id, actor_profile.business_id),
    'adjustment',
    'Reward Credit used',
    '',
    0,
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
    coalesce(actor_profile.full_name, 'Staff'),
    'Reward Credit used',
    format('Used 1 Reward Credit for member %s.', p_profile_id)
  );

  return updated_balance;
end;
$$;
