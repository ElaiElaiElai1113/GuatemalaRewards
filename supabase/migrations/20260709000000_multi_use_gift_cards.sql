create or replace function public.parse_gift_card_value_label(p_value_label text)
returns numeric
language sql
immutable
as $$
  select coalesce(
    nullif(substring(coalesce(p_value_label, '') from '([0-9]+(\.[0-9]+)?)'), '')::numeric,
    0
  );
$$;

alter table public.gift_cards
  add column if not exists original_value_amount numeric(12,2),
  add column if not exists remaining_value_amount numeric(12,2),
  add column if not exists value_currency text not null default 'USD';

update public.gift_cards gc
set
  original_value_amount = round(greatest(public.parse_gift_card_value_label(gcc.value_label), 0)::numeric, 2),
  remaining_value_amount = case
    when gc.status = 'redeemed' or gc.redeemed_at is not null then 0
    else round(greatest(public.parse_gift_card_value_label(gcc.value_label), 0)::numeric, 2)
  end,
  value_currency = coalesce(
    nullif(upper(substring(coalesce(gcc.value_label, '') from '([A-Za-z]{3})')), ''),
    'USD'
  )
from public.gift_card_catalog gcc
where gcc.id = gc.catalog_id
  and (
    gc.original_value_amount is null
    or gc.remaining_value_amount is null
    or gc.value_currency is null
  );

update public.gift_cards
set
  original_value_amount = coalesce(original_value_amount, 0),
  remaining_value_amount = coalesce(remaining_value_amount, case when status = 'redeemed' then 0 else original_value_amount end, 0),
  value_currency = coalesce(value_currency, 'USD');

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'gift_cards_original_value_amount_nonnegative'
  ) then
    alter table public.gift_cards
      add constraint gift_cards_original_value_amount_nonnegative check (original_value_amount >= 0) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'gift_cards_remaining_value_amount_nonnegative'
  ) then
    alter table public.gift_cards
      add constraint gift_cards_remaining_value_amount_nonnegative check (remaining_value_amount >= 0) not valid;
  end if;
end
$$;

drop function if exists public.get_business_gift_cards(uuid);

