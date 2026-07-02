do $$
begin
  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'gift_card_status'
  ) then
    create type public.gift_card_status as enum ('active', 'redeemed', 'expired', 'cancelled');
  end if;
end
$$;

alter type public.activity_type add value if not exists 'gift_card_issued';
alter type public.activity_type add value if not exists 'gift_card_redeemed';

create table if not exists public.gift_card_catalog (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  title text not null,
  description text not null default '',
  image_url text,
  points_cost integer not null check (points_cost >= 0),
  value_label text not null,
  expiry_days integer not null default 30 check (expiry_days > 0),
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if to_regclass('public.reward_catalog') is not null
    and to_regclass('public.business_branding') is not null then
    execute $sql$
      insert into public.gift_card_catalog (
        business_id,
        title,
        description,
        image_url,
        points_cost,
        value_label,
        expiry_days,
        is_active,
        created_at,
        updated_at
      )
      select
        coalesce(bb.legacy_business_id, rc.business_id),
        rc.title,
        coalesce(rc.description, ''),
        rc.image_url,
        rc.points_cost,
        case
          when rc.gift_card_value_cents is not null then
            coalesce(rc.currency, 'PHP') || ' ' || trim(to_char(rc.gift_card_value_cents / 100.0, 'FM999999990.00'))
          else coalesce(rc.currency, 'PHP') || ' gift card'
        end,
        30,
        coalesce(rc.is_active, true),
        coalesce(rc.created_at, now()),
        coalesce(rc.updated_at, now())
      from public.reward_catalog rc
      left join public.business_branding bb on bb.id = rc.business_id
      join public.businesses b on b.id = coalesce(bb.legacy_business_id, rc.business_id)
      where rc.reward_type::text = 'gift_card'
        and not exists (
          select 1
          from public.gift_card_catalog gcc
          where gcc.business_id = coalesce(bb.legacy_business_id, rc.business_id)
            and gcc.title = rc.title
            and gcc.points_cost = rc.points_cost
        )
    $sql$;
  end if;
end
$$;

create table if not exists public.gift_cards (
  id uuid primary key default gen_random_uuid(),
  catalog_id uuid references public.gift_card_catalog(id) on delete set null,
  business_id uuid not null,
  customer_id uuid not null,
  issued_by uuid,
  code text unique,
  public_token text unique,
  status public.gift_card_status not null default 'active',
  points_spent integer not null default 0 check (points_spent >= 0),
  expires_at timestamptz not null,
  redeemed_at timestamptz,
  redeemed_by uuid,
  redeemed_at_business uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.gift_cards
  add column if not exists catalog_id uuid,
  add column if not exists issued_by uuid,
  add column if not exists code text,
  add column if not exists points_spent integer,
  add column if not exists redeemed_at_business uuid,
  add column if not exists updated_at timestamptz not null default now();

do $$
declare
  fk record;
begin
  for fk in
    select conname
    from pg_constraint
    where conrelid = 'public.gift_cards'::regclass
      and contype = 'f'
      and confrelid = to_regclass('public.business_branding')
  loop
    execute format('alter table public.gift_cards drop constraint %I', fk.conname);
  end loop;
end
$$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'gift_cards'
      and column_name = 'gift_card_code'
  ) then
    execute $sql$
      update public.gift_cards gc
      set
        code = coalesce(gc.code, gc.gift_card_code),
        points_spent = coalesce(gc.points_spent, gc.reward_points_used),
        issued_by = coalesce(gc.issued_by, gc.issued_by_profile_id),
        redeemed_at_business = coalesce(gc.redeemed_at_business, gc.business_id)
    $sql$;
  end if;

  if to_regclass('public.business_branding') is not null then
    execute $sql$
      update public.gift_cards gc
      set business_id = bb.legacy_business_id
      from public.business_branding bb
      join public.businesses b on b.id = bb.legacy_business_id
      where gc.business_id = bb.id
        and bb.legacy_business_id is not null
    $sql$;
  end if;

  if to_regclass('public.reward_catalog') is not null
    and to_regclass('public.business_branding') is not null
    and exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'gift_cards'
        and column_name = 'reward_catalog_id'
    ) then
    execute $sql$
      update public.gift_cards gc
      set catalog_id = coalesce(
        gc.catalog_id,
        (
          select gcc.id
          from public.gift_card_catalog gcc
          join public.reward_catalog rc on rc.title = gcc.title
          left join public.business_branding bb on bb.id = rc.business_id
          join public.businesses b on b.id = coalesce(bb.legacy_business_id, rc.business_id)
          where rc.id = gc.reward_catalog_id
            and gcc.business_id = coalesce(bb.legacy_business_id, rc.business_id)
          limit 1
        )
      )
    $sql$;
  end if;
