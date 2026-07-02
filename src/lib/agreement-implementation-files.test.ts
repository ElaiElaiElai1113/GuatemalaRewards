import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

function readProjectFile(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8')
}

function readProjectFilesInDirectory(path: string) {
  return readdirSync(join(process.cwd(), path))
    .sort()
    .map((file) => readProjectFile(`${path}/${file}`))
    .join('\n')
}

describe('agreement Supabase implementation files', () => {
  const migration = readProjectFile('supabase/migrations/20260601163803_agreement_esignature_gate.sql')
  const allMigrations = readProjectFilesInDirectory('supabase/migrations')

  it('creates versioned agreement and acceptance tables with RLS', () => {
    expect(migration).toContain('create table if not exists public.agreement_versions')
    expect(migration).toContain('create table if not exists public.agreement_acceptances')
    expect(migration).toContain('alter table public.agreement_versions enable row level security')
    expect(migration).toContain('alter table public.agreement_acceptances enable row level security')
    expect(migration).toContain('unique (profile_id, agreement_version_id)')
  })

  it('seeds member and business affiliate agreements as required active versions', () => {
    expect(migration).toContain("'member'::public.agreement_kind")
    expect(migration).toContain("'customer'::public.user_role")
    expect(migration).toContain("'business_affiliate'::public.agreement_kind")
    expect(migration).toContain("'business-owner'::public.user_role")
    expect(migration).toContain("'trade_deal'::public.agreement_kind")
    expect(migration).toContain('null::public.user_role as required_role')
  })

  it('adds database agreement gate helpers and protects customer actions', () => {
    expect(migration).toContain('create or replace function private.has_required_agreements')
    expect(migration).toContain('create or replace function private.can_use_platform')
    expect(migration).toContain('private.has_required_agreements(auth.uid())')
    expect(migration).toContain('create policy "Users can create orders"')
    expect(migration).toContain('create policy "Users can create redemptions"')
    expect(migration).toContain('create policy "Users can update own profile"')
  })

  it('requires stored drawn signatures for completed agreement access', () => {
    expect(allMigrations).toContain('signature_svg')
    expect(allMigrations).toContain('aa.signature_svg is not null')
    expect(allMigrations).toContain('length(aa.signature_svg) >= 80')
  })
})

describe('agreement Edge Functions', () => {
  const signAgreementFunction = readProjectFile('supabase/functions/sign-agreement/index.ts')
  const registerCustomerFunction = readProjectFile('supabase/functions/register-customer/index.ts')

  it('sign-agreement verifies the caller and stores audit metadata', () => {
    expect(signAgreementFunction).toContain('admin.auth.getUser(token)')
    expect(signAgreementFunction).toContain(".eq('is_active', true)")
    expect(signAgreementFunction).toContain('agreement.required_role !== profile.role')
    expect(signAgreementFunction).toContain(".from('agreement_acceptances')")
    expect(signAgreementFunction).toContain('signer_ip')
    expect(signAgreementFunction).toContain('signer_user_agent')
  })

  it('sign-agreement requires and stores a sanitized drawn signature', () => {
    expect(signAgreementFunction).toContain('signatureSvg')
    expect(signAgreementFunction).toContain('signature_svg')
    expect(signAgreementFunction).toContain('Drawn signature is required.')
    expect(signAgreementFunction).toContain('sanitizeSignatureSvg')
  })

  it('register-customer uses server-side invite flow and checks staff agreements', () => {
    expect(registerCustomerFunction).toContain('hasRequiredAgreements')
    expect(registerCustomerFunction).toContain('inviteUserByEmail')
    expect(registerCustomerFunction).toContain('updateUserById')
    expect(registerCustomerFunction).toContain('registered_by_business_id')
  })
})

describe('agreement admin reporting', () => {
  const adminService = readProjectFile('src/integrations/supabase/services/admin-service.ts')
  const adminHook = readProjectFile('src/hooks/use-admin-data.ts')
  const adminPage = readProjectFile('src/features/admin/pages/admin-page.tsx')

  it('loads agreement status records for the admin portal', () => {
    expect(adminService).toContain('getAgreementStatuses')
    expect(adminService).toContain('signature_svg')
    expect(adminHook).toContain('useAdminAgreementStatuses')
  })

  it('adds a signed agreements panel to the admin page', () => {
    expect(adminPage).toContain('AgreementStatusPanel')
    expect(adminPage).toContain('value="agreements"')
  })
})
