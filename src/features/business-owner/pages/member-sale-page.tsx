import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle, DollarSign, IdCard, ReceiptText } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useParams } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingState } from '@/components/ui/loading-state'
import { Textarea } from '@/components/ui/textarea'
import { createClientRequestId } from '@/features/critical-flows/critical-flow'
import {
  calculateMemberTransaction,
  calculateRewardablePurchaseAmount,
} from '@/features/critical-flows/member-transaction'
import {
  useBusinessOwnerData,
  useRecordMemberTransaction,
  useScannedMember,
} from '@/hooks/use-business-owner-data'
import { formatCurrency, formatPoints } from '@/lib/utils'
import { memberTransactionSchema, type MemberTransactionFormValues } from '@/types/forms'
import type { MemberTransaction } from '@/types/domain'

type GiftCardSaleContext = {
  originalBill: number
  giftCardAmount: number
  giftCardCode?: string
  receiptNumber?: string
}

const GIFT_CARD_SALE_CONTEXT_KEY = 'Guatemala-rewards:pending-gift-card-sale'

function readGiftCardSaleContext(): GiftCardSaleContext | null {
  if (typeof window === 'undefined') return null

  const raw = window.sessionStorage.getItem(GIFT_CARD_SALE_CONTEXT_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Partial<GiftCardSaleContext>
    const originalBill = Number(parsed.originalBill)
    const giftCardAmount = Number(parsed.giftCardAmount)
    if (!Number.isFinite(originalBill) || !Number.isFinite(giftCardAmount)) return null

    return {
      originalBill,
      giftCardAmount,
      giftCardCode: parsed.giftCardCode,
      receiptNumber: parsed.receiptNumber,
    }
  } catch {
    return null
  }
}

