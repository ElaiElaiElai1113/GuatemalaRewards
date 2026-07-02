import { zodResolver } from '@hookform/resolvers/zod'
import { Copy, QrCode } from 'lucide-react'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { QRCodeSVG } from 'qrcode.react'
import { Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { normalizeCheckoutItems } from '@/features/critical-flows/critical-flow'
import { EarnRedeemGate } from '@/features/membership/components/earn-redeem-gate'
import { VerificationStatusNotice } from '@/features/membership/components/verification-status-notice'
import { useAuth } from '@/hooks/use-auth'
import { useBusinesses, useCart, usePlaceOrder, useProducts } from '@/hooks/use-customer-data'
import { useLanguage } from '@/lib/language'
import { formatCurrency } from '@/lib/utils'
import type { CheckoutFormValues } from '@/types/forms'
import { checkoutSchema } from '@/types/forms'

export function CheckoutPage() {
  const navigate = useNavigate()
  const cart = useCart()
  const { profile } = useAuth()
  const { t } = useLanguage()
  const products = useProducts()
  const businesses = useBusinesses()
  const placeOrder = usePlaceOrder(profile?.id)

  const [error, setError] = useState<string | null>(null)
  const [partnerCode, setPartnerCode] = useState(() => sessionStorage.getItem('partnerReferrerCode') ?? '')

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { paymentMethod: 'visa' },
  })
  const selectedPaymentMethod = useWatch({
    control: form.control,
    name: 'paymentMethod',
  })

  const cartItems = cart.data ?? []
  const allProducts = products.data ?? []

  const resolvedItems = cartItems
    .map((item) => {
      const product = allProducts.find((p) => p.id === item.productId)
      return product ? { product, quantity: item.quantity } : null
    })
    .filter(Boolean) as { product: typeof allProducts[0]; quantity: number }[]

  if (resolvedItems.length === 0) {
    return <Navigate to="/cart" replace />
  }

  let businessId = ''
  let validationError: string | null = null
  let checkoutItems: { productId: string; quantity: number }[] = []

  try {
    const normalized = normalizeCheckoutItems(
      resolvedItems.map(({ product, quantity }) => ({
        productId: product.id,
        businessId: product.businessId,
        quantity,
      })),
    )
    businessId = normalized.businessId
    checkoutItems = normalized.items
  } catch (validationIssue) {
    validationError = validationIssue instanceof Error ? validationIssue.message : t('Your cart is invalid.')
  }

  const subtotal = resolvedItems.reduce((sum, { product, quantity }) => sum + product.price * quantity, 0)
  const business = businesses.data?.find((row) => row.id === businessId)
  const taxRate = business?.taxRate ?? 0.09
  const tax = +(subtotal * taxRate).toFixed(2)
  const total = +(subtotal + tax).toFixed(2)
  const itemCount = resolvedItems.reduce((sum, { quantity }) => sum + quantity, 0)
  const estimatedPoints = Math.floor(total * (business?.earnRate ?? 10))
  const verificationStatus = profile?.verificationStatus ?? 'not_submitted'
  const rewardActionsLocked = verificationStatus !== 'verified'
  const memberQrUrl =
    profile?.memberQrToken && typeof window !== 'undefined'
      ? `${window.location.origin}/business/member-sale/${profile.memberQrToken}`
      : ''

  return (
    <div className="space-y-16 pb-20">
      <div className="space-y-4 max-w-2xl">
        <Badge variant="accent" className="bg-tertiary/20 text-primary">
          {t('Demo Checkout')}
        </Badge>
        <h1 className="font-serif text-5xl tracking-tight text-primary md:text-7xl leading-[1.1]">
          {t('Demo Checkout')}
        </h1>
        <p className="text-base font-medium leading-relaxed text-on-surface-variant/80">
          {t('No real payment will be processed. This purchase creates the order and posts the matching points to your account immediately.')}
        </p>
      </div>

      <div className="grid gap-16 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          <VerificationStatusNotice
            status={verificationStatus}
            rejectionReason={profile?.verificationRejectionReason}
          />
          <section className="rounded-[2rem] border border-outline-variant/10 bg-surface-low p-6 shadow-card">
            <h2 className="font-serif text-3xl text-primary">{t('Checkout summary')}</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-surface-lowest p-4">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-on-surface-variant/70">
                  {t('Items in order')}
                </p>
                <p className="mt-2 text-2xl font-semibold text-primary">{itemCount}</p>
              </div>
              <div className="rounded-2xl bg-surface-lowest p-4">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-on-surface-variant/70">
                  {t('Estimated total')}
                </p>
                <p className="mt-2 text-2xl font-semibold text-primary">{formatCurrency(total)}</p>
              </div>
              <div className="rounded-2xl bg-surface-lowest p-4">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-on-surface-variant/70">
                  {t('Estimated reward impact')}
                </p>
                <p className="mt-2 text-2xl font-semibold text-primary">+{estimatedPoints}</p>
              </div>
            </div>
            {rewardActionsLocked ? (
              <p className="mt-4 rounded-xl bg-warning/10 p-4 text-sm font-semibold text-warning">
                {t('Verification required before earning rewards')}
              </p>
            ) : (
              <p className="mt-4 rounded-xl bg-primary/5 p-4 text-sm font-semibold text-primary">
                {t('Your points will post as soon as the purchase is confirmed.')}
              </p>
            )}

            <div className="mt-6 rounded-2xl border border-outline-variant/10 bg-white p-5">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <QrCode className="size-5" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-serif text-2xl text-primary">Member QR</h3>
                    <p className="max-w-xl text-sm font-medium leading-6 text-on-surface-variant/80">
                      {rewardActionsLocked
                        ? t('Verify your ID first to activate the QR staff will scan at checkout.')
                        : t('If partner staff need to verify your member account during checkout, they can scan this QR.')}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl bg-surface-low p-4">
                  <div className="mx-auto flex size-52 items-center justify-center rounded-xl bg-white p-4">
                    {!rewardActionsLocked && memberQrUrl ? (
                      <QRCodeSVG value={memberQrUrl} size={168} />
                    ) : (
                      <div className="flex size-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-outline-variant/40 bg-[var(--muted)] text-center">
                        <QrCode className="size-14 text-on-surface-variant/30" />
                        <span className="px-4 text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant/60">
                          {t('QR locked')}
                        </span>
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-3 w-full rounded-2xl"
                    disabled={rewardActionsLocked || !memberQrUrl}
                    onClick={async () => {
                      if (rewardActionsLocked || !memberQrUrl) return
                      await navigator.clipboard.writeText(memberQrUrl)
                      toast.success('Member QR link copied')
                    }}
                  >
                    <Copy className="size-4" />
                    Copy QR Link
                  </Button>
                </div>
              </div>
            </div>
          </section>
          <div className="rounded-[2rem] bg-surface-low p-8 border border-outline-variant/10 shadow-card space-y-6">
            <div className="space-y-2">
              <h2 className="font-serif text-3xl text-primary">{t('Simulated Payment Method')}</h2>
              <p className="text-sm font-medium text-on-surface-variant/75">
                {t('Use the preset demo payment options below. They do not charge a real card.')}
              </p>
            </div>
            <form
              className="space-y-6"
              onSubmit={form.handleSubmit(async (values) => {
                if (validationError) {
                  setError(validationError)
                  return
                }
                if (rewardActionsLocked) {
                  setError('Verification required before earning rewards')
                  return
                }

                try {
                  setError(null)
                  const order = await placeOrder.mutateAsync({
                    businessId,
                    paymentMethod: values.paymentMethod,
                    items: checkoutItems,
                    partnerCode,
                  })
                  toast.success('Purchase made successfully.')
                  if (partnerCode.trim()) {
                    sessionStorage.removeItem('partnerReferrerCode')
                    sessionStorage.removeItem('partnerBusinessId')
                  }
                  navigate('/order-confirmation', { state: { orderId: order.id } })
                } catch (err) {
                  setError(err instanceof Error ? err.message : t('Order failed.'))
                }
              })}
            >
              <div className="grid gap-3">
                <Label>{t('Card Type')}</Label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'visa', label: 'Visa •••• 4242' },
                    { value: 'mastercard', label: 'Mastercard •••• 8888' },
                    { value: 'applepay', label: 'Apple Pay' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => form.setValue('paymentMethod', option.value as 'visa' | 'mastercard' | 'applepay')}
                      className={`rounded-2xl border p-4 text-sm font-medium transition-all ${
                        selectedPaymentMethod === option.value
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-outline-variant/20 text-on-surface-variant hover:border-outline-variant/40'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3">
                <Label htmlFor="card-number">{t('Card Number')}</Label>
                <Input id="card-number" value="4242 4242 4242 4242" disabled />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-3">
                  <Label>{t('Expiry')}</Label>
                  <Input value="12/28" disabled />
                </div>
                <div className="grid gap-3">
                  <Label>{t('CVC')}</Label>
                  <Input value="•••" disabled />
                </div>
              </div>

              <div className="grid gap-3">
                <Label htmlFor="partner-code">Partner Code</Label>
                <Input
                  id="partner-code"
                  value={partnerCode}
                  placeholder="Optional front-desk or receptionist code"
                  className="uppercase"
                  onChange={(event) => setPartnerCode(event.target.value.toUpperCase())}
                />
                <p className="text-xs text-on-surface-variant/75">
                  Add a receptionist or front-desk code if someone from a hotel, hostel, or partner business referred you.
                </p>
              </div>

              {(validationError || error) && (
                <p className="text-sm font-bold text-red-500 text-center">{validationError ?? error}</p>
              )}

              <EarnRedeemGate action="earn">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full rounded-full h-16 text-lg font-bold shadow-card"
                  disabled={placeOrder.isPending || Boolean(validationError) || rewardActionsLocked}
                  isLoading={placeOrder.isPending}
                >
                  {rewardActionsLocked
                    ? t('Verify ID to place order')
                    : placeOrder.isPending
                      ? t('Placing Order...')
                      : `${t('Place order request')} ${formatCurrency(total)}`}
                </Button>
              </EarnRedeemGate>
            </form>
          </div>
        </div>

        <div className="rounded-[2rem] bg-surface-low p-8 border border-outline-variant/10 shadow-card space-y-6 h-fit sticky top-32">
          <h2 className="font-serif text-2xl text-primary">{t('Order Summary')}</h2>
          <div className="space-y-3">
            {resolvedItems.map(({ product, quantity }) => (
              <div key={product.id} className="flex justify-between text-sm">
                <span className="text-on-surface-variant">{t(product.title)} x{quantity}</span>
                <span className="text-primary font-medium">{formatCurrency(product.price * quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-outline-variant/10 pt-3 space-y-2 text-sm">
            <div className="flex justify-between text-on-surface-variant">
              <span>{t('Subtotal')}</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>{t('Tax')}</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between font-bold text-primary text-lg pt-2 border-t border-outline-variant/10">
              <span>{t('Total')}</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
            <div className="rounded-xl bg-tertiary/20 p-4 text-sm">
              <span className="font-bold text-primary">+{estimatedPoints} {t('points')}</span>
              <span className="text-on-surface-variant/80"> {t('will post after checkout')}</span>
            </div>
        </div>
      </div>
    </div>
  )
}
