create or replace function public.admin_delete_customer(p_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  actor_profile public.profiles%rowtype;
  target_profile public.profiles%rowtype;
begin
  if actor_id is null then
    raise exception 'Permission denied';
  end if;

  select *
    into actor_profile
  from public.profiles
  where id = actor_id;

  if not found or actor_profile.role <> 'platform-admin' then
    raise exception 'Permission denied';
  end if;

  select *
    into target_profile
  from public.profiles
  where id = p_profile_id
  for update;

  if not found then
    raise exception 'Customer not found.';
  end if;

  if target_profile.id = actor_id then
    raise exception 'Admins cannot remove their own account.';
  end if;

  if target_profile.role <> 'customer' then
    raise exception 'Only customer accounts can be removed from this admin action.';
  end if;

  insert into public.admin_logs (actor_id, actor_name, action, details)
  values (
    actor_id,
    actor_profile.full_name,
    'customer_removed',
    jsonb_build_object(
      'removedProfileId', target_profile.id,
      'removedEmail', target_profile.email,
      'removedFullName', target_profile.full_name
    )::text
  );

  delete from auth.users
  where id = target_profile.id;
end;
$$;

revoke all on function public.admin_delete_customer(uuid) from public;
grant execute on function public.admin_delete_customer(uuid) to authenticated;

notify pgrst, 'reload schema';
