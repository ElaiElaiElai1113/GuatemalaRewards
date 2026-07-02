export interface CheckoutResolutionItem {
  productId: string
  businessId: string
  quantity: number
}

export interface CheckoutPayloadItem {
  productId: string
  quantity: number
}

export const VALID_PICKUP_WINDOWS = ['Now', 'Within 30 mins', 'Later today'] as const

export type PickupWindow = (typeof VALID_PICKUP_WINDOWS)[number]

export function createClientRequestId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `fallback-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function isPickupWindow(value: string): value is PickupWindow {
  return (VALID_PICKUP_WINDOWS as readonly string[]).includes(value)
}

export function normalizeCheckoutItems(items: CheckoutResolutionItem[]) {
  if (items.length === 0) {
    throw new Error('Your cart is empty.')
  }

  const businessIds = new Set(items.map((item) => item.businessId))
  if (businessIds.size !== 1) {
    throw new Error('Checkout supports one business at a time. Remove other items from your cart first.')
  }

  const aggregated = new Map<string, number>()
  for (const item of items) {
    if (!item.productId || item.quantity <= 0) {
      throw new Error('Your cart contains an invalid item.')
    }

    aggregated.set(item.productId, (aggregated.get(item.productId) ?? 0) + item.quantity)
  }

  return {
    businessId: items[0].businessId,
    items: Array.from(aggregated.entries()).map(([productId, quantity]) => ({
      productId,
      quantity,
    })) satisfies CheckoutPayloadItem[],
  }
}
