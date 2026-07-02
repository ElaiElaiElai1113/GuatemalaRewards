create or replace function public.create_owner_product(
  p_title text,
  p_description text,
  p_category text,
  p_price numeric,
  p_highlight text,
  p_inventory integer
)
returns public.products
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_profile public.profiles%rowtype;
  inserted_product public.products%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select *
    into actor_profile
  from public.profiles
  where id = auth.uid();

  if actor_profile.role <> 'business-owner' or actor_profile.business_id is null then
    raise exception 'Only business owners can create products.';
  end if;

  insert into public.products (
    business_id,
    title,
    description,
    category,
    price,
    highlight,
    inventory,
    featured
  )
  values (
    actor_profile.business_id,
    trim(p_title),
    trim(coalesce(p_description, '')),
    p_category::public.product_category,
    p_price,
    trim(coalesce(p_highlight, '')),
    coalesce(p_inventory, 0),
    false
  )
  returning *
    into inserted_product;

  return inserted_product;
end;
$$;

create or replace function public.create_owner_promotion(
  p_title text,
  p_description text,
  p_badge text,
  p_cta text,
  p_audience text
)
returns public.promotions
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_profile public.profiles%rowtype;
  inserted_promotion public.promotions%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select *
    into actor_profile
  from public.profiles
  where id = auth.uid();

  if actor_profile.role <> 'business-owner' or actor_profile.business_id is null then
    raise exception 'Only business owners can create promotions.';
  end if;

  insert into public.promotions (
    business_id,
    title,
    description,
    badge,
    cta,
    audience,
    expires_at,
    active
  )
  values (
    actor_profile.business_id,
    trim(p_title),
    trim(coalesce(p_description, '')),
    trim(coalesce(p_badge, '')),
    trim(coalesce(p_cta, '')),
    trim(coalesce(p_audience, '')),
    now() + interval '14 days',
    true
  )
  returning *
    into inserted_promotion;

  return inserted_promotion;
end;
$$;

create or replace function public.create_owner_gift_card_catalog_item(
  p_title text,
  p_description text,
  p_image_url text,
  p_points_cost integer,
  p_value_label text,
  p_expiry_days integer,
  p_is_active boolean
)
returns public.gift_card_catalog
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_profile public.profiles%rowtype;
  inserted_item public.gift_card_catalog%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select *
    into actor_profile
  from public.profiles
  where id = auth.uid();

  if actor_profile.role <> 'business-owner' or actor_profile.business_id is null then
    raise exception 'Only business owners can create gift cards.';
  end if;

  insert into public.gift_card_catalog (
    business_id,
    title,
    description,
    image_url,
    points_cost,
    value_label,
    expiry_days,
    is_active,
    created_by
  )
  values (
    actor_profile.business_id,
    trim(p_title),
    trim(coalesce(p_description, '')),
    nullif(trim(coalesce(p_image_url, '')), ''),
    p_points_cost,
    trim(coalesce(p_value_label, '')),
    p_expiry_days,
    coalesce(p_is_active, true),
    actor_profile.id
  )
  returning *
    into inserted_item;

  return inserted_item;
end;
$$;

create or replace function public.update_owner_business_settings(
  p_earn_rate numeric,
  p_reward_rate_percent numeric,
  p_commission_rate_percent numeric,
  p_tax_rate numeric
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

  update public.businesses
  set earn_rate = p_earn_rate,
      reward_rate_percent = p_reward_rate_percent,
      commission_rate_percent = p_commission_rate_percent,
      tax_rate = p_tax_rate
  where id = actor_profile.business_id
  returning *
    into updated_business;

  if not found then
    raise exception 'Business not found.';
  end if;

  return updated_business;
end;
$$;

create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_role public.user_role;
  new_business_id uuid;
  new_registered_by_business_id uuid;
  new_verification_id text;
  new_verification_document_path text;
  new_verification_document_filename text;
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

  if new_verification_document_path is not null
    and new_verification_document_path !~ '^pending/[a-zA-Z0-9-]+\.[a-z0-9]+$'
  then
    raise exception 'Invalid verification document path.';
  end if;

  insert into public.profiles (
    id,
    full_name,
    email,
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

revoke all on function public.create_owner_product(text, text, text, numeric, text, integer) from public;
revoke all on function public.create_owner_promotion(text, text, text, text, text) from public;
revoke all on function public.create_owner_gift_card_catalog_item(text, text, text, integer, text, integer, boolean) from public;
revoke all on function public.update_owner_business_settings(numeric, numeric, numeric, numeric) from public;

grant execute on function public.create_owner_product(text, text, text, numeric, text, integer) to authenticated;
grant execute on function public.create_owner_promotion(text, text, text, text, text) to authenticated;
grant execute on function public.create_owner_gift_card_catalog_item(text, text, text, integer, text, integer, boolean) to authenticated;
grant execute on function public.update_owner_business_settings(numeric, numeric, numeric, numeric) to authenticated;
