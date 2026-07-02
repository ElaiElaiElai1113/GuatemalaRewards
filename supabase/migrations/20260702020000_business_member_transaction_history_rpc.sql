drop function if exists public.get_business_member_transactions(uuid);

create or replace function public.get_business_member_transactions(p_business_id uuid)
returns table (
  id uuid,
  profile_id uuid,
  business_id uuid,
  purchase_amount numeric,
  receipt_number text,
  reward_rate_percent numeric,
  reward_value numeric,
  points_awarded integer,
  commission_rate_percent numeric,
  commission_amount numeric,
  commission_status public.member_transaction_commission_status,
  commission_paid_at timestamptz,
  commission_paid_by uuid,
  commission_payment_note text,
  recorded_by uuid,
  note text,
  client_request_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  member_full_name text,
  member_email text,
  member_verification_status text,
  business_name text,
  business_currency text
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
    mt.id,
    mt.profile_id,
    mt.business_id,
    mt.purchase_amount,
    mt.receipt_number,
    mt.reward_rate_percent,
    mt.reward_value,
    mt.points_awarded,
    mt.commission_rate_percent,
    mt.commission_amount,
    mt.commission_status,
    mt.commission_paid_at,
    mt.commission_paid_by,
    mt.commission_payment_note,
    mt.recorded_by,
    mt.note,
    mt.client_request_id,
    mt.created_at,
    mt.updated_at,
    customer.full_name as member_full_name,
    customer.email as member_email,
    customer.verification_status::text as member_verification_status,
    b.name as business_name,
    b.currency as business_currency
  from public.member_transactions mt
  join public.profiles customer on customer.id = mt.profile_id
  join public.businesses b on b.id = mt.business_id
  where mt.business_id = p_business_id
  order by mt.created_at desc;
end;
$$;

revoke all on function public.get_business_member_transactions(uuid) from public;
grant execute on function public.get_business_member_transactions(uuid) to authenticated;

notify pgrst, 'reload schema';
