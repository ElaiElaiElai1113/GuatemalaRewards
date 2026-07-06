create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_role public.user_role;
  new_business_id uuid;
  new_registered_by_business_id uuid;
  new_verification_id text;
  new_verification_document_path text;
  new_verification_document_filename text;
  new_phone text;
begin
  new_role := coalesce(
    (new.raw_app_meta_data ->> 'role')::public.user_role,
    'customer'
  );

  new_business_id := (
    new.raw_app_meta_data ->> 'business_id'
  )::uuid;

  new_registered_by_business_id := nullif(
    coalesce(
      new.raw_user_meta_data ->> 'registered_by_business_id',
      new.raw_app_meta_data ->> 'registered_by_business_id',
      ''
    ),
    ''
  )::uuid;

  new_verification_id := nullif(trim(coalesce(new.raw_user_meta_data ->> 'verification_id_number', '')), '');
  new_verification_document_path := nullif(trim(coalesce(new.raw_user_meta_data ->> 'verification_document_path', '')), '');
  new_verification_document_filename := nullif(trim(coalesce(new.raw_user_meta_data ->> 'verification_document_filename', '')), '');
  new_phone := nullif(trim(coalesce(
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'whatsapp',
    ''
  )), '');

  if new_verification_document_path is not null
    and new_verification_document_path !~ '^pending/[a-zA-Z0-9-]+\.[a-z0-9]+$'
  then
    raise exception 'Invalid verification document path.';
  end if;

  insert into public.profiles (
    id,
    full_name,
    email,
    phone,
    role,
    business_id,
    registered_by_business_id,
    referral_code,
    verification_id_number,
    verification_document_path,
    verification_document_filename,
    verification_submitted_at,
    verification_status
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    new.email,
    coalesce(new_phone, ''),
    new_role,
    new_business_id,
    new_registered_by_business_id,
    public.generate_referral_code(),
    new_verification_id,
    new_verification_document_path,
    new_verification_document_filename,
    case when new_verification_document_path is null then null else now() end,
    case
      when new_verification_id is not null and new_verification_document_path is null then 'pending_document'
      when new_verification_document_path is not null then 'submitted'
      else 'not_submitted'
    end
  );

  insert into public.reward_balances (profile_id, points, next_reward_points, available_credits)
  values (new.id, 0, 300, 0);

  return new;
end;
$$ language plpgsql security definer;

create or replace function public.is_member_verified(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = p_profile_id
      and (
        p.role <> 'customer'
        or (
          nullif(trim(coalesce(p.full_name, '')), '') is not null
          and nullif(trim(coalesce(p.email, '')), '') is not null
          and nullif(trim(coalesce(p.phone, '')), '') is not null
        )
      )
  );
$$;

create or replace function public.assert_member_verified(p_profile_id uuid)
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_member_verified(p_profile_id) then
    raise exception 'member_contact_required';
  end if;
end;
$$;

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

  perform public.assert_member_verified(member_profile.id);

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

drop policy if exists "Users can create own credit redemptions" on public.credit_redemptions;
create policy "Users can create own credit redemptions"
  on public.credit_redemptions for insert
  with check (
    auth.uid() = profile_id
    and public.is_member_verified(profile_id)
  );

revoke all on function public.is_member_verified(uuid) from public;
revoke all on function public.assert_member_verified(uuid) from public;
grant execute on function public.is_member_verified(uuid) to authenticated;

notify pgrst, 'reload schema';
