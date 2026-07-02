alter type public.agreement_kind add value if not exists 'business_custom';

drop index if exists idx_active_required_business_agreement_versions;

create index if not exists idx_active_required_business_agreement_versions
  on public.agreement_versions(kind, required_role, business_id, version)
  where is_active and required_role is not null and business_id is not null;
