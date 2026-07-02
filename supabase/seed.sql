-- ============================================================
-- Seed Data - Matches current mock store
-- Run with: supabase db reset (includes seed) or manually
-- ============================================================

-- ─── Businesses ──────────────────────────────────────────────

insert into public.businesses (id, name, slug, description, earn_rate, tax_rate, currency, active, address, latitude, longitude) values
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Velvet Brew', 'velvet-brew', 'A neighborhood beverage shop known for handcrafted drinks, seasonal pastries, and retail favorites.', 10, 0.0875, 'USD', true, 'Cra. 37 #10-32, El Poblado, Guatemala', 6.2088, -75.5672),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Mystic Coffee', 'mystic-coffee', 'A mystical coffee experience with ethically sourced beans, herbal infusions, and enchanted blends.', 8, 0.0925, 'USD', true, 'Cl. 10B #36-14, Provenza, Guatemala', 6.2099, -75.5651)
on conflict (slug) do update
set name = excluded.name,
    description = excluded.description,
    earn_rate = excluded.earn_rate,
    tax_rate = excluded.tax_rate,
    currency = excluded.currency,
    active = excluded.active,
    address = excluded.address,
    latitude = excluded.latitude,
    longitude = excluded.longitude;

do $$
declare
  insert_columns text[] := array['id'];
  select_expressions text[] := array['b.id'];
  update_assignments text[] := array[]::text[];
  unsupported_required_columns text[];
  status_data_type text;
  status_udt_schema text;
  status_udt_name text;