end
$$;

update public.gift_cards
set
  code = coalesce(code, 'GC-' || to_char(coalesce(created_at, now()), 'YYMMDD') || '-' || upper(substr(replace(id::text, '-', ''), 1, 6))),
  points_spent = coalesce(points_spent, 0);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'gift_cards'
      and column_name = 'redeemed_by'
      and udt_name = 'text'
  ) then
    alter table public.gift_cards
      alter column redeemed_by type uuid
      using (
        case
          when redeemed_by ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
            then redeemed_by::uuid
          else null
        end
      );
  end if;
end
$$;

alter table public.gift_cards
  alter column code set not null,
  alter column points_spent set not null;

do $$
declare
  fk record;
begin
  for fk in
    select conname
    from pg_constraint
    where conrelid = 'public.gift_cards'::regclass
      and contype = 'f'
      and confrelid = to_regclass('public.business_branding')
  loop
    execute format('alter table public.gift_cards drop constraint %I', fk.conname);
  end loop;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'gift_cards_catalog_id_fkey') then
    alter table public.gift_cards
      add constraint gift_cards_catalog_id_fkey
      foreign key (catalog_id) references public.gift_card_catalog(id) on delete set null not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'gift_cards_business_id_fkey') then
    alter table public.gift_cards
      add constraint gift_cards_business_id_fkey
      foreign key (business_id) references public.businesses(id) on delete restrict not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'gift_cards_customer_id_fkey') then
    alter table public.gift_cards
      add constraint gift_cards_customer_id_fkey
      foreign key (customer_id) references public.profiles(id) on delete cascade not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'gift_cards_issued_by_fkey') then
    alter table public.gift_cards
      add constraint gift_cards_issued_by_fkey
      foreign key (issued_by) references public.profiles(id) on delete set null not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'gift_cards_redeemed_by_fkey') then
    alter table public.gift_cards
      add constraint gift_cards_redeemed_by_fkey
      foreign key (redeemed_by) references public.profiles(id) on delete set null not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'gift_cards_redeemed_at_business_fkey') then
    alter table public.gift_cards
      add constraint gift_cards_redeemed_at_business_fkey
      foreign key (redeemed_at_business) references public.businesses(id) on delete set null not valid;
  end if;
end
$$;

create table if not exists public.gift_card_events (
  id uuid primary key default gen_random_uuid(),
  gift_card_id uuid not null references public.gift_cards(id) on delete cascade,
  event_type text not null,
  actor_id uuid references public.profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.gift_card_events
  add column if not exists actor_id uuid;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'gift_card_events_actor_id_fkey') then
    alter table public.gift_card_events
      add constraint gift_card_events_actor_id_fkey
      foreign key (actor_id) references public.profiles(id) on delete set null not valid;
  end if;
end
$$;

create unique index if not exists gift_cards_code_key on public.gift_cards(code);
create unique index if not exists gift_cards_public_token_key on public.gift_cards(public_token);
create index if not exists idx_gift_card_catalog_business_id on public.gift_card_catalog(business_id);
create index if not exists idx_gift_card_catalog_active on public.gift_card_catalog(is_active, business_id);
create index if not exists idx_gift_cards_customer_id on public.gift_cards(customer_id);
create index if not exists idx_gift_cards_business_id on public.gift_cards(business_id);
create index if not exists idx_gift_cards_status_expires_at on public.gift_cards(status, expires_at);
create index if not exists idx_gift_cards_public_token on public.gift_cards(public_token);
create index if not exists idx_gift_card_events_gift_card_id on public.gift_card_events(gift_card_id, created_at desc);

drop trigger if exists set_gift_card_catalog_updated_at on public.gift_card_catalog;
create trigger set_gift_card_catalog_updated_at
  before update on public.gift_card_catalog
  for each row execute function public.handle_updated_at();

drop trigger if exists set_gift_cards_updated_at on public.gift_cards;
create trigger set_gift_cards_updated_at
  before update on public.gift_cards
  for each row execute function public.handle_updated_at();

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
as $$
  select public.jwt_role() = 'platform-admin'
$$;

create or replace function public.can_manage_business(p_business_id uuid)
returns boolean
language sql
stable
as $$
  select public.is_platform_admin()
    or (
      public.jwt_role() in ('business-owner', 'business-staff')
      and public.current_business_id() = p_business_id
    )
$$;

