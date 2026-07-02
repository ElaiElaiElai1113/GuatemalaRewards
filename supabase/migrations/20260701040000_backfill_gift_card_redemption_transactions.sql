do $$
declare
  redemption record;
  original_bill_value numeric(12,2);
  gift_card_amount_value numeric(12,2);
  final_bill_value numeric(12,2);
  receipt_number_value text;
  charge_multiplier numeric;
  purchase_amount_value numeric(12,2);
  reward_value_value numeric(12,2);
  points_awarded_value integer;
  commission_amount_value numeric(12,2);
begin
  for redemption in
    select
      gc.id as gift_card_id,
      gc.code,
      gc.customer_id,
      gc.business_id,
      gc.redeemed_by,
      b.name as business_name,
      b.currency,
      b.tax_rate,
      b.service_charge_enabled,
      b.service_charge_rate,
      b.reward_rate_percent,
      b.commission_rate_percent,
      latest_redemption.metadata
    from public.gift_cards gc
    join public.businesses b on b.id = gc.business_id
    join lateral (
      select gce.metadata
      from public.gift_card_events gce
      where gce.gift_card_id = gc.id
        and gce.event_type = 'redeemed'
      order by gce.created_at desc
      limit 1
    ) latest_redemption on true
    where gc.status = 'redeemed'
      and gc.redeemed_at is not null
      and latest_redemption.metadata ? 'original_bill'
      and not exists (
        select 1
        from public.member_transactions mt
        where mt.business_id = gc.business_id
          and mt.note ilike '%' || gc.code || '%'
      )
  loop
    original_bill_value := round(nullif(redemption.metadata ->> 'original_bill', '')::numeric, 2);
    gift_card_amount_value := round(least(greatest(coalesce(nullif(redemption.metadata ->> 'gift_card_amount', '')::numeric, 0), 0), original_bill_value)::numeric, 2);
    final_bill_value := round(coalesce(nullif(redemption.metadata ->> 'final_bill', '')::numeric, greatest(original_bill_value - gift_card_amount_value, 0))::numeric, 2);
    receipt_number_value := nullif(trim(coalesce(redemption.metadata ->> 'receipt_number', '')), '');

    if final_bill_value <= 0 or receipt_number_value is null or length(receipt_number_value) < 3 then
      continue;
    end if;

    if exists (
      select 1
      from public.member_transactions mt
      where mt.business_id = redemption.business_id
        and lower(trim(mt.receipt_number)) = lower(receipt_number_value)
    ) then
      continue;
    end if;

    charge_multiplier := 1 + coalesce(redemption.tax_rate, 0) + case
      when coalesce(redemption.service_charge_enabled, false) then coalesce(redemption.service_charge_rate, 0)
      else 0
    end;
    purchase_amount_value := case
      when charge_multiplier > 1 then round((final_bill_value / charge_multiplier)::numeric, 2)
      else final_bill_value
    end;

    if purchase_amount_value <= 0 then
      continue;
    end if;

    reward_value_value := round((purchase_amount_value * redemption.reward_rate_percent / 100)::numeric, 2);
    points_awarded_value := floor(reward_value_value * 100);
    commission_amount_value := round((purchase_amount_value * redemption.commission_rate_percent / 100)::numeric, 2);

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
      redemption.customer_id,
      redemption.business_id,
      purchase_amount_value,
      receipt_number_value,
      redemption.reward_rate_percent,
      reward_value_value,
      points_awarded_value,
      redemption.commission_rate_percent,
      commission_amount_value,
      redemption.redeemed_by,
      format(
        'Gift card code: %s. Gift card value: %s. Original receipt total: %s. Final bill after gift card: %s. Backfilled from gift card redemption.',
        redemption.code,
        to_char(gift_card_amount_value, 'FM999999990.00'),
        to_char(original_bill_value, 'FM999999990.00'),
        to_char(final_bill_value, 'FM999999990.00')
      ),
      gen_random_uuid()
    );

    insert into public.reward_balances (profile_id)
    values (redemption.customer_id)
    on conflict (profile_id) do nothing;

    update public.reward_balances
    set points = points + points_awarded_value
    where profile_id = redemption.customer_id;

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
      redemption.customer_id,
      redemption.business_id,
      'earned',
      format('Purchase at %s - %s %s', redemption.business_name, redemption.currency, to_char(purchase_amount_value, 'FM999999990.00')),
      format('%s %s reward value issued from receipt %s after gift card %s.', redemption.currency, to_char(reward_value_value, 'FM999999990.00'), receipt_number_value, redemption.code),
      points_awarded_value,
      'posted'
    );
  end loop;
end;
$$;
