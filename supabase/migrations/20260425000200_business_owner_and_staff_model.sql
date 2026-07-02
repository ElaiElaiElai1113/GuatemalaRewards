alter table public.businesses
  add column if not exists owner_profile_id uuid references public.profiles(id) on delete set null;

create index if not exists idx_businesses_owner_profile_id
  on public.businesses (owner_profile_id);

do $$
declare
  owner_record record;
begin
  for owner_record in
    select distinct on (p.business_id)
      p.business_id,
      p.id as profile_id
    from public.profiles p
    where p.role = 'business-owner'
      and p.business_id is not null
    order by p.business_id, p.created_at, p.id
  loop
    update public.businesses
    set owner_profile_id = owner_record.profile_id
    where id = owner_record.business_id
      and owner_profile_id is null;
  end loop;

  update public.profiles p
  set role = 'business-staff'
  from public.businesses b
  where p.role = 'business-owner'
    and p.business_id = b.id
    and b.owner_profile_id is not null
    and p.id <> b.owner_profile_id;

  update auth.users u
  set raw_app_meta_data = jsonb_set(
    coalesce(u.raw_app_meta_data, '{}'::jsonb),
    '{role}',
    to_jsonb(p.role::text)
  )
  from public.profiles p
  where u.id = p.id
    and p.role = 'business-staff';
end;
$$;

create or replace function public.is_business_owner()
returns boolean
language sql
stable
as $$
  select public.jwt_role() in ('business-owner', 'business-staff')
$$;

create or replace function public.has_business_access()
returns boolean
language sql
stable
as $$
  select public.jwt_role() in ('business-owner', 'business-staff')
$$;

create or replace function public.has_staff_access()
returns boolean
language sql
stable
as $$
  select public.jwt_role() in ('platform-admin', 'business-owner', 'business-staff')
$$;

drop policy if exists "Business owners can view own business referrals" on public.referrals;
create policy "Business team can view own business referrals"
  on public.referrals for select
  using (
    public.has_business_access()
    and business_id = public.current_business_id()
  );

drop policy if exists "Business owners can update own business referrals" on public.referrals;
create policy "Business team can update own business referrals"
  on public.referrals for update
  using (
    public.has_business_access()
    and business_id = public.current_business_id()
  )
  with check (
    public.has_business_access()
    and business_id = public.current_business_id()
  );

drop policy if exists "staff can view referral participant profiles" on profiles;
create policy "staff can view referral participant profiles"
  on profiles for select
  using (
    public.jwt_role() in ('platform-admin', 'business-owner', 'business-staff')
    and exists (
      select 1
      from referrals r
      where r.referrer_id = profiles.id
         or r.referee_id = profiles.id
    )
  );