create or replace function public.can_curate_gift_card_catalog(p_business_id uuid)
returns boolean
language sql
stable
as $$
  select public.is_platform_admin()
    or (
      public.jwt_role() = 'business-owner'
      and public.current_business_id() = p_business_id
    )
$$;

create or replace function public.generate_gift_card_code()
returns text
language plpgsql
as $$
declare
  candidate text;
begin
  loop
    candidate := 'GC-' || to_char(now(), 'YYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    exit when not exists (
      select 1
      from public.gift_cards
      where code = candidate
    );
  end loop;

  return candidate;
end;
$$;

create or replace function public.issue_gift_card(
  p_catalog_id uuid,
  p_customer_id uuid
)
returns public.gift_cards
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  actor_profile public.profiles%rowtype;
  catalog_row public.gift_card_catalog%rowtype;
  customer_profile public.profiles%rowtype;
  balance_row public.reward_balances%rowtype;
  next_card public.gift_cards%rowtype;
  next_token text;
  remaining_points integer;
begin
  if actor_id is null then
    raise exception 'Authentication required';
  end if;

  select * into actor_profile from public.profiles where id = actor_id;
  if not found then raise exception 'Issuing profile not found'; end if;

  select * into customer_profile from public.profiles where id = p_customer_id;
  if not found then raise exception 'Customer not found'; end if;
  if customer_profile.role <> 'customer' then raise exception 'Gift cards can only be issued to customers'; end if;

  select * into catalog_row
  from public.gift_card_catalog
  where id = p_catalog_id
    and is_active = true;
  if not found then raise exception 'Gift card catalog item is not active'; end if;

  if actor_profile.role = 'customer' and actor_id <> p_customer_id then
    raise exception 'Customers can only issue gift cards for themselves';
  end if;

  if actor_profile.role = 'business-owner' and (
    actor_profile.business_id is null
    or actor_profile.business_id <> catalog_row.business_id
  ) then
    raise exception 'Permission denied';
  end if;

  if actor_profile.role not in ('customer', 'platform-admin', 'business-owner') then
    raise exception 'Permission denied';
  end if;

  insert into public.reward_balances (profile_id)
  values (p_customer_id)
  on conflict (profile_id) do nothing;

  select * into balance_row
  from public.reward_balances
  where profile_id = p_customer_id
  for update;

  if balance_row.points < catalog_row.points_cost then
    raise exception 'Insufficient points';
  end if;

  update public.reward_balances
  set points = points - catalog_row.points_cost,
      updated_at = now()
  where profile_id = p_customer_id
    and points >= catalog_row.points_cost
  returning points into remaining_points;

  if not found then raise exception 'Insufficient points'; end if;

  loop
    next_token := encode(gen_random_bytes(16), 'hex');
    begin
      insert into public.gift_cards (
        catalog_id,
        business_id,
        customer_id,
        issued_by,
        code,
        public_token,
        status,
        points_spent,
        expires_at
      )
      values (
        catalog_row.id,
        catalog_row.business_id,
        p_customer_id,
        actor_id,
        public.generate_gift_card_code(),
        next_token,
        'active',
        catalog_row.points_cost,
        now() + make_interval(days => catalog_row.expiry_days)
      )
      returning * into next_card;
      exit;
    exception
      when unique_violation then continue;
    end;
  end loop;

  insert into public.gift_card_events (gift_card_id, event_type, actor_id, metadata)
  values (
    next_card.id,
    'issued',
    actor_id,
    jsonb_build_object(
      'catalog_id', catalog_row.id,
      'business_id', catalog_row.business_id,
      'points_spent', catalog_row.points_cost,
      'remaining_points', remaining_points
    )
  );

  insert into public.activities (profile_id, business_id, type, title, description, points, status)
  values (
    p_customer_id,
    catalog_row.business_id,
    'gift_card_issued',
    'Gift card issued',
    catalog_row.title,
    -catalog_row.points_cost,
    'posted'
  );

  return next_card;
end;
$$;

create or replace function public.redeem_gift_card(
  p_gift_card_id uuid,
  p_business_id uuid
)
returns public.gift_cards
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  actor_profile public.profiles%rowtype;
  card_row public.gift_cards%rowtype;
  updated_card public.gift_cards%rowtype;
  catalog_title text;
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

  insert into public.gift_card_events (gift_card_id, event_type, actor_id, metadata)
  values (updated_card.id, 'redeemed', actor_id, jsonb_build_object('business_id', p_business_id));

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

