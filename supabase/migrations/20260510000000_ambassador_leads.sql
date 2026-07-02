create table if not exists public.ambassador_leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  city text not null,
  social_links jsonb not null default '{}'::jsonb,
  notes text not null default '',
  business_id uuid references public.businesses(id) on delete set null,
  source text not null default 'ambassador-page',
  status text not null default 'new' check (status in ('new', 'contacted', 'converted', 'archived')),
  marketing_consent_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ambassador_leads_status_created_at
  on public.ambassador_leads (status, created_at desc);

create index if not exists idx_ambassador_leads_business_id
  on public.ambassador_leads (business_id, created_at desc);

drop trigger if exists set_ambassador_leads_updated_at on public.ambassador_leads;
create trigger set_ambassador_leads_updated_at
  before update on public.ambassador_leads
  for each row execute function public.handle_updated_at();

alter table public.ambassador_leads enable row level security;

drop policy if exists "Platform admins can view ambassador leads" on public.ambassador_leads;
create policy "Platform admins can view ambassador leads"
  on public.ambassador_leads for select
  using (public.jwt_role() = 'platform-admin');

drop policy if exists "Business team can view own ambassador leads" on public.ambassador_leads;
create policy "Business team can view own ambassador leads"
  on public.ambassador_leads for select
  using (
    public.has_business_access()
    and business_id = public.current_business_id()
  );

drop policy if exists "Platform admins can update ambassador leads" on public.ambassador_leads;
create policy "Platform admins can update ambassador leads"
  on public.ambassador_leads for update
  using (public.jwt_role() = 'platform-admin')
  with check (public.jwt_role() = 'platform-admin');

drop policy if exists "Business team can update own ambassador leads" on public.ambassador_leads;
create policy "Business team can update own ambassador leads"
  on public.ambassador_leads for update
  using (
    public.has_business_access()
    and business_id = public.current_business_id()
  )
  with check (
    public.has_business_access()
    and business_id = public.current_business_id()
  );

grant select, update on public.ambassador_leads to authenticated;

create or replace function public.create_ambassador_lead(
  p_full_name text,
  p_email text,
  p_phone text,
  p_city text,
  p_social_links jsonb,
  p_notes text,
  p_business_id uuid default null,
  p_marketing_consent boolean default false,
  p_source text default 'ambassador-page'
)
returns public.ambassador_leads
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_lead public.ambassador_leads%rowtype;
  has_social_link boolean;
begin
  if nullif(trim(coalesce(p_full_name, '')), '') is null then
    raise exception 'Full name is required.';
  end if;

  if nullif(trim(coalesce(p_email, '')), '') is null
    or trim(p_email) !~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$' then
    raise exception 'A valid email is required.';
  end if;

  if nullif(trim(coalesce(p_city, '')), '') is null then
    raise exception 'City or location is required.';
  end if;

  if p_marketing_consent is not true then
    raise exception 'Contact consent is required.';
  end if;

  if p_business_id is not null and not exists (
    select 1
    from public.businesses
    where id = p_business_id
  ) then
    raise exception 'Business not found.';
  end if;

  select exists (
    select 1
    from jsonb_each_text(coalesce(p_social_links, '{}'::jsonb)) as social(key, value)
    where nullif(trim(social.value), '') is not null
  )
    into has_social_link;

  if has_social_link is not true then
    raise exception 'At least one social link or handle is required.';
  end if;

  insert into public.ambassador_leads (
    full_name,
    email,
    phone,
    city,
    social_links,
    notes,
    business_id,
    source,
    marketing_consent_at
  )
  values (
    trim(p_full_name),
    lower(trim(p_email)),
    nullif(trim(coalesce(p_phone, '')), ''),
    trim(p_city),
    coalesce(p_social_links, '{}'::jsonb),
    trim(coalesce(p_notes, '')),
    p_business_id,
    coalesce(nullif(trim(p_source), ''), 'ambassador-page'),
    now()
  )
  returning *
    into inserted_lead;

  return inserted_lead;
end;
$$;

revoke all on function public.create_ambassador_lead(text, text, text, text, jsonb, text, uuid, boolean, text) from public;
grant execute on function public.create_ambassador_lead(text, text, text, text, jsonb, text, uuid, boolean, text) to anon, authenticated;
