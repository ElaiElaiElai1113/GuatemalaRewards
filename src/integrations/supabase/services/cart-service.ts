import { readCart, writeCart, clearCart } from '@/lib/mock-store'
import type { CartItem } from '@/types/domain'

export const cartService = {
  async getCart(): Promise<CartItem[]> {
    return readCart()
  },

  async addItem(productId: string, quantity: number = 1): Promise<CartItem[]> {
    const items = readCart()
    const existing = items.find((i) => i.productId === productId)
    if (existing) {
      existing.quantity += quantity
    } else {
      items.push({ productId, quantity })
    }
    writeCart(items)
    return items
  },

  async updateQuantity(productId: string, quantity: number): Promise<CartItem[]> {
    let items = readCart()
    if (quantity <= 0) {
      items = items.filter((i) => i.productId !== productId)
    } else {
      const item = items.find((i) => i.productId === productId)
      if (item) item.quantity = quantity
    }
    writeCart(items)
    return items
  },

  async removeItem(productId: string): Promise<CartItem[]> {
    const items = readCart().filter((i) => i.productId !== productId)
    writeCart(items)
    return items
  },

  async emptyCart(): Promise<void> {
    clearCart()
  },
}
