import { Link } from 'react-router-dom'
import { Gift } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingState } from '@/components/ui/loading-state'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useLanguage } from '@/lib/language'
import type { GiftCard, GiftCardStatus } from '@/types/domain'
import { useMyGiftCards } from '../hooks/use-gift-cards'

function GiftCardRow({ card }: { card: GiftCard }) {
  return (
    <Link
      to={`/wallet/gift-cards/${card.id}`}
      className="rounded-xl border border-[var(--border)] bg-white shadow-sm flex flex-col gap-4 p-5 transition-all hover:border-primary-container/35 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-4">
        <div className="flex size-12 items-center justify-center rounded border border-primary-container/35 bg-primary-container/10 text-primary-container">
          <Gift className="size-6" />
        </div>
        <div>
          <h3 className="font-serif text-2xl font-semibold uppercase tracking-[0.02em] text-primary-container">
            {card.catalog?.title ?? 'Gift card'}
          </h3>
          <p className="text-sm text-on-surface-variant">{card.business?.name}</p>
          <p className="mt-2 font-mono text-sm text-on-surface">{card.code}</p>
        </div>
      </div>
      <Badge variant={card.status === 'active' ? 'accent' : 'outline'}>{card.status}</Badge>
    </Link>
  )
}

export function WalletGiftCardsPage() {
  const { t } = useLanguage()
  const giftCards = useMyGiftCards()
  const cards = giftCards.data ?? []

  function byStatus(status: GiftCardStatus) {
    return cards.filter((card) => card.status === status)
  }

  function emptyDescription(status: GiftCardStatus) {
    if (status === 'active') return 'Gift cards you can still use will appear here.'
    if (status === 'redeemed') return 'Redeemed gift cards appear here after partner staff scan and redeem them.'
    return 'Expired gift cards will appear here after their use-by date passes.'
  }

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-4">
          <Badge variant="accent">Wallet</Badge>
          <h1 className="font-serif text-5xl font-bold uppercase tracking-[0.02em] text-primary-container">
            Gift Cards
          </h1>
          <p className="text-on-surface-variant">Keep active, redeemed, and expired cards in one place.</p>
        </div>
        <Button asChild variant="secondary">
          <Link to="/gift-cards">Browse Gift Cards</Link>
        </Button>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active ({byStatus('active').length})</TabsTrigger>
          <TabsTrigger value="redeemed">Redeemed ({byStatus('redeemed').length})</TabsTrigger>
          <TabsTrigger value="expired">Expired ({byStatus('expired').length})</TabsTrigger>
        </TabsList>
        {(['active', 'redeemed', 'expired'] as const).map((status) => (
          <TabsContent key={status} value={status} className="space-y-4">
            {giftCards.isLoading ? (
              <>
                <LoadingState
                  className="py-2"
                  title={t('Loading')}
                  description={t('Opening your gift card wallet.')}
                />
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-28 rounded-xl" />
                ))}
              </>
            ) : (
              byStatus(status).map((card) => <GiftCardRow key={card.id} card={card} />)
            )}
            {!giftCards.isLoading && byStatus(status).length === 0 ? (
              <EmptyState
                icon={<Gift className="size-8" />}
                title={t('No gift cards here')}
                description={t(emptyDescription(status))}
                action={
                  status === 'active' ? (
                    <Button asChild variant="secondary" className="rounded-full">
                      <Link to="/gift-cards">{t('Browse Gift Cards')}</Link>
                    </Button>
                  ) : undefined
                }
              />
            ) : null}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