begin
  if to_regclass('public.business_branding') is not null then
    select array_agg(column_name order by ordinal_position)
    into unsupported_required_columns
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'business_branding'
      and is_nullable = 'NO'
      and column_default is null
      and coalesce(is_identity, 'NO') = 'NO'
      and coalesce(is_generated, 'NEVER') = 'NEVER'
      and column_name not in (
        'id',
        'legacy_business_id',
        'name',
        'slug',
        'description',
        'status',
        'active',
        'currency',
        'primary_color',
        'secondary_color',
        'accent_color',
        'brand_color',
        'logo_url',
        'banner_url',
        'cover_url',
        'website_url',
        'phone',
        'address',
        'email',
        'created_at',
        'updated_at'
      );

    if unsupported_required_columns is not null then
      raise exception 'Seed cannot populate required business_branding columns: %', array_to_string(unsupported_required_columns, ', ');
    end if;

    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'business_branding' and column_name = 'legacy_business_id') then
      insert_columns := array_append(insert_columns, 'legacy_business_id');
      select_expressions := array_append(select_expressions, 'b.id');
      update_assignments := array_append(update_assignments, 'legacy_business_id = excluded.legacy_business_id');
    end if;

    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'business_branding' and column_name = 'name') then
      insert_columns := array_append(insert_columns, 'name');
      select_expressions := array_append(select_expressions, 'b.name');
      update_assignments := array_append(update_assignments, 'name = excluded.name');
    end if;

    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'business_branding' and column_name = 'slug') then
      insert_columns := array_append(insert_columns, 'slug');
      select_expressions := array_append(select_expressions, 'b.slug');
      update_assignments := array_append(update_assignments, 'slug = excluded.slug');
    end if;

    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'business_branding' and column_name = 'description') then
      insert_columns := array_append(insert_columns, 'description');
      select_expressions := array_append(select_expressions, 'b.description');
      update_assignments := array_append(update_assignments, 'description = excluded.description');
    end if;

    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'business_branding' and column_name = 'status') then
      select data_type, udt_schema, udt_name
      into status_data_type, status_udt_schema, status_udt_name
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'business_branding'
        and column_name = 'status';

      insert_columns := array_append(insert_columns, 'status');
      if status_data_type = 'USER-DEFINED' then
        select_expressions := array_append(
          select_expressions,
          format('(case when b.active then ''active'' else ''inactive'' end)::%I.%I', status_udt_schema, status_udt_name)
        );
      else
        select_expressions := array_append(select_expressions, 'case when b.active then ''active'' else ''inactive'' end');
      end if;
      update_assignments := array_append(update_assignments, 'status = excluded.status');
    end if;

    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'business_branding' and column_name = 'active') then
      insert_columns := array_append(insert_columns, 'active');
      select_expressions := array_append(select_expressions, 'b.active');
      update_assignments := array_append(update_assignments, 'active = excluded.active');
    end if;

    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'business_branding' and column_name = 'currency') then
      insert_columns := array_append(insert_columns, 'currency');
      select_expressions := array_append(select_expressions, 'b.currency');
      update_assignments := array_append(update_assignments, 'currency = excluded.currency');
    end if;

    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'business_branding' and column_name = 'primary_color') then
      insert_columns := array_append(insert_columns, 'primary_color');
      select_expressions := array_append(select_expressions, '''#111111''');
      update_assignments := array_append(update_assignments, 'primary_color = excluded.primary_color');
    end if;

    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'business_branding' and column_name = 'secondary_color') then
      insert_columns := array_append(insert_columns, 'secondary_color');
      select_expressions := array_append(select_expressions, '''#ffffff''');
      update_assignments := array_append(update_assignments, 'secondary_color = excluded.secondary_color');
    end if;

    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'business_branding' and column_name = 'accent_color') then
      insert_columns := array_append(insert_columns, 'accent_color');
      select_expressions := array_append(select_expressions, '''#c8a45d''');
      update_assignments := array_append(update_assignments, 'accent_color = excluded.accent_color');
    end if;

    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'business_branding' and column_name = 'brand_color') then
      insert_columns := array_append(insert_columns, 'brand_color');
      select_expressions := array_append(select_expressions, '''#111111''');
      update_assignments := array_append(update_assignments, 'brand_color = excluded.brand_color');
    end if;

    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'business_branding' and column_name = 'logo_url') then
      insert_columns := array_append(insert_columns, 'logo_url');
      select_expressions := array_append(select_expressions, '''''');
      update_assignments := array_append(update_assignments, 'logo_url = excluded.logo_url');
    end if;

    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'business_branding' and column_name = 'banner_url') then
      insert_columns := array_append(insert_columns, 'banner_url');
      select_expressions := array_append(select_expressions, '''''');
      update_assignments := array_append(update_assignments, 'banner_url = excluded.banner_url');
    end if;

    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'business_branding' and column_name = 'cover_url') then
      insert_columns := array_append(insert_columns, 'cover_url');
      select_expressions := array_append(select_expressions, '''''');
      update_assignments := array_append(update_assignments, 'cover_url = excluded.cover_url');
    end if;

    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'business_branding' and column_name = 'website_url') then
      insert_columns := array_append(insert_columns, 'website_url');
      select_expressions := array_append(select_expressions, '''''');
      update_assignments := array_append(update_assignments, 'website_url = excluded.website_url');
    end if;

    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'business_branding' and column_name = 'phone') then
      insert_columns := array_append(insert_columns, 'phone');
      select_expressions := array_append(select_expressions, '''''');
      update_assignments := array_append(update_assignments, 'phone = excluded.phone');
    end if;

    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'business_branding' and column_name = 'address') then
      insert_columns := array_append(insert_columns, 'address');
      select_expressions := array_append(select_expressions, '''''');
      update_assignments := array_append(update_assignments, 'address = excluded.address');
    end if;

    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'business_branding' and column_name = 'email') then
      insert_columns := array_append(insert_columns, 'email');
      select_expressions := array_append(select_expressions, '''''');
      update_assignments := array_append(update_assignments, 'email = excluded.email');
    end if;

    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'business_branding' and column_name = 'created_at') then
      insert_columns := array_append(insert_columns, 'created_at');
      select_expressions := array_append(select_expressions, 'now()');
    end if;

    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'business_branding' and column_name = 'updated_at') then
      insert_columns := array_append(insert_columns, 'updated_at');
      select_expressions := array_append(select_expressions, 'now()');
      update_assignments := array_append(update_assignments, 'updated_at = now()');
    end if;

    if array_length(update_assignments, 1) is null then
      execute format(
        'insert into public.business_branding (%s)
         select %s
         from public.businesses b
         where b.slug in (''velvet-brew'', ''mystic-coffee'')
         on conflict (id) do nothing',
        array_to_string(insert_columns, ', '),
        array_to_string(select_expressions, ', ')
      );
    else
      execute format(
        'insert into public.business_branding (%s)
         select %s
         from public.businesses b
         where b.slug in (''velvet-brew'', ''mystic-coffee'')
         on conflict (id) do update
         set %s',
        array_to_string(insert_columns, ', '),
        array_to_string(select_expressions, ', '),
        array_to_string(update_assignments, ', ')
      );
    end if;
  end if;
