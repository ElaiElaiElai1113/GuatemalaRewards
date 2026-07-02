create or replace function public.enforce_verified_profile_value_action()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_profile_id uuid;
begin
  if tg_table_name = 'memberships' then
    if new.status::text <> 'active' then
      return new;
    end if;
    target_profile_id := new.profile_id;
  elsif tg_table_name = 'orders' then
    target_profile_id := new.profile_id;
  elsif tg_table_name = 'redemptions' then
    target_profile_id := new.profile_id;
  elsif tg_table_name = 'gift_cards' then
    if tg_op = 'UPDATE' and new.status is not distinct from old.status then
      return new;
    end if;
    if new.status::text not in ('active', 'redeemed') then
      return new;
    end if;
    target_profile_id := new.customer_id;
  elsif tg_table_name = 'reward_balances' then
    if tg_op = 'INSERT' then
      if coalesce(new.points, 0) = 0 then
        return new;
      end if;
    elsif new.points is not distinct from old.points
      and new.available_credits >= old.available_credits then
      return new;
    end if;

    target_profile_id := new.profile_id;
  else
    return new;
  end if;

  perform public.assert_member_verified(target_profile_id);
  return new;
end;
$$;

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
  where id = approve_referral.referral_id
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

  insert into public.reward_balances (profile_id)
  select participant_id
  from (values (referral_row.referrer_id), (referral_row.referee_id)) as participants(participant_id)
  on conflict (profile_id) do nothing;

  update public.referrals
  set status = 'approved',
      approved_by = approve_referral.approver_id,
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

revoke all on function public.approve_referral(uuid, uuid) from public;
grant execute on function public.approve_referral(uuid, uuid) to authenticated;
