import type { CheckoutPayloadItem } from '@/features/critical-flows/critical-flow'
import { createClientRequestId, normalizeCheckoutItems } from '@/features/critical-flows/critical-flow'
import { clearCart } from '@/lib/mock-store'
import type { Order, OrderLineItem } from '@/types/domain'
import { partnerService } from './partner-service'
import { camelCaseRow, friendlySupabaseError, requireSupabase } from './shared'

function mapOrder(orderRow: Record<string, unknown>): Order {
  const o = camelCaseRow(orderRow)
  const lineItems = (orderRow.order_line_items ?? []) as Record<string, unknown>[]
  const items: OrderLineItem[] = lineItems.map((li) => {
    const l = camelCaseRow(li)
    return {
      productId: l.productId as string,
      productTitle: l.productTitle as string,
      unitPrice: Number(l.unitPrice),
      quantity: l.quantity as number,
      subtotal: Number(l.subtotal),
    }
  })

  return {
    id: o.id as string,
    profileId: o.profileId as string,
    businessId: o.businessId as string,
    items,
    subtotal: Number(o.subtotal),
    tax: Number(o.tax),
    total: Number(o.total),
    pointsEarned: o.pointsEarned as number,
    pointsStatus: o.pointsStatus as Order['pointsStatus'],
    paymentMethod: o.paymentMethod as string,
    status: o.status as Order['status'],
    createdAt: o.createdAt as string,
  }
}

export const ordersService = {
  async getOrders(profileId: string): Promise<Order[]> {
    const sb = requireSupabase()

    const { data, error } = await sb
      .from('orders')
      .select('*, order_line_items(*)')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })

    if (error) throw new Error('Failed to load orders.')

    return (data as Record<string, unknown>[]).map(mapOrder)
  },

  async getOrderById(orderId: string): Promise<Order | null> {
    const sb = requireSupabase()

    const { data, error } = await sb
      .from('orders')
      .select('*, order_line_items(*)')
      .eq('id', orderId)
      .single()

    if (error || !data) return null

    return mapOrder(data as Record<string, unknown>)
  },

  async placeOrder(
    profileId: string,
    businessId: string,
    paymentMethod: string,
    items: CheckoutPayloadItem[],
    partnerCode?: string | null,
  ): Promise<Order> {
    const sb = requireSupabase()
    if (items.length === 0) throw new Error('Your cart is empty.')

    const productIds = items.map((item) => item.productId)
    const { data: productRows, error: productsError } = await sb
      .from('products')
      .select('id, business_id, title, price')
      .in('id', productIds)

    if (productsError) throw new Error('Failed to load products.')

    const productMap = new Map((productRows ?? []).map((row) => [row.id as string, row]))
    const lineItems: OrderLineItem[] = items.map((item) => {
      const product = productMap.get(item.productId)
      if (!product) throw new Error(`Product ${item.productId} not found.`)

      return {
        productId: product.id as string,
        productTitle: product.title as string,
        unitPrice: Number(product.price),
        quantity: item.quantity,
        subtotal: Number(product.price) * item.quantity,
      }
    })

    const normalized = normalizeCheckoutItems(
      items.map((item) => {
        const product = productMap.get(item.productId)
        if (!product) throw new Error(`Product ${item.productId} not found.`)

        return {
          productId: item.productId,
          businessId: product.business_id as string,
          quantity: item.quantity,
        }
      }),
    )

    if (normalized.businessId !== businessId) {
      throw new Error('Checkout supports one business at a time. Remove other items from your cart first.')
    }

    const sanitizedPartnerCode = partnerCode?.trim().toUpperCase() ?? ''
    if (sanitizedPartnerCode) {
      await partnerService.attributePartnerReferral(sanitizedPartnerCode, profileId, businessId)
    }

    const { data, error } = await sb.rpc('place_order', {
      p_business_id: businessId,
      p_payment_method: paymentMethod,
      p_items: normalized.items.map((item) => ({
        product_id: item.productId,
        quantity: item.quantity,
      })),
      p_client_request_id: createClientRequestId(),
    })

    const orderRow = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null
    if (error || !orderRow) {
      throw new Error(friendlySupabaseError(error, 'Failed to create order.'))
    }

    clearCart()

    const mappedOrder = mapOrder({
      ...orderRow,
      order_line_items: lineItems.map((item) => ({
        product_id: item.productId,
        product_title: item.productTitle,
        unit_price: item.unitPrice,
        quantity: item.quantity,
        subtotal: item.subtotal,
      })),
    })

    if (mappedOrder.profileId !== profileId) {
      throw new Error('Order was created for the wrong member.')
    }

    return mappedOrder
  },
}
