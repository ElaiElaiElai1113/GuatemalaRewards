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
  referrer_business_id uuid;
  resolved_business_id uuid;
  inserted_id uuid;
begin
  if auth.uid() <> create_referral.referee_id then
    raise exception 'Permission denied';
  end if;

  select id, business_id
    into resolved_referrer_id, referrer_business_id
  from public.profiles
  where referral_code = upper(trim(create_referral.referrer_code))
  limit 1;

  if resolved_referrer_id is null and create_referral.referrer_code ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    select id, business_id
      into resolved_referrer_id, referrer_business_id
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

  if create_referral.target_business_id is not null
    and referrer_business_id is distinct from create_referral.target_business_id then
    status := 'cross-business';
    referral_id := null;
    return next;
    return;
  end if;

  resolved_business_id := coalesce(create_referral.target_business_id, referrer_business_id);

  insert into public.referrals (referrer_id, referee_id, business_id)
  values (resolved_referrer_id, create_referral.referee_id, resolved_business_id)
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
