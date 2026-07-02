alter table public.profiles
  add column if not exists verification_id_number text,
  add column if not exists verification_document_path text,
  add column if not exists verification_document_filename text,
  add column if not exists verification_submitted_at timestamptz,
  add column if not exists verification_status text not null default 'not_submitted';

alter table public.profiles
  drop constraint if exists profiles_verification_status_check;

alter table public.profiles
  add constraint profiles_verification_status_check
  check (verification_status in ('not_submitted', 'pending_document', 'submitted', 'verified', 'rejected'));

create unique index if not exists idx_profiles_verification_id_number_unique
  on public.profiles (lower(regexp_replace(verification_id_number, '[^a-zA-Z0-9]', '', 'g')))
  where nullif(regexp_replace(verification_id_number, '[^a-zA-Z0-9]', '', 'g'), '') is not null;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'member-verification-ids',
  'member-verification-ids',
  false,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Members can upload own verification IDs" on storage.objects;
create policy "Members can upload own verification IDs"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'member-verification-ids'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Onboarding can upload pending verification IDs" on storage.objects;
create policy "Onboarding can upload pending verification IDs"
  on storage.objects for insert
  to anon, authenticated
  with check (
    bucket_id = 'member-verification-ids'
    and (storage.foldername(name))[1] = 'pending'
  );

drop policy if exists "Members can view own verification IDs" on storage.objects;
create policy "Members can view own verification IDs"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'member-verification-ids'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Platform admins can view member verification IDs" on storage.objects;
create policy "Platform admins can view member verification IDs"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'member-verification-ids'
    and public.is_platform_admin()
  );

create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_role public.user_role;
  new_business_id uuid;
  new_verification_id text;
  new_verification_document_path text;
  new_verification_document_filename text;
begin
  new_role := coalesce(
    (new.raw_app_meta_data ->> 'role')::public.user_role,
    'customer'
  );

  new_business_id := (
    new.raw_app_meta_data ->> 'business_id'
  )::uuid;

  new_verification_id := nullif(trim(coalesce(new.raw_user_meta_data ->> 'verification_id_number', '')), '');
  new_verification_document_path := nullif(trim(coalesce(new.raw_user_meta_data ->> 'verification_document_path', '')), '');
  new_verification_document_filename := nullif(trim(coalesce(new.raw_user_meta_data ->> 'verification_document_filename', '')), '');

  if new_verification_document_path is not null
    and new_verification_document_path !~ '^pending/[a-zA-Z0-9-]+\.[a-z0-9]+$'
  then
    raise exception 'Invalid verification document path.';
  end if;

  insert into public.profiles (
    id,
    full_name,
    email,
    role,
    business_id,
    referral_code,
    verification_id_number,
    verification_document_path,
    verification_document_filename,
    verification_submitted_at,
    verification_status
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    new.email,
    new_role,
    new_business_id,
    public.generate_referral_code(),
    new_verification_id,
    new_verification_document_path,
    new_verification_document_filename,
    case when new_verification_document_path is null then null else now() end,
    case
      when new_verification_id is not null and new_verification_document_path is null then 'pending_document'
      when new_verification_document_path is not null then 'submitted'
      else 'not_submitted'
    end
  );

  insert into public.reward_balances (profile_id, points, next_reward_points, available_credits)
  values (new.id, 0, 300, 0);

  return new;
end;
$$ language plpgsql security definer;
