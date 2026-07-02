import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { GiftCard } from '@/types/domain'

interface RedemptionConfirmationDialogProps {
  giftCard: GiftCard | null
  open: boolean
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function RedemptionConfirmationDialog({
  giftCard,
  open,
  isSubmitting,
  onOpenChange,
  onConfirm,
}: RedemptionConfirmationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Redeem gift card</DialogTitle>
          <DialogDescription>
            {giftCard ? `Redeem ${giftCard.catalog?.title ?? giftCard.code} for ${giftCard.customerFirstName ?? 'this customer'}? This cannot be undone.` : ''}
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
