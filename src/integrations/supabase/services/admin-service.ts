import type {
  Activity,
  AgreementKind,
  AgreementStatusRecord,
  BusinessWithMetrics,
  OrderForVerification,
  Profile,
  Redemption,
  UserRole,
} from '@/types/domain'
import type { RewardAdjustmentFormValues } from '@/types/forms'
import { MEMBER_VERIFICATION_BUCKET } from '@/lib/member-verification'
import { requireSupabase, camelCaseRow, friendlySupabaseError, snakeCaseObj, toNullableNumber } from './shared'

function toTierProgress(points: number, target: number) {
  return Math.max(0, Math.min(100, Math.round((points / target) * 100)))
}

type AdjustmentContext = {
  businessId?: string
}

type CreateBusinessInput = {
  name: string
  slug: string
  description?: string
  address?: string
  latitude?: number | null
  longitude?: number | null
  logoUrl?: string
  earnRate: number
  taxRate: number
  taxIncludedInBill: boolean
  serviceChargeEnabled: boolean
  serviceChargeRate: number
  currency: string
  active: boolean
}

type CreateBusinessAgreementInput = {
  businessId: string
  businessName: string
  title?: string
  body: string
}

export type ProvisionPartnerOwnerResult = {
  email: string
  defaultPassword: string
  userId: string
  businessId: string
  accountCreated: boolean
}

type AgreementStatusProfileRow = {
  id: string
  full_name: string | null
  email: string | null
  role: UserRole
  business_id: string | null
}

type AgreementStatusVersionRow = {
  id: string
  kind: AgreementKind
  required_role: UserRole | null
  business_id: string | null
  version: number
  title: string
  content_hash: string
  is_active: boolean
}

type AgreementStatusAcceptanceRow = {
  profile_id: string
  agreement_version_id: string
  agreement_kind: AgreementKind
  agreement_version: number
  content_hash: string
  typed_signature: string | null
  signature_svg: string | null
  accepted_electronic_records: boolean
  accepted_terms: boolean
  signed_at: string | null
}

async function readFunctionErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'context' in error) {
    const context = (error as { context?: unknown }).context
    if (context instanceof Response) {
      try {
        const text = await context.text()
        if (text) {
          try {
            const parsed = JSON.parse(text) as { message?: unknown; error?: unknown }
            const message = parsed.message ?? parsed.error
            if (typeof message === 'string' && message.trim()) {
              return message
            }
          } catch {
            return text
          }
        }
      } catch {
        // Fall back to the Supabase error message below.
      }
    }
  }

  return error instanceof Error ? error.message : fallback
}

async function performRewardAdjustment(
  values: RewardAdjustmentFormValues,
  context: AdjustmentContext,
) {
  const sb = requireSupabase()

  const { data: target, error: targetError } = await sb
    .from('profiles')
    .select('*')
    .eq('id', values.profileId)
    .single()

  if (targetError || !target) {
    throw new Error('Member not found.')
  }

  const { data: balance, error: adjustmentError } = await sb.rpc('adjust_member_points', {
    p_profile_id: values.profileId,
    p_delta: values.delta,
    p_reason: values.reason,
    p_business_id: context.businessId ?? null,
  })

  if (adjustmentError || !balance) {
    throw new Error(friendlySupabaseError(adjustmentError, 'Failed to adjust rewards.'))
  }
}

function normalizeCreateBusinessInput(input: CreateBusinessInput) {
  return {
    name: input.name.trim(),
    slug: input.slug.trim(),
    description: input.description?.trim() ?? '',
    address: input.address?.trim() ?? '',
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    logoUrl: input.logoUrl?.trim() ? input.logoUrl.trim() : null,
    earnRate: input.earnRate,
    taxRate: input.taxRate / 100,
    taxIncludedInBill: input.taxIncludedInBill,
    serviceChargeEnabled: input.serviceChargeEnabled,
    serviceChargeRate: input.serviceChargeEnabled ? input.serviceChargeRate / 100 : 0,
    currency: input.currency.trim().toUpperCase(),
    active: input.active,
  }
}

