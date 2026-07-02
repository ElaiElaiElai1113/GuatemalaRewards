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
      if coalesce(new.points, 0) = 0 and coalesce(new.available_credits, 0) = 0 then
        return new;
      end if;
    elsif new.points is not distinct from old.points
      and new.available_credits is not distinct from old.available_credits then
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
