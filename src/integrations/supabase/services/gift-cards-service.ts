import type { GiftCard, PublicGiftCard } from '@/types/domain'
import { camelCaseRow, friendlySupabaseError, requireSupabase } from './shared'

function mapGiftCard(row: Record<string, unknown>): GiftCard {
  const mapped = camelCaseRow(row)
  const catalog = row.gift_card_catalog as Record<string, unknown> | null | undefined
  const business = row.businesses as Record<string, unknown> | null | undefined
  const customer = row.profiles as Record<string, unknown> | null | undefined

  return {
    id: mapped.id as string,
    catalogId: (mapped.catalogId as string | null) ?? null,
    businessId: mapped.businessId as string,
    customerId: mapped.customerId as string,
    issuedBy: (mapped.issuedBy as string | null) ?? null,
    code: mapped.code as string,
    publicToken: mapped.publicToken as string,
    status: mapped.status as GiftCard['status'],
    pointsSpent: mapped.pointsSpent as number,
    expiresAt: mapped.expiresAt as string,
    redeemedAt: (mapped.redeemedAt as string | null) ?? null,
    redeemedBy: (mapped.redeemedBy as string | null) ?? null,
    redeemedAtBusiness: (mapped.redeemedAtBusiness as string | null) ?? null,
    createdAt: mapped.createdAt as string,
    updatedAt: mapped.updatedAt as string,
    catalog: catalog
      ? {
          id: catalog.id as string,
          title: catalog.title as string,
          description: catalog.description as string,
          valueLabel: catalog.value_label as string,
          imageUrl: (catalog.image_url as string | null) ?? null,
        }
      : undefined,
    business: business
      ? {
          id: business.id as string,
          name: business.name as string,
          logoUrl: (business.logo_url as string | null) ?? null,
        }
      : undefined,
    customerFirstName: customer?.full_name
      ? String(customer.full_name).split(' ')[0]
      : undefined,
  }
}

function mapPublicGiftCard(row: Record<string, unknown>): PublicGiftCard {
  const mapped = camelCaseRow(row)

  return {
    id: mapped.id as string,
    catalogId: (mapped.catalogId as string | null) ?? null,
    businessId: mapped.businessId as string,
    customerId: mapped.customerId as string,
    issuedBy: null,
    code: mapped.code as string,
    publicToken: mapped.publicToken as string,
    status: mapped.status as GiftCard['status'],
    pointsSpent: mapped.pointsSpent as number,
    expiresAt: mapped.expiresAt as string,
    redeemedAt: (mapped.redeemedAt as string | null) ?? null,
    redeemedBy: null,
    redeemedAtBusiness: null,
    createdAt: '',
    updatedAt: '',
    businessName: mapped.businessName as string,
    businessLogoUrl: (mapped.businessLogoUrl as string | null) ?? null,
    businessPrimaryColor: mapped.businessPrimaryColor as string,
    businessAccentColor: mapped.businessAccentColor as string,
    customerFirstName: mapped.customerFirstName as string,
    title: mapped.title as string,
    description: mapped.description as string,
    valueLabel: mapped.valueLabel as string,
    imageUrl: (mapped.imageUrl as string | null) ?? null,
  }
}

function publicGiftCardToGiftCard(card: PublicGiftCard): GiftCard {
  return {
    id: card.id,
    catalogId: card.catalogId,
    businessId: card.businessId,
    customerId: card.customerId,
    issuedBy: null,
    code: card.code,
    publicToken: card.publicToken,
    status: card.status,
    pointsSpent: card.pointsSpent,
    expiresAt: card.expiresAt,
    redeemedAt: card.redeemedAt,
    redeemedBy: null,
    redeemedAtBusiness: null,
    createdAt: card.createdAt,
    updatedAt: card.updatedAt,
    catalog: {
      id: card.catalogId ?? card.id,
      title: card.title,
      description: card.description,
      valueLabel: card.valueLabel,
      imageUrl: card.imageUrl,
    },
    business: {
      id: card.businessId,
      name: card.businessName,
      logoUrl: card.businessLogoUrl,
    },
    customerFirstName: card.customerFirstName,
  }
}