export function MemberSalePage() {
  const { token = '' } = useParams()
  const { business } = useBusinessOwnerData()
  const member = useScannedMember(token)
  const [recordedTransaction, setRecordedTransaction] = useState<MemberTransaction | null>(null)
  const [giftCardSaleContext, setGiftCardSaleContext] = useState<GiftCardSaleContext | null>(() => readGiftCardSaleContext())
  const recordTransaction = useRecordMemberTransaction(business?.id, member.data?.id)

  const form = useForm<MemberTransactionFormValues>({
    resolver: zodResolver(memberTransactionSchema),
    defaultValues: {
      purchaseAmount: 50,
      giftCardAmount: 0,
      receiptNumber: '',
      note: '',
    },
    mode: 'onChange',
  })

  const purchaseAmount = useWatch({
    control: form.control,
    name: 'purchaseAmount',
  })
  const giftCardAmount = useWatch({
    control: form.control,
    name: 'giftCardAmount',
  })
  const rewardableBreakdown = useMemo(() => {
    if (!business || !Number.isFinite(purchaseAmount) || purchaseAmount <= 0) return null

    return calculateRewardablePurchaseAmount({
      receiptTotal: purchaseAmount,
      taxRate: business.taxRate,
      taxIncludedInBill: business.taxIncludedInBill,
      serviceChargeRate: business.serviceChargeRate,
      serviceChargeEnabled: business.serviceChargeEnabled,
      giftCardAmount: giftCardAmount ?? 0,
    })
  }, [business, giftCardAmount, purchaseAmount])

  const preview = useMemo(() => {
    if (!business || !rewardableBreakdown || rewardableBreakdown.rewardableAmount <= 0) return null

    return calculateMemberTransaction({
      purchaseAmount: rewardableBreakdown.rewardableAmount,
      rewardRatePercent: business.rewardRatePercent,
      commissionRatePercent: business.commissionRatePercent,
    })
  }, [business, rewardableBreakdown])

  useEffect(() => {
    if (!giftCardSaleContext) return

    form.setValue('purchaseAmount', giftCardSaleContext.originalBill, {
      shouldDirty: true,
      shouldValidate: true,
    })
    form.setValue('giftCardAmount', giftCardSaleContext.giftCardAmount, {
      shouldDirty: true,
      shouldValidate: true,
    })
    if (giftCardSaleContext.receiptNumber) {
      form.setValue('receiptNumber', giftCardSaleContext.receiptNumber, {
        shouldDirty: true,
        shouldValidate: true,
      })
    }
  }, [form, giftCardSaleContext])

  if (member.isLoading || !business) {
    return <LoadingState title="Loading member" description="Preparing the scanned member sale." />
  }

  if (!member.data) {
    return (
      <EmptyState
        icon={<IdCard className="size-8" />}
        title="Member QR not found"
        description="Ask the customer to open their current member QR code and scan again."
      />
    )
  }

  const rewardValue = preview?.rewardValue ?? 0
  const pointsAwarded = preview?.pointsAwarded ?? 0
  const commissionAmount = preview?.commissionAmount ?? 0
  const isMemberVerified = member.data.verificationStatus === 'verified'

  return (
    <div className="mx-auto max-w-5xl space-y-10 pb-20">
      <div className="space-y-4 border-b border-outline-variant/10 pb-8">
        <Badge variant={isMemberVerified ? 'accent' : 'outline'} className="w-fit">
          {isMemberVerified ? 'Verified member' : 'Verification required'}
        </Badge>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-serif text-5xl tracking-tight text-primary">Record Member Sale</h1>
            <p className="mt-3 text-lg text-on-surface-variant/85">
              {business.name} can record an outside-app purchase and award rewards automatically.
            </p>
          </div>
          <div className="rounded-2xl border border-outline-variant/20 bg-card px-5 py-4">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/70">Member</p>
            <p className="font-serif text-2xl text-primary">{member.data.fullName}</p>
            <p className="text-sm text-on-surface-variant/75">{member.data.email}</p>
          </div>
        </div>
      </div>

      {recordedTransaction ? (
        <div className="rounded-3xl border border-success/20 bg-success/10 p-8">
          <div className="flex items-start gap-4">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-success/15 text-success">
              <CheckCircle className="size-6" />
            </div>
            <div className="space-y-2">
              <h2 className="font-serif text-3xl text-primary">Transaction recorded</h2>
              <p className="text-on-surface-variant/85">
                Awarded {formatPoints(recordedTransaction.pointsAwarded)} points from{' '}
                {formatCurrency(recordedTransaction.purchaseAmount)} of rewardable bill.
              </p>
              <p className="font-mono text-xs text-on-surface-variant/70">ID: {recordedTransaction.id}</p>
            </div>
          </div>
        </div>
      ) : null}

      <form
        className="grid gap-8 lg:grid-cols-[1fr_340px]"
        onSubmit={form.handleSubmit(async (values) => {
          const transaction = await recordTransaction.mutateAsync({
            token,
            purchaseAmount: rewardableBreakdown?.rewardableAmount ?? values.purchaseAmount,
            receiptNumber: values.receiptNumber,
            note: [
              values.note,
              rewardableBreakdown
                ? `Bill before tax/service: ${formatCurrency(rewardableBreakdown.originalReceiptTotal)}; gift card: ${formatCurrency(rewardableBreakdown.giftCardAmount)}; tax added: ${formatCurrency(rewardableBreakdown.taxableChargeAmount)}; service charge added: ${formatCurrency(rewardableBreakdown.serviceChargeAmount)}; customer total: ${formatCurrency(rewardableBreakdown.finalPriceAmount)}.`
                : null,
              giftCardSaleContext?.giftCardCode ? `Gift card code: ${giftCardSaleContext.giftCardCode}.` : null,
            ].filter(Boolean).join(' '),
            clientRequestId: createClientRequestId(),
          })
          setRecordedTransaction(transaction)
          if (typeof window !== 'undefined') {
            window.sessionStorage.removeItem(GIFT_CARD_SALE_CONTEXT_KEY)
          }
          setGiftCardSaleContext(null)
          form.reset({ purchaseAmount: 50, giftCardAmount: 0, receiptNumber: '', note: '' })
        })}
      >
        <div className="rounded-3xl border border-outline-variant/20 bg-card p-8 shadow-sm">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ReceiptText className="size-5" />
            </div>
            <div>
              <h2 className="font-serif text-3xl text-primary">Purchase Details</h2>
              <p className="text-sm text-on-surface-variant/70">Payment is handled outside Guatemala Rewards.</p>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="grid gap-3">
              <Label htmlFor="purchaseAmount">Bill Before Tax/Service</Label>
              <Input
                id="purchaseAmount"
                type="number"
                min="0.01"
                step="0.01"
                className="h-14 rounded-2xl text-lg"
                {...form.register('purchaseAmount', { valueAsNumber: true })}
              />
              {form.formState.errors.purchaseAmount ? (
                <p className="text-sm font-bold text-red-500">{form.formState.errors.purchaseAmount.message}</p>
              ) : (
                <p className="text-sm text-on-surface-variant/70">
                  Enter the bill amount before tax and service charge. Tax and service charge can be added to the customer total, but rewards stay based on this bill amount after any gift card.
                </p>
              )}
            </div>

            {giftCardSaleContext ? (
              <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4 text-sm">
                <p className="font-bold text-primary">Gift card applied from staff scan</p>
                <p className="mt-1 text-on-surface-variant/80">
                  Original bill {formatCurrency(giftCardSaleContext.originalBill)} minus gift card{' '}
                  {formatCurrency(giftCardSaleContext.giftCardAmount)}.
                </p>
              </div>
            ) : null}

            <div className="grid gap-3">
              <Label htmlFor="giftCardAmount">Gift Card / Credit Applied</Label>
              <Input
                id="giftCardAmount"
                type="number"
                min="0"
                step="0.01"
                className="h-14 rounded-2xl text-lg"
                {...form.register('giftCardAmount', { valueAsNumber: true })}
              />
              {form.formState.errors.giftCardAmount ? (
                <p className="text-sm font-bold text-red-500">{form.formState.errors.giftCardAmount.message}</p>
              ) : (
                <p className="text-sm text-on-surface-variant/70">
                  This autofills after a gift card scan. Leave 0 when no gift card was used.
                </p>
              )}
            </div>

            <div className="grid gap-3">
              <Label htmlFor="receiptNumber">Receipt / Bill Number</Label>
              <Input
                id="receiptNumber"
                className="h-14 rounded-2xl text-lg"
                placeholder="Receipt #, factura #, POS bill #"
                {...form.register('receiptNumber')}
              />
              {form.formState.errors.receiptNumber ? (
                <p className="text-sm font-bold text-red-500">{form.formState.errors.receiptNumber.message}</p>
              ) : (
                <p className="text-sm text-on-surface-variant/70">
                  Required. This prevents staff from recording the same bill more than once.
                </p>
              )}
            </div>

            <div className="grid gap-3">
              <Label htmlFor="note">Cashier Note</Label>
              <Textarea
                id="note"
                placeholder="Optional cashier note"
                className="min-h-28 rounded-2xl"
                {...form.register('note')}
              />
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-3xl border border-outline-variant/20 bg-card p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <DollarSign className="size-5" />
              </div>
              <h2 className="font-serif text-2xl text-primary">Preview</h2>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-on-surface-variant/75">Reward rate</span>
                <strong>{business.rewardRatePercent}%</strong>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-on-surface-variant/75">Bill before tax/service</span>
                <strong>{formatCurrency(rewardableBreakdown?.originalReceiptTotal ?? purchaseAmount ?? 0)}</strong>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-on-surface-variant/75">Gift card deducted</span>
                <strong>-{formatCurrency(rewardableBreakdown?.giftCardAmount ?? 0)}</strong>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-on-surface-variant/75">Bill after gift card</span>
                <strong>{formatCurrency(rewardableBreakdown?.amountAfterGiftCard ?? 0)}</strong>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-on-surface-variant/75">
                  {business.taxIncludedInBill ? 'Tax added to customer total' : 'Tax not charged'} {business.taxRate > 0 ? `(${(business.taxRate * 100).toFixed(2)}%)` : ''}
                </span>
                <strong>{business.taxIncludedInBill ? `+${formatCurrency(rewardableBreakdown?.taxableChargeAmount ?? 0)}` : formatCurrency(0)}</strong>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-on-surface-variant/75">
                  Service charge added {business.serviceChargeEnabled ? `(${(business.serviceChargeRate * 100).toFixed(2)}%)` : ''}
                </span>
                <strong>+{formatCurrency(rewardableBreakdown?.serviceChargeAmount ?? 0)}</strong>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-on-surface-variant/75">Customer total</span>
                <strong>{formatCurrency(rewardableBreakdown?.finalPriceAmount ?? 0)}</strong>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-on-surface-variant/75">Rewardable bill</span>
                <strong>{formatCurrency(rewardableBreakdown?.rewardableAmount ?? 0)}</strong>
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-outline-variant/10 pt-4">
                <span className="text-on-surface-variant/75">Reward value</span>
                <strong>{formatCurrency(rewardValue)}</strong>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-on-surface-variant/75">Points awarded</span>
                <strong>{formatPoints(pointsAwarded)}</strong>
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-outline-variant/10 pt-4">
                <span className="text-on-surface-variant/75">Commission owed</span>
                <strong>{formatCurrency(commissionAmount)}</strong>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="h-14 w-full rounded-full font-semibold"
            disabled={!isMemberVerified || !preview || recordTransaction.isPending}
          >
            {recordTransaction.isPending ? 'Recording...' : 'Record Sale'}
          </Button>

          {!isMemberVerified ? (
            <p className="rounded-2xl bg-warning/10 p-4 text-sm font-medium text-warning">
              This member QR is not active yet. Ask the member to complete ID verification before recording rewards.
            </p>
          ) : null}
        </div>
      </form>
    </div>
  )
}
