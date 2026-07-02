create or replace function public.generate_referral_code()
returns text
language plpgsql
as $$
declare
  candidate text;
begin
  loop
    candidate := upper(substr(md5(gen_random_uuid()::text), 1, 8));
    exit when not exists (
      select 1
      from public.profiles
      where referral_code = candidate
    );
  end loop;

  return candidate;
end;
$$;

alter table public.profiles
  add column if not exists referral_code text;

update public.profiles
set referral_code = public.generate_referral_code()
where referral_code is null or referral_code = '';

alter table public.profiles
  alter column referral_code set not null;

create unique index if not exists profiles_referral_code_key
  on public.profiles (referral_code);

create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_role public.user_role;
  new_business_id uuid;
begin
  new_role := coalesce(
    (new.raw_app_meta_data ->> 'role')::public.user_role,
    'customer'
  );

  new_business_id := (
    new.raw_app_meta_data ->> 'business_id'
  )::uuid;

  insert into public.profiles (id, full_name, email, role, business_id, referral_code)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    new.email,
    new_role,
    new_business_id,
    public.generate_referral_code()
  );

  insert into public.reward_balances (profile_id, points, next_reward_points, available_credits)
  values (new.id, 0, 300, 0);

  return new;
end;
$$ language plpgsql security definer;

drop policy if exists "business owners read referrals" on public.referrals;
drop policy if exists "authenticated insert referrals" on public.referrals;
drop policy if exists "business owners update referrals" on public.referrals;

create policy "Customers can view own referrals"
  on public.referrals for select
  using (auth.uid() = referrer_id or auth.uid() = referee_id);

create policy "Customers can create own referral"
  on public.referrals for insert
  with check (
    auth.uid() = referee_id
    and referrer_id <> referee_id
  );

create policy "Business owners can view own business referrals"
  on public.referrals for select
  using (
    public.jwt_role() = 'business-owner'
    and business_id = public.current_business_id()
  );

create policy "Business owners can update own business referrals"
  on public.referrals for update
  using (
    public.jwt_role() = 'business-owner'
    and business_id = public.current_business_id()
  )
  with check (
    public.jwt_role() = 'business-owner'
    and business_id = public.current_business_id()
  );

create policy "Platform admins can view referrals"
  on public.referrals for select
  using (public.jwt_role() = 'platform-admin');

create policy "Platform admins can update referrals"
  on public.referrals for update
  using (public.jwt_role() = 'platform-admin')
  with check (public.jwt_role() = 'platform-admin');

