create type public.partner_referral_status as enum (
  'attributed',
  'credited',
  'voided'
);

create table public.partner_referrers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  partner_name text not null,
  contact_name text not null,
  contact_email text,
  code text not null unique,
  active boolean not null default true,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.partner_referrals (
  id uuid primary key default gen_random_uuid(),
  partner_referrer_id uuid not null references public.partner_referrers(id) on delete cascade,
  customer_profile_id uuid not null references public.profiles(id) on delete cascade,
  source_business_id uuid not null references public.businesses(id) on delete cascade,
  status public.partner_referral_status not null default 'attributed',
  attributed_at timestamptz not null default now(),
  first_order_id uuid references public.orders(id) on delete set null,
  credited_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.partner_credit_ledger (
  id uuid primary key default gen_random_uuid(),
  partner_referrer_id uuid not null references public.partner_referrers(id) on delete cascade,
  partner_referral_id uuid not null references public.partner_referrals(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  credit_type text not null default 'partner-credit',
  credit_units integer not null default 1 check (credit_units > 0),
  details text not null default '',
  created_at timestamptz not null default now(),
  redeemed_at timestamptz
);

create index idx_partner_referrers_business_id
  on public.partner_referrers (business_id);

create index idx_partner_referrals_business_id
  on public.partner_referrals (source_business_id, created_at desc);

create index idx_partner_referrals_customer_id
  on public.partner_referrals (customer_profile_id, source_business_id);

create index idx_partner_credit_ledger_referrer_id
  on public.partner_credit_ledger (partner_referrer_id, created_at desc);

create unique index partner_referrals_customer_business_active_key
  on public.partner_referrals (customer_profile_id, source_business_id)
  where status in ('attributed', 'credited');

create unique index partner_credit_ledger_partner_referral_unique
  on public.partner_credit_ledger (partner_referral_id);

create or replace function public.generate_partner_referrer_code()
returns text
language plpgsql
as $$
declare
  candidate text;
begin
  loop
    candidate := upper(substr(md5(gen_random_uuid()::text), 1, 10));
    exit when not exists (
      select 1
      from public.partner_referrers
      where code = candidate
    );
  end loop;

  return candidate;
end;
$$;

update public.partner_referrers
set code = public.generate_partner_referrer_code()
where code = '';

alter table public.partner_referrers
  alter column code set default public.generate_partner_referrer_code();

create trigger set_partner_referrers_updated_at
  before update on public.partner_referrers
  for each row execute function public.handle_updated_at();

alter table public.partner_referrers enable row level security;
alter table public.partner_referrals enable row level security;
alter table public.partner_credit_ledger enable row level security;

create policy "Staff can view own business partner referrers"
  on public.partner_referrers for select
  using (
    public.jwt_role() = 'platform-admin'
    or (
      public.has_staff_access()
      and business_id = public.current_business_id()
    )
  );

create policy "Staff can manage own business partner referrers"
  on public.partner_referrers for insert
  with check (
    public.jwt_role() = 'platform-admin'
    or (
      public.has_staff_access()
      and business_id = public.current_business_id()
    )
  );

create policy "Staff can update own business partner referrers"
  on public.partner_referrers for update
  using (
    public.jwt_role() = 'platform-admin'
    or (
      public.has_staff_access()
      and business_id = public.current_business_id()
    )
  )
  with check (
    public.jwt_role() = 'platform-admin'
    or (
      public.has_staff_access()
      and business_id = public.current_business_id()
    )
  );

create policy "Staff can view own business partner referrals"
  on public.partner_referrals for select
  using (
    public.jwt_role() = 'platform-admin'
    or (
      public.has_staff_access()
      and source_business_id = public.current_business_id()
    )
  );

create policy "Customers can view own partner referrals"
  on public.partner_referrals for select
  using (auth.uid() = customer_profile_id);

create policy "Staff can view own business partner credit ledger"
  on public.partner_credit_ledger for select
  using (
    public.jwt_role() = 'platform-admin'
    or exists (
      select 1
      from public.partner_referrers pr
      where pr.id = partner_credit_ledger.partner_referrer_id
        and public.has_staff_access()
        and pr.business_id = public.current_business_id()
    )
  );

create policy "Staff can update own business partner credit ledger"
  on public.partner_credit_ledger for update
  using (
    public.jwt_role() = 'platform-admin'
    or exists (
      select 1
      from public.partner_referrers pr
      where pr.id = partner_credit_ledger.partner_referrer_id
        and public.has_staff_access()
        and pr.business_id = public.current_business_id()
    )
  )
  with check (
    public.jwt_role() = 'platform-admin'
    or exists (
      select 1
      from public.partner_referrers pr
      where pr.id = partner_credit_ledger.partner_referrer_id
        and public.has_staff_access()
        and pr.business_id = public.current_business_id()
    )
  );

create or replace function public.attribute_partner_referral(
  p_partner_code text,
  p_customer_profile_id uuid,
  p_source_business_id uuid
)
returns public.partner_referrals
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  actor_role text := public.jwt_role();
  referrer_row public.partner_referrers%rowtype;
  existing_referral public.partner_referrals%rowtype;
  inserted_referral public.partner_referrals%rowtype;
begin
  if actor_id is null then
    raise exception 'Authentication required';
  end if;

  if p_customer_profile_id is null or p_source_business_id is null then
    raise exception 'Customer and business are required.';
  end if;

  if actor_id <> p_customer_profile_id and actor_role not in ('platform-admin', 'business-owner', 'business-staff') then
    raise exception 'Permission denied';
  end if;

  select *
    into referrer_row
  from public.partner_referrers
  where code = upper(trim(p_partner_code))
    and active = true
  limit 1;

  if not found then
    raise exception 'Partner code not found.';
  end if;

  if referrer_row.business_id <> p_source_business_id then
    raise exception 'Partner code is not valid for this business.';
  end if;

  select *
    into existing_referral
  from public.partner_referrals
  where customer_profile_id = p_customer_profile_id
    and source_business_id = p_source_business_id
    and status in ('attributed', 'credited')
  limit 1;

  if found then
    return existing_referral;
  end if;

  insert into public.partner_referrals (
    partner_referrer_id,
    customer_profile_id,
    source_business_id,
    status
  )
  values (
    referrer_row.id,
    p_customer_profile_id,
    p_source_business_id,
    'attributed'
  )
  returning *
    into inserted_referral;

  return inserted_referral;
end;
$$;

revoke all on function public.attribute_partner_referral(text, uuid, uuid) from public;
grant execute on function public.attribute_partner_referral(text, uuid, uuid) to authenticated;

create or replace function public.credit_partner_referral(
  p_customer_profile_id uuid,
  p_business_id uuid,
  p_order_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  referral_row public.partner_referrals%rowtype;
  referrer_row public.partner_referrers%rowtype;
begin
  if p_customer_profile_id is null or p_business_id is null or p_order_id is null then
    return;
  end if;

  select *
    into referral_row
  from public.partner_referrals
  where customer_profile_id = p_customer_profile_id
    and source_business_id = p_business_id
    and status = 'attributed'
    and first_order_id is null
  order by created_at asc
  limit 1
  for update;

  if not found then
    return;
  end if;

  select *
    into referrer_row
  from public.partner_referrers
  where id = referral_row.partner_referrer_id
  limit 1;

  if not found or not referrer_row.active then
    return;
  end if;

  update public.partner_referrals
  set first_order_id = p_order_id,
      status = 'credited',
      credited_at = now()
  where id = referral_row.id
    and first_order_id is null;

  if not found then
    return;
  end if;

  insert into public.partner_credit_ledger (
    partner_referrer_id,
    partner_referral_id,
    order_id,
    credit_type,
    credit_units,
    details
  )
  values (
    referral_row.partner_referrer_id,
    referral_row.id,
    p_order_id,
    'partner-credit',
    1,
    format(
      '1 partner credit awarded to %s for the first paid order from customer %s.',
      referrer_row.contact_name,
      p_customer_profile_id
    )
  )
  on conflict (partner_referral_id) do nothing;
end;
$$;

create or replace function public.place_order(
  p_business_id uuid,
  p_payment_method text,
  p_items jsonb,
  p_client_request_id uuid default null
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  actor_name text;
  business_row public.businesses%rowtype;
  existing_order public.orders%rowtype;
  item_count integer;
  inserted_order public.orders%rowtype;
  subtotal_value numeric(12,2);
  tax_value numeric(12,2);
  total_value numeric(12,2);
  points_earned_value integer;
begin
  if actor_id is null then
    raise exception 'Authentication required';
  end if;

  if p_business_id is null then
    raise exception 'Business is required.';
  end if;

  if coalesce(jsonb_typeof(p_items), '') <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Your cart is empty.';
  end if;

  if p_payment_method not in ('visa', 'mastercard', 'applepay') then
    raise exception 'Unsupported payment method.';
  end if;

  if p_client_request_id is not null then
    select *
      into existing_order
    from public.orders
    where profile_id = actor_id
      and client_request_id = p_client_request_id
    limit 1;

    if found then
      return existing_order;
    end if;
  end if;

  select *
    into business_row
  from public.businesses
  where id = p_business_id
    and active = true
  for share;

  if not found then
    raise exception 'Business not found.';
  end if;

  create temporary table if not exists pg_temp.checkout_items (
    product_id uuid primary key,
    quantity integer not null
  ) on commit drop;

  truncate table pg_temp.checkout_items;

  insert into pg_temp.checkout_items (product_id, quantity)
  select
    raw.product_id,
    sum(raw.quantity)::integer
  from jsonb_to_recordset(p_items) as raw(product_id uuid, quantity integer)
  where raw.product_id is not null
  group by raw.product_id;

  get diagnostics item_count = row_count;
  if item_count = 0 then
    raise exception 'Your cart is empty.';
  end if;

  if exists (
    select 1
    from pg_temp.checkout_items
    where quantity <= 0
  ) then
    raise exception 'Cart quantities must be greater than zero.';
  end if;

  if exists (
    select 1
    from pg_temp.checkout_items ci
    join public.products p on p.id = ci.product_id
    where p.business_id <> p_business_id
  ) then
    raise exception 'Checkout supports one business per order.';
  end if;

  if exists (
    select 1
    from pg_temp.checkout_items ci
    left join public.products p on p.id = ci.product_id
    where p.id is null
  ) then
    raise exception 'One or more cart items are no longer available.';
  end if;

  if exists (
    select 1
    from pg_temp.checkout_items ci
    join public.products p on p.id = ci.product_id
    where p.inventory < ci.quantity
  ) then
    raise exception 'One or more items do not have enough inventory.';
  end if;

  select
    round(coalesce(sum(p.price * ci.quantity), 0)::numeric, 2),
    round(coalesce(sum(p.price * ci.quantity), 0)::numeric * business_row.tax_rate, 2)
    into subtotal_value, tax_value
  from pg_temp.checkout_items ci
  join public.products p on p.id = ci.product_id;

  total_value := round(subtotal_value + tax_value, 2);
  points_earned_value := floor(total_value * business_row.earn_rate);

  update public.products p
  set inventory = p.inventory - ci.quantity
  from pg_temp.checkout_items ci
  where p.id = ci.product_id
    and p.business_id = p_business_id
    and p.inventory >= ci.quantity;

  get diagnostics item_count = row_count;
  if item_count <> (select count(*) from pg_temp.checkout_items) then
    raise exception 'Inventory changed before checkout completed. Please refresh your cart and try again.';
  end if;

  insert into public.orders (
    profile_id,
    business_id,
    subtotal,
    tax,
    total,
    points_earned,
    points_status,
    payment_method,
    status,
    client_request_id
  )
  values (
    actor_id,
    p_business_id,
    subtotal_value,
    tax_value,
    total_value,
    points_earned_value,
    'posted',
    p_payment_method,
    'confirmed',
    p_client_request_id
  )
  returning *
    into inserted_order;

  insert into public.order_line_items (
    order_id,
    product_id,
    product_title,
    unit_price,
    quantity,
    subtotal
  )
  select
    inserted_order.id,
    p.id,
    p.title,
    p.price,
    ci.quantity,
    round((p.price * ci.quantity)::numeric, 2)
  from pg_temp.checkout_items ci
  join public.products p on p.id = ci.product_id;

  insert into public.reward_balances (profile_id)
  values (actor_id)
  on conflict (profile_id) do nothing;

  update public.reward_balances
  set points = points + points_earned_value
  where profile_id = actor_id;

  perform public.credit_partner_referral(actor_id, p_business_id, inserted_order.id);

  select full_name
    into actor_name
  from public.profiles
  where id = actor_id;

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
    actor_id,
    p_business_id,
    'earned',
    format('Purchase at %s - $%s', business_row.name, to_char(total_value, 'FM999999990.00')),
    format('%s item(s) ordered. %s XP earned.', (select sum(quantity) from pg_temp.checkout_items), points_earned_value),
    points_earned_value,
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
    coalesce(actor_name, 'Customer checkout'),
    'Order placed',
    format('Order %s placed for business %s. Total: $%s. XP earned: %s.',
      inserted_order.id,
      business_row.name,
      to_char(total_value, 'FM999999990.00'),
      points_earned_value
    )
  );

  return inserted_order;
exception
  when unique_violation then
    if p_client_request_id is not null then
      select *
        into existing_order
      from public.orders
      where profile_id = actor_id
        and client_request_id = p_client_request_id
      limit 1;

      if found then
        return existing_order;
      end if;
    end if;

    raise;
end;
$$;
