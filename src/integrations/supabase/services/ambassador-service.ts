import type { AmbassadorLead, AmbassadorLeadStatus } from '@/types/domain'
import type { AmbassadorLeadFormValues } from '@/types/forms'
import { camelCaseRow, requireSupabase } from './shared'

function mapAmbassadorLead(row: Record<string, unknown>): AmbassadorLead {
  const mapped = camelCaseRow(row)
  const socialLinks = (mapped.socialLinks ?? {}) as AmbassadorLead['socialLinks']

  return {
    id: mapped.id as string,
    fullName: mapped.fullName as string,
    email: mapped.email as string,
    phone: (mapped.phone as string | null) ?? null,
    city: mapped.city as string,
    socialLinks,
    notes: (mapped.notes as string) ?? '',
    businessId: (mapped.businessId as string | null) ?? null,
    source: mapped.source as string,
    status: mapped.status as AmbassadorLeadStatus,
    marketingConsentAt: mapped.marketingConsentAt as string,
    createdAt: mapped.createdAt as string,
    updatedAt: mapped.updatedAt as string,
  }
}

export const ambassadorService = {
  async createLead(values: AmbassadorLeadFormValues, businessId?: string | null): Promise<AmbassadorLead> {
    const sb = requireSupabase()
    const { data, error } = await sb.rpc('create_ambassador_lead', {
      p_full_name: values.fullName,
      p_email: values.email,
      p_phone: values.phone?.trim() || null,
      p_city: values.city,
      p_social_links: {
        instagram: values.instagram?.trim() ?? '',
        tiktok: values.tiktok?.trim() ?? '',
        other: values.otherSocial?.trim() ?? '',
      },
      p_notes: values.notes?.trim() ?? '',
      p_business_id: businessId || null,
      p_marketing_consent: values.marketingConsent,
      p_source: 'ambassador-page',
    })

    if (error || !data) {
      throw new Error(error?.message ?? 'Failed to submit ambassador lead.')
    }

    return mapAmbassadorLead(data as Record<string, unknown>)
  },

  async getLeads(businessId?: string): Promise<AmbassadorLead[]> {
    const sb = requireSupabase()
    let query = sb.from('ambassador_leads').select('*').order('created_at', { ascending: false })

    if (businessId) {
      query = query.eq('business_id', businessId)
    }

    const { data, error } = await query

    if (error) {
      throw new Error('Failed to load ambassador leads.')
    }

    return ((data ?? []) as Record<string, unknown>[]).map(mapAmbassadorLead)
  },

  async updateLeadStatus(id: string, status: AmbassadorLeadStatus): Promise<AmbassadorLead> {
    const sb = requireSupabase()
    const { data, error } = await sb
      .from('ambassador_leads')
      .update({ status })
      .eq('id', id)
      .select('*')
      .single()

    if (error || !data) {
      throw new Error(error?.message ?? 'Failed to update ambassador lead.')
    }

    return mapAmbassadorLead(data as Record<string, unknown>)
  },
}
