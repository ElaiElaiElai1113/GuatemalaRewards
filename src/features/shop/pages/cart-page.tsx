import { Link } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingState } from '@/components/ui/loading-state'
import { Skeleton } from '@/components/ui/skeleton'
import { normalizeCheckoutItems } from '@/features/critical-flows/critical-flow'
import { CartItemRow } from '@/features/shop/components/cart-item-row'
import { useBusinesses, useCart, useProducts, useRemoveFromCart, useUpdateCartItem } from '@/hooks/use-customer-data'
import { useLanguage } from '@/lib/language'
import { formatCurrency } from '@/lib/utils'

export function CartPage() {
  const cart = useCart()
  const { t } = useLanguage()
  const products = useProducts()
  const businesses = useBusinesses()
  const updateCartItem = useUpdateCartItem()
  const removeCartItem = useRemoveFromCart()

  const cartItems = cart.data ?? []
  const allProducts = products.data ?? []

  const resolvedItems = cartItems
    .map((item) => {
      const product = allProducts.find((p) => p.id === item.productId)
      return product ? { product, quantity: item.quantity } : null
    })
    .filter(Boolean) as { product: typeof allProducts[0]; quantity: number }[]

  let cartValidationError: string | null = null
  let checkoutBusinessId = resolvedItems[0]?.product.businessId

  try {
    checkoutBusinessId = normalizeCheckoutItems(
      resolvedItems.map(({ product, quantity }) => ({
        productId: product.id,
        businessId: product.businessId,
        quantity,
      })),
    ).businessId
  } catch (error) {
    cartValidationError = error instanceof Error ? error.message : t('Your cart is invalid.')
  }

  const subtotal = resolvedItems.reduce((sum, { product, quantity }) => sum + product.price * quantity, 0)
  const business = businesses.data?.find((row) => row.id === checkoutBusinessId)
  const taxRate = business?.taxRate ?? 0.09
  const tax = +(subtotal * taxRate).toFixed(2)
  const total = +(subtotal + tax).toFixed(2)
  const earnRate = business?.earnRate ?? 10
  const estimatedPoints = Math.floor(total * earnRate)

  return (
    <div className="space-y-16 pb-20">
      <div className="space-y-4 max-w-2xl">
        <Badge variant="accent" className="bg-tertiary/20 text-primary">
          {t('Cart')}
        </Badge>
        <h1 className="font-serif text-5xl tracking-tight text-primary md:text-7xl leading-[1.1]">
          {t('Your Cart')}
        </h1>
      </div>

      {cart.isLoading || products.isLoading ? (
        <div className="space-y-6">
          <LoadingState
            className="py-2"
            title={t('Loading')}
            description={t('Checking your cart.')}
          />
          <div className="grid gap-16 lg:grid-cols-[1fr_380px]">
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-32 rounded-2xl" />
              ))}
            </div>
            <Skeleton className="h-80 rounded-[2rem]" />
          </div>
        </div>
      ) : resolvedItems.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="size-8" />}
          title={t('Your cart is empty')}
          description={t('Pick products from participating businesses before checking out.')}
          action={
            <Button asChild variant="default" size="lg" className="rounded-full">
              <Link to="/shop">{t('Browse businesses')}</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-16 lg:grid-cols-[1fr_380px]">
          <div className="space-y-4">
            {resolvedItems.map(({ product, quantity }) => (
              <CartItemRow
                key={product.id}
                product={product}
                quantity={quantity}
                onUpdateQuantity={(id, qty) => updateCartItem.mutate({ productId: id, quantity: qty })}
                onRemove={(id) => removeCartItem.mutate(id)}
              />
            ))}
          </div>

          <div className="rounded-[2rem] bg-surface-low p-8 border border-outline-variant/10 shadow-card space-y-6 h-fit sticky top-32">
            <h2 className="font-serif text-3xl text-primary">{t('Order Summary')}</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-on-surface-variant">
                <span>{t('Subtotal')}</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-on-surface-variant">
                <span>{t('Tax')} ({(taxRate * 100).toFixed(2)}%)</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <div className="border-t border-outline-variant/10 pt-3 flex justify-between font-bold text-primary text-lg">
                <span>{t('Total')}</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
            <div className="rounded-xl bg-tertiary/20 p-4 text-sm">
              <span className="font-bold text-primary">+{estimatedPoints} {t('points')}</span>
              <span className="text-on-surface-variant/80"> {t('estimated after partner staff scan your QR at purchase')}</span>
            </div>
            {cartValidationError ? (
              <p className="text-sm font-semibold text-red-500">{cartValidationError}</p>
            ) : null}
            <Button
              asChild={!cartValidationError}
              variant="default"
              size="lg"
              className="w-full rounded-full h-14"
              disabled={Boolean(cartValidationError)}
            >
              {cartValidationError ? (
                <span>{t('Checkout blocked')}</span>
              ) : (
                <Link to="/checkout">{t('Proceed to Checkout')}</Link>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
