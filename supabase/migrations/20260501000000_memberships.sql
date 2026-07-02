do $$
begin
  create type public.membership_status as enum ('active', 'canceled');
exception
  when duplicate_object then null;
end;
$$;

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade unique,
  status public.membership_status not null default 'active',
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz not null default (now() + interval '30 days'),
  cancel_at_period_end boolean not null default false,
  price_cents integer not null default 1000 check (price_cents >= 0),
  currency text not null default 'USD',
  provider text not null default 'mock',
  provider_subscription_id text,
  last_credit_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint memberships_profile_matches_auth check (profile_id = auth.uid())
);

drop trigger if exists set_memberships_updated_at on public.memberships;
create trigger set_memberships_updated_at
  before update on public.memberships
  for each row execute function public.handle_updated_at();

alter table public.memberships enable row level security;

drop policy if exists "Users can view own membership" on public.memberships;
create policy "Users can view own membership"
  on public.memberships for select
  using (profile_id = auth.uid());

drop policy if exists "Users can create own membership" on public.memberships;
create policy "Users can create own membership"
  on public.memberships for insert
  with check (profile_id = auth.uid());

drop policy if exists "Users can update own membership" on public.memberships;
create policy "Users can update own membership"
  on public.memberships for update
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create or replace function public.is_membership_active(p_profile_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships
    where profile_id = p_profile_id
      and status = 'active'
      and current_period_end > now()
  );
$$;

create or replace function public.grant_membership_credit(
  p_profile_id uuid,
  p_amount_cents integer
)
returns public.reward_balances
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_balance public.reward_balances%rowtype;
begin
  if p_profile_id is null then
    raise exception 'profile_required';
  end if;

  if p_amount_cents <= 0 then
    raise exception 'amount_required';
  end if;

  insert into public.reward_balances (profile_id)
  values (p_profile_id)
  on conflict (profile_id) do nothing;

  update public.reward_balances
  set available_credits = available_credits + p_amount_cents
  where profile_id = p_profile_id
  returning *
    into updated_balance;

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
    p_profile_id,
    null,
    'bonus',
    'Monthly membership credit',
    'Monthly membership credit',
    0,
    'posted'
  );

  return updated_balance;
end;
$$;

create or replace function public.mock_subscribe()
returns public.memberships
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  existing_membership public.memberships%rowtype;
  membership_row public.memberships%rowtype;
begin
  if actor_id is null then
    raise exception 'Authentication required';
  end if;

  select *
    into existing_membership
  from public.memberships
  where profile_id = actor_id
  for update;

  if found and existing_membership.status = 'active' and existing_membership.current_period_end > now() then
    return existing_membership;
  end if;

  insert into public.memberships (
    profile_id,
    status,
    current_period_start,
    current_period_end,
    cancel_at_period_end,
    price_cents,
    currency,
    provider,
    provider_subscription_id,
    last_credit_at
  )
  values (
    actor_id,
    'active',
    now(),
    now() + interval '30 days',
    false,
    1000,
    'USD',
    'mock',
    null,
    null
  )
  on conflict (profile_id) do update
  set status = 'active',
      current_period_start = now(),
      current_period_end = now() + interval '30 days',
      cancel_at_period_end = false,
      price_cents = 1000,
      currency = 'USD',
      provider = 'mock',
      provider_subscription_id = null,
      last_credit_at = null
  returning *
    into membership_row;

  perform public.grant_membership_credit(actor_id, 1000);

  return membership_row;
end;
$$;

create or replace function public.mock_renew()
returns public.memberships
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  existing_membership public.memberships%rowtype;
  membership_row public.memberships%rowtype;
  period_base timestamptz;
begin
  if actor_id is null then
    raise exception 'Authentication required';
  end if;

  select *
    into existing_membership
  from public.memberships
  where profile_id = actor_id
  for update;

  if found and existing_membership.last_credit_at is not null
    and existing_membership.last_credit_at::date = now()::date then
    return existing_membership;
  end if;

  period_base := greatest(coalesce(existing_membership.current_period_end, now()), now());

  insert into public.memberships (
    profile_id,
    status,
    current_period_start,
    current_period_end,
    cancel_at_period_end,
    price_cents,
    currency,
    provider,
    provider_subscription_id,
    last_credit_at
  )
  values (
    actor_id,
    'active',
    now(),
    now() + interval '30 days',
    false,
    1000,
    'USD',
    'mock',
    null,
    now()
  )
  on conflict (profile_id) do update
  set status = 'active',
      current_period_start = case
        when public.memberships.current_period_end > now() then public.memberships.current_period_start
        else now()
      end,
      current_period_end = period_base + interval '30 days',
      cancel_at_period_end = false,
      price_cents = 1000,
      currency = 'USD',
      provider = 'mock',
      provider_subscription_id = null,
      last_credit_at = now()
  returning *
    into membership_row;

  perform public.grant_membership_credit(actor_id, 1000);

  return membership_row;
