create extension if not exists pgcrypto;

create or replace function public.generate_secure_token(byte_length integer default 16)
returns text
language plpgsql
stable
as $$
declare
  hex_value text := '';
begin
  if byte_length is null or byte_length <= 0 then
    raise exception 'byte_length must be positive';
  end if;

  if to_regprocedure('extensions.gen_random_bytes(integer)') is not null then
    execute 'select encode(extensions.gen_random_bytes($1), ''hex'')'
      into hex_value
      using byte_length;
    return hex_value;
  end if;

  if to_regprocedure('gen_random_bytes(integer)') is not null then
    execute 'select encode(gen_random_bytes($1), ''hex'')'
      into hex_value
      using byte_length;
    return hex_value;
  end if;

  while length(hex_value) < byte_length * 2 loop
    hex_value := hex_value || replace(gen_random_uuid()::text, '-', '');
  end loop;

  return substr(hex_value, 1, byte_length * 2);
end;
$$;

create or replace function public.issue_gift_card(
  p_catalog_id uuid,
  p_customer_id uuid
)
returns public.gift_cards
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  actor_profile public.profiles%rowtype;
  catalog_row public.gift_card_catalog%rowtype;
  customer_profile public.profiles%rowtype;
  balance_row public.reward_balances%rowtype;
  next_card public.gift_cards%rowtype;
  next_token text;
  remaining_points integer;
begin
  if actor_id is null then
    raise exception 'Authentication required';
  end if;

  select * into actor_profile from public.profiles where id = actor_id;
  if not found then raise exception 'Issuing profile not found'; end if;

  select * into customer_profile from public.profiles where id = p_customer_id;
  if not found then raise exception 'Customer not found'; end if;
  if customer_profile.role <> 'customer' then raise exception 'Gift cards can only be issued to customers'; end if;

  select * into catalog_row
  from public.gift_card_catalog
  where id = p_catalog_id
    and is_active = true;
  if not found then raise exception 'Gift card catalog item is not active'; end if;

  if actor_profile.role = 'customer' and actor_id <> p_customer_id then
    raise exception 'Customers can only issue gift cards for themselves';
  end if;

  if actor_profile.role = 'business-owner' and (
    actor_profile.business_id is null
    or actor_profile.business_id <> catalog_row.business_id
  ) then
    raise exception 'Permission denied';
  end if;

  if actor_profile.role not in ('customer', 'platform-admin', 'business-owner') then
    raise exception 'Permission denied';
  end if;

  insert into public.reward_balances (profile_id)
  values (p_customer_id)
  on conflict (profile_id) do nothing;

  select * into balance_row
  from public.reward_balances
  where profile_id = p_customer_id
  for update;

  if balance_row.points < catalog_row.points_cost then
    raise exception 'Insufficient points';
  end if;

  update public.reward_balances
  set points = points - catalog_row.points_cost,
      updated_at = now()
  where profile_id = p_customer_id
    and points >= catalog_row.points_cost
  returning points into remaining_points;

  if not found then raise exception 'Insufficient points'; end if;

  loop
    next_token := public.generate_secure_token(16);
    begin
      insert into public.gift_cards (
        catalog_id,
        business_id,
        customer_id,
        issued_by,
        code,
        public_token,
        status,
        points_spent,
        expires_at
      )
      values (
        catalog_row.id,
        catalog_row.business_id,
        p_customer_id,
        actor_id,
        public.generate_gift_card_code(),
        next_token,
        'active',
        catalog_row.points_cost,
        now() + make_interval(days => catalog_row.expiry_days)
      )
      returning * into next_card;
      exit;
    exception
      when unique_violation then continue;
    end;
  end loop;

  insert into public.gift_card_events (gift_card_id, event_type, actor_id, metadata)
  values (
    next_card.id,
    'issued',
    actor_id,
    jsonb_build_object(
      'catalog_id', catalog_row.id,
      'business_id', catalog_row.business_id,
      'points_spent', catalog_row.points_cost,
      'remaining_points', remaining_points
    )
  );

  insert into public.activities (profile_id, business_id, type, title, description, points, status)
  values (
    p_customer_id,
    catalog_row.business_id,
    'gift_card_issued',
    'Gift card issued',
    catalog_row.title,
    -catalog_row.points_cost,
    'posted'
  );

  return next_card;
end;
$$;
