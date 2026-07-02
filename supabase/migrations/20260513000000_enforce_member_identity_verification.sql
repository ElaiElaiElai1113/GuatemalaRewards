alter table public.profiles
  add column if not exists verification_reviewed_at timestamptz,
  add column if not exists verification_reviewed_by uuid references public.profiles(id) on delete set null,
  add column if not exists verification_rejection_reason text;

drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can update own profile" on profiles;

create or replace function public.is_member_verified(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = p_profile_id
      and (
        p.role <> 'customer'
        or p.verification_status = 'verified'
      )
  );
$$;

create or replace function public.assert_member_verified(p_profile_id uuid)
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_member_verified(p_profile_id) then
    raise exception 'identity_verification_required';
  end if;
end;
$$;

create or replace function public.update_own_profile(
  p_full_name text,
  p_phone text,
  p_location text,
  p_favorite_order text
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  updated_profile public.profiles%rowtype;
begin
  if actor_id is null then
    raise exception 'Authentication required';
  end if;

  if nullif(trim(coalesce(p_full_name, '')), '') is null then
    raise exception 'Full name is required.';
  end if;

  update public.profiles
  set full_name = trim(p_full_name),
      phone = trim(coalesce(p_phone, '')),
      location = trim(coalesce(p_location, '')),
      favorite_order = trim(coalesce(p_favorite_order, ''))
  where id = actor_id
  returning *
    into updated_profile;

  if not found then
    raise exception 'Profile not found.';
  end if;

  return updated_profile;
end;
$$;

create or replace function public.submit_member_verification(
  p_verification_id_number text,
  p_verification_document_path text,
  p_verification_document_filename text
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  actor_profile public.profiles%rowtype;
  updated_profile public.profiles%rowtype;
  normalized_id text;
  document_path text;
begin
  if actor_id is null then
    raise exception 'Authentication required';
  end if;

  select *
    into actor_profile
  from public.profiles
  where id = actor_id
  for update;

  if not found or actor_profile.role <> 'customer' then
    raise exception 'Permission denied';
  end if;

  if actor_profile.verification_status = 'verified' then
    raise exception 'This member is already verified.';
  end if;

  normalized_id := nullif(trim(coalesce(p_verification_id_number, '')), '');
  document_path := nullif(trim(coalesce(p_verification_document_path, '')), '');

  if normalized_id is null then
    raise exception 'Verification ID is required.';
  end if;

  if document_path is null then
    raise exception 'Verification document is required.';
  end if;

  if document_path !~ '^pending/[a-zA-Z0-9-]+\.[a-z0-9]+$' then
    raise exception 'Invalid verification document path.';
  end if;

  update public.profiles
  set verification_id_number = normalized_id,
      verification_document_path = document_path,
      verification_document_filename = nullif(trim(coalesce(p_verification_document_filename, '')), ''),
      verification_submitted_at = now(),
      verification_status = 'submitted',
      verification_reviewed_at = null,
      verification_reviewed_by = null,
      verification_rejection_reason = null
  where id = actor_id
  returning *
    into updated_profile;

  return updated_profile;
end;
$$;

create or replace function public.review_member_verification(
  p_profile_id uuid,
  p_status text,
  p_reason text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  target_profile public.profiles%rowtype;
  updated_profile public.profiles%rowtype;
  clean_status text := lower(trim(coalesce(p_status, '')));
  clean_reason text := nullif(trim(coalesce(p_reason, '')), '');
begin
  if actor_id is null or public.jwt_role() <> 'platform-admin' then
    raise exception 'Permission denied';
  end if;

  if clean_status not in ('verified', 'rejected') then
    raise exception 'Verification review must be verified or rejected.';
  end if;

  if clean_status = 'rejected' and clean_reason is null then
    raise exception 'A rejection reason is required.';
  end if;

  select *
    into target_profile
  from public.profiles
  where id = p_profile_id
  for update;

  if not found or target_profile.role <> 'customer' then
    raise exception 'Member not found.';
  end if;

  if clean_status = 'verified' and (
    target_profile.verification_id_number is null
    or target_profile.verification_document_path is null
  ) then
    raise exception 'Submitted ID details are required before verification.';
  end if;

  update public.profiles
  set verification_status = clean_status,
      verification_reviewed_at = now(),
      verification_reviewed_by = actor_id,
      verification_rejection_reason = case when clean_status = 'rejected' then clean_reason else null end
  where id = p_profile_id
  returning *
    into updated_profile;

  insert into public.admin_logs (actor_id, actor_name, action, details)
  values (
    actor_id,
    coalesce((select full_name from public.profiles where id = actor_id), 'Platform Admin'),
    'Member verification reviewed',
    format('Set member %s verification status to %s%s.',
      p_profile_id,
      clean_status,
      case when clean_reason is null then '' else format(' Reason: %s', clean_reason) end
    )
  );

  return updated_profile;
end;
$$;

create or replace function public.enforce_verified_profile_value_action()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_profile_id uuid;
begin
  if tg_table_name = 'memberships' then
    if new.status::text <> 'active' then
      return new;
    end if;
    target_profile_id := new.profile_id;
  elsif tg_table_name = 'orders' then
    target_profile_id := new.profile_id;
  elsif tg_table_name = 'redemptions' then
    target_profile_id := new.profile_id;
  elsif tg_table_name = 'gift_cards' then
    if tg_op = 'UPDATE' and new.status is not distinct from old.status then
      return new;
    end if;
    if new.status::text not in ('active', 'redeemed') then
      return new;
    end if;
    target_profile_id := new.customer_id;
  elsif tg_table_name = 'reward_balances' then
    if tg_op = 'INSERT' then
      if coalesce(new.points, 0) = 0 and coalesce(new.available_credits, 0) = 0 then
        return new;
      end if;
    elsif new.points is not distinct from old.points
      and new.available_credits is not distinct from old.available_credits then
      return new;
    end if;
    target_profile_id := new.profile_id;
  else
    return new;
  end if;

  perform public.assert_member_verified(target_profile_id);
  return new;
end;
$$;

drop trigger if exists enforce_memberships_verified_profile on public.memberships;
create trigger enforce_memberships_verified_profile
  before insert or update on public.memberships
  for each row execute function public.enforce_verified_profile_value_action();

drop trigger if exists enforce_orders_verified_profile on public.orders;
create trigger enforce_orders_verified_profile
  before insert on public.orders
  for each row execute function public.enforce_verified_profile_value_action();

drop trigger if exists enforce_redemptions_verified_profile on public.redemptions;
create trigger enforce_redemptions_verified_profile
  before insert on public.redemptions
  for each row execute function public.enforce_verified_profile_value_action();

drop trigger if exists enforce_reward_balances_verified_profile on public.reward_balances;
create trigger enforce_reward_balances_verified_profile
  before insert or update on public.reward_balances
  for each row execute function public.enforce_verified_profile_value_action();

drop trigger if exists enforce_gift_cards_verified_profile on public.gift_cards;
create trigger enforce_gift_cards_verified_profile
  before insert or update on public.gift_cards
  for each row execute function public.enforce_verified_profile_value_action();

drop policy if exists "Users can create own credit redemptions" on public.credit_redemptions;
create policy "Users can create own credit redemptions"
  on public.credit_redemptions for insert
  with check (
    auth.uid() = profile_id
    and public.is_member_verified(profile_id)
  );

revoke all on function public.is_member_verified(uuid) from public;
revoke all on function public.assert_member_verified(uuid) from public;
revoke all on function public.update_own_profile(text, text, text, text) from public;
revoke all on function public.submit_member_verification(text, text, text) from public;
revoke all on function public.review_member_verification(uuid, text, text) from public;

grant execute on function public.is_member_verified(uuid) to authenticated;
grant execute on function public.update_own_profile(text, text, text, text) to authenticated;
grant execute on function public.submit_member_verification(text, text, text) to authenticated;
grant execute on function public.review_member_verification(uuid, text, text) to authenticated;
