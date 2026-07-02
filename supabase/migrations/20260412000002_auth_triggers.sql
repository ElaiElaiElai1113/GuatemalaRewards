-- ============================================================
-- Auth Triggers - Auto-create profile & balance on signup
-- ============================================================

-- Store role in app_metadata (safe for auth decisions)
-- user_metadata is user-editable and NOT safe for authorization

create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_role public.user_role;
  new_business_id uuid;
begin
  -- Determine role from app_metadata (set during signup by admin or invite)
  new_role := coalesce(
    (new.raw_app_meta_data ->> 'role')::public.user_role,
    'customer'
  );

  new_business_id := (
    new.raw_app_meta_data ->> 'business_id'
  )::uuid;

  -- Create profile
  insert into public.profiles (id, full_name, email, role, business_id, referral_code)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    new.email,
    new_role,
    new_business_id,
    public.generate_referral_code()
  );

  -- Create reward balance for all new users
  insert into public.reward_balances (profile_id, points, next_reward_points, available_credits)
  values (new.id, 0, 300, 0);

  return new;
end;
$$ language plpgsql security definer;

-- Trigger on auth.users creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Helper: Set user role (call from secure context) ────────

create or replace function public.set_user_role(
  target_user_id uuid,
  new_role public.user_role,
  new_business_id uuid default null
)
returns void as $$
begin
  -- Only platform admins can set roles
  assert exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'platform-admin'
  ), 'Permission denied: only platform admins can set user roles';

  -- Update profile
  update public.profiles
  set role = new_role,
      business_id = new_business_id
  where id = target_user_id;

  -- Update app_metadata so JWT claims reflect the new role
  update auth.users
  set raw_app_meta_data = jsonb_set(
    coalesce(raw_app_meta_data, '{}'::jsonb),
    '{role}',
    to_jsonb(new_role)
  )
  where id = target_user_id;

  -- If business_id provided, set it in app_metadata too
  if new_business_id is not null then
    update auth.users
    set raw_app_meta_data = jsonb_set(
      coalesce(raw_app_meta_data, '{}'::jsonb),
      '{business_id}',
      to_jsonb(new_business_id)
    )
    where id = target_user_id;
  end if;
end;
$$ language plpgsql security definer;

-- ─── Helper: Adjust points (for admin point adjustments) ────

create or replace function public.adjust_points(
  target_profile_id uuid,
  delta integer,
  reason text
)
returns void as $$
declare
  actor_name text;
begin
  -- Get actor name
  select full_name into actor_name
  from public.profiles where id = auth.uid();

  -- Only admins and business owners can adjust points
  assert exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('platform-admin', 'business-owner')
  ), 'Permission denied';

  -- Update balance
  update public.reward_balances
  set points = greatest(0, points + delta)
  where profile_id = target_profile_id;

  -- Log activity
  insert into public.activities (profile_id, type, title, description, points, status)
  values (
    target_profile_id,
    'adjustment',
    case when delta >= 0 then 'Points added by staff' else 'Points deducted by staff' end,
    reason,
    delta,
    'posted'
  );

  -- Log admin action
  insert into public.admin_logs (actor_name, action, details)
  values (
    actor_name,
    'Manual reward adjustment',
    format('%s %s points. Reason: %s', case when delta >= 0 then 'Added' else 'Deducted' end, abs(delta), reason)
  );
end;
$$ language plpgsql security definer;
