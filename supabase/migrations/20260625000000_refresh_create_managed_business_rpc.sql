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
  p_longitude numeric default null
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
    upper(trim(p_currency)),
    coalesce(p_active, true)
  )
  returning *
    into inserted_business;

  return inserted_business;
end;
$$;

revoke all on function public.create_managed_business(text, text, text, text, numeric, numeric, text, boolean, text, numeric, numeric) from public;
grant execute on function public.create_managed_business(text, text, text, text, numeric, numeric, text, boolean, text, numeric, numeric) to authenticated;

notify pgrst, 'reload schema';
