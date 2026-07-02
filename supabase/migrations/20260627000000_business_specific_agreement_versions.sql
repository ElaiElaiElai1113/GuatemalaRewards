alter table public.agreement_versions
  add column if not exists business_id uuid references public.businesses(id) on delete cascade;

alter table public.agreement_versions
  drop constraint if exists agreement_versions_kind_version_key;

drop index if exists idx_active_required_agreement_versions;
drop index if exists idx_active_optional_agreement_versions;

create unique index if not exists idx_agreement_versions_global_kind_version
  on public.agreement_versions(kind, version)
  where business_id is null;

create unique index if not exists idx_agreement_versions_business_kind_version
  on public.agreement_versions(kind, business_id, version)
  where business_id is not null;

create unique index if not exists idx_active_required_global_agreement_versions
  on public.agreement_versions(kind, required_role)
  where is_active and required_role is not null and business_id is null;

create unique index if not exists idx_active_required_business_agreement_versions
  on public.agreement_versions(kind, required_role, business_id)
  where is_active and required_role is not null and business_id is not null;

create unique index if not exists idx_active_optional_global_agreement_versions
  on public.agreement_versions(kind)
  where is_active and required_role is null and business_id is null;

create index if not exists idx_agreement_versions_business_id
  on public.agreement_versions(business_id);

drop policy if exists "Users can view active agreement versions" on public.agreement_versions;
create policy "Users can view active agreement versions"
  on public.agreement_versions for select
  to authenticated
  using (
    public.is_platform_admin()
    or (
      is_active
      and (
        business_id is null
        or exists (
          select 1
          from public.profiles p
          where p.id = auth.uid()
            and p.business_id = agreement_versions.business_id
        )
      )
    )
  );

create or replace function private.has_required_agreements(target_profile_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public, private
as $$
declare
  target_role public.user_role;
  target_business_id uuid;
  missing_required_count integer;
begin
  if target_profile_id is null then
    return false;
  end if;

  select p.role, p.business_id
    into target_role, target_business_id
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
    and (
      av.business_id is null
      or av.business_id = target_business_id
    )
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
