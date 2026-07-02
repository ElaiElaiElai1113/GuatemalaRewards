do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'gift_cards'
      and column_name = 'gift_card_code'
  ) then
    alter table public.gift_cards
      alter column gift_card_code set default public.generate_gift_card_code();

    execute $sql$
      create or replace function public.sync_legacy_gift_card_code()
      returns trigger
      language plpgsql
      set search_path = public
      as $fn$
      begin
        if new.code is null then
          new.code := coalesce(new.gift_card_code, public.generate_gift_card_code());
        end if;

        if new.gift_card_code is null then
          new.gift_card_code := new.code;
        end if;

        return new;
      end;
      $fn$;
    $sql$;

    drop trigger if exists sync_legacy_gift_card_code on public.gift_cards;
    create trigger sync_legacy_gift_card_code
      before insert or update on public.gift_cards
      for each row execute function public.sync_legacy_gift_card_code();

    update public.gift_cards
    set gift_card_code = coalesce(gift_card_code, code, public.generate_gift_card_code()),
        code = coalesce(code, gift_card_code, public.generate_gift_card_code());
  end if;
end
$$;

notify pgrst, 'reload schema';
