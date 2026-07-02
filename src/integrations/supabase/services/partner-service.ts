import type {
  PartnerCreditLedgerEntry,
  PartnerPerformanceSummary,
  PartnerReferral,
  PartnerReferrer,
} from '@/types/domain'
import type { PartnerReferrerDraftFormValues } from '@/types/forms'
import { camelCaseRow, requireSupabase, snakeCaseObj } from './shared'

type PartnerReferralRow = Record<string, unknown> & {
  partner_referrers?: Record<string, unknown> | Record<string, unknown>[] | null
  customer?: Record<string, unknown> | Record<string, unknown>[] | null
  first_order?: Record<string, unknown> | Record<string, unknown>[] | null
}

function firstRow(value: Record<string, unknown> | Record<string, unknown>[] | null | undefined) {
  return Array.isArray(value) ? value[0] ?? null : value ?? null
}

function mapPartnerReferrer(row: Record<string, unknown>): PartnerReferrer {
  const mapped = camelCaseRow(row)
  const partnerName = mapped.partnerName as string
  const contactName = mapped.contactName as string
  const displayLabel = contactName || partnerName
  return {
    id: mapped.id as string,
    businessId: mapped.businessId as string,
    partnerName,
    contactName: displayLabel,
    contactEmail: (mapped.contactEmail as string | null) ?? null,
    code: mapped.code as string,
    active: Boolean(mapped.active),
    notes: (mapped.notes as string) ?? '',
    createdAt: mapped.createdAt as string,
    updatedAt: mapped.updatedAt as string,
  }
}

function mapPartnerReferral(row: PartnerReferralRow): PartnerReferral {
  const mapped = camelCaseRow(row)
  const rawPartnerReferrer = firstRow(row.partner_referrers as Record<string, unknown> | Record<string, unknown>[] | null)
  const rawCustomer = firstRow(row.customer as Record<string, unknown> | Record<string, unknown>[] | null)
  const rawFirstOrder = firstRow(row.first_order as Record<string, unknown> | Record<string, unknown>[] | null)
  const partnerReferrer = rawPartnerReferrer ? camelCaseRow(rawPartnerReferrer) : null
  const customer = rawCustomer ? camelCaseRow(rawCustomer) : null
  const firstOrder = rawFirstOrder ? camelCaseRow(rawFirstOrder) : null

  return {
    id: mapped.id as string,
    partnerReferrerId: mapped.partnerReferrerId as string,
    customerProfileId: mapped.customerProfileId as string,
    sourceBusinessId: mapped.sourceBusinessId as string,
    status: mapped.status as PartnerReferral['status'],
    attributedAt: mapped.attributedAt as string,
    firstOrderId: (mapped.firstOrderId as string | null) ?? null,
    creditedAt: (mapped.creditedAt as string | null) ?? null,
    createdAt: mapped.createdAt as string,
    partnerReferrer: {
      partnerName: (partnerReferrer?.partnerName as string) ?? 'Referral Source',
      contactName:
        (partnerReferrer?.contactName as string)
        || (partnerReferrer?.partnerName as string)
        || 'Unknown Source',
      code: (partnerReferrer?.code as string) ?? '',
    },
    customer: {
      fullName: (customer?.fullName as string) ?? 'Unknown Customer',
      email: (customer?.email as string) ?? '',
    },
    firstOrder: firstOrder
      ? {
          id: firstOrder.id as string,
          total: Number(firstOrder.total ?? 0),
          createdAt: firstOrder.createdAt as string,
        }
      : null,
  }
}

function mapPartnerCreditLedgerEntry(row: Record<string, unknown>): PartnerCreditLedgerEntry {
  const mapped = camelCaseRow(row)
  return {
    id: mapped.id as string,
    partnerReferrerId: mapped.partnerReferrerId as string,
    partnerReferralId: mapped.partnerReferralId as string,
    orderId: mapped.orderId as string,
    creditType: mapped.creditType as string,
    creditUnits: Number(mapped.creditUnits ?? 0),
    details: (mapped.details as string) ?? '',
    createdAt: mapped.createdAt as string,
    redeemedAt: (mapped.redeemedAt as string | null) ?? null,
  }
}

function summarizePartnerPerformance(
  referrers: PartnerReferrer[],
  referrals: PartnerReferral[],
  ledger: PartnerCreditLedgerEntry[],
): PartnerPerformanceSummary[] {
  return referrers.map((referrer) => {
    const referrerReferrals = referrals.filter((referral) => referral.partnerReferrerId === referrer.id)
    const referrerCredits = ledger.filter((entry) => entry.partnerReferrerId === referrer.id)

    return {
      partnerReferrerId: referrer.id,
      partnerName: referrer.partnerName,
      contactName: referrer.contactName,
      code: referrer.code,
      active: referrer.active,
      referralsAttributed: referrerReferrals.length,
      referralsCredited: referrerReferrals.filter((referral) => referral.status === 'credited').length,
      creditsEarned: referrerCredits.reduce((sum, entry) => sum + entry.creditUnits, 0),
      creditsRedeemed: referrerCredits
        .filter((entry) => entry.redeemedAt)
        .reduce((sum, entry) => sum + entry.creditUnits, 0),
    }
  })
}