end
$$;

-- ─── Demo Users (create via Supabase Auth, then profiles are auto-created) ──
-- After running seed, create these users in Supabase Auth:
--
-- 1. Customer Demo
--    Email: ava@example.com  Password: demo1234
--    app_metadata: { "role": "customer" }
--
-- 2. Platform Admin
--    Email: admin@guatemalarewards.com  Password: demo1234
--    app_metadata: { "role": "platform-admin" }
--
-- 3. Velvet Brew Owner
--    Email: owner@velvetbrew.co  Password: demo1234
--    app_metadata: { "role": "business-owner", "business_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11" }
--
-- 4. Mystic Coffee Owner
--    Email: owner@mysticcoffee.co  Password: demo1234
--    app_metadata: { "role": "business-owner", "business_id": "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22" }

-- ─── Rewards ─────────────────────────────────────────────────

-- E2E Auth Users
-- Password for all E2E users: demo1234

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'customer@Guatemala.test', crypt('demo1234', gen_salt('bf')), now(), '{"provider":"email","providers":["email"],"role":"customer"}'::jsonb, '{"full_name":"E2E Verified Customer","verification_id_number":"E2E-CUSTOMER-001","verification_document_path":"pending/11111111-1111-1111-1111-111111111111.png","verification_document_filename":"verified-customer.png"}'::jsonb, now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'unverified@Guatemala.test', crypt('demo1234', gen_salt('bf')), now(), '{"provider":"email","providers":["email"],"role":"customer"}'::jsonb, '{"full_name":"E2E Unverified Customer","verification_id_number":"E2E-CUSTOMER-002","verification_document_path":"pending/22222222-2222-2222-2222-222222222222.png","verification_document_filename":"unverified-customer.png"}'::jsonb, now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', 'authenticated', 'authenticated', 'staff@velvetbrew.test', crypt('demo1234', gen_salt('bf')), now(), '{"provider":"email","providers":["email"],"role":"business-staff","business_id":"a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"}'::jsonb, '{"full_name":"E2E Velvet Staff"}'::jsonb, now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '44444444-4444-4444-4444-444444444444', 'authenticated', 'authenticated', 'owner@velvetbrew.test', crypt('demo1234', gen_salt('bf')), now(), '{"provider":"email","providers":["email"],"role":"business-owner","business_id":"a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"}'::jsonb, '{"full_name":"E2E Velvet Owner"}'::jsonb, now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '55555555-5555-5555-5555-555555555555', 'authenticated', 'authenticated', 'admin@Guatemala.test', crypt('demo1234', gen_salt('bf')), now(), '{"provider":"email","providers":["email"],"role":"platform-admin"}'::jsonb, '{"full_name":"E2E Platform Admin"}'::jsonb, now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '66666666-6666-6666-6666-666666666666', 'authenticated', 'authenticated', 'agreement-pending-customer@Guatemala.test', crypt('demo1234', gen_salt('bf')), now(), '{"provider":"email","providers":["email"],"role":"customer"}'::jsonb, '{"full_name":"E2E Agreement Pending Customer","verification_id_number":"E2E-AGREEMENT-001","verification_document_path":"pending/66666666-6666-6666-6666-666666666666.png","verification_document_filename":"agreement-pending-customer.png"}'::jsonb, now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '77777777-7777-7777-7777-777777777777', 'authenticated', 'authenticated', 'agreement-pending-owner@velvetbrew.test', crypt('demo1234', gen_salt('bf')), now(), '{"provider":"email","providers":["email"],"role":"business-owner","business_id":"a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"}'::jsonb, '{"full_name":"E2E Agreement Pending Owner"}'::jsonb, now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '88888888-8888-8888-8888-888888888888', 'authenticated', 'authenticated', 'agreement-unsigned-customer@Guatemala.test', crypt('demo1234', gen_salt('bf')), now(), '{"provider":"email","providers":["email"],"role":"customer"}'::jsonb, '{"full_name":"E2E Unsigned Agreement Customer"}'::jsonb, now(), now(), '', '', '', '')
on conflict (id) do update
set email = excluded.email,
    encrypted_password = excluded.encrypted_password,
    email_confirmed_at = excluded.email_confirmed_at,
    raw_app_meta_data = excluded.raw_app_meta_data,
    raw_user_meta_data = excluded.raw_user_meta_data,
    updated_at = now();

