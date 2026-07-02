import { existsSync, readFileSync } from 'node:fs'

import { test } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import { e2ePassword } from './env.js'

type AppSupabaseClient = SupabaseClient

export interface E2EProfile {
  id: string
  fullName: string
  email: string
  businessId: string | null
  memberQrToken: string | null
  verificationStatus: string | null
}

export interface E2ERewardBalance {
  profileId: string
  points: number
  availableCredits: number
}

export interface E2EMemberTransaction {
  id: string
  profileId: string
  businessId: string
  purchaseAmount: number
  pointsAwarded: number
  note: string | null
}

export interface E2EAgreementAcceptance {
  id: string
  agreementKind: string
  agreementVersion: number
  typedSignature: string
  signatureSvg: string | null
  signedAt: string
}

function readDotEnv() {
  if (!existsSync('.env')) return new Map<string, string>()

  return new Map(
    readFileSync('.env', 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const [key, ...valueParts] = line.split('=')
        return [key, valueParts.join('=').replace(/^"|"$/g, '')] as const
      }),
  )
}

const dotEnv = readDotEnv()

function getRequiredEnv(name: string) {
  const value = process.env[name] ?? dotEnv.get(name)

  if (!value) {
    throw new Error(`${name} is required for launch checklist tests.`)
  }

  return value
}

function createSupabaseClient() {
  return createClient(getRequiredEnv('VITE_SUPABASE_URL'), getRequiredEnv('VITE_SUPABASE_ANON_KEY'), {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  })
}

function isSupabaseFetchError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  const cause = error instanceof Error && 'cause' in error ? String(error.cause) : ''

  return /fetch failed|failed to fetch|eacces|networkerror/i.test(`${message} ${cause}`)
}

function skipIfSupabaseUnavailable(error: unknown) {
  if (isSupabaseFetchError(error)) {
    test.skip(true, 'Supabase is unreachable in this environment.')
  }
}

export function createAnonymousSupabaseClient() {
  return createSupabaseClient()
}

function mapProfile(row: Record<string, unknown>): E2EProfile {
  return {
    id: row.id as string,
    fullName: row.full_name as string,
    email: row.email as string,
    businessId: (row.business_id as string | null) ?? null,
    memberQrToken: (row.member_qr_token as string | null) ?? null,
    verificationStatus: (row.verification_status as string | null) ?? null,
  }
}

export async function getSupabaseSessionClient(email: string, password = e2ePassword) {
  const client = createSupabaseClient()
  const { error } = await client.auth.signInWithPassword({ email, password }).catch((error: unknown) => {
    skipIfSupabaseUnavailable(error)
    throw error
  })

  if (error) {
    throw new Error(`Could not sign in Supabase test client for ${email}: ${error.message}`)
  }

  return client
}

export async function signUpTestCustomer(email: string, fullName: string, password = e2ePassword) {
  const client = createSupabaseClient()
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: 'customer',
      },
    },
  }).catch((error: unknown) => {
    skipIfSupabaseUnavailable(error)
    throw error
  })

  if (error) {
    throw new Error(`Could not sign up test customer ${email}: ${error.message}`)
  }

  if (!data.session) {
    const { error: signInError } = await client.auth.signInWithPassword({ email, password }).catch((error: unknown) => {
      skipIfSupabaseUnavailable(error)
      throw error
    })
    if (signInError) {
      throw new Error(`Test customer ${email} was created but could not sign in: ${signInError.message}`)
    }
  }

  return client
}

export async function getBusinessBySlug(client: AppSupabaseClient, slug: string) {
  const { data, error } = await client
    .from('businesses')
    .select('id, name, slug')
    .eq('slug', slug)
    .single()

  if (error || !data) {
    throw new Error(`Business not found for slug ${slug}: ${error?.message ?? 'missing row'}`)
  }

  return data as { id: string; name: string; slug: string }
}

export async function getProfileByEmail(client: AppSupabaseClient, email: string) {
  const { data, error } = await client
    .from('profiles')
    .select('id, full_name, email, business_id, member_qr_token, verification_status')
    .eq('email', email)
    .single()

  if (error || !data) {
    throw new Error(`Profile not found for ${email}: ${error?.message ?? 'missing row'}`)
  }

  return mapProfile(data as Record<string, unknown>)
}

export async function getRewardBalance(client: AppSupabaseClient, profileId: string): Promise<E2ERewardBalance> {
  const { data, error } = await client
    .from('reward_balances')
    .select('profile_id, points, available_credits')
    .eq('profile_id', profileId)
    .single()

  if (error || !data) {
    throw new Error(`Reward balance not found for ${profileId}: ${error?.message ?? 'missing row'}`)
  }

  const row = data as Record<string, unknown>
  return {
    profileId: row.profile_id as string,
    points: Number(row.points),
    availableCredits: Number(row.available_credits),
  }
}