create or replace function public.assign_business_user(
  target_user_id uuid,
  target_role public.user_role,
  target_business_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_owner_id uuid;
begin
  if public.jwt_role() <> 'platform-admin' then
    raise exception 'Permission denied';
  end if;

  if target_role not in ('business-owner', 'business-staff') then
    raise exception 'Invalid business role';
  end if;

  if target_user_id is null or target_business_id is null then
    raise exception 'User and business are required';
  end if;

  if not exists (
    select 1
    from public.businesses
    where id = target_business_id
  ) then
    raise exception 'Business not found';
  end if;

  if target_role = 'business-owner' then
    select owner_profile_id
      into current_owner_id
    from public.businesses
    where id = target_business_id
    limit 1;

    if current_owner_id is not null and current_owner_id <> target_user_id then
      perform public.set_user_role(current_owner_id, 'business-staff', target_business_id);
    end if;

    update public.businesses
    set owner_profile_id = target_user_id
    where owner_profile_id = target_user_id
      and id <> target_business_id;

    update public.businesses
    set owner_profile_id = target_user_id
    where id = target_business_id;

    perform public.set_user_role(target_user_id, 'business-owner', target_business_id);
    return;
  end if;

  if exists (
    select 1
    from public.businesses
    where id = target_business_id
      and owner_profile_id = target_user_id
  ) then
    raise exception 'Assign a new owner before demoting the current owner.';
  end if;

  update public.businesses
  set owner_profile_id = null
  where owner_profile_id = target_user_id
    and id <> target_business_id;

  perform public.set_user_role(target_user_id, 'business-staff', target_business_id);
end;
$$;

revoke all on function public.assign_business_user(uuid, public.user_role, uuid) from public;
grant execute on function public.assign_business_user(uuid, public.user_role, uuid) to authenticated;

create or replace function public.approve_referral(
  referral_id uuid,
  approver_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  referral_row public.referrals%rowtype;
  requester_role text;
  requester_business_id uuid;
begin
  select role::text, business_id
    into requester_role, requester_business_id
  from public.profiles
  where id = auth.uid();

  if requester_role is null then
    raise exception 'Permission denied';
  end if;

  if approve_referral.approver_id <> auth.uid() then
    raise exception 'Approver must match current user.';
  end if;

  select *
    into referral_row
  from public.referrals
  where id = referral_id
    and status = 'pending'
  for update;

  if not found then
    raise exception 'Referral is not pending or could not be approved.';
  end if;

  if requester_role <> 'platform-admin' and (
    requester_role not in ('business-owner', 'business-staff')
    or requester_business_id is null
    or referral_row.business_id is distinct from requester_business_id
  ) then
    raise exception 'Permission denied';
  end if;

  update public.referrals
  set status = 'approved',
      approved_by = approver_id,
      approved_at = now()
  where id = referral_row.id;

  update public.reward_balances
  set available_credits = available_credits + 1
  where profile_id in (referral_row.referrer_id, referral_row.referee_id);

  if (select count(*) from public.reward_balances where profile_id in (referral_row.referrer_id, referral_row.referee_id)) <> 2 then
    raise exception 'Balance not found.';
  end if;

  insert into public.activities (profile_id, business_id, type, title, points, status)
  values
    (referral_row.referrer_id, referral_row.business_id, 'bonus', 'Referral credit awarded', 0, 'posted'),
    (referral_row.referee_id, referral_row.business_id, 'bonus', 'Referral credit awarded', 0, 'posted');
end;
$$;

create or replace function public.reject_referral(referral_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  referral_row public.referrals%rowtype;
  requester_role text;
  requester_business_id uuid;
begin
  select role::text, business_id
    into requester_role, requester_business_id
  from public.profiles
  where id = auth.uid();

  select *
    into referral_row
  from public.referrals
  where id = referral_id
    and status = 'pending'
  for update;

  if not found then
    raise exception 'Referral is not pending or could not be rejected.';
  end if;

  if requester_role <> 'platform-admin' and (
    requester_role not in ('business-owner', 'business-staff')
    or requester_business_id is null
    or referral_row.business_id is distinct from requester_business_id
  ) then
    raise exception 'Permission denied';
  end if;

  update public.referrals
  set status = 'rejected'
  where id = referral_row.id;
end;
$$;

create or replace function public.redeem_credit_code(
  code text,
  business_id uuid
)
returns table(profile_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  redemption_row public.credit_redemptions%rowtype;
  requester_role text;
  requester_business_id uuid;
  actor_name text;
begin
  select role::text, profiles.business_id, full_name
    into requester_role, requester_business_id, actor_name
  from public.profiles
  where id = auth.uid();

  if requester_role <> 'platform-admin' and (
    requester_role not in ('business-owner', 'business-staff')
    or requester_business_id is null
    or requester_business_id <> redeem_credit_code.business_id
  ) then
    raise exception 'Permission denied';
  end if;

  select *
    into redemption_row
  from public.credit_redemptions
  where credit_redemptions.code = regexp_replace(redeem_credit_code.code, '\D', '', 'g')
    and status = 'pending'
    and expires_at > now()
  order by created_at desc
  limit 1
  for update;

  if not found then
    raise exception 'Invalid or expired code';
  end if;

  update public.reward_balances
  set available_credits = available_credits - 1
  where reward_balances.profile_id = redemption_row.profile_id
    and available_credits > 0;

  if not found then
    raise exception 'No reward credits are available for this member.';
  end if;

  update public.credit_redemptions
  set status = 'used',
      used_at = now(),
      used_by_business_id = redeem_credit_code.business_id
  where id = redemption_row.id;

  insert into public.activities (profile_id, business_id, type, title, points, status)
  values (redemption_row.profile_id, redeem_credit_code.business_id, 'adjustment', 'Reward credit used', 0, 'posted');

  insert into public.admin_logs (actor_id, actor_name, action, details)
  values (
    auth.uid(),
    coalesce(actor_name, 'Staff redemption'),
    'Reward credit used',
    format('Used 1 reward credit for member %s.', redemption_row.profile_id)
  );

  profile_id := redemption_row.profile_id;
  return next;
end;
$$;

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
    actor_profile.role not in ('business-owner', 'business-staff')
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

  if actor_profile.role in ('business-owner', 'business-staff') and (
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

  if actor_profile.role not in ('platform-admin', 'business-owner', 'business-staff') then
    raise exception 'Permission denied';
  end if;

  select *
    into target_profile
  from public.profiles
  where id = p_profile_id;

  if not found then
    raise exception 'Member not found.';
  end if;

  if actor_profile.role in ('business-owner', 'business-staff') and (
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