create or replace function public.create_referral(
  referrer_code text,
  referee_id uuid,
  target_business_id uuid default null
)
returns table(status text, referral_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  resolved_referrer_id uuid;
  inserted_id uuid;
begin
  if auth.uid() <> create_referral.referee_id then
    raise exception 'Permission denied';
  end if;

  select id
    into resolved_referrer_id
  from public.profiles
  where referral_code = upper(trim(create_referral.referrer_code))
  limit 1;

  if resolved_referrer_id is null and create_referral.referrer_code ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    select id
      into resolved_referrer_id
    from public.profiles
    where id = create_referral.referrer_code::uuid
    limit 1;
  end if;

  if resolved_referrer_id is null then
    status := 'missing-referrer';
    referral_id := null;
    return next;
    return;
  end if;

  if resolved_referrer_id = create_referral.referee_id then
    status := 'self-referral';
    referral_id := null;
    return next;
    return;
  end if;

  insert into public.referrals (referrer_id, referee_id, business_id)
  values (resolved_referrer_id, create_referral.referee_id, create_referral.target_business_id)
  returning id into inserted_id;

  status := 'created';
  referral_id := inserted_id;
  return next;
exception
  when unique_violation then
    status := 'duplicate';
    referral_id := null;
    return next;
end;
$$;

create or replace function public.approve_referral(
  referral_id uuid,
  approver_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  referral_row public.referrals%rowtype;
  requester_role text;
  requester_business_id uuid;
begin
  select role::text, business_id
    into requester_role, requester_business_id
  from public.profiles
  where id = auth.uid();

  if requester_role is null then
    raise exception 'Permission denied';
  end if;

  if approve_referral.approver_id <> auth.uid() then
    raise exception 'Approver must match current user.';
  end if;

  select *
    into referral_row
  from public.referrals
  where id = referral_id
    and status = 'pending'
  for update;

  if not found then
    raise exception 'Referral is not pending or could not be approved.';
  end if;

  if requester_role <> 'platform-admin' and (
    requester_role <> 'business-owner'
    or requester_business_id is null
    or referral_row.business_id is distinct from requester_business_id
  ) then
    raise exception 'Permission denied';
  end if;

  update public.referrals
  set status = 'approved',
      approved_by = approver_id,
      approved_at = now()
  where id = referral_row.id;

  update public.reward_balances
  set available_credits = available_credits + 1
  where profile_id in (referral_row.referrer_id, referral_row.referee_id);

  if (select count(*) from public.reward_balances where profile_id in (referral_row.referrer_id, referral_row.referee_id)) <> 2 then
    raise exception 'Balance not found.';
  end if;

  insert into public.activities (profile_id, business_id, type, title, points, status)
  values
    (referral_row.referrer_id, referral_row.business_id, 'bonus', 'Referral credit awarded', 0, 'posted'),
    (referral_row.referee_id, referral_row.business_id, 'bonus', 'Referral credit awarded', 0, 'posted');
end;
$$;

create or replace function public.reject_referral(referral_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  referral_row public.referrals%rowtype;
  requester_role text;
  requester_business_id uuid;
begin
  select role::text, business_id
    into requester_role, requester_business_id
  from public.profiles
  where id = auth.uid();

  select *
    into referral_row
  from public.referrals
  where id = referral_id
    and status = 'pending'
  for update;

  if not found then
    raise exception 'Referral is not pending or could not be rejected.';
  end if;

  if requester_role <> 'platform-admin' and (
    requester_role <> 'business-owner'
    or requester_business_id is null
    or referral_row.business_id is distinct from requester_business_id
  ) then
    raise exception 'Permission denied';
  end if;

  update public.referrals
  set status = 'rejected'
  where id = referral_row.id;
end;
$$;

create or replace function public.redeem_credit_code(
  code text,
  business_id uuid
)
returns table(profile_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  redemption_row public.credit_redemptions%rowtype;
  requester_role text;
  requester_business_id uuid;
  actor_name text;
begin
  select role::text, profiles.business_id, full_name
    into requester_role, requester_business_id, actor_name
  from public.profiles
  where id = auth.uid();

  if requester_role <> 'platform-admin' and (
    requester_role <> 'business-owner'
    or requester_business_id is null
    or requester_business_id <> redeem_credit_code.business_id
  ) then
    raise exception 'Permission denied';
  end if;

  select *
    into redemption_row
  from public.credit_redemptions
  where credit_redemptions.code = regexp_replace(redeem_credit_code.code, '\D', '', 'g')
    and status = 'pending'
    and expires_at > now()
  order by created_at desc
  limit 1
  for update;

  if not found then
    raise exception 'Invalid or expired code';
  end if;

  update public.reward_balances
  set available_credits = available_credits - 1
  where reward_balances.profile_id = redemption_row.profile_id
    and available_credits > 0;

  if not found then
    raise exception 'No reward credits are available for this member.';
  end if;

  update public.credit_redemptions
  set status = 'used',
      used_at = now(),
      used_by_business_id = redeem_credit_code.business_id
  where id = redemption_row.id;

  insert into public.activities (profile_id, business_id, type, title, points, status)
  values (redemption_row.profile_id, redeem_credit_code.business_id, 'adjustment', 'Reward credit used', 0, 'posted');

  insert into public.admin_logs (actor_id, actor_name, action, details)
  values (
    auth.uid(),
    coalesce(actor_name, 'Staff redemption'),
    'Reward credit used',
    format('Used 1 reward credit for member %s.', redemption_row.profile_id)
  );

  profile_id := redemption_row.profile_id;
  return next;
end;
$$;
