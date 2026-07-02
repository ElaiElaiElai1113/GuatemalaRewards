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
  gift_card_amount_value numeric(12,2);
  bill_after_gift_card_value numeric(12,2);
  tax_charge_value numeric(12,2);
  service_charge_value numeric(12,2);
  final_bill_value numeric(12,2);
  purchase_amount_value numeric(12,2);
  reward_value_value numeric(12,2);
  points_awarded_value integer;
  commission_amount_value numeric(12,2);
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
  if card_row.status = 'redeemed' or card_row.redeemed_at is not null then raise exception 'Gift card has already been redeemed'; end if;
  if card_row.status <> 'active' then raise exception 'Gift card is not active'; end if;

  if now() >= card_row.expires_at then
    update public.gift_cards set status = 'expired' where id = card_row.id;
    insert into public.gift_card_events (gift_card_id, event_type, actor_id, metadata)
    values (card_row.id, 'expired', actor_id, jsonb_build_object('reason', 'redeem_attempt_after_expiry'));
    raise exception 'Gift card has expired';
  end if;

  update public.gift_cards
  set status = 'redeemed',
      redeemed_at = now(),
      redeemed_by = actor_id,
      redeemed_at_business = p_business_id
  where id = p_gift_card_id
    and status = 'active'
    and redeemed_at is null
  returning * into updated_card;

  if not found then raise exception 'Gift card has already been redeemed'; end if;

  select title into catalog_title
  from public.gift_card_catalog
  where id = updated_card.catalog_id;

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
    gift_card_amount_value := round(least(greatest(coalesce(p_gift_card_amount, 0), 0), original_bill_value)::numeric, 2);
    bill_after_gift_card_value := round(greatest(original_bill_value - gift_card_amount_value, 0)::numeric, 2);
    tax_charge_value := case
      when coalesce(business_row.tax_included_in_bill, false)
        then round((bill_after_gift_card_value * coalesce(business_row.tax_rate, 0))::numeric, 2)
      else 0
    end;
    service_charge_value := case
      when coalesce(business_row.service_charge_enabled, false)
        then round((bill_after_gift_card_value * coalesce(business_row.service_charge_rate, 0))::numeric, 2)
      else 0
    end;
    final_bill_value := round((bill_after_gift_card_value + tax_charge_value + service_charge_value)::numeric, 2);
  else
    original_bill_value := null;
    gift_card_amount_value := round(greatest(coalesce(p_gift_card_amount, 0), 0)::numeric, 2);
    bill_after_gift_card_value := null;
    tax_charge_value := 0;
    service_charge_value := 0;
    final_bill_value := null;
  end if;

  insert into public.gift_card_events (gift_card_id, event_type, actor_id, metadata)
  values (
    updated_card.id,
    'redeemed',
    actor_id,
    jsonb_build_object(
      'business_id', p_business_id,
      'original_bill', original_bill_value,
      'gift_card_amount', gift_card_amount_value,
      'bill_after_gift_card', bill_after_gift_card_value,
      'tax_added', tax_charge_value,
      'service_charge_added', service_charge_value,
      'final_bill', final_bill_value,
      'receipt_number', receipt_number_value
    )
  );

  if bill_after_gift_card_value is not null and bill_after_gift_card_value > 0 then
    purchase_amount_value := bill_after_gift_card_value;

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
        'Gift card code: %s. Gift card value: %s. Original receipt total: %s. Bill after gift card: %s. Tax added: %s. Service charge added: %s. Final bill after gift card: %s.',
        updated_card.code,
        to_char(gift_card_amount_value, 'FM999999990.00'),
        to_char(original_bill_value, 'FM999999990.00'),
        to_char(bill_after_gift_card_value, 'FM999999990.00'),
        to_char(tax_charge_value, 'FM999999990.00'),
        to_char(service_charge_value, 'FM999999990.00'),
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
    'Gift card redeemed',
    coalesce(catalog_title, updated_card.code),
    0,
    'posted'
  );

  return updated_card;
end;
$$;

notify pgrst, 'reload schema';