export async function getAgreementAcceptancesForProfile(
  client: AppSupabaseClient,
  profileId: string,
): Promise<E2EAgreementAcceptance[]> {
  const { data, error } = await client
    .from('agreement_acceptances')
    .select('id, agreement_kind, agreement_version, typed_signature, signature_svg, signed_at')
    .eq('profile_id', profileId)
    .order('signed_at', { ascending: false })

  if (error) {
    throw new Error(`Agreement acceptances not found for ${profileId}: ${error.message}`)
  }

  return ((data ?? []) as Record<string, unknown>[]).map((row) => ({
    id: row.id as string,
    agreementKind: row.agreement_kind as string,
    agreementVersion: Number(row.agreement_version),
    typedSignature: row.typed_signature as string,
    signatureSvg: (row.signature_svg as string | null) ?? null,
    signedAt: row.signed_at as string,
  }))
}

export async function recordMemberQrSale(
  client: AppSupabaseClient,
  token: string,
  purchaseAmount: number,
  note: string,
) {
  const receiptNumber = `E2E-${note}`
  const { data, error } = await client.rpc('record_member_transaction', {
    p_member_qr_token: token,
    p_purchase_amount: purchaseAmount,
    p_receipt_number: receiptNumber,
    p_note: note,
    p_client_request_id: crypto.randomUUID(),
  })

  const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null
  if (error || !row) {
    throw new Error(`Could not record member QR sale: ${error?.message ?? 'missing row'}`)
  }

  return row
}

export async function getLatestMemberTransactionByNote(
  client: AppSupabaseClient,
  note: string,
): Promise<E2EMemberTransaction> {
  const { data, error } = await client
    .from('member_transactions')
    .select('id, profile_id, business_id, purchase_amount, points_awarded, note')
    .eq('note', note)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    throw new Error(`Member transaction not found for note ${note}: ${error?.message ?? 'missing row'}`)
  }

  const row = data as Record<string, unknown>
  return {
    id: row.id as string,
    profileId: row.profile_id as string,
    businessId: row.business_id as string,
    purchaseAmount: Number(row.purchase_amount),
    pointsAwarded: Number(row.points_awarded),
    note: (row.note as string | null) ?? null,
  }
}

export async function getEarlyAccessLeadByEmail(client: AppSupabaseClient, email: string) {
  const { data, error } = await client
    .from('early_access_leads')
    .select('id, full_name, email, whatsapp, status')
    .eq('email', email)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) {
    throw new Error(`Early access lead not found for ${email}: ${error?.message ?? 'missing row'}`)
  }

  return data as Record<string, unknown>
}

export async function getFirstPartnerReferrerForBusiness(client: AppSupabaseClient, businessId: string) {
  const { data, error } = await client
    .from('partner_referrers')
    .select('id, business_id, contact_name, code, active')
    .eq('business_id', businessId)
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(`Could not load partner referrer: ${error.message}`)
  }

  return data as { id: string; business_id: string; contact_name: string; code: string; active: boolean } | null
}

export async function createPartnerReferrer(client: AppSupabaseClient, businessId: string, sourceLabel: string) {
  const { data, error } = await client
    .from('partner_referrers')
    .insert({
      business_id: businessId,
      partner_name: sourceLabel,
      contact_name: sourceLabel,
      contact_email: `${sourceLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-')}@example.com`,
      notes: 'Created by workflow E2E tests.',
    })
    .select('id, business_id, contact_name, code, active')
    .single()

  if (error || !data) {
    throw new Error(`Could not create partner referrer: ${error?.message ?? 'missing row'}`)
  }

  return data as { id: string; business_id: string; contact_name: string; code: string; active: boolean }
}

export async function getPartnerReferralForCustomer(
  client: AppSupabaseClient,
  customerProfileId: string,
  businessId: string,
) {
  const { data, error } = await client
    .from('partner_referrals')
    .select('id, partner_referrer_id, customer_profile_id, source_business_id, status, first_order_id, credited_at')
    .eq('customer_profile_id', customerProfileId)
    .eq('source_business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    throw new Error(`Partner referral not found for customer ${customerProfileId}: ${error?.message ?? 'missing row'}`)
  }

  return data as Record<string, unknown>
}

export async function attributePartnerReferral(
  client: AppSupabaseClient,
  partnerCode: string,
  customerProfileId: string,
  businessId: string,
) {
  const { error } = await client.rpc('attribute_partner_referral', {
    p_partner_code: partnerCode,
    p_customer_profile_id: customerProfileId,
    p_source_business_id: businessId,
  })

  if (error) {
    throw new Error(`Could not attribute partner referral: ${error.message}`)
  }
}

export async function getFirstProductForBusiness(client: AppSupabaseClient, businessId: string) {
  const { data, error } = await client
    .from('products')
    .select('id, title, price')
    .eq('business_id', businessId)
    .gt('inventory', 0)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    throw new Error(`Product not found for business ${businessId}: ${error?.message ?? 'missing row'}`)
  }

  return data as { id: string; title: string; price: number }
}

