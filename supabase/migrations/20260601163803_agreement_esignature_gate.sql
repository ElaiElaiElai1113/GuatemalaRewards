create extension if not exists pgcrypto;

create schema if not exists private;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'agreement_kind') then
    create type public.agreement_kind as enum (
      'member',
      'business_affiliate',
      'trade_deal'
    );
  end if;
end $$;

create table if not exists public.agreement_versions (
  id uuid primary key default gen_random_uuid(),
  kind public.agreement_kind not null,
  required_role public.user_role,
  version integer not null check (version > 0),
  title text not null,
  body text not null,
  content_hash text not null,
  is_active boolean not null default false,
  effective_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (kind, version)
);

create table if not exists public.agreement_acceptances (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete set null,
  agreement_version_id uuid not null references public.agreement_versions(id) on delete restrict,
  agreement_kind public.agreement_kind not null,
  agreement_version integer not null check (agreement_version > 0),
  content_hash text not null,
  typed_signature text not null check (length(trim(typed_signature)) >= 2),
  accepted_electronic_records boolean not null,
  accepted_terms boolean not null,
  signer_ip inet,
  signer_user_agent text,
  signed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (profile_id, agreement_version_id)
);

create unique index if not exists idx_active_required_agreement_versions
  on public.agreement_versions(kind, required_role)
  where is_active and required_role is not null;

create unique index if not exists idx_active_optional_agreement_versions
  on public.agreement_versions(kind)
  where is_active and required_role is null;

create index if not exists idx_agreement_acceptances_profile_id
  on public.agreement_acceptances(profile_id);

create index if not exists idx_agreement_acceptances_business_id
  on public.agreement_acceptances(business_id);

drop trigger if exists set_updated_at on public.agreement_versions;
create trigger set_updated_at
  before update on public.agreement_versions
  for each row execute function public.handle_updated_at();

alter table public.agreement_versions enable row level security;
alter table public.agreement_acceptances enable row level security;

drop policy if exists "Users can view active agreement versions" on public.agreement_versions;
create policy "Users can view active agreement versions"
  on public.agreement_versions for select
  to authenticated
  using (is_active or public.is_platform_admin());

drop policy if exists "Platform admins can manage agreement versions" on public.agreement_versions;
create policy "Platform admins can manage agreement versions"
  on public.agreement_versions for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

drop policy if exists "Users can view own agreement acceptances" on public.agreement_acceptances;
create policy "Users can view own agreement acceptances"
  on public.agreement_acceptances for select
  to authenticated
  using (profile_id = auth.uid());

drop policy if exists "Platform admins can view all agreement acceptances" on public.agreement_acceptances;
create policy "Platform admins can view all agreement acceptances"
  on public.agreement_acceptances for select
  to authenticated
  using (public.is_platform_admin());

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
    );

  return missing_required_count = 0;
end;
$$;

create or replace function private.can_use_platform()
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select public.is_platform_admin() or private.has_required_agreements(auth.uid())
$$;

grant usage on schema private to authenticated;
grant execute on function private.has_required_agreements(uuid) to authenticated;
grant execute on function private.can_use_platform() to authenticated;

create or replace function public.is_business_owner()
returns boolean
language sql
stable
as $$
  select public.jwt_role() in ('business-owner', 'business-staff')
    and private.has_required_agreements(auth.uid())
$$;

create or replace function public.has_staff_access()
returns boolean
language sql
stable
as $$
  select public.is_platform_admin()
    or (
      public.jwt_role() in ('business-owner', 'business-staff')
      and private.has_required_agreements(auth.uid())
    )
$$;

update public.agreement_versions
set is_active = false
where kind = 'member'
  and required_role = 'customer';