create or replace function public.get_business_gift_cards(p_business_id uuid)
returns table (
  id uuid,
  catalog_id uuid,
  business_id uuid,
  customer_id uuid,
  issued_by uuid,
  code text,
  public_token text,
  status public.gift_card_status,
  points_spent integer,
  original_value_amount numeric,
  remaining_value_amount numeric,
  value_currency text,
  expires_at timestamptz,
  redeemed_at timestamptz,
  redeemed_by uuid,
  redeemed_at_business uuid,
  created_at timestamptz,
  updated_at timestamptz,
  catalog_title text,
  catalog_description text,
  catalog_value_label text,
  catalog_image_url text,
  business_name text,
  business_logo_url text,
  customer_first_name text,
  redemption_original_bill numeric,
  redemption_gift_card_amount numeric,
  redemption_remaining_balance numeric,
  redemption_receipt_number text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  actor_profile public.profiles%rowtype;
begin
  if actor_id is null then
    raise exception 'Authentication required';
  end if;

  select * into actor_profile
  from public.profiles
  where profiles.id = actor_id;

  if not found then
    raise exception 'Business profile not found';
  end if;

  if actor_profile.role <> 'platform-admin' and (
    actor_profile.role not in ('business-owner', 'business-staff')
    or actor_profile.business_id is null
    or actor_profile.business_id <> p_business_id
  ) then
    raise exception 'Permission denied';
  end if;

  return query
  select
    gc.id,
    gc.catalog_id,
    gc.business_id,
    gc.customer_id,
    gc.issued_by,
    gc.code,
    gc.public_token,
    case
      when gc.status in ('redeemed', 'cancelled') then gc.status
      when gc.expires_at <= now() then 'expired'::public.gift_card_status
      when coalesce(gc.remaining_value_amount, 0) <= 0 then 'redeemed'::public.gift_card_status
      else gc.status
    end as status,
    gc.points_spent,
    coalesce(gc.original_value_amount, public.parse_gift_card_value_label(gcc.value_label)) as original_value_amount,
    coalesce(gc.remaining_value_amount, public.parse_gift_card_value_label(gcc.value_label)) as remaining_value_amount,
    coalesce(gc.value_currency, upper(substring(coalesce(gcc.value_label, '') from '([A-Za-z]{3})')), 'USD') as value_currency,
    gc.expires_at,
    gc.redeemed_at,
    gc.redeemed_by,
    gc.redeemed_at_business,
    gc.created_at,
    gc.updated_at,
    coalesce(gcc.title, 'Gift card') as catalog_title,
    coalesce(gcc.description, '') as catalog_description,
    coalesce(gcc.value_label, '') as catalog_value_label,
    gcc.image_url as catalog_image_url,
    b.name as business_name,
    b.logo_url as business_logo_url,
    split_part(coalesce(customer.full_name, 'Member'), ' ', 1) as customer_first_name,
    nullif(latest_redemption.metadata ->> 'original_bill', '')::numeric as redemption_original_bill,
    nullif(latest_redemption.metadata ->> 'gift_card_amount', '')::numeric as redemption_gift_card_amount,
    nullif(latest_redemption.metadata ->> 'remaining_balance', '')::numeric as redemption_remaining_balance,
    nullif(latest_redemption.metadata ->> 'receipt_number', '') as redemption_receipt_number
  from public.gift_cards gc
  join public.businesses b on b.id = gc.business_id
  join public.profiles customer on customer.id = gc.customer_id
  left join public.gift_card_catalog gcc on gcc.id = gc.catalog_id
  left join lateral (
    select gce.metadata
    from public.gift_card_events gce
    where gce.gift_card_id = gc.id
      and gce.event_type in ('redeemed', 'partially_redeemed')
    order by gce.created_at desc
    limit 1
  ) latest_redemption on true
  where gc.business_id = p_business_id
  order by gc.created_at desc;
end;
$$;

revoke all on function public.get_business_gift_cards(uuid) from public;
grant execute on function public.get_business_gift_cards(uuid) to authenticated;

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
  remaining_points integer := null;
  card_value numeric(12,2);
  card_currency text;
  should_charge_points boolean := false;
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

  if actor_profile.role = 'customer' then
    if actor_id <> p_customer_id then
      raise exception 'Customers can only issue gift cards for themselves';
    end if;
    should_charge_points := true;
  elsif actor_profile.role in ('business-owner', 'business-staff') then
    if actor_profile.business_id is null or actor_profile.business_id <> catalog_row.business_id then
      raise exception 'Permission denied';
    end if;
  elsif actor_profile.role <> 'platform-admin' then
    raise exception 'Permission denied';
  end if;

  card_value := round(greatest(public.parse_gift_card_value_label(catalog_row.value_label), 0)::numeric, 2);
  card_currency := coalesce(nullif(upper(substring(coalesce(catalog_row.value_label, '') from '([A-Za-z]{3})')), ''), 'USD');

  if card_value <= 0 then
    raise exception 'Gift card value must be greater than 0.';
  end if;

  if should_charge_points then
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
  end if;

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
        original_value_amount,
        remaining_value_amount,
        value_currency,
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
        case when should_charge_points then catalog_row.points_cost else 0 end,
        card_value,
        card_value,
        card_currency,
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
      'points_spent', next_card.points_spent,
      'remaining_points', remaining_points,
      'original_value_amount', card_value,
      'remaining_value_amount', card_value,
      'issue_source', actor_profile.role
    )
  );

  insert into public.activities (profile_id, business_id, type, title, description, points, status)
  values (
    p_customer_id,
    catalog_row.business_id,
    'gift_card_issued',
    'Gift card issued',
    catalog_row.title,
    -next_card.points_spent,
    'posted'
  );

  return next_card;
end;
$$;

