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
  customer_first_name text
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
      else gc.status
    end as status,
    gc.points_spent,
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
    split_part(coalesce(customer.full_name, 'Member'), ' ', 1) as customer_first_name
  from public.gift_cards gc
  join public.businesses b on b.id = gc.business_id
  join public.profiles customer on customer.id = gc.customer_id
  left join public.gift_card_catalog gcc on gcc.id = gc.catalog_id
  where gc.business_id = p_business_id
  order by gc.created_at desc;
end;
$$;

revoke all on function public.get_business_gift_cards(uuid) from public;
grant execute on function public.get_business_gift_cards(uuid) to authenticated;
