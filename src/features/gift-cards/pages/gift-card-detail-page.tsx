import { Link, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/ui/loading-state'
import { Skeleton } from '@/components/ui/skeleton'
import { GiftCardDisplay } from '../components/gift-card-display'
import { useGiftCard } from '../hooks/use-gift-cards'

export function GiftCardDetailPage() {
  const { id } = useParams()
  const giftCard = useGiftCard(id)
  const card = giftCard.data
  const publicUrl = card && typeof window !== 'undefined' ? `${window.location.origin}/g/${card.publicToken}` : ''

  if (giftCard.isLoading) {
    return (
      <div className="space-y-6">
        <LoadingState title="Loading" description="Opening your gift card." />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  if (!card) {
    return <div className="rounded-xl border border-[var(--border)] bg-card shadow-sm p-10 text-on-surface-variant">Gift card not found.</div>
  }

  return (
    <div className="space-y-8 pb-20">
      <Button asChild variant="ghost">
        <Link to="/wallet/gift-cards">Back to Wallet</Link>
      </Button>
      <GiftCardDisplay
        giftCard={card}
        publicUrl={publicUrl}
        title={card.catalog?.title}
        businessName={card.business?.name}
      />
    </div>
  )
}