drop function if exists public.get_public_gift_card_by_token(text);
create or replace function public.get_public_gift_card_by_token(p_token text)
returns table (
  id uuid,
  catalog_id uuid,
  business_id uuid,
  customer_id uuid,
  code text,
  public_token text,
  status public.gift_card_status,
  points_spent integer,
  expires_at timestamptz,
  redeemed_at timestamptz,
  business_name text,
  business_logo_url text,
  business_primary_color text,
  business_accent_color text,
  customer_first_name text,
  title text,
  description text,
  value_label text,
  image_url text
)
language sql
security definer
set search_path = public
as $$
  select
    gc.id,
    gc.catalog_id,
    gc.business_id,
    gc.customer_id,
    gc.code,
    gc.public_token,
    case
      when gc.status in ('redeemed', 'cancelled') then gc.status
      when gc.expires_at <= now() then 'expired'::public.gift_card_status
      else gc.status
    end,
    gc.points_spent,
    gc.expires_at,
    gc.redeemed_at,
    b.name,
    b.logo_url,
    '#f4a84f'::text,
    '#7bd8cf'::text,
    split_part(coalesce(p.full_name, 'Member'), ' ', 1),
    coalesce(gcc.title, 'Gift card'),
    coalesce(gcc.description, ''),
    coalesce(gcc.value_label, ''),
    gcc.image_url
  from public.gift_cards gc
  join public.businesses b on b.id = gc.business_id
  join public.profiles p on p.id = gc.customer_id
  left join public.gift_card_catalog gcc on gcc.id = gc.catalog_id
  where gc.public_token = p_token
     or upper(gc.code) = upper(p_token)
  limit 1;
$$;

create or replace function public.expire_old_gift_cards()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  expired_count integer;
begin
  with expired_cards as (
    update public.gift_cards
    set status = 'expired'
    where status = 'active'
      and now() >= expires_at
    returning id
  ),
  logged_events as (
    insert into public.gift_card_events (gift_card_id, event_type, actor_id, metadata)
    select id, 'expired', auth.uid(), jsonb_build_object('source', 'expire_old_gift_cards')
    from expired_cards
    returning 1
  )
  select count(*) into expired_count from logged_events;

  return expired_count;
end;
$$;

alter table public.gift_card_catalog enable row level security;
alter table public.gift_cards enable row level security;
alter table public.gift_card_events enable row level security;

drop policy if exists "Active gift card catalog is public" on public.gift_card_catalog;
create policy "Active gift card catalog is public"
  on public.gift_card_catalog for select
  to anon, authenticated
  using (is_active = true or public.can_curate_gift_card_catalog(business_id));

drop policy if exists "Business teams can create gift card catalog" on public.gift_card_catalog;
create policy "Business teams can create gift card catalog"
  on public.gift_card_catalog for insert
  to authenticated
  with check (public.can_curate_gift_card_catalog(business_id));

drop policy if exists "Business teams can update gift card catalog" on public.gift_card_catalog;
create policy "Business teams can update gift card catalog"
  on public.gift_card_catalog for update
  to authenticated
  using (public.can_curate_gift_card_catalog(business_id))
  with check (public.can_curate_gift_card_catalog(business_id));

drop policy if exists "Business teams can delete gift card catalog" on public.gift_card_catalog;
create policy "Business teams can delete gift card catalog"
  on public.gift_card_catalog for delete
  to authenticated
  using (public.can_curate_gift_card_catalog(business_id));

drop policy if exists "Customers can read own gift cards" on public.gift_cards;
create policy "Customers can read own gift cards"
  on public.gift_cards for select
  to authenticated
  using (auth.uid() = customer_id);

drop policy if exists "Business teams can read gift cards" on public.gift_cards;
create policy "Business teams can read gift cards"
  on public.gift_cards for select
  to authenticated
  using (public.can_manage_business(business_id));

drop policy if exists "Gift card event scoped reads" on public.gift_card_events;
create policy "Gift card event scoped reads"
  on public.gift_card_events for select
  to authenticated
  using (
    exists (
      select 1
      from public.gift_cards gc
      where gc.id = gift_card_events.gift_card_id
        and (
          gc.customer_id = auth.uid()
          or public.can_manage_business(gc.business_id)
        )
    )
  );

revoke all on function public.issue_gift_card(uuid, uuid) from public;
grant execute on function public.issue_gift_card(uuid, uuid) to authenticated;

revoke all on function public.redeem_gift_card(uuid, uuid) from public;
grant execute on function public.redeem_gift_card(uuid, uuid) to authenticated;

revoke all on function public.get_public_gift_card_by_token(text) from public;
grant execute on function public.get_public_gift_card_by_token(text) to anon, authenticated;

revoke all on function public.expire_old_gift_cards() from public;
grant execute on function public.expire_old_gift_cards() to authenticated;