create or replace function public.redeem_gift_card(
  p_gift_card_id uuid,
  p_business_id uuid,
  p_original_bill numeric default null,
  p_receipt_number text default null,
  p_gift_card_amount numeric default null,
  p_client_request_id uuid default null
)
returns public.gift_cards
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  actor_profile public.profiles%rowtype;
  business_row public.businesses%rowtype;
  card_row public.gift_cards%rowtype;
  updated_card public.gift_cards%rowtype;
  inserted_transaction public.member_transactions%rowtype;
  existing_receipt_transaction public.member_transactions%rowtype;
  catalog_title text;
  receipt_number_value text;
  original_bill_value numeric(12,2);
  requested_gift_card_amount_value numeric(12,2);
  gift_card_amount_value numeric(12,2);
  remaining_balance_value numeric(12,2);
  bill_after_gift_card_value numeric(12,2);
  tax_charge_value numeric(12,2);
  service_charge_value numeric(12,2);
  total_before_gift_card_value numeric(12,2);
  final_bill_value numeric(12,2);
  purchase_amount_value numeric(12,2);
  reward_value_value numeric(12,2);
  points_awarded_value integer;
  commission_amount_value numeric(12,2);
  redemption_event_type text;
begin
  if actor_id is null then raise exception 'Authentication required'; end if;

  select * into actor_profile from public.profiles where id = actor_id;
  if not found then raise exception 'Redeeming profile not found'; end if;

  if actor_profile.role <> 'platform-admin' and (
    actor_profile.role not in ('business-owner', 'business-staff')
    or actor_profile.business_id is null
    or actor_profile.business_id <> p_business_id
  ) then
    raise exception 'Permission denied';
  end if;

  select * into business_row
  from public.businesses
  where id = p_business_id;

  if not found then raise exception 'Business not found'; end if;

  select * into card_row
  from public.gift_cards
  where id = p_gift_card_id
  for update;

  if not found then raise exception 'Gift card not found'; end if;
  if card_row.business_id <> p_business_id then raise exception 'Gift card belongs to a different business'; end if;
  if card_row.status = 'cancelled' then raise exception 'Gift card is cancelled'; end if;
  if card_row.status = 'redeemed' or coalesce(card_row.remaining_value_amount, 0) <= 0 then raise exception 'Gift card has no remaining balance'; end if;
  if card_row.status <> 'active' then raise exception 'Gift card is not active'; end if;

  if now() >= card_row.expires_at then
    update public.gift_cards set status = 'expired' where id = card_row.id;
    insert into public.gift_card_events (gift_card_id, event_type, actor_id, metadata)
    values (card_row.id, 'expired', actor_id, jsonb_build_object('reason', 'redeem_attempt_after_expiry'));
    raise exception 'Gift card has expired';
  end if;

  select title into catalog_title
  from public.gift_card_catalog
  where id = card_row.catalog_id;

  if p_original_bill is not null then
    if p_original_bill <= 0 then
      raise exception 'Original bill must be greater than 0.';
    end if;

    receipt_number_value := nullif(trim(coalesce(p_receipt_number, '')), '');
    if receipt_number_value is null or length(receipt_number_value) < 3 then
      raise exception 'Receipt or bill number is required.';
    end if;

    select *
      into existing_receipt_transaction
    from public.member_transactions
    where business_id = business_row.id
      and lower(trim(receipt_number)) = lower(receipt_number_value)
    limit 1;

    if found then
      raise exception 'This receipt or bill number has already been recorded.';
    end if;

    original_bill_value := round(p_original_bill::numeric, 2);
    tax_charge_value := case
      when coalesce(business_row.tax_included_in_bill, false)
        then round((original_bill_value * coalesce(business_row.tax_rate, 0))::numeric, 2)
      else 0
    end;
    service_charge_value := case
      when coalesce(business_row.service_charge_enabled, false)
        then round((original_bill_value * coalesce(business_row.service_charge_rate, 0))::numeric, 2)
      else 0
    end;
    total_before_gift_card_value := round((original_bill_value + tax_charge_value + service_charge_value)::numeric, 2);
    requested_gift_card_amount_value := round(greatest(coalesce(p_gift_card_amount, card_row.remaining_value_amount), 0)::numeric, 2);
    gift_card_amount_value := round(least(requested_gift_card_amount_value, card_row.remaining_value_amount, total_before_gift_card_value)::numeric, 2);
    bill_after_gift_card_value := round(greatest(original_bill_value - gift_card_amount_value, 0)::numeric, 2);
    final_bill_value := round(greatest(total_before_gift_card_value - gift_card_amount_value, 0)::numeric, 2);
  else
    original_bill_value := null;
    requested_gift_card_amount_value := round(greatest(coalesce(p_gift_card_amount, card_row.remaining_value_amount), 0)::numeric, 2);
    gift_card_amount_value := round(least(requested_gift_card_amount_value, card_row.remaining_value_amount)::numeric, 2);
    bill_after_gift_card_value := null;
    tax_charge_value := 0;
    service_charge_value := 0;
    total_before_gift_card_value := null;
    final_bill_value := null;
  end if;

  if gift_card_amount_value <= 0 then
    raise exception 'Gift card amount must be greater than 0.';
  end if;

  remaining_balance_value := round(greatest(card_row.remaining_value_amount - gift_card_amount_value, 0)::numeric, 2);
  redemption_event_type := case when remaining_balance_value > 0 then 'partially_redeemed' else 'redeemed' end;

  update public.gift_cards
  set status = case when remaining_balance_value > 0 then 'active'::public.gift_card_status else 'redeemed'::public.gift_card_status end,
      remaining_value_amount = remaining_balance_value,
      redeemed_at = case when remaining_balance_value <= 0 then now() else redeemed_at end,
      redeemed_by = actor_id,
      redeemed_at_business = p_business_id,
      updated_at = now()
  where id = p_gift_card_id
    and status = 'active'
    and coalesce(remaining_value_amount, 0) > 0
  returning * into updated_card;

  if not found then raise exception 'Gift card balance changed. Please reload and try again.'; end if;

  insert into public.gift_card_events (gift_card_id, event_type, actor_id, metadata)
  values (
    updated_card.id,
    redemption_event_type,
    actor_id,
    jsonb_build_object(
      'business_id', p_business_id,
      'original_bill', original_bill_value,
      'requested_gift_card_amount', requested_gift_card_amount_value,
      'gift_card_amount', gift_card_amount_value,
      'remaining_balance', remaining_balance_value,
      'bill_after_gift_card', bill_after_gift_card_value,
      'tax_added', tax_charge_value,
      'service_charge_added', service_charge_value,
      'total_before_gift_card', total_before_gift_card_value,
      'final_bill', final_bill_value,
      'receipt_number', receipt_number_value
    )
  );

  if original_bill_value is not null and original_bill_value > 0 then
    purchase_amount_value := original_bill_value;

    reward_value_value := round((purchase_amount_value * business_row.reward_rate_percent / 100)::numeric, 2);
    points_awarded_value := floor(reward_value_value);
    commission_amount_value := round((purchase_amount_value * business_row.commission_rate_percent / 100)::numeric, 2);

    insert into public.member_transactions (
      profile_id,
      business_id,
      purchase_amount,
      receipt_number,
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
      updated_card.customer_id,
      business_row.id,
      purchase_amount_value,
      receipt_number_value,
      business_row.reward_rate_percent,
      reward_value_value,
      points_awarded_value,
      business_row.commission_rate_percent,
      commission_amount_value,
      actor_id,
      format(
        'Gift card code: %s. Gift card value: %s. Gift card remaining balance: %s. Original receipt total: %s. Bill after gift card: %s. Tax added: %s. Service charge added: %s. Total before gift card: %s. Final bill after gift card: %s.',
        updated_card.code,
        to_char(gift_card_amount_value, 'FM999999990.00'),
        to_char(remaining_balance_value, 'FM999999990.00'),
        to_char(original_bill_value, 'FM999999990.00'),
        to_char(bill_after_gift_card_value, 'FM999999990.00'),
        to_char(tax_charge_value, 'FM999999990.00'),
        to_char(service_charge_value, 'FM999999990.00'),
        to_char(total_before_gift_card_value, 'FM999999990.00'),
        to_char(final_bill_value, 'FM999999990.00')
      ),
      p_client_request_id
    )
    returning * into inserted_transaction;

    insert into public.reward_balances (profile_id)
    values (updated_card.customer_id)
    on conflict (profile_id) do nothing;

    update public.reward_balances
    set points = points + points_awarded_value
    where profile_id = updated_card.customer_id;

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
      updated_card.customer_id,
      business_row.id,
      'earned',
      format('Purchase at %s - %s %s', business_row.name, business_row.currency, to_char(purchase_amount_value, 'FM999999990.00')),
      format('%s %s reward value issued from receipt %s after gift card %s.', business_row.currency, to_char(reward_value_value, 'FM999999990.00'), receipt_number_value, updated_card.code),
      points_awarded_value,
      'posted'
    );
  end if;

  insert into public.activities (profile_id, business_id, type, title, description, points, status)
  values (
    updated_card.customer_id,
    updated_card.business_id,
    'gift_card_redeemed',
    case when remaining_balance_value > 0 then 'Gift card partially used' else 'Gift card redeemed' end,
    format('%s. Used %s %s. Remaining %s %s.', coalesce(catalog_title, updated_card.code), updated_card.value_currency, to_char(gift_card_amount_value, 'FM999999990.00'), updated_card.value_currency, to_char(remaining_balance_value, 'FM999999990.00')),
    0,
    'posted'
  );

  return updated_card;