function isMissingCreateBusinessRpcError(error: unknown) {
  if (!error || typeof error !== 'object') return false

  const message = 'message' in error ? String((error as { message?: unknown }).message ?? '') : ''
  const code = 'code' in error ? String((error as { code?: unknown }).code ?? '') : ''

  return code === 'PGRST202' || (
    message.includes('create_managed_business') &&
    message.includes('schema cache')
  )
}

function isMissingBusinessBillColumnsError(error: unknown) {
  if (!error || typeof error !== 'object') return false

  const message = 'message' in error ? String((error as { message?: unknown }).message ?? '') : ''
  const code = 'code' in error ? String((error as { code?: unknown }).code ?? '') : ''

  return (
    code === 'PGRST204' ||
    (
      message.includes('schema cache') &&
      (
        message.includes('tax_included_in_bill') ||
        message.includes('service_charge_enabled') ||
        message.includes('service_charge_rate')
      )
    )
  )
}

async function sha256Hex(value: string) {
  const encoded = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export const adminService = {
  async getBusinessesWithMetrics(): Promise<BusinessWithMetrics[]> {
    const sb = requireSupabase()

    const [businessesResult, ordersResult, activitiesResult, profilesResult, balancesResult, memberTransactionsResult] =
      await Promise.all([
        sb.from('businesses').select('*').order('name'),
        sb.from('orders').select('business_id, profile_id, total'),
        sb.from('activities').select('business_id, points').eq('type', 'earned'),
        sb.from('profiles').select('id, business_id, role, full_name, email'),
        sb.from('reward_balances').select('profile_id, available_credits'),
        sb.from('member_transactions').select('business_id, profile_id, commission_amount, commission_status'),
      ])

    if (businessesResult.error) throw new Error('Failed to load businesses.')
    if (ordersResult.error) throw new Error('Failed to load business order metrics.')
    if (activitiesResult.error) throw new Error('Failed to load business activity metrics.')
    if (profilesResult.error) throw new Error('Failed to load business reward credit metrics.')
    if (balancesResult.error) throw new Error('Failed to load member reward credit balances.')
    if (memberTransactionsResult.error) throw new Error('Failed to load member transaction metrics.')

    const memberIdsByBusiness = new Map<string, Set<string>>()
    const revenueByBusiness = new Map<string, number>()

    for (const order of ordersResult.data ?? []) {
      const businessId = order.business_id as string | null
      const profileId = order.profile_id as string | null
      if (!businessId) continue

      if (profileId) {
        const memberSet = memberIdsByBusiness.get(businessId) ?? new Set<string>()
        memberSet.add(profileId)
        memberIdsByBusiness.set(businessId, memberSet)
      }

      revenueByBusiness.set(
        businessId,
        (revenueByBusiness.get(businessId) ?? 0) + Number(order.total ?? 0),
      )
    }

    const commissionOwedByBusiness = new Map<string, number>()
    const commissionPaidByBusiness = new Map<string, number>()
    const memberTransactionCountByBusiness = new Map<string, number>()
    for (const transaction of memberTransactionsResult.data ?? []) {
      const businessId = transaction.business_id as string | null
      const profileId = transaction.profile_id as string | null
      if (!businessId) continue

      memberTransactionCountByBusiness.set(
        businessId,
        (memberTransactionCountByBusiness.get(businessId) ?? 0) + 1,
      )

      if (profileId) {
        const memberSet = memberIdsByBusiness.get(businessId) ?? new Set<string>()
        memberSet.add(profileId)
        memberIdsByBusiness.set(businessId, memberSet)
      }

      const commissionAmount = Number(transaction.commission_amount ?? 0)
      if (transaction.commission_status === 'commission_paid') {
        commissionPaidByBusiness.set(businessId, (commissionPaidByBusiness.get(businessId) ?? 0) + commissionAmount)
      } else {
        commissionOwedByBusiness.set(businessId, (commissionOwedByBusiness.get(businessId) ?? 0) + commissionAmount)
      }
    }

    const pointsIssuedByBusiness = new Map<string, number>()
    for (const activity of activitiesResult.data ?? []) {
      const businessId = activity.business_id as string | null
      if (!businessId) continue

      pointsIssuedByBusiness.set(
        businessId,
        (pointsIssuedByBusiness.get(businessId) ?? 0) + Number(activity.points ?? 0),
      )
    }

    const businessIdByProfile = new Map<string, string>()
    const ownerByBusiness = new Map<string, { id: string; fullName: string; email: string }>()
    const staffCountByBusiness = new Map<string, number>()
    const staffEmailsByBusiness = new Map<string, string[]>()
    for (const profile of profilesResult.data ?? []) {
      if (typeof profile.id === 'string' && typeof profile.business_id === 'string') {
        businessIdByProfile.set(profile.id, profile.business_id)
      }

      if (typeof profile.business_id !== 'string') continue

      if (profile.role === 'business-owner') {
        ownerByBusiness.set(profile.business_id, {
          id: profile.id as string,
          fullName: (profile.full_name as string | null) ?? (profile.email as string),
          email: profile.email as string,
        })
      }

      if (profile.role === 'business-staff') {
        staffCountByBusiness.set(
          profile.business_id,
          (staffCountByBusiness.get(profile.business_id) ?? 0) + 1,
        )
        staffEmailsByBusiness.set(profile.business_id, [
          ...(staffEmailsByBusiness.get(profile.business_id) ?? []),
          profile.email as string,
        ])
      }
    }

    const creditsOutstandingByBusiness = new Map<string, number>()
    for (const balance of balancesResult.data ?? []) {
      const profileId = balance.profile_id as string | null
      if (!profileId) continue

      const businessId = businessIdByProfile.get(profileId)
      if (!businessId) continue

      creditsOutstandingByBusiness.set(
        businessId,
        (creditsOutstandingByBusiness.get(businessId) ?? 0) + Number(balance.available_credits ?? 0),
      )
    }

    return (businessesResult.data ?? []).map((row) => {
      const business = camelCaseRow(row as Record<string, unknown>)
      const businessId = business.id as string

      return {
        id: businessId,
        name: business.name as string,
        slug: business.slug as string,
        description: (business.description as string | null) ?? null,
        address: (business.address as string | null) ?? '',
        latitude: toNullableNumber(business.latitude),
        longitude: toNullableNumber(business.longitude),
        earnRate: Number(business.earnRate ?? 0),
        rewardRatePercent: Number(business.rewardRatePercent ?? 20),
        commissionRatePercent: Number(business.commissionRatePercent ?? 10),
        taxIncludedInBill: Boolean(business.taxIncludedInBill ?? false),
        serviceChargeEnabled: Boolean(business.serviceChargeEnabled ?? false),
        serviceChargeRate: Number(business.serviceChargeRate ?? 0),
        currency: (business.currency as string) || 'USD',
        active: Boolean(business.active),
        logoUrl: (business.logoUrl as string | null) ?? null,
        totalMembers: memberIdsByBusiness.get(businessId)?.size ?? 0,
        totalRevenue: revenueByBusiness.get(businessId) ?? 0,
        pointsIssued: pointsIssuedByBusiness.get(businessId) ?? 0,
        creditsOutstanding: creditsOutstandingByBusiness.get(businessId) ?? 0,
        commissionOwed: commissionOwedByBusiness.get(businessId) ?? 0,
        commissionPaid: commissionPaidByBusiness.get(businessId) ?? 0,
        memberTransactionCount: memberTransactionCountByBusiness.get(businessId) ?? 0,
        ownerProfileId: (business.ownerProfileId as string | null) ?? ownerByBusiness.get(businessId)?.id ?? null,
        ownerName: ownerByBusiness.get(businessId)?.fullName ?? null,
        ownerEmail: ownerByBusiness.get(businessId)?.email ?? null,
        staffCount: staffCountByBusiness.get(businessId) ?? 0,
        staffEmails: staffEmailsByBusiness.get(businessId) ?? [],
      }
    })
  },

  async getUsers() {
    const sb = requireSupabase()

    const { data: profileRows, error: profError } = await sb
      .from('profiles')
      .select('*')

    if (profError) throw new Error('Failed to load users.')

    const { data: balanceRows, error: balError } = await sb
      .from('reward_balances')
      .select('*')

    if (balError) throw new Error('Failed to load balances.')

    const balanceMap = new Map(
      (balanceRows as Record<string, unknown>[]).map((b) => {
        const mapped = camelCaseRow(b)
        return [mapped.profileId as string, mapped]
      }),
    )

    const profiles = (profileRows as Record<string, unknown>[]).map((row) => {
      const profile = camelCaseRow(row) as unknown as Profile
      const rawBalance = balanceMap.get(profile.id)
      const balance = rawBalance
        ? {
            profileId: rawBalance.profileId as string,
            points: rawBalance.points as number,
            nextRewardPoints: rawBalance.nextRewardPoints as number,
            availableCredits: rawBalance.availableCredits as number,
            tierProgress: toTierProgress(rawBalance.points as number, rawBalance.nextRewardPoints as number),
          }
        : null
      return { profile, balance }
    })

    await Promise.all(
      profiles.map(async ({ profile }) => {
        if (!profile.verificationDocumentPath) return

        const { data, error } = await sb.storage
          .from(MEMBER_VERIFICATION_BUCKET)
          .createSignedUrl(profile.verificationDocumentPath, 60 * 60)

        if (!error && data?.signedUrl) {
          profile.verificationDocumentUrl = data.signedUrl
        }
      }),
    )

    return profiles
  },

  async getAgreementStatuses(): Promise<AgreementStatusRecord[]> {
    const sb = requireSupabase()

    const [profilesResult, agreementsResult, acceptancesResult] = await Promise.all([
      sb
        .from('profiles')
        .select('id, full_name, email, role, business_id')
        .neq('role', 'platform-admin')
        .order('full_name'),
      sb
        .from('agreement_versions')
        .select('id, kind, required_role, business_id, version, title, content_hash, is_active')
        .eq('is_active', true)
        .not('required_role', 'is', null)
        .order('kind', { ascending: true })
        .order('version', { ascending: false }),
      sb
        .from('agreement_acceptances')
        .select(
          'profile_id, agreement_version_id, agreement_kind, agreement_version, content_hash, typed_signature, signature_svg, accepted_electronic_records, accepted_terms, signed_at',
        ),
    ])

    if (profilesResult.error) throw new Error('Failed to load agreement users.')
    if (agreementsResult.error) throw new Error('Failed to load active agreements.')
    if (acceptancesResult.error) throw new Error('Failed to load agreement signatures.')

    const profiles = (profilesResult.data ?? []) as AgreementStatusProfileRow[]
    const agreements = (agreementsResult.data ?? []) as AgreementStatusVersionRow[]
    const acceptances = (acceptancesResult.data ?? []) as AgreementStatusAcceptanceRow[]
    const acceptanceByProfileAndVersion = new Map<string, AgreementStatusAcceptanceRow>()

    for (const acceptance of acceptances) {
      acceptanceByProfileAndVersion.set(
        `${acceptance.profile_id}:${acceptance.agreement_version_id}`,
        acceptance,
      )
    }

    const records: AgreementStatusRecord[] = []
    for (const profile of profiles) {
      const requiredAgreements = agreements.filter((agreement) =>
        agreement.required_role === profile.role &&
        (!agreement.business_id || agreement.business_id === profile.business_id)
      )

      for (const agreement of requiredAgreements) {
        const acceptance = acceptanceByProfileAndVersion.get(`${profile.id}:${agreement.id}`)
        const signatureSvg = acceptance?.signature_svg ?? null
        const isSigned = Boolean(
          acceptance &&
            acceptance.agreement_kind === agreement.kind &&
            acceptance.agreement_version === agreement.version &&
            acceptance.content_hash === agreement.content_hash &&
            acceptance.accepted_electronic_records &&
            acceptance.accepted_terms &&
            signatureSvg &&
            signatureSvg.length >= 80,
        )

        records.push({
          profileId: profile.id,
          fullName: profile.full_name ?? profile.email ?? 'Unknown user',
          email: profile.email ?? '',
          role: profile.role,
          businessId: profile.business_id,
          agreementVersionId: agreement.id,
          agreementBusinessId: agreement.business_id,
          agreementKind: agreement.kind,
          agreementTitle: agreement.title,
          agreementVersion: agreement.version,
          contentHash: agreement.content_hash,
          isSigned,
          signedAt: isSigned ? acceptance?.signed_at ?? null : null,
          typedSignature: acceptance?.typed_signature ?? null,
          signatureSvg: isSigned ? signatureSvg : null,
        })
      }
    }

    return records.sort((a, b) => {
      if (a.isSigned !== b.isSigned) return a.isSigned ? 1 : -1
      return `${a.role}:${a.fullName}:${a.agreementTitle}`.localeCompare(
        `${b.role}:${b.fullName}:${b.agreementTitle}`,
      )
    })
  },

  async getOverview() {
    const sb = requireSupabase()

    const [redemptionsResult, logsResult, activitiesResult] = await Promise.all([
      sb.from('redemptions').select('*').order('redeemed_at', { ascending: false }),
      sb.from('admin_logs').select('*').order('created_at', { ascending: false }),
      sb.from('activities').select('*').order('created_at', { ascending: false }),
    ])

    const redemptions = (redemptionsResult.data ?? []).map((r) => {
      const m = camelCaseRow(r as Record<string, unknown>)
      return {
        id: m.id as string,
        profileId: m.profileId as string,
        rewardId: m.rewardId as string,
        rewardTitle: m.rewardTitle as string,
        pointsCost: m.pointsCost as number,
        notes: m.notes as string | undefined,
        redeemedAt: m.redeemedAt as string,
        status: m.status as Redemption['status'],
      }
    })

    const adminLogs = (logsResult.data ?? []).map((l) => {
      const m = camelCaseRow(l as Record<string, unknown>)
      return {
        id: m.id as string,
        actorName: m.actorName as string,
        action: m.action as string,
        details: m.details as string,
        createdAt: m.createdAt as string,
      }
    })

    const activities = (activitiesResult.data ?? []).map((a) => {
      const m = camelCaseRow(a as Record<string, unknown>)
      return {
        id: m.id as string,
        profileId: m.profileId as string,
        type: m.type as Activity['type'],
        title: m.title as string,
        description: m.description as string,
        points: m.points as number,
        createdAt: m.createdAt as string,
        status: m.status as Activity['status'],
      }
    })

    return { redemptions, adminLogs, activities }
  },

  async adjustRewards(values: RewardAdjustmentFormValues, actor: Profile) {
    void actor
    await performRewardAdjustment(values, {
    })
  },

  async updateBusiness(
    id: string,
    patch: {
      name?: string
      description?: string
      address?: string
      latitude?: number | null
      longitude?: number | null
      logoUrl?: string
    },
  ) {
    const sb = requireSupabase()
    const snakePatch = snakeCaseObj(patch as Record<string, unknown>)

    const { data, error } = await sb
      .from('businesses')
      .update(snakePatch)
      .eq('id', id)
      .select('*')
      .single()

    if (error || !data) {
      throw new Error('Failed to update business.')
    }

    const { error: logError } = await sb.from('admin_logs').insert({
      actor_name: 'Platform Admin',
      action: 'business_info_updated',
      details: JSON.stringify(patch),
    })

    if (logError) {
      console.error('Admin log error:', logError)
    }

    return camelCaseRow(data as Record<string, unknown>)
  },

  async createBusiness(input: CreateBusinessInput) {
    const sb = requireSupabase()
    const normalized = normalizeCreateBusinessInput(input)
    const legacyRpcParams = {
      p_name: normalized.name,
      p_slug: normalized.slug,
      p_description: normalized.description,
      p_address: normalized.address,
      p_latitude: normalized.latitude,
      p_longitude: normalized.longitude,
      p_logo_url: normalized.logoUrl,
      p_earn_rate: normalized.earnRate,
      p_tax_rate: normalized.taxRate,
      p_currency: normalized.currency,
      p_active: normalized.active,
    }
    const legacyInsertPayload = {
      name: normalized.name,
      slug: normalized.slug,
      description: normalized.description,
      address: normalized.address,
      latitude: normalized.latitude,
      longitude: normalized.longitude,
      logo_url: normalized.logoUrl,
      earn_rate: normalized.earnRate,
      tax_rate: normalized.taxRate,
      currency: normalized.currency,
      active: normalized.active,
    }

    const { data, error } = await sb.rpc('create_managed_business', {
      ...legacyRpcParams,
      p_tax_included_in_bill: normalized.taxIncludedInBill,
      p_service_charge_enabled: normalized.serviceChargeEnabled,
      p_service_charge_rate: normalized.serviceChargeRate,
    })

    if (error && (isMissingCreateBusinessRpcError(error) || isMissingBusinessBillColumnsError(error))) {
      const { data: legacyData, error: legacyError } = await sb.rpc('create_managed_business', legacyRpcParams)
      if (!legacyError && legacyData) {
        return camelCaseRow(legacyData as Record<string, unknown>)
      }

      const { data: insertedBusiness, error: insertError } = await sb
        .from('businesses')
        .insert(legacyInsertPayload)
        .select('*')
        .single()

      if (insertError || !insertedBusiness) {
        throw new Error(insertError?.message ?? 'Failed to create business.')
      }

      return camelCaseRow(insertedBusiness as Record<string, unknown>)
    }

    if (error || !data) {
      throw new Error(error?.message ?? 'Failed to create business.')
    }

    return camelCaseRow(data as Record<string, unknown>)
  },

  async createBusinessAgreement(input: CreateBusinessAgreementInput) {
    const body = input.body.trim()
    if (!body) return null

    const sb = requireSupabase()
    const title = input.title?.trim() || `${input.businessName.trim()} Required Document`
    const contentHash = await sha256Hex(`${title}\n\n${body}`)
    const { data: existingVersions, error: versionError } = await sb
      .from('agreement_versions')
      .select('version')
      .eq('kind', 'business_custom')
      .eq('business_id', input.businessId)
      .order('version', { ascending: false })
      .limit(1)

    if (versionError) {
      throw new Error(versionError.message || 'Failed to prepare business document.')
    }

    const version = Number(existingVersions?.[0]?.version ?? 0) + 1

    const { data, error } = await sb
      .from('agreement_versions')
      .insert({
        kind: 'business_custom',
        required_role: 'business-owner',
        business_id: input.businessId,
        version,
        title,
        body,
        content_hash: contentHash,
        is_active: true,
      })
      .select('*')
      .single()

    if (error || !data) {
      throw new Error(error?.message ?? 'Failed to create business contract.')
    }

    return camelCaseRow(data as Record<string, unknown>)
  },

  async provisionPartnerOwner(input: {
    businessId: string
    businessName: string
    email: string
  }): Promise<ProvisionPartnerOwnerResult> {
    const sb = requireSupabase()
    const { data, error } = await sb.functions.invoke('provision-partner-owner', {
      body: {
        businessId: input.businessId,
        businessName: input.businessName,
        email: input.email.trim().toLowerCase(),
      },
    })

    if (error) {
      throw new Error(await readFunctionErrorMessage(error, 'Failed to provision partner owner account.'))
    }

    const result = data as Partial<ProvisionPartnerOwnerResult> | null
    if (!result?.email || !result.defaultPassword || !result.userId || !result.businessId) {
      throw new Error('Partner owner account was not provisioned.')
    }

    return {
      email: result.email,
      defaultPassword: result.defaultPassword,
      userId: result.userId,
      businessId: result.businessId,
      accountCreated: Boolean(result.accountCreated),
    }
  },

  async lookupUserByEmail(email: string): Promise<string | null> {
    const sb = requireSupabase()

    const { data, error } = await sb.rpc('lookup_user_by_email', {
      p_email: email,
    })

    if (error) {
      throw error
    }

    return typeof data === 'string' ? data : null
  },

  async assignBusinessUser(
    userId: string,
    businessId: string,
    role: 'business-owner' | 'business-staff',
  ) {
    const sb = requireSupabase()

    const { error } = await sb.rpc('assign_business_user', {
      target_user_id: userId,
      target_role: role,
      target_business_id: businessId,
    })

    if (error) {
      throw error
    }
  },

  async assignBusinessOwner(userId: string, businessId: string) {
    await this.assignBusinessUser(userId, businessId, 'business-owner')
  },

  async assignBusinessStaff(userId: string, businessId: string) {
    await this.assignBusinessUser(userId, businessId, 'business-staff')
  },

  async adjustRewardsForBusiness(
    values: RewardAdjustmentFormValues,
    actor: Profile,
    businessId: string,
  ) {
    void actor
    await performRewardAdjustment(values, {
      businessId,
    })
  },

  async registerCustomer(name: string, email: string, businessId: string) {
    const sb = requireSupabase()
    const { data, error } = await sb.functions.invoke('register-customer', {
      body: {
        name,
        email,
        businessId,
      },
    })

    if (error) {
      throw new Error(await readFunctionErrorMessage(error, 'Customer invitation could not be sent.'))
    }

    const user = (data as { user?: { id: string; email?: string } } | null)?.user
    if (!user) {
      throw new Error('Customer invitation was sent but user data was not returned.')
    }

    return user
  },

  async getOrdersForVerification(businessId?: string): Promise<OrderForVerification[]> {
    const sb = requireSupabase()

    let query = sb
      .from('orders')
      .select('id, profile_id, business_id, total, points_earned, created_at, businesses(name, earn_rate)')
      .order('created_at', { ascending: false })
      .limit(100)

    if (businessId) {
      query = query.eq('business_id', businessId)
    }

    const { data, error } = await query

    if (error) {
      throw new Error('Failed to load orders for verification.')
    }

    return (data ?? []).map((row) => {
      const order = camelCaseRow(row as Record<string, unknown>)
      const rawBusinesses = (row as { businesses?: unknown }).businesses
      const businessRow = Array.isArray(rawBusinesses)
        ? ((rawBusinesses[0] as Record<string, unknown> | undefined) ?? null)
        : ((rawBusinesses as Record<string, unknown> | null | undefined) ?? null)
      const earnRate = Number(businessRow?.earn_rate ?? 0)
      const total = Number(order.total ?? 0)
      const pointsEarned = Number(order.pointsEarned ?? 0)
      const expectedPoints = Math.floor(total * earnRate)

      return {
        id: order.id as string,
        profileId: order.profileId as string,
        businessId: order.businessId as string,
        businessName: (businessRow?.name as string) ?? 'Unknown Partner',
        total,
        pointsEarned,
        expectedPoints,
        mismatch: pointsEarned !== expectedPoints,
        createdAt: order.createdAt as string,
      }
    })
  },

  async reviewMemberVerification(
    profileId: string,
    status: 'verified' | 'rejected',
    reason?: string,
  ): Promise<Profile> {
    const sb = requireSupabase()

    const { data, error } = await sb.rpc('review_member_verification', {
      p_profile_id: profileId,
      p_status: status,
      p_reason: reason ?? null,
    })

    if (error || !data) {
      throw new Error(error?.message ?? 'Failed to review member verification.')
    }

    const row = Array.isArray(data) ? data[0] : data
    return camelCaseRow(row as Record<string, unknown>) as unknown as Profile
  },

  async fulfillRedemption(redemptionId: string, actor: Profile) {
    const sb = requireSupabase()

    // Fetch redemption
    const { data: redemption, error: fetchError } = await sb
      .from('redemptions')
      .select('*')
      .eq('id', redemptionId)
      .single()

    if (fetchError || !redemption) {
      throw new Error('Redemption not found.')
    }

    // Update status
    const { error: updateError } = await sb
      .from('redemptions')
      .update({ status: 'fulfilled' })
      .eq('id', redemptionId)

    if (updateError) {
      throw new Error(updateError.message)
    }

    // Log admin action
    const { error: logError } = await sb.from('admin_logs').insert({
      actor_name: actor.fullName,
      action: 'Redemption fulfilled',
      details: `Marked reward "${redemption.reward_title}" as fulfilled for member ID: ${redemption.profile_id}.`,
    })

    if (logError) {
      throw new Error(logError.message)
    }
  },
}