function mapBusinessGiftCard(row: Record<string, unknown>): GiftCard {
  const mapped = camelCaseRow(row)

  return {
    id: mapped.id as string,
    catalogId: (mapped.catalogId as string | null) ?? null,
    businessId: mapped.businessId as string,
    customerId: mapped.customerId as string,
    issuedBy: (mapped.issuedBy as string | null) ?? null,
    code: mapped.code as string,
    publicToken: mapped.publicToken as string,
    status: mapped.status as GiftCard['status'],
    pointsSpent: mapped.pointsSpent as number,
    expiresAt: mapped.expiresAt as string,
    redeemedAt: (mapped.redeemedAt as string | null) ?? null,
    redeemedBy: (mapped.redeemedBy as string | null) ?? null,
    redeemedAtBusiness: (mapped.redeemedAtBusiness as string | null) ?? null,
    createdAt: mapped.createdAt as string,
    updatedAt: mapped.updatedAt as string,
    redemptionOriginalBill: (mapped.redemptionOriginalBill as number | null) ?? null,
    redemptionGiftCardAmount: (mapped.redemptionGiftCardAmount as number | null) ?? null,
    redemptionReceiptNumber: (mapped.redemptionReceiptNumber as string | null) ?? null,
    catalog: {
      id: ((mapped.catalogId as string | null) ?? mapped.id) as string,
      title: mapped.catalogTitle as string,
      description: mapped.catalogDescription as string,
      valueLabel: mapped.catalogValueLabel as string,
      imageUrl: (mapped.catalogImageUrl as string | null) ?? null,
    },
    business: {
      id: mapped.businessId as string,
      name: mapped.businessName as string,
      logoUrl: (mapped.businessLogoUrl as string | null) ?? null,
    },
    customerFirstName: mapped.customerFirstName as string,
  }
}

const giftCardSelect = '*, gift_card_catalog(id, title, description, value_label, image_url), businesses(id, name, logo_url)'

async function enrichGiftCardRows(rows: Record<string, unknown>[]): Promise<GiftCard[]> {
  if (rows.length === 0) return []

  const sb = requireSupabase()
  const catalogIds = [...new Set(rows.map((row) => row.catalog_id).filter(Boolean) as string[])]
  const businessIds = [...new Set(rows.map((row) => row.business_id).filter(Boolean) as string[])]

  const [catalogResult, businessResult] = await Promise.all([
    catalogIds.length > 0
      ? sb
          .from('gift_card_catalog')
          .select('id, title, description, value_label, image_url')
          .in('id', catalogIds)
      : Promise.resolve({ data: [] }),
    businessIds.length > 0
      ? sb
          .from('businesses')
          .select('id, name, logo_url')
          .in('id', businessIds)
      : Promise.resolve({ data: [] }),
  ])

  const catalogById = new Map(
    ((catalogResult.data ?? []) as Record<string, unknown>[]).map((catalog) => [catalog.id as string, catalog]),
  )
  const businessById = new Map(
    ((businessResult.data ?? []) as Record<string, unknown>[]).map((business) => [business.id as string, business]),
  )

  return rows.map((row) => {
    const enrichedRow = { ...row }
    const catalog = catalogById.get(row.catalog_id as string)
    const business = businessById.get(row.business_id as string)

    if (catalog) enrichedRow.gift_card_catalog = catalog
    if (business) enrichedRow.businesses = business

    return mapGiftCard(enrichedRow)
  })
}

