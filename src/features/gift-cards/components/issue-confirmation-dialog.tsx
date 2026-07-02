import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { GiftCardCatalogItem } from '@/types/domain'

interface IssueConfirmationDialogProps {
  item: GiftCardCatalogItem | null
  open: boolean
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function IssueConfirmationDialog({
  item,
  open,
  isSubmitting,
  onOpenChange,
  onConfirm,
}: IssueConfirmationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Issue gift card</DialogTitle>
          <DialogDescription>
            {item ? `Spend ${item.pointsCost} points for ${item.title}. This card expires in ${item.expiryDays} days.` : ''}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" variant="secondary" disabled={!item || isSubmitting} isLoading={isSubmitting} onClick={onConfirm}>
            {isSubmitting ? 'Issuing...' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
