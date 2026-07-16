import { existsSync, readFileSync } from 'node:fs'

export const e2eBaseUrl = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:5275'

export const e2ePassword = process.env.E2E_PASSWORD ?? 'demo1234'

function readDotEnvValue(name: string) {
  if (!existsSync('.env')) return undefined

  const line = readFileSync('.env', 'utf8')
    .split(/\r?\n/)
    .find((entry) => entry.trim().startsWith(`${name}=`))

  return line?.split('=').slice(1).join('=').replace(/^"|"$/g, '').trim()
}

const configuredSupabaseUrl = process.env.VITE_SUPABASE_URL ?? readDotEnvValue('VITE_SUPABASE_URL') ?? ''
const usesLocalSupabase = /^(http:\/\/)?(127\.0\.0\.1|localhost)(:\d+)?/i.test(configuredSupabaseUrl)
const lifecycleAuthRequested =
  process.env.npm_lifecycle_event === 'test:e2e:workflows' ||
  process.env.npm_lifecycle_event === 'test:launch' ||
  process.env.npm_lifecycle_event === 'test:referrals' ||
  process.env.npm_lifecycle_event === 'test:onboarding' ||
  process.env.npm_lifecycle_event === 'test:gift-cards' ||
  process.env.npm_lifecycle_event === 'test:rewards' ||
  process.env.npm_lifecycle_event === 'test:agreements'
const explicitAuthEnabled = process.env.E2E_AUTH_ENABLED === 'true'

export const workflowAuthEnabled = explicitAuthEnabled || (lifecycleAuthRequested && usesLocalSupabase)

export const e2eAccounts = {
  customer: process.env.E2E_CUSTOMER_EMAIL ?? 'customer@Guatemala.test',
  unverifiedCustomer: process.env.E2E_UNVERIFIED_CUSTOMER_EMAIL ?? 'unverified@Guatemala.test',
  businessStaff: process.env.E2E_BUSINESS_STAFF_EMAIL ?? 'staff@velvetbrew.test',
  businessOwner: process.env.E2E_BUSINESS_OWNER_EMAIL ?? 'owner@velvetbrew.test',
  admin: process.env.E2E_ADMIN_EMAIL ?? 'admin@Guatemala.test',
  agreementPendingCustomer:
    process.env.E2E_AGREEMENT_PENDING_CUSTOMER_EMAIL ?? 'agreement-pending-customer@Guatemala.test',
  agreementPendingBusinessOwner:
    process.env.E2E_AGREEMENT_PENDING_BUSINESS_OWNER_EMAIL ?? 'agreement-pending-owner@velvetbrew.test',
  agreementUnsignedCustomer:
    process.env.E2E_AGREEMENT_UNSIGNED_CUSTOMER_EMAIL ?? 'agreement-unsigned-customer@Guatemala.test',
} as const