export const partnerService = {
  async getPartnerReferrers(businessId?: string): Promise<PartnerReferrer[]> {
    const sb = requireSupabase()
    let query = sb.from('partner_referrers').select('*').order('created_at', { ascending: false })

    if (businessId) {
      query = query.eq('business_id', businessId)
    }

    const { data, error } = await query

    if (error) {
      throw new Error('Failed to load partner referrers.')
    }

    return ((data ?? []) as Record<string, unknown>[]).map(mapPartnerReferrer)
  },

  async getPartnerReferrals(businessId?: string): Promise<PartnerReferral[]> {
    const sb = requireSupabase()
    let query = sb
      .from('partner_referrals')
      .select(`
        *,
        partner_referrers!partner_referrals_partner_referrer_id_fkey(partner_name,contact_name,code),
        customer:profiles!partner_referrals_customer_profile_id_fkey(full_name,email),
        first_order:orders!partner_referrals_first_order_id_fkey(id,total,created_at)
      `)
      .order('created_at', { ascending: false })

    if (businessId) {
      query = query.eq('source_business_id', businessId)
    }

    const { data, error } = await query

    if (error) {
      throw new Error('Failed to load partner referrals.')
    }

    return ((data ?? []) as PartnerReferralRow[]).map(mapPartnerReferral)
  },

  async getPartnerCreditLedger(businessId?: string): Promise<PartnerCreditLedgerEntry[]> {
    const sb = requireSupabase()
    let query = sb
      .from('partner_credit_ledger')
      .select(`
        *,
        partner_referrers!inner(business_id)
      `)
      .order('created_at', { ascending: false })

    if (businessId) {
      query = query.eq('partner_referrers.business_id', businessId)
    }

    const { data, error } = await query

    if (error) {
      throw new Error('Failed to load partner credits.')
    }

    return ((data ?? []) as Record<string, unknown>[]).map(mapPartnerCreditLedgerEntry)
  },

  async getPartnerPerformance(businessId?: string): Promise<PartnerPerformanceSummary[]> {
    const [referrers, referrals, ledger] = await Promise.all([
      this.getPartnerReferrers(businessId),
      this.getPartnerReferrals(businessId),
      this.getPartnerCreditLedger(businessId),
    ])

    return summarizePartnerPerformance(referrers, referrals, ledger)
  },

  async createPartnerReferrer(values: PartnerReferrerDraftFormValues): Promise<PartnerReferrer> {
    const sb = requireSupabase()
    const payload = snakeCaseObj({
      businessId: values.businessId,
      partnerName: values.sourceLabel.trim(),
      contactName: values.sourceLabel.trim(),
      contactEmail: values.contactEmail?.trim() ? values.contactEmail.trim().toLowerCase() : null,
      notes: values.notes?.trim() ?? '',
    })

    const { data, error } = await sb
      .from('partner_referrers')
      .insert(payload)
      .select('*')
      .single()

    if (error || !data) {
      throw new Error(error?.message ?? 'Failed to create partner referrer.')
    }

    return mapPartnerReferrer(data as Record<string, unknown>)
  },

  async updatePartnerReferrer(
    id: string,
    values: Partial<PartnerReferrerDraftFormValues> & { active?: boolean },
  ): Promise<PartnerReferrer> {
    const sb = requireSupabase()
    const patch = snakeCaseObj({
      businessId: values.businessId,
      partnerName: values.sourceLabel?.trim(),
      contactName: values.sourceLabel?.trim(),
      contactEmail:
        values.contactEmail === undefined
          ? undefined
          : values.contactEmail.trim()
            ? values.contactEmail.trim().toLowerCase()
            : null,
      notes: values.notes?.trim(),
      active: values.active,
    })

    const cleanedPatch = Object.fromEntries(
      Object.entries(patch).filter(([, value]) => value !== undefined),
    )

    const { data, error } = await sb
      .from('partner_referrers')
      .update(cleanedPatch)
      .eq('id', id)
      .select('*')
      .single()

    if (error || !data) {
      throw new Error(error?.message ?? 'Failed to update partner referrer.')
    }

    return mapPartnerReferrer(data as Record<string, unknown>)
  },

  async archivePartnerReferrer(id: string): Promise<void> {
    await this.updatePartnerReferrer(id, { active: false })
  },

  async attributePartnerReferral(code: string, customerProfileId: string, businessId: string): Promise<void> {
    const sb = requireSupabase()
    const { error } = await sb.rpc('attribute_partner_referral', {
      p_partner_code: code.trim().toUpperCase(),
      p_customer_profile_id: customerProfileId,
      p_source_business_id: businessId,
    })

    if (error) {
      throw new Error(error.message)
    }
  },

  async redeemPartnerCredit(id: string): Promise<void> {
    const sb = requireSupabase()
    const { error } = await sb
      .from('partner_credit_ledger')
      .update({ redeemed_at: new Date().toISOString() })
      .eq('id', id)
      .is('redeemed_at', null)

    if (error) {
      throw new Error(error.message)
    }
  },
}