end;
$$;

create or replace function public.mock_cancel()
returns public.memberships
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  membership_row public.memberships%rowtype;
begin
  if actor_id is null then
    raise exception 'Authentication required';
  end if;

  update public.memberships
  set status = 'canceled',
      cancel_at_period_end = true
  where profile_id = actor_id
  returning *
    into membership_row;

  if not found then
    raise exception 'membership_not_found';
  end if;

  return membership_row;
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

  if not public.is_membership_active(actor_id) then
    raise exception 'membership_required';
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

create or replace function public.redeem_reward(
  p_reward_id uuid,
  p_pickup_window text,
  p_notes text default null,
  p_client_request_id uuid default null
)
returns public.redemptions
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  actor_name text;
  reward_row public.rewards%rowtype;
  balance_row public.reward_balances%rowtype;
  existing_redemption public.redemptions%rowtype;
  inserted_redemption public.redemptions%rowtype;
begin
  if actor_id is null then
    raise exception 'Authentication required';
  end if;

  if not public.is_membership_active(actor_id) then
    raise exception 'membership_required';
  end if;

  if p_reward_id is null then
    raise exception 'Reward not found.';
  end if;

  if p_pickup_window not in ('Now', 'Within 30 mins', 'Later today') then
    raise exception 'Invalid pickup window.';
  end if;

  if p_client_request_id is not null then
    select *
      into existing_redemption
    from public.redemptions
    where profile_id = actor_id
      and client_request_id = p_client_request_id
    limit 1;

    if found then
      return existing_redemption;
    end if;
  end if;

  select *
    into reward_row
  from public.rewards
  where id = p_reward_id
  for update;

  if not found then
    raise exception 'Reward not found.';
  end if;

  if reward_row.inventory <= 0 then
    raise exception 'That reward is currently out of stock.';
  end if;

  insert into public.reward_balances (profile_id)
  values (actor_id)
  on conflict (profile_id) do nothing;

  select *
    into balance_row
  from public.reward_balances
  where profile_id = actor_id
  for update;

  if balance_row.points < reward_row.points_cost then
    raise exception 'You do not have enough XP for this reward yet.';
  end if;

  update public.rewards
  set inventory = inventory - 1
  where id = reward_row.id
    and inventory > 0;

  if not found then
    raise exception 'That reward is currently out of stock.';
  end if;

  update public.reward_balances
  set points = points - reward_row.points_cost
  where profile_id = actor_id;

  insert into public.redemptions (
    profile_id,
    reward_id,
    reward_title,
    points_cost,
    pickup_window,
    notes,
    status,
    client_request_id
  )
  values (
    actor_id,
    reward_row.id,
    reward_row.title,
    reward_row.points_cost,
    p_pickup_window,
    nullif(trim(coalesce(p_notes, '')), ''),
    'ready',
    p_client_request_id
  )
  returning *
    into inserted_redemption;

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
    reward_row.business_id,
    'redeemed',
    format('%s redeemed', reward_row.title),
    case
      when nullif(trim(coalesce(p_notes, '')), '') is null
        then format('%s pickup selected', p_pickup_window)
      else format('%s pickup selected - %s', p_pickup_window, nullif(trim(coalesce(p_notes, '')), ''))
    end,
    reward_row.points_cost * -1,
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
    coalesce(actor_name, 'Customer redemption'),
    'Reward redeemed',
    format('Reward %s redeemed at business %s for %s XP.',
      reward_row.title,
      reward_row.business_id,
      reward_row.points_cost
    )
  );

  return inserted_redemption;
exception
  when unique_violation then
    if p_client_request_id is not null then
      select *
        into existing_redemption
      from public.redemptions
      where profile_id = actor_id
        and client_request_id = p_client_request_id
      limit 1;

      if found then
        return existing_redemption;
      end if;
    end if;

    raise;
end;
$$;

revoke all on function public.is_membership_active(uuid) from public;
revoke all on function public.grant_membership_credit(uuid, integer) from public;
revoke all on function public.mock_subscribe() from public;
revoke all on function public.mock_renew() from public;
revoke all on function public.mock_cancel() from public;
revoke all on function public.place_order(uuid, text, jsonb, uuid) from public;
revoke all on function public.redeem_reward(uuid, text, text, uuid) from public;

grant execute on function public.is_membership_active(uuid) to authenticated;
grant execute on function public.mock_subscribe() to authenticated;
grant execute on function public.mock_renew() to authenticated;
grant execute on function public.mock_cancel() to authenticated;
grant execute on function public.place_order(uuid, text, jsonb, uuid) to authenticated;
grant execute on function public.redeem_reward(uuid, text, text, uuid) to authenticated;