with member_agreement as (
  select
    'member'::public.agreement_kind as kind,
    'customer'::public.user_role as required_role,
    1 as version,
    'Member Agreement' as title,
    $agreement$
MEMBER AGREEMENT
Guatemala Rewards Platform
Terms and Conditions of Membership

1. Membership Benefits
As a registered Guatemala Rewards member, you may earn rewards by spending at listed partner or affiliate businesses, redeem earned rewards at listed partner or affiliate businesses, receive referral bonuses when available, access member offers and promotions, and retain earned rewards while your account remains active and in good standing.

Earn rates, referral bonuses, and membership fees may vary by campaign, business, or membership type. Current rates are shown inside the platform or communicated by Guatemala Rewards before they apply.

2. Member Obligations and Conduct
By registering, you agree to treat partner and affiliate businesses, their staff, and other members with respect; keep your account information accurate; avoid unlawful, fraudulent, deceptive, or abusive activity; and follow current platform rules as updated with notice.

You may not resell, exchange, transfer, pool, or trade rewards with another person or entity. Rewards have no cash value and cannot be exchanged for money.

3. Account Rules
Only one account is permitted per person. Accounts are non-transferable. Duplicate accounts, fake referrals, self-referrals, false identity, or other abuse may result in suspension, cancellation, forfeiture of rewards, and permanent removal from the platform.

Guatemala Rewards may request additional identity verification before enabling selected benefits, promotions, payouts, or high-risk activity. V1 membership access does not require document upload inside the app.

4. Third Party Disclaimer
Guatemala Rewards is a third-party rewards platform. We are not responsible for the operations, products, services, quality, pricing, or conduct of partner or affiliate businesses. Members engage with partner businesses directly and at their own discretion. Disputes about a partner business transaction must be resolved directly with that business.

5. Guatemala Rewards Rights
Guatemala Rewards may suspend or cancel accounts that violate these terms; adjust earn rates, redemption rates, referral bonuses, or fees with reasonable notice; update these terms with notice of material changes; add or remove partner businesses; and request additional verification when needed.

6. Account Termination
Members may close their account by written request. On termination, unused rewards are forfeited and cannot be redeemed after account closure. Guatemala Rewards may terminate an account immediately for breach of these terms, without refund where permitted by law.

7. Privacy and Confidentiality
Member personal data is handled according to the Guatemala Rewards privacy policy and applicable law. Confidential platform information, rewards balances, and member account details may not be misused or disclosed except as required for platform operation or legal compliance.

8. Electronic Signature
By signing electronically, you confirm that you have read, understood, and agree to this Member Agreement; the information you provide is accurate; you are registering for your own personal use; and you understand that violations may result in account cancellation.
$agreement$ as body
)
insert into public.agreement_versions (
  kind,
  required_role,
  version,
  title,
  body,
  content_hash,
  is_active,
  effective_at
)
select
  kind,
  required_role,
  version,
  title,
  body,
  encode(extensions.digest(body, 'sha256'), 'hex'),
  true,
  '2026-06-01 00:00:00+00'::timestamptz
from member_agreement
on conflict (kind, version) do update
set required_role = excluded.required_role,
    title = excluded.title,
    body = excluded.body,
    content_hash = excluded.content_hash,
    is_active = excluded.is_active,
    effective_at = excluded.effective_at,
    updated_at = now();

update public.agreement_versions
set is_active = false
where kind = 'business_affiliate'
  and required_role = 'business-owner';

