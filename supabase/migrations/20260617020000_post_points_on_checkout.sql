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
  inserted_order public.orders%rowtype;
  item_count integer;
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
    format('%s item(s) ordered. %s points posted after checkout.', (select sum(quantity) from pg_temp.checkout_items), points_earned_value),
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
    format(
      'Order %s placed for business %s. Total: $%s. Points posted: %s.',
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
