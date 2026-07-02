create or replace function public.lookup_user_by_email(p_email text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  matched_user_id uuid;
begin
  if auth.jwt() ->> 'role' <> 'platform-admin' then
    raise exception 'forbidden';
  end if;

  select u.id
    into matched_user_id
  from auth.users u
  where u.email = lower(trim(p_email))
  limit 1;

  return matched_user_id;
end;
$$;

revoke all on function public.lookup_user_by_email(text) from public;
grant execute on function public.lookup_user_by_email(text) to authenticated;