with affiliate_agreement as (
  select
    'business_affiliate'::public.agreement_kind as kind,
    'business-owner'::public.user_role as required_role,
    1 as version,
    'Business Affiliate Agreement' as title,
    $agreement$
BUSINESS AFFILIATE AGREEMENT
Guatemala Rewards Platform
Partner Business Onboarding Agreement

1. Purpose
This agreement governs the terms under which a participating business joins Guatemala Rewards as a rewards partner. By joining, the business agrees to accept Guatemala Rewards credits, vouchers, and gift cards from verified platform members in exchange for visibility, member traffic, reporting tools, and access to the platform member base.

2. Affiliate Benefits
The affiliate may receive an active listing on the platform, member traffic directed to the business, marketing exposure within the member network, a business account and dashboard, and transaction reporting for reconciliation. Account setup and activation are managed by Guatemala Rewards.

3. Commercial Terms
Commission type, commission rate, payment schedule, and reporting method are agreed separately in the business account records or written commercial schedule. The affiliate must provide accurate and timely transaction records for commission calculation and reconciliation.

4. Affiliate Obligations
The affiliate agrees to accept Guatemala Rewards credits, vouchers, and gift cards from verified registered platform members at full face value; apply no expiry date unless separately agreed in writing; apply no minimum spend, blackout dates, or exclusions unless agreed in writing; provide the same standard of service and product quality as for regular paying customers; treat members professionally and respectfully; and notify Guatemala Rewards with at least 30 days' notice of closure, sale, change of ownership, or rebrand.

5. Competing Programs
The affiliate will not actively promote competing rewards programs to Guatemala Rewards members on the affiliate premises or through platform-specific member interactions, unless Guatemala Rewards agrees in writing.

6. Third Party Disclaimer
Guatemala Rewards acts solely as a third-party rewards platform intermediary. Guatemala Rewards is not responsible for the affiliate's business operations, products, services, quality, pricing, or disputes between the affiliate and customers, including Guatemala Rewards members.

7. Account Activation and E-Signature
Before account access and platform activity are enabled, the affiliate must complete this agreement by e-signature through the platform. E-signatures are binding and are stored securely in the Guatemala Rewards system with the agreement version and timestamp.

8. Exit and Termination
Either party may terminate this agreement with 30 days' written notice. Rewards already earned by members through the affiliate remain valid and must continue to be honored through and after the termination period. The affiliate may not claw back, cancel, or invalidate credits already earned by members before termination. Outstanding commission amounts must be settled according to the agreed payment schedule.

9. General Terms
This agreement supersedes prior discussions about affiliate platform participation. Both parties agree to keep confidential commercial terms confidential. Guatemala Rewards is not liable for the affiliate's products, services, operations, or customer disputes except where required by law.

10. Electronic Signature
By signing electronically, the signer confirms that they are authorized to bind the affiliate business and that the affiliate has read, understood, and agreed to this Business Affiliate Agreement.
$agreement$ as body
)
insert into public.agreement_versions (
  kind,
  required_role,
  version,
  title,
  body,
  content_hash,
  is_active,
  effective_at
)
select
  kind,
  required_role,
  version,
  title,
  body,
  encode(extensions.digest(body, 'sha256'), 'hex'),
  true,
  '2026-06-01 00:00:00+00'::timestamptz
from affiliate_agreement
on conflict (kind, version) do update
set required_role = excluded.required_role,
    title = excluded.title,
    body = excluded.body,
    content_hash = excluded.content_hash,
    is_active = excluded.is_active,
    effective_at = excluded.effective_at,
    updated_at = now();

update public.agreement_versions
set is_active = false
where kind = 'trade_deal'
  and required_role is null;

