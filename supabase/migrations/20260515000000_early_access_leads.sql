create table if not exists public.early_access_leads (
  id uuid primary key default gen_random_uuid(),
  full_name text,
  email text,
  whatsapp text,
  notes text not null default '',
  source text not null default 'early-access-page',
  status text not null default 'new' check (status in ('new', 'contacted', 'invited', 'archived')),
  marketing_consent_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    nullif(trim(coalesce(email, '')), '') is not null
    or nullif(trim(coalesce(whatsapp, '')), '') is not null
  )
);

create index if not exists idx_early_access_leads_status_created_at
  on public.early_access_leads (status, created_at desc);

create unique index if not exists idx_early_access_leads_email_unique
  on public.early_access_leads (lower(email))
  where email is not null;

create unique index if not exists idx_early_access_leads_whatsapp_unique
  on public.early_access_leads (whatsapp)
  where whatsapp is not null;

drop trigger if exists set_early_access_leads_updated_at on public.early_access_leads;
create trigger set_early_access_leads_updated_at
  before update on public.early_access_leads
  for each row execute function public.handle_updated_at();

alter table public.early_access_leads enable row level security;

create or replace function public.jwt_role()
returns text
language sql
stable
as $$
  select coalesce(
    auth.jwt() -> 'app_metadata' ->> 'role',
    auth.jwt() ->> 'role',
    ''
  )
$$;

drop policy if exists "Platform admins can view early access leads" on public.early_access_leads;
create policy "Platform admins can view early access leads"
  on public.early_access_leads for select
  using (public.jwt_role() = 'platform-admin');

drop policy if exists "Platform admins can update early access leads" on public.early_access_leads;
create policy "Platform admins can update early access leads"
  on public.early_access_leads for update
  using (public.jwt_role() = 'platform-admin')
  with check (public.jwt_role() = 'platform-admin');

grant select, update on public.early_access_leads to authenticated;

create or replace function public.create_early_access_lead(
  p_full_name text,
  p_email text,
  p_whatsapp text,
  p_notes text,
  p_marketing_consent boolean default false,
  p_source text default 'early-access-page'
)
returns public.early_access_leads
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_lead public.early_access_leads%rowtype;
  clean_email text := nullif(lower(trim(coalesce(p_email, ''))), '');
  clean_whatsapp text := nullif(trim(coalesce(p_whatsapp, '')), '');
begin
  if clean_email is null and clean_whatsapp is null then
    raise exception 'Add an email or WhatsApp number.';
  end if;

  if clean_email is not null and clean_email !~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$' then
    raise exception 'A valid email is required.';
  end if;

  if p_marketing_consent is not true then
    raise exception 'Contact consent is required.';
  end if;

  insert into public.early_access_leads (
    full_name,
    email,
    whatsapp,
    notes,
    source,
    marketing_consent_at
  )
  values (
    nullif(trim(coalesce(p_full_name, '')), ''),
    clean_email,
    clean_whatsapp,
    trim(coalesce(p_notes, '')),
    coalesce(nullif(trim(p_source), ''), 'early-access-page'),
    now()
  )
  on conflict do nothing
  returning *
    into inserted_lead;

  if inserted_lead.id is null then
    select *
    into inserted_lead
    from public.early_access_leads
    where (clean_email is not null and lower(email) = clean_email)
      or (clean_whatsapp is not null and whatsapp = clean_whatsapp)
    order by created_at desc
    limit 1;
  end if;

  return inserted_lead;
end;
$$;

revoke all on function public.create_early_access_lead(text, text, text, text, boolean, text) from public;
grant execute on function public.create_early_access_lead(text, text, text, text, boolean, text) to anon, authenticated;
