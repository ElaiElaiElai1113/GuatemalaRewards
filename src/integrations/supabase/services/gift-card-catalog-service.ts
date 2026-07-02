import type { GiftCardCatalogItem } from '@/types/domain'
import type { GiftCardCatalogItemFormValues, OwnerGiftCardCatalogItemFormValues } from '@/types/forms'
import { camelCaseRow, requireSupabase, snakeCaseObj } from './shared'

function mapCatalogItem(row: Record<string, unknown>): GiftCardCatalogItem {
  const mapped = camelCaseRow(row)
  const business = row.businesses as Record<string, unknown> | null | undefined

  return {
    id: mapped.id as string,
    businessId: mapped.businessId as string,
    title: mapped.title as string,
    description: mapped.description as string,
    imageUrl: (mapped.imageUrl as string | null) ?? null,
    pointsCost: mapped.pointsCost as number,
    valueLabel: mapped.valueLabel as string,
    expiryDays: mapped.expiryDays as number,
    isActive: mapped.isActive as boolean,
    createdBy: (mapped.createdBy as string | null) ?? null,
    createdAt: mapped.createdAt as string,
    updatedAt: mapped.updatedAt as string,
    business: business
      ? {
          id: business.id as string,
          name: business.name as string,
          logoUrl: (business.logo_url as string | null) ?? null,
        }
      : undefined,
  }
}

export const giftCardCatalogService = {
  async listCatalog(businessId?: string): Promise<GiftCardCatalogItem[]> {
    const sb = requireSupabase()

    let query = sb
      .from('gift_card_catalog')
      .select('*, businesses(id, name, logo_url)')
      .order('created_at', { ascending: false })

    if (businessId) {
      query = query.eq('business_id', businessId)
    }

    const { data, error } = await query
    if (error) throw new Error('Failed to load gift card catalog.')

    return ((data ?? []) as Record<string, unknown>[]).map(mapCatalogItem)
  },

  async getCatalogItem(id: string): Promise<GiftCardCatalogItem | null> {
    const sb = requireSupabase()

    const { data, error } = await sb
      .from('gift_card_catalog')
      .select('*, businesses(id, name, logo_url)')
      .eq('id', id)
      .single()

    if (error || !data) return null
    return mapCatalogItem(data as Record<string, unknown>)
  },

  async createCatalogItem(values: GiftCardCatalogItemFormValues, createdBy?: string): Promise<GiftCardCatalogItem> {
    const sb = requireSupabase()
    const snakeValues = snakeCaseObj(values as unknown as Record<string, unknown>)

    const { data, error } = await sb
      .from('gift_card_catalog')
      .insert({
        ...snakeValues,
        image_url: values.imageUrl || null,
        created_by: createdBy ?? null,
      })
      .select('*, businesses(id, name, logo_url)')
      .single()

    if (error || !data) throw new Error(error?.message ?? 'Failed to create gift card catalog item.')
    return mapCatalogItem(data as Record<string, unknown>)
  },

  async createOwnerCatalogItem(values: OwnerGiftCardCatalogItemFormValues): Promise<GiftCardCatalogItem> {
    const sb = requireSupabase()

    const { data, error } = await sb.rpc('create_owner_gift_card_catalog_item', {
      p_title: values.title,
      p_description: values.description,
      p_image_url: values.imageUrl || null,
      p_points_cost: values.pointsCost,
      p_value_label: values.valueLabel,
      p_expiry_days: values.expiryDays,
      p_is_active: values.isActive,
    })

    if (error || !data) throw new Error(error?.message ?? 'Failed to create gift card catalog item.')

    const item = mapCatalogItem(data as Record<string, unknown>)
    const business = await this.getCatalogItem(item.id)
    return business ?? item
  },

  async updateCatalogItem(id: string, values: Partial<GiftCardCatalogItemFormValues>): Promise<GiftCardCatalogItem> {
    const sb = requireSupabase()
    const snakeValues = snakeCaseObj(values as unknown as Record<string, unknown>)

    if ('imageUrl' in values) {
      snakeValues.image_url = values.imageUrl || null
    }

    const { data, error } = await sb
      .from('gift_card_catalog')
      .update(snakeValues)
      .eq('id', id)
      .select('*, businesses(id, name, logo_url)')
      .single()

    if (error || !data) throw new Error(error?.message ?? 'Failed to update gift card catalog item.')
    return mapCatalogItem(data as Record<string, unknown>)
  },

  async deleteCatalogItem(id: string): Promise<void> {
    const sb = requireSupabase()
    const { error } = await sb.from('gift_card_catalog').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
}
