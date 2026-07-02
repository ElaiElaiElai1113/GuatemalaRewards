import type { Promotion } from '@/types/domain'
import type { PromotionDraftFormValues } from '@/types/forms'
import { requireSupabase, camelCaseRow, snakeCaseObj } from './shared'

export const promotionsService = {
  async getPromotions(businessId?: string): Promise<Promotion[]> {
    const sb = requireSupabase()

    let query = sb.from('promotions').select('*')
    if (businessId) {
      query = query.eq('business_id', businessId)
    }

    const { data, error } = await query
    if (error) throw new Error('Failed to load promotions.')

    return (data as Record<string, unknown>[])
      .map((row) => camelCaseRow(row) as unknown as Promotion)
      .sort((a, b) => a.expiresAt.localeCompare(b.expiresAt))
  },

  async createPromotion(
    values: PromotionDraftFormValues & { businessId: string },
    actorName = 'Business Owner',
  ): Promise<Promotion> {
    const sb = requireSupabase()

    const snakeValues = snakeCaseObj(values as unknown as Record<string, unknown>)
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString()

    const { data, error } = await sb
      .from('promotions')
      .insert({ ...snakeValues, expires_at: expiresAt })
      .select('*')
      .single()

    if (error || !data) {
      throw new Error(error?.message ?? 'Failed to create promotion.')
    }

    const promotion = camelCaseRow(data) as unknown as Promotion

    const { error: logError } = await sb.from('admin_logs').insert({
      actor_name: actorName,
      action: 'Promotion created',
      details: `Created ${promotion.title}.`,
    })

    if (logError) {
      throw new Error(logError.message)
    }

    return promotion
  },

  async createOwnerPromotion(
    values: PromotionDraftFormValues,
    actorName = 'Business Owner',
  ): Promise<Promotion> {
    const sb = requireSupabase()

    const { data, error } = await sb.rpc('create_owner_promotion', {
      p_title: values.title,
      p_description: values.description,
      p_badge: values.badge,
      p_cta: values.cta,
      p_audience: values.audience,
    })

    if (error || !data) {
      throw new Error(error?.message ?? 'Failed to create promotion.')
    }

    const promotion = camelCaseRow(data as Record<string, unknown>) as unknown as Promotion

    const { error: logError } = await sb.from('admin_logs').insert({
      actor_name: actorName,
      action: 'Promotion created',
      details: `Created ${promotion.title}.`,
    })

    if (logError) {
      throw new Error(logError.message)
    }

    return promotion
  },

  async deletePromotion(promotionId: string, actorName = 'Platform Admin'): Promise<void> {
    const sb = requireSupabase()

    const { error } = await sb.from('promotions').delete().eq('id', promotionId)

    if (error) {
      throw new Error(error.message)
    }

    await sb.from('admin_logs').insert({
      actor_name: actorName,
      action: 'Promotion deleted',
      details: `Removed promotion ID: ${promotionId}.`,
    })
  },

  async updatePromotion(
    promotionId: string,
    values: Partial<PromotionDraftFormValues>,
    actorName = 'Platform Admin',
  ): Promise<Promotion> {
    const sb = requireSupabase()
    const snakeValues = snakeCaseObj(values as unknown as Record<string, unknown>)

    const { data, error } = await sb
      .from('promotions')
      .update(snakeValues)
      .eq('id', promotionId)
      .select('*')
      .single()

    if (error || !data) {
      throw new Error(error?.message ?? 'Failed to update promotion.')
    }

    const promotion = camelCaseRow(data) as unknown as Promotion

    await sb.from('admin_logs').insert({
      actor_name: actorName,
      action: 'Promotion updated',
      details: `Updated details for ${promotion.title}.`,
    })

    return promotion
  },
}
