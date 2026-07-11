import type { Business } from '@/types/domain'
import type { BusinessSettingsFormValues } from '@/types/forms'
import { requireSupabase, camelCaseRow, snakeCaseObj, toNullableNumber } from './shared'

function isMissingBusinessBillSettingsRpc(error: unknown) {
  if (!error || typeof error !== 'object') return false

  const message = 'message' in error ? String((error as { message?: unknown }).message ?? '') : ''
  const code = 'code' in error ? String((error as { code?: unknown }).code ?? '') : ''

  return (
    code === 'PGRST202' ||
    code === 'PGRST204' ||
    (
      message.includes('schema cache') &&
      (
        message.includes('update_owner_business_settings') ||
        message.includes('tax_included_in_bill') ||
        message.includes('service_charge_enabled') ||
        message.includes('service_charge_rate')
      )
    )
  )
}

function normalizeBusiness(row: Record<string, unknown>): Business {
  const business = camelCaseRow(row) as unknown as Business
  return {
    ...business,
    address: business.address ?? '',
    latitude: toNullableNumber(business.latitude),
    longitude: toNullableNumber(business.longitude),
    rewardRatePercent: Number(business.rewardRatePercent ?? 20),
    commissionRatePercent: Number(business.commissionRatePercent ?? 10),
    taxIncludedInBill: Boolean(business.taxIncludedInBill ?? false),
    serviceChargeEnabled: Boolean(business.serviceChargeEnabled ?? false),
    serviceChargeRate: Number(business.serviceChargeRate ?? 0),
  }
}

export const businessService = {
  async getBusinesses(includeInactive = false): Promise<Business[]> {
    const sb = requireSupabase()

    let query = sb
      .from('businesses')
      .select('*')

    if (!includeInactive) {
      query = query.eq('active', true)
    }

    const { data, error } = await query

    if (error) throw new Error('Failed to load businesses.')
    return data.map((row) => normalizeBusiness(row as Record<string, unknown>))
  },

  async getSingleBusiness(businessId?: string): Promise<Business> {
    const sb = requireSupabase()

    let query = sb
      .from('businesses')
      .select('*')
      .eq('active', true)

    if (businessId) {
      query = query.eq('id', businessId)
    } else {
      query = query.limit(1)
    }

    const { data, error } = await query.single()

    if (error || !data) {
      throw new Error('No business configured.')
    }

    return normalizeBusiness(data as Record<string, unknown>)
  },

  async getBusinessById(businessId: string): Promise<Business | null> {
    const sb = requireSupabase()

    const { data, error } = await sb
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .single()

    if (error || !data) return null
    return normalizeBusiness(data as Record<string, unknown>)
  },

  async getBusinessBySlug(slug: string): Promise<Business | null> {
    const sb = requireSupabase()
    const normalizedSlug = slug.trim().toLowerCase()
    if (!normalizedSlug) return null

    const { data, error } = await sb
      .from('businesses')
      .select('*')
      .eq('slug', normalizedSlug)
      .eq('active', true)
      .maybeSingle()

    if (error || !data) return null
    return normalizeBusiness(data as Record<string, unknown>)
  },

  async updateSettings(businessId: string, values: BusinessSettingsFormValues): Promise<Business> {
    const sb = requireSupabase()

    const snakeValues = snakeCaseObj(values as unknown as Record<string, unknown>)

    const { data, error } = await sb
      .from('businesses')
      .update(snakeValues)
      .eq('id', businessId)
      .select('*')
      .single()

    if (error || !data) {
      throw new Error('Failed to update business settings.')
    }

    // Log the change
    await sb.from('admin_logs').insert({
      actor_name: 'Business Owner',
      action: 'Business settings updated',
      details: `Updated earn rate ${values.earnRate} pts/$1, reward rate ${values.rewardRatePercent}%, commission ${values.commissionRatePercent}%, tax rate ${(values.taxRate * 100).toFixed(2)}%, service charge ${(values.serviceChargeRate * 100).toFixed(2)}%.`,
    })

    return normalizeBusiness(data as Record<string, unknown>)
  },

  async updateOwnerSettings(values: BusinessSettingsFormValues): Promise<Business> {
    const sb = requireSupabase()
    const legacyParams = {
      p_earn_rate: values.earnRate,
      p_reward_rate_percent: values.rewardRatePercent,
      p_commission_rate_percent: values.commissionRatePercent,
      p_tax_rate: values.taxRate,
    }

    const { data, error } = await sb.rpc('update_owner_business_settings', {
      ...legacyParams,
      p_tax_included_in_bill: values.taxIncludedInBill,
      p_service_charge_enabled: values.serviceChargeEnabled,
      p_service_charge_rate: values.serviceChargeRate,
    })

    if (error && isMissingBusinessBillSettingsRpc(error)) {
      const { data: legacyData, error: legacyError } = await sb.rpc('update_owner_business_settings', legacyParams)

      if (legacyError || !legacyData) {
        throw new Error(legacyError?.message ?? 'Failed to update business settings.')
      }

      return normalizeBusiness(legacyData as Record<string, unknown>)
    }

    if (error || !data) {
      throw new Error(error?.message ?? 'Failed to update business settings.')
    }

    return normalizeBusiness(data as Record<string, unknown>)
  },
}
