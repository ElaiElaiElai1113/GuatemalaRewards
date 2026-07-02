do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'gift_cards'
      and column_name = 'gift_card_value_cents'
  ) then
    update public.gift_cards
    set gift_card_value_cents = 1
    where gift_card_value_cents is null
       or gift_card_value_cents <= 0;

    alter table public.gift_cards
      alter column gift_card_value_cents set default 1,
      alter column gift_card_value_cents drop not null;

    execute $sql$
      create or replace function public.sync_legacy_gift_card_code()
      returns trigger
      language plpgsql
      set search_path = public
      as $fn$
      declare
        catalog_value_label text;
        parsed_value numeric;
      begin
        if new.code is null then
          new.code := coalesce(new.gift_card_code, public.generate_gift_card_code());
        end if;

        if new.gift_card_code is null then
          new.gift_card_code := new.code;
        end if;

        if new.gift_card_value_cents is null or new.gift_card_value_cents <= 0 then
          if new.catalog_id is not null then
            select value_label
              into catalog_value_label
            from public.gift_card_catalog
            where id = new.catalog_id;

            parsed_value := nullif(regexp_replace(coalesce(catalog_value_label, ''), '[^0-9.]', '', 'g'), '')::numeric;
          end if;

          new.gift_card_value_cents := greatest(coalesce(round(parsed_value * 100)::integer, 1), 1);
        end if;

        return new;
      end;
      $fn$;
    $sql$;
  end if;
end
$$;

notify pgrst, 'reload schema';