export async function placeSingleItemOrder(client: AppSupabaseClient, businessId: string, productId: string) {
  const { data, error } = await client.rpc('place_order', {
    p_business_id: businessId,
    p_payment_method: 'visa',
    p_items: [{ product_id: productId, quantity: 1 }],
    p_client_request_id: crypto.randomUUID(),
  })

  const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null
  if (error || !row) {
    throw new Error(`Could not place test order: ${error?.message ?? 'missing row'}`)
  }

  return row
}

export async function ensureActiveMembership(client: AppSupabaseClient) {
  const { data, error } = await client.rpc('mock_subscribe')
  const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null

  if (error || !row) {
    throw new Error(`Could not activate test membership: ${error?.message ?? 'missing row'}`)
  }

  return row
}

export async function getFirstGiftCardCatalogItem(client: AppSupabaseClient, businessId?: string) {
  let query = client
    .from('gift_card_catalog')
    .select('id, business_id, title, points_cost, is_active')
    .eq('is_active', true)
    .order('points_cost', { ascending: true })
    .limit(1)

  if (businessId) {
    query = query.eq('business_id', businessId)
  }

  const { data, error } = await query.single()
  if (error || !data) {
    throw new Error(`Gift card catalog item not found: ${error?.message ?? 'missing row'}`)
  }

  return data as { id: string; business_id: string; title: string; points_cost: number; is_active: boolean }
}

export async function createGiftCardCatalogItem(
  client: AppSupabaseClient,
  businessId: string,
  title: string,
  pointsCost = 100,
) {
  const { data, error } = await client
    .from('gift_card_catalog')
    .insert({
      business_id: businessId,
      title,
      description: 'Workflow automation gift card.',
      points_cost: pointsCost,
      value_label: 'Test value',
      expiry_days: 30,
      is_active: true,
    })
    .select('id, business_id, title, points_cost, is_active')
    .single()

  if (error || !data) {
    throw new Error(`Could not create gift card catalog item: ${error?.message ?? 'missing row'}`)
  }

  return data as { id: string; business_id: string; title: string; points_cost: number; is_active: boolean }
}

export async function issueGiftCardForCustomer(
  client: AppSupabaseClient,
  catalogId: string,
  customerProfileId: string,
) {
  const { data, error } = await client.rpc('issue_gift_card', {
    p_catalog_id: catalogId,
    p_customer_id: customerProfileId,
  })

  const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null
  if (error || !row) {
    throw new Error(`Could not issue gift card: ${error?.message ?? 'missing row'}`)
  }

  return row
}

export async function redeemGiftCardForBusiness(
  client: AppSupabaseClient,
  giftCardId: string,
  businessId: string,
) {
  const { data, error } = await client.rpc('redeem_gift_card', {
    p_gift_card_id: giftCardId,
    p_business_id: businessId,
  })

  const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null
  if (error || !row) {
    throw new Error(`Could not redeem gift card: ${error?.message ?? 'missing row'}`)
  }

  return row
}

export async function getLatestGiftCardForCustomer(client: AppSupabaseClient, customerProfileId: string) {
  const { data, error } = await client
    .from('gift_cards')
    .select('id, business_id, customer_id, status, public_token, points_spent, redeemed_at')
    .eq('customer_id', customerProfileId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    throw new Error(`Gift card not found for customer ${customerProfileId}: ${error?.message ?? 'missing row'}`)
  }

  return data as Record<string, unknown>
}

export async function getFirstRewardForBusiness(client: AppSupabaseClient, businessId: string) {
  const { data, error } = await client
    .from('rewards')
    .select('id, business_id, title, points_cost, inventory')
    .eq('business_id', businessId)
    .gt('inventory', 0)
    .order('points_cost', { ascending: true })
    .limit(1)
    .single()

  if (error || !data) {
    throw new Error(`Reward not found for business ${businessId}: ${error?.message ?? 'missing row'}`)
  }

  return data as { id: string; business_id: string; title: string; points_cost: number; inventory: number }
}

export async function redeemRewardForCustomer(client: AppSupabaseClient, rewardId: string, notes: string) {
  const { data, error } = await client.rpc('redeem_reward', {
    p_reward_id: rewardId,
    p_pickup_window: 'Now',
    p_notes: notes,
    p_client_request_id: crypto.randomUUID(),
  })

  const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null
  if (error || !row) {
    throw new Error(`Could not redeem reward: ${error?.message ?? 'missing row'}`)
  }

  return row
}

export async function getLatestRedemptionForCustomer(client: AppSupabaseClient, customerProfileId: string) {
  const { data, error } = await client
    .from('redemptions')
    .select('id, profile_id, reward_id, reward_title, points_cost, status, notes')
    .eq('profile_id', customerProfileId)
    .order('redeemed_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    throw new Error(`Redemption not found for customer ${customerProfileId}: ${error?.message ?? 'missing row'}`)
  }

  return data as Record<string, unknown>
}

export async function fulfillRewardRedemption(client: AppSupabaseClient, redemptionId: string) {
  const { error } = await client
    .from('redemptions')
    .update({ status: 'fulfilled' })
    .eq('id', redemptionId)

  if (error) {
    throw new Error(`Could not fulfill reward redemption ${redemptionId}: ${error.message}`)
  }
}
