alter table public.businesses
  add column if not exists tax_included_in_bill boolean not null default false,
  add column if not exists service_charge_enabled boolean not null default false,
  add column if not exists service_charge_rate numeric not null default 0;

alter table public.businesses
  drop constraint if exists businesses_service_charge_rate_range;

alter table public.businesses
  add constraint businesses_service_charge_rate_range
  check (service_charge_rate >= 0 and service_charge_rate <= 0.5);

drop function if exists public.create_managed_business(text, text, text, text, numeric, numeric, text, boolean, text, numeric, numeric);

create or replace function public.create_managed_business(
  p_name text,
  p_slug text,
  p_description text default '',
  p_logo_url text default null,
  p_earn_rate numeric default 0,
  p_tax_rate numeric default 0,
  p_currency text default 'USD',
  p_active boolean default true,
  p_address text default '',
  p_latitude numeric default null,
  p_longitude numeric default null,
  p_tax_included_in_bill boolean default false,
  p_service_charge_enabled boolean default false,
  p_service_charge_rate numeric default 0
)
returns public.businesses
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role public.user_role;
  inserted_business public.businesses%rowtype;
begin
  select role
    into actor_role
  from public.profiles
  where id = auth.uid()
  limit 1;

  if actor_role is distinct from 'platform-admin'::public.user_role then
    raise exception 'Permission denied';
  end if;

  if p_latitude is not null and (p_latitude < -90 or p_latitude > 90) then
    raise exception 'Latitude must be between -90 and 90.';
  end if;

  if p_longitude is not null and (p_longitude < -180 or p_longitude > 180) then
    raise exception 'Longitude must be between -180 and 180.';
  end if;

  if p_tax_rate is null or p_tax_rate < 0 or p_tax_rate > 0.5 then
    raise exception 'Tax rate must be between 0 and 0.5.';
  end if;

  if p_service_charge_rate is null or p_service_charge_rate < 0 or p_service_charge_rate > 0.5 then
    raise exception 'Service charge rate must be between 0 and 0.5.';
  end if;

  insert into public.businesses (
    name,
    slug,
    description,
    address,
    latitude,
    longitude,
    logo_url,
    earn_rate,
    tax_rate,
    tax_included_in_bill,
    service_charge_enabled,
    service_charge_rate,
    currency,
    active
  )
  values (
    trim(p_name),
    trim(p_slug),
    coalesce(trim(p_description), ''),
    coalesce(trim(p_address), ''),
    p_latitude,
    p_longitude,
    case when nullif(trim(coalesce(p_logo_url, '')), '') is null then null else trim(p_logo_url) end,
    p_earn_rate,
    p_tax_rate,
    coalesce(p_tax_included_in_bill, false),
    coalesce(p_service_charge_enabled, false),
    case when coalesce(p_service_charge_enabled, false) then p_service_charge_rate else 0 end,
    upper(trim(p_currency)),
    coalesce(p_active, true)
  )
  returning *
    into inserted_business;

  return inserted_business;
end;
$$;

drop function if exists public.update_owner_business_settings(numeric, numeric, numeric, numeric);

create or replace function public.update_owner_business_settings(
  p_earn_rate numeric,
  p_reward_rate_percent numeric,
  p_commission_rate_percent numeric,
  p_tax_rate numeric,
  p_tax_included_in_bill boolean default false,
  p_service_charge_enabled boolean default false,
  p_service_charge_rate numeric default 0
)
returns public.businesses
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_profile public.profiles%rowtype;
  updated_business public.businesses%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select *
    into actor_profile
  from public.profiles
  where id = auth.uid();

  if actor_profile.role <> 'business-owner' or actor_profile.business_id is null then
    raise exception 'Only business owners can update business settings.';
  end if;

  if p_earn_rate is null or p_earn_rate < 0 or p_earn_rate > 100 then
    raise exception 'Earn rate must be between 0 and 100.';
  end if;

  if p_reward_rate_percent is null or p_reward_rate_percent < 0 or p_reward_rate_percent > 100 then
    raise exception 'Reward rate must be between 0 and 100.';
  end if;

  if p_commission_rate_percent is null or p_commission_rate_percent < 10 or p_commission_rate_percent > 100 then
    raise exception 'Commission rate must be between 10 and 100.';
  end if;

  if p_tax_rate is null or p_tax_rate < 0 or p_tax_rate > 0.5 then
    raise exception 'Tax rate must be between 0 and 0.5.';
  end if;

  if p_service_charge_rate is null or p_service_charge_rate < 0 or p_service_charge_rate > 0.5 then
    raise exception 'Service charge rate must be between 0 and 0.5.';
  end if;

  update public.businesses
  set earn_rate = p_earn_rate,
      reward_rate_percent = p_reward_rate_percent,
      commission_rate_percent = p_commission_rate_percent,
      tax_rate = p_tax_rate,
      tax_included_in_bill = coalesce(p_tax_included_in_bill, false),
      service_charge_enabled = coalesce(p_service_charge_enabled, false),
      service_charge_rate = case when coalesce(p_service_charge_enabled, false) then p_service_charge_rate else 0 end
  where id = actor_profile.business_id
  returning *
    into updated_business;

  if not found then
    raise exception 'Business not found.';
  end if;

  return updated_business;
end;
$$;

revoke all on function public.create_managed_business(text, text, text, text, numeric, numeric, text, boolean, text, numeric, numeric, boolean, boolean, numeric) from public;
grant execute on function public.create_managed_business(text, text, text, text, numeric, numeric, text, boolean, text, numeric, numeric, boolean, boolean, numeric) to authenticated;

revoke all on function public.update_owner_business_settings(numeric, numeric, numeric, numeric, boolean, boolean, numeric) from public;
grant execute on function public.update_owner_business_settings(numeric, numeric, numeric, numeric, boolean, boolean, numeric) to authenticated;

notify pgrst, 'reload schema';
