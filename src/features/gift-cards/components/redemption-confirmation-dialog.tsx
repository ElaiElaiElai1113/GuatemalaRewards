import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { GiftCard } from '@/types/domain'

interface RedemptionConfirmationDialogProps {
  giftCard: GiftCard | null
  open: boolean
  isSubmitting: boolean
  appliedAmount?: number
  remainingAfterUse?: number
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function RedemptionConfirmationDialog({
  giftCard,
  open,
  isSubmitting,
  appliedAmount = 0,
  remainingAfterUse,
  onOpenChange,
  onConfirm,
}: RedemptionConfirmationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Redeem gift card</DialogTitle>
          <DialogDescription>
            {giftCard
              ? `Use ${giftCard.valueCurrency} ${appliedAmount.toFixed(2)} from ${giftCard.catalog?.title ?? giftCard.code} for ${giftCard.customerFirstName ?? 'this customer'}? Remaining balance will be ${giftCard.valueCurrency} ${(remainingAfterUse ?? Math.max(giftCard.remainingValueAmount - appliedAmount, 0)).toFixed(2)}.`
              : ''}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" variant="secondary" disabled={!giftCard || isSubmitting} isLoading={isSubmitting} onClick={onConfirm}>
            {isSubmitting ? 'Redeeming...' : 'Redeem'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