export const giftCardsService = {
  async issueGiftCard(catalogId: string, customerId: string): Promise<GiftCard> {
    const sb = requireSupabase()

    const { data, error } = await sb.rpc('issue_gift_card', {
      p_catalog_id: catalogId,
      p_customer_id: customerId,
    })

    const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null
    if (error || !row) throw new Error(friendlySupabaseError(error, 'Failed to issue gift card.'))

    return this.getGiftCardById(row.id as string).then((giftCard) => giftCard ?? mapGiftCard(row))
  },

  async redeemGiftCard(
    giftCardId: string,
    businessId: string,
    transaction?: {
      originalBill: number
      receiptNumber: string
      giftCardAmount: number
      clientRequestId: string
    },
  ): Promise<GiftCard> {
    const sb = requireSupabase()

    const { data, error } = await sb.rpc('redeem_gift_card', {
      p_gift_card_id: giftCardId,
      p_business_id: businessId,
      p_original_bill: transaction?.originalBill ?? null,
      p_receipt_number: transaction?.receiptNumber ?? null,
      p_gift_card_amount: transaction?.giftCardAmount ?? null,
      p_client_request_id: transaction?.clientRequestId ?? null,
    })

    const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null
    if (error || !row) throw new Error(friendlySupabaseError(error, 'Failed to redeem gift card.'))

    return this.getGiftCardById(row.id as string).then((giftCard) => {
      if (!giftCard) throw new Error('Redeemed gift card could not be loaded.')
      return giftCard
    })
  },

  async getMyGiftCards(): Promise<GiftCard[]> {
    const sb = requireSupabase()

    const { data, error } = await sb
      .from('gift_cards')
      .select(giftCardSelect)
      .order('created_at', { ascending: false })

    if (error) {
      const { data: plainData, error: plainError } = await sb
        .from('gift_cards')
        .select('*')
        .order('created_at', { ascending: false })

      if (plainError) throw new Error('Failed to load your gift cards.')
      return enrichGiftCardRows((plainData ?? []) as Record<string, unknown>[])
    }

    return ((data ?? []) as Record<string, unknown>[]).map(mapGiftCard)
  },

  async getGiftCardsForBusiness(businessId?: string): Promise<GiftCard[]> {
    const sb = requireSupabase()

    if (businessId) {
      const { data, error } = await sb.rpc('get_business_gift_cards', {
        p_business_id: businessId,
      })

      if (!error) return ((data ?? []) as Record<string, unknown>[]).map(mapBusinessGiftCard)
    }

    let query = sb
      .from('gift_cards')
      .select(giftCardSelect)
      .order('created_at', { ascending: false })

    if (businessId) {
      query = query.eq('business_id', businessId)
    }

    const { data, error } = await query

    if (error) throw new Error('Failed to load business gift cards.')
    return ((data ?? []) as Record<string, unknown>[]).map(mapGiftCard)
  },

  async getPublicGiftCard(token: string): Promise<PublicGiftCard | null> {
    const sb = requireSupabase()

    const { data, error } = await sb.rpc('get_public_gift_card_by_token', {
      p_token: token,
    })

    if (error) throw new Error(error.message)
    const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null
    return row ? mapPublicGiftCard(row) : null
  },

  async findGiftCardByTokenOrCode(input: string): Promise<GiftCard | null> {
    const tokenOrCode = input.trim()
    if (!tokenOrCode) return null

    const publicCard = await this.getPublicGiftCard(tokenOrCode)
    return publicCard ? publicGiftCardToGiftCard(publicCard) : null
  },

  async getGiftCardById(id: string): Promise<GiftCard | null> {
    const sb = requireSupabase()

    const { data, error } = await sb
      .from('gift_cards')
      .select(giftCardSelect)
      .eq('id', id)
      .maybeSingle()

    if (data) return mapGiftCard(data as Record<string, unknown>)
    if (!error) return null

    const { data: plainData, error: plainError } = await sb
      .from('gift_cards')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (plainError || !plainData) return null

    const enrichedRow: Record<string, unknown> = { ...(plainData as Record<string, unknown>) }
    const catalogId = enrichedRow.catalog_id as string | null | undefined
    const businessId = enrichedRow.business_id as string | null | undefined

    const [catalogResult, businessResult] = await Promise.all([
      catalogId
        ? sb
            .from('gift_card_catalog')
            .select('id, title, description, value_label, image_url')
            .eq('id', catalogId)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      businessId
        ? sb
            .from('businesses')
            .select('id, name, logo_url')
            .eq('id', businessId)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ])

    if (catalogResult.data) enrichedRow.gift_card_catalog = catalogResult.data
    if (businessResult.data) enrichedRow.businesses = businessResult.data

    return mapGiftCard(enrichedRow)
  },
}
