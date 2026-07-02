alter table public.member_transactions
  add column if not exists receipt_number text;

create unique index if not exists member_transactions_business_receipt_number_key
  on public.member_transactions (business_id, lower(trim(receipt_number)))
  where receipt_number is not null and length(trim(receipt_number)) > 0;

create or replace function public.record_member_transaction(
  p_member_qr_token text,
  p_purchase_amount numeric,
  p_receipt_number text,
  p_note text default null,
  p_client_request_id uuid default null
)
returns public.member_transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  actor_profile public.profiles%rowtype;
  business_row public.businesses%rowtype;
  member_profile public.profiles%rowtype;
  existing_transaction public.member_transactions%rowtype;
  existing_receipt_transaction public.member_transactions%rowtype;
  inserted_transaction public.member_transactions%rowtype;
  purchase_amount_value numeric(12,2);
  receipt_number_value text;
  reward_value_value numeric(12,2);
  points_awarded_value integer;
  commission_amount_value numeric(12,2);
begin
  if actor_id is null then
    raise exception 'Authentication required';
  end if;

  if p_client_request_id is not null then
    select *
      into existing_transaction
    from public.member_transactions
    where recorded_by = actor_id
      and client_request_id = p_client_request_id
    limit 1;

    if found then
      return existing_transaction;
    end if;
  end if;

  select *
    into actor_profile
  from public.profiles
  where id = actor_id;

  if actor_profile.role not in ('business-owner', 'business-staff') or actor_profile.business_id is null then
    raise exception 'Permission denied';
  end if;

  select *
    into business_row
  from public.businesses
  where id = actor_profile.business_id
    and active = true
  for share;

  if not found then
    raise exception 'Business not found.';
  end if;

  select *
    into member_profile
  from public.profiles
  where member_qr_token = p_member_qr_token
    and role = 'customer';

  if not found then
    raise exception 'Member not found.';
  end if;

  if member_profile.verification_status::text <> 'verified' then
    raise exception 'identity_verification_required';
  end if;

  if p_purchase_amount is null or p_purchase_amount <= 0 then
    raise exception 'Purchase amount must be greater than 0.';
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

  purchase_amount_value := round(p_purchase_amount::numeric, 2);
  reward_value_value := round((purchase_amount_value * business_row.reward_rate_percent / 100)::numeric, 2);
  points_awarded_value := floor(reward_value_value * 100);
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
    member_profile.id,
    business_row.id,
    purchase_amount_value,
    receipt_number_value,
    business_row.reward_rate_percent,
    reward_value_value,
    points_awarded_value,
    business_row.commission_rate_percent,
    commission_amount_value,
    actor_id,
    nullif(trim(coalesce(p_note, '')), ''),
    p_client_request_id
  )
  returning *
    into inserted_transaction;

  insert into public.reward_balances (profile_id)
  values (member_profile.id)
  on conflict (profile_id) do nothing;

  update public.reward_balances
  set points = points + points_awarded_value
  where profile_id = member_profile.id;

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
    member_profile.id,
    business_row.id,
    'earned',
    format('Purchase at %s - $%s', business_row.name, to_char(purchase_amount_value, 'FM999999990.00')),
    format('$%s reward value issued from receipt %s.', to_char(reward_value_value, 'FM999999990.00'), receipt_number_value),
    points_awarded_value,
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
    coalesce(actor_profile.full_name, 'Business staff'),
    'Member QR transaction recorded',
    format('Recorded receipt %s for $%s for %s at %s. Awarded %s points. Commission owed: $%s.',
      receipt_number_value,
      to_char(purchase_amount_value, 'FM999999990.00'),
      member_profile.full_name,
      business_row.name,
      points_awarded_value,
      to_char(commission_amount_value, 'FM999999990.00')
    )
  );

  return inserted_transaction;
exception
  when unique_violation then
    if p_client_request_id is not null then
      select *
        into existing_transaction
      from public.member_transactions
      where recorded_by = actor_id
        and client_request_id = p_client_request_id
      limit 1;

      if found then
        return existing_transaction;
      end if;
    end if;

    raise exception 'This receipt or bill number has already been recorded.';
end;
$$;

revoke all on function public.record_member_transaction(text, numeric, text, text, uuid) from public;
grant execute on function public.record_member_transaction(text, numeric, text, text, uuid) to authenticated;

notify pgrst, 'reload schema';