end;
$$;

revoke all on function public.redeem_gift_card(uuid, uuid, numeric, text, numeric, uuid) from public;
grant execute on function public.redeem_gift_card(uuid, uuid, numeric, text, numeric, uuid) to authenticated;

drop function if exists public.get_public_gift_card_by_token(text);

create or replace function public.get_public_gift_card_by_token(p_token text)
returns table (
  id uuid,
  catalog_id uuid,
  business_id uuid,
  customer_id uuid,
  code text,
  public_token text,
  status public.gift_card_status,
  points_spent integer,
  original_value_amount numeric,
  remaining_value_amount numeric,
  value_currency text,
  expires_at timestamptz,
  redeemed_at timestamptz,
  business_name text,
  business_logo_url text,
  business_primary_color text,
  business_accent_color text,
  customer_first_name text,
  title text,
  description text,
  value_label text,
  image_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    gc.id,
    gc.catalog_id,
    gc.business_id,
    gc.customer_id,
    gc.code,
    gc.public_token,
    case
      when gc.status in ('redeemed', 'cancelled') then gc.status
      when gc.expires_at <= now() then 'expired'::public.gift_card_status
      when coalesce(gc.remaining_value_amount, 0) <= 0 then 'redeemed'::public.gift_card_status
      else gc.status
    end as status,
    gc.points_spent,
    coalesce(gc.original_value_amount, public.parse_gift_card_value_label(gcc.value_label)) as original_value_amount,
    coalesce(gc.remaining_value_amount, public.parse_gift_card_value_label(gcc.value_label)) as remaining_value_amount,
    coalesce(gc.value_currency, upper(substring(coalesce(gcc.value_label, '') from '([A-Za-z]{3})')), 'USD') as value_currency,
    gc.expires_at,
    gc.redeemed_at,
    b.name as business_name,
    b.logo_url as business_logo_url,
    '#8B5A2B' as business_primary_color,
    '#D4A574' as business_accent_color,
    split_part(coalesce(customer.full_name, 'Member'), ' ', 1) as customer_first_name,
    coalesce(gcc.title, 'Gift card') as title,
    coalesce(gcc.description, '') as description,
    coalesce(gcc.value_label, '') as value_label,
    gcc.image_url
  from public.gift_cards gc
  join public.businesses b on b.id = gc.business_id
  join public.profiles customer on customer.id = gc.customer_id
  left join public.gift_card_catalog gcc on gcc.id = gc.catalog_id
  where gc.public_token = p_token
     or upper(gc.code) = upper(p_token)
  limit 1;
$$;

notify pgrst, 'reload schema';
