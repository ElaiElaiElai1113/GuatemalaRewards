do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'gift_cards'
      and column_name = 'gift_card_code'
  ) then
    update public.gift_cards
    set
      code = coalesce(code, gift_card_code),
      gift_card_code = coalesce(gift_card_code, code, public.generate_gift_card_code());

    alter table public.gift_cards
      alter column gift_card_code drop not null;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'gift_cards'
      and column_name = 'reward_points_used'
  ) then
    update public.gift_cards
    set
      points_spent = coalesce(points_spent, reward_points_used, 0),
      reward_points_used = coalesce(reward_points_used, points_spent, 0);

    alter table public.gift_cards
      alter column reward_points_used drop not null;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'gift_cards'
      and column_name = 'issued_by_profile_id'
  ) then
    update public.gift_cards
    set issued_by = coalesce(issued_by, issued_by_profile_id);

    alter table public.gift_cards
      alter column issued_by_profile_id drop not null;
  end if;
end
$$;

notify pgrst, 'reload schema';