insert into auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) values
  ('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'customer@Guatemala.test', '{"sub":"11111111-1111-1111-1111-111111111111","email":"customer@Guatemala.test"}'::jsonb, 'email', now(), now(), now()),
  ('22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'unverified@Guatemala.test', '{"sub":"22222222-2222-2222-2222-222222222222","email":"unverified@Guatemala.test"}'::jsonb, 'email', now(), now(), now()),
  ('33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'staff@velvetbrew.test', '{"sub":"33333333-3333-3333-3333-333333333333","email":"staff@velvetbrew.test"}'::jsonb, 'email', now(), now(), now()),
  ('44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'owner@velvetbrew.test', '{"sub":"44444444-4444-4444-4444-444444444444","email":"owner@velvetbrew.test"}'::jsonb, 'email', now(), now(), now()),
  ('55555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', 'admin@Guatemala.test', '{"sub":"55555555-5555-5555-5555-555555555555","email":"admin@Guatemala.test"}'::jsonb, 'email', now(), now(), now()),
  ('66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', 'agreement-pending-customer@Guatemala.test', '{"sub":"66666666-6666-6666-6666-666666666666","email":"agreement-pending-customer@Guatemala.test"}'::jsonb, 'email', now(), now(), now()),
  ('77777777-7777-7777-7777-777777777777', '77777777-7777-7777-7777-777777777777', 'agreement-pending-owner@velvetbrew.test', '{"sub":"77777777-7777-7777-7777-777777777777","email":"agreement-pending-owner@velvetbrew.test"}'::jsonb, 'email', now(), now(), now()),
  ('88888888-8888-8888-8888-888888888888', '88888888-8888-8888-8888-888888888888', 'agreement-unsigned-customer@Guatemala.test', '{"sub":"88888888-8888-8888-8888-888888888888","email":"agreement-unsigned-customer@Guatemala.test"}'::jsonb, 'email', now(), now(), now())
on conflict (id) do update
set provider_id = excluded.provider_id,
    identity_data = excluded.identity_data,
    provider = excluded.provider,
    updated_at = now();

update public.profiles
set verification_status = 'verified'
where id = '11111111-1111-1111-1111-111111111111';

update public.profiles
set verification_status = 'submitted'
where id = '22222222-2222-2222-2222-222222222222';

update public.profiles
set verification_status = 'verified'
where id = '66666666-6666-6666-6666-666666666666';

insert into public.reward_balances (
  profile_id,
  points,
  next_reward_points,
  available_credits
)
values (
  '11111111-1111-1111-1111-111111111111',
  50000,
  1500,
  0
)
on conflict (profile_id) do update
set points = greatest(public.reward_balances.points, excluded.points),
    next_reward_points = excluded.next_reward_points,
    updated_at = now();

with signed_agreement_profiles as (
  select p.id as profile_id, p.business_id, p.role, p.full_name
  from public.profiles p
  where p.id in (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '44444444-4444-4444-4444-444444444444'
  )
),
required_agreements as (
  select
    sap.profile_id,
    sap.business_id,
    sap.full_name,
    av.id as agreement_version_id,
    av.kind as agreement_kind,
    av.version as agreement_version,
    av.content_hash
  from signed_agreement_profiles sap
  join public.agreement_versions av
    on av.is_active
   and av.required_role = sap.role
)
insert into public.agreement_acceptances (
  profile_id,
  business_id,
  agreement_version_id,
  agreement_kind,
  agreement_version,
  content_hash,
  typed_signature,
  signature_svg,
  accepted_electronic_records,
  accepted_terms,
  signer_ip,
  signer_user_agent,
  signed_at
)
select
  profile_id,
  business_id,
  agreement_version_id,
  agreement_kind,
  agreement_version,
  content_hash,
  full_name,
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 220" data-signature="drawn"><path d="M 80 132 L 142 94 L 206 124 L 286 72 L 374 118 L 512 86" fill="none" stroke="#111827" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  true,
  true,
  '127.0.0.1',
  'Supabase seed',
  now()
from required_agreements
on conflict (profile_id, agreement_version_id) do update
set business_id = excluded.business_id,
    agreement_kind = excluded.agreement_kind,
    agreement_version = excluded.agreement_version,
    content_hash = excluded.content_hash,
    typed_signature = excluded.typed_signature,
    signature_svg = excluded.signature_svg,
    accepted_electronic_records = excluded.accepted_electronic_records,
    accepted_terms = excluded.accepted_terms,
    signer_ip = excluded.signer_ip,
    signer_user_agent = excluded.signer_user_agent,
    signed_at = excluded.signed_at;

delete from public.rewards
where business_id in (
    select id from public.businesses where slug in ('velvet-brew', 'mystic-coffee')
  )
  and title in (
    'Signature Velvet Latte',
    'Cold Brew Flight',
    'Butter Croissant Pairing',
    'Velvet Brew Tote',
    'Mystic Matcha Latte',
    'Almond Croissant',
    'Afternoon Tea Set'
  );

insert into public.rewards (business_id, title, description, category, points_cost, inventory, featured, highlight) values
  -- Velvet Brew
  ((select id from public.businesses where slug = 'velvet-brew'), 'Signature Velvet Latte', 'Redeem any handcrafted latte with your choice of milk and syrup.', 'Drink', 250, 99, true, 'Most redeemed this week'),
  ((select id from public.businesses where slug = 'velvet-brew'), 'Cold Brew Flight', 'Sample three seasonal cold brew profiles in one curated tasting.', 'Experience', 480, 24, true, 'Weekend-only tasting'),
  ((select id from public.businesses where slug = 'velvet-brew'), 'Butter Croissant Pairing', 'Fresh-baked croissant paired with any small brewed coffee.', 'Pastry', 180, 44, false, 'Morning favorite'),
  ((select id from public.businesses where slug = 'velvet-brew'), 'Velvet Brew Tote', 'Canvas tote with embossed logo and internal bottle sleeve.', 'Merch', 700, 12, false, 'Limited spring merch'),
  -- Mystic Coffee
  ((select id from public.businesses where slug = 'mystic-coffee'), 'Mystic Matcha Latte', 'Ceremonial-grade matcha whisked with your choice of milk.', 'Drink', 200, 60, true, 'Fan favorite'),
  ((select id from public.businesses where slug = 'mystic-coffee'), 'Almond Croissant', 'Flaky croissant filled with almond cream and topped with sliced almonds.', 'Pastry', 160, 30, false, 'Fresh daily'),
  ((select id from public.businesses where slug = 'mystic-coffee'), 'Afternoon Tea Set', 'Pot of premium herbal tea served with a selection of three mini pastries.', 'Experience', 400, 15, true, 'Weekend special');

-- ─── Products ────────────────────────────────────────────────

delete from public.products
where business_id in (
    select id from public.businesses where slug in ('velvet-brew', 'mystic-coffee')
  )
  and title in (
    'Oat Milk Latte',
    'Cold Brew Concentrate 32oz',
    'Pistachio Cardamom Bun',
    'Single Origin: Ethiopia Yirgacheffe',
    'Velvet Brew Ceramic Tumbler',
    'Pour-Over Starter Kit',
    'Chai Spice Latte',
    'Mystic Breakfast Sandwich',
    'Lavender Honey Scone',
    'Premium Tea Sampler',
    'Mystic Coffee Mug'
  );

insert into public.products (business_id, title, description, category, price, inventory, featured, highlight) values
  -- Velvet Brew
  ((select id from public.businesses where slug = 'velvet-brew'), 'Oat Milk Latte', 'Our signature oat milk latte with house-made vanilla syrup.', 'Coffee', 5.50, 200, true, 'Best seller'),
  ((select id from public.businesses where slug = 'velvet-brew'), 'Cold Brew Concentrate 32oz', 'Take home our 24-hour cold brew concentrate. Dilute to taste.', 'Coffee', 14.00, 50, true, 'Take-home'),
  ((select id from public.businesses where slug = 'velvet-brew'), 'Pistachio Cardamom Bun', 'Flaky laminated pastry with pistachio frangipane and cardamom glaze.', 'Pastry', 4.75, 30, false, 'Seasonal'),
  ((select id from public.businesses where slug = 'velvet-brew'), 'Single Origin: Ethiopia Yirgacheffe', '12oz bag of light-roasted whole beans with floral and citrus notes.', 'Coffee', 18.00, 40, false, 'Direct trade'),
  ((select id from public.businesses where slug = 'velvet-brew'), 'Velvet Brew Ceramic Tumbler', '16oz double-walled ceramic tumbler in matte black with silicone lid.', 'Merch', 28.00, 25, true, 'New arrival'),
  ((select id from public.businesses where slug = 'velvet-brew'), 'Pour-Over Starter Kit', 'Ceramic dripper, 100 filters, and a 12oz sample roast.', 'Equipment', 42.00, 15, false, 'Brew at home'),
  -- Mystic Coffee
  ((select id from public.businesses where slug = 'mystic-coffee'), 'Chai Spice Latte', 'House-blended chai with cinnamon, cardamom, ginger, and steamed milk.', 'Coffee', 5.00, 150, true, 'House blend'),
  ((select id from public.businesses where slug = 'mystic-coffee'), 'Mystic Breakfast Sandwich', 'Scrambled eggs, gruyere, arugula, and truffle aioli on brioche.', 'Pastry', 9.50, 40, true, 'Morning staple'),
  ((select id from public.businesses where slug = 'mystic-coffee'), 'Lavender Honey Scone', 'Buttery scone with dried lavender and a honey glaze drizzle.', 'Pastry', 4.25, 35, false, 'Popular'),
  ((select id from public.businesses where slug = 'mystic-coffee'), 'Premium Tea Sampler', 'Set of 4 loose-leaf herbal teas: Chamomile, Peppermint, Hibiscus, and Lavender.', 'Coffee', 22.00, 20, false, 'Gift idea'),
  ((select id from public.businesses where slug = 'mystic-coffee'), 'Mystic Coffee Mug', 'Handmade ceramic mug with a mystical mountain motif. 12oz capacity.', 'Merch', 24.00, 18, true, 'Limited edition');

-- ─── Promotions ──────────────────────────────────────────────

delete from public.promotions
where business_id in (
    select id from public.businesses where slug in ('velvet-brew', 'mystic-coffee')
  )
  and title in (
    'Double points after 3 PM',
    'Spring pairing menu',
    'Bring-a-friend Saturdays',
    'Tea Tuesday Bonus',
    'Brunch Bundle'
  );

insert into public.promotions (business_id, title, description, badge, cta, expires_at, audience) values
  ((select id from public.businesses where slug = 'velvet-brew'), 'Double points after 3 PM', 'Stop by after 3 PM and earn twice the points on any handcrafted drink.', 'Weekday perk', 'Drop by after work', '2026-04-24T23:59:59.000Z', 'All members'),
  ((select id from public.businesses where slug = 'velvet-brew'), 'Spring pairing menu', 'Unlock a bonus 120 points when you pair a pistachio bun with any iced espresso.', 'Seasonal', 'Try the pairing', '2026-04-17T23:59:59.000Z', 'All members'),
  ((select id from public.businesses where slug = 'velvet-brew'), 'Bring-a-friend Saturdays', 'Invite a friend to scan your code in-store and both of you receive a surprise bonus.', 'Referral', 'Share your code', '2026-05-01T23:59:59.000Z', 'All members'),
  ((select id from public.businesses where slug = 'mystic-coffee'), 'Tea Tuesday Bonus', 'Order any tea on Tuesdays and earn triple points all day.', 'Weekly', 'View teas', '2026-05-15T23:59:59.000Z', 'All members'),
  ((select id from public.businesses where slug = 'mystic-coffee'), 'Brunch Bundle', 'Get a free pastry when you order any breakfast sandwich before 11 AM.', 'Weekend', 'See menu', '2026-04-30T23:59:59.000Z', 'All members');