with trade_deal_agreement as (
  select
    'trade_deal'::public.agreement_kind as kind,
    null::public.user_role as required_role,
    1 as version,
    'Trade Deal Agreement' as title,
    $agreement$
TRADE DEAL AGREEMENT
Guatemala Rewards Platform
Direct Service-for-Credit Exchange

1. Purpose
This agreement covers a direct trade arrangement where Guatemala Rewards provides professional services to a business in exchange for store credit, gift cards, or service vouchers that may be distributed to registered Guatemala Rewards members as rewards. No cash changes hands unless a separate written schedule says otherwise.

2. Services and Trade Credit
The services provided by Guatemala Rewards, total service value, maintenance fee if any, delivery dates, deliverables, total trade credit value, form of credit, monthly credit if any, and issuance schedule must be documented in a separate written schedule or admin-assigned deal record before signing.

3. Business Obligations
The business agrees to honor issued credits, gift cards, and service vouchers from verified registered platform members at full face value; apply no expiry date, hidden restrictions, blackout periods, minimum spend requirements, or exclusions unless agreed in writing; provide the same quality and availability offered to regular paying customers; notify Guatemala Rewards with at least 30 days' notice of closure, sale, rebrand, or material change; and not issue cash refunds for credits redeemed.

4. Guatemala Rewards Obligations
Guatemala Rewards agrees to deliver agreed services according to the written scope and timeline, distribute issued credits only through the platform membership program, avoid resale or transfer outside the membership program, and maintain confidentiality of business information and agreement terms.

5. Third Party Disclaimer
Guatemala Rewards acts solely as a third-party rewards platform. Guatemala Rewards is not responsible for the business operations, products, services, quality, or conduct of the business or other partner businesses.

6. Dispute Resolution and Exit
The business must raise written disputes within 14 days of delivery of the relevant service. Guatemala Rewards will make reasonable efforts to remedy the issue within 14 days after receiving written notice. Either party may exit with 30 days' written notice. Credits already issued to and earned by members remain valid and must continue to be honored.

7. Electronic Signature
By signing electronically, both parties confirm they have read and agree to this Trade Deal Agreement and any separate written schedule attached to the trade arrangement.
$agreement$ as body
)
insert into public.agreement_versions (
  kind,
  required_role,
  version,
  title,
  body,
  content_hash,
  is_active,
  effective_at
)
select
  kind,
  required_role,
  version,
  title,
  body,
  encode(extensions.digest(body, 'sha256'), 'hex'),
  true,
  '2026-06-01 00:00:00+00'::timestamptz
from trade_deal_agreement
on conflict (kind, version) do update
set required_role = excluded.required_role,
    title = excluded.title,
    body = excluded.body,
    content_hash = excluded.content_hash,
    is_active = excluded.is_active,
    effective_at = excluded.effective_at,
    updated_at = now();

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id and private.has_required_agreements(auth.uid()))
  with check (auth.uid() = id and private.has_required_agreements(auth.uid()));

drop policy if exists "Users can view own balance" on public.reward_balances;
create policy "Users can view own balance"
  on public.reward_balances for select
  to authenticated
  using (auth.uid() = profile_id and private.has_required_agreements(auth.uid()));

drop policy if exists "System can insert balances" on public.reward_balances;
create policy "System can insert balances"
  on public.reward_balances for insert
  to authenticated
  with check (auth.uid() = profile_id and private.has_required_agreements(auth.uid()));

drop policy if exists "Users can view own orders" on public.orders;
create policy "Users can view own orders"
  on public.orders for select
  to authenticated
  using (auth.uid() = profile_id and private.has_required_agreements(auth.uid()));

drop policy if exists "Users can create orders" on public.orders;
create policy "Users can create orders"
  on public.orders for insert
  to authenticated
  with check (auth.uid() = profile_id and private.has_required_agreements(auth.uid()));

drop policy if exists "Create line items via orders" on public.order_line_items;
create policy "Create line items via orders"
  on public.order_line_items for insert
  to authenticated
  with check (
    private.has_required_agreements(auth.uid())
    and exists (
      select 1
      from public.orders o
      where o.id = public.order_line_items.order_id
        and o.profile_id = auth.uid()
    )
  );

drop policy if exists "Users can view own activities" on public.activities;
create policy "Users can view own activities"
  on public.activities for select
  to authenticated
  using (auth.uid() = profile_id and private.has_required_agreements(auth.uid()));

drop policy if exists "System can insert activities" on public.activities;
create policy "System can insert activities"
  on public.activities for insert
  to authenticated
  with check (private.can_use_platform());

drop policy if exists "Users can view own redemptions" on public.redemptions;
create policy "Users can view own redemptions"
  on public.redemptions for select
  to authenticated
  using (auth.uid() = profile_id and private.has_required_agreements(auth.uid()));

drop policy if exists "Users can create redemptions" on public.redemptions;
create policy "Users can create redemptions"
  on public.redemptions for insert
  to authenticated
  with check (auth.uid() = profile_id and private.has_required_agreements(auth.uid()));

drop policy if exists "System can insert logs" on public.admin_logs;
create policy "System can insert logs"
  on public.admin_logs for insert
  to authenticated
  with check (private.can_use_platform());
