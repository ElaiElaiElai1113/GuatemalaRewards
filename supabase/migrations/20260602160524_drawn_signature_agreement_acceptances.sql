alter table public.agreement_acceptances
  add column if not exists signature_svg text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'agreement_acceptances_signature_svg_length'
  ) then
    alter table public.agreement_acceptances
      add constraint agreement_acceptances_signature_svg_length
      check (signature_svg is null or length(signature_svg) between 80 and 50000);
  end if;
end $$;

create or replace function private.has_required_agreements(target_profile_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public, private
as $$
declare
  target_role public.user_role;
  missing_required_count integer;
begin
  if target_profile_id is null then
    return false;
  end if;

  select p.role
    into target_role
  from public.profiles p
  where p.id = target_profile_id;

  if target_role is null then
    return false;
  end if;

  if target_role = 'platform-admin' then
    return true;
  end if;

  select count(*)
    into missing_required_count
  from public.agreement_versions av
  where av.is_active
    and av.required_role = target_role
    and not exists (
      select 1
      from public.agreement_acceptances aa
      where aa.profile_id = target_profile_id
        and aa.agreement_version_id = av.id
        and aa.agreement_kind = av.kind
        and aa.agreement_version = av.version
        and aa.content_hash = av.content_hash
        and aa.accepted_electronic_records
        and aa.accepted_terms
        and aa.signature_svg is not null
        and length(aa.signature_svg) >= 80
    );

  return missing_required_count = 0;
end;
$$;
