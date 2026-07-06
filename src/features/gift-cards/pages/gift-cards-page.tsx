import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Gift, Sparkles, WalletCards } from 'lucide-react'

import { BusinessFilter } from '@/components/business-filter'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingState } from '@/components/ui/loading-state'
import { Skeleton } from '@/components/ui/skeleton'
import { VerificationStatusNotice } from '@/features/membership/components/verification-status-notice'
import { useLanguage } from '@/lib/language'
import { useAuth } from '@/hooks/use-auth'
import { useBusinesses, useRewardBalance } from '@/hooks/use-customer-data'
import type { GiftCardCatalogItem } from '@/types/domain'
import { GiftCardTile } from '../components/gift-card-tile'
import { IssueConfirmationDialog } from '../components/issue-confirmation-dialog'
import { useGiftCardCatalog, useIssueGiftCard } from '../hooks/use-gift-cards'

export function GiftCardsPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { t } = useLanguage()
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<GiftCardCatalogItem | null>(null)
  const [showClaimableOnly, setShowClaimableOnly] = useState(false)
  const businesses = useBusinesses()
  const catalog = useGiftCardCatalog(selectedBusiness ?? undefined)
  const balance = useRewardBalance(profile?.id)
  const issueGiftCard = useIssueGiftCard(profile?.id)
  const balancePoints = balance.data?.points ?? 0
  const verificationStatus = profile?.verificationStatus ?? 'not_submitted'
  const rewardActionsLocked = !profile?.phone?.trim()
  const catalogItems = catalog.data ?? []
  const claimableGiftCards = catalogItems.filter((item) =>
    balancePoints >= item.pointsCost
    && !rewardActionsLocked
  )
  const visibleGiftCards = showClaimableOnly ? claimableGiftCards : catalogItems
  const selectedBusinessName = selectedBusiness
    ? businesses.data?.find((business) => business.id === selectedBusiness)?.name ?? t('Selected business')
    : t('All businesses')
  const emptyStateTitle = showClaimableOnly
    ? 'No claimable gift cards yet'
    : selectedBusiness
      ? 'No gift cards for this business'
      : 'No gift cards yet'
  const emptyStateDescription = showClaimableOnly
    ? 'Earn more points, add contact details, or check back when new gift cards are available.'
    : selectedBusiness
      ? 'Try another business or clear the business filter.'
      : 'Gift cards from partner businesses will appear here when they are available.'

  function handleSelect(item: GiftCardCatalogItem) {
    if (rewardActionsLocked) {
      navigate('/profile')
      return
    }
    setSelectedItem(item)
  }

  async function handleIssue() {
    if (!selectedItem) return
    const giftCard = await issueGiftCard.mutateAsync(selectedItem.id)
    setSelectedItem(null)
    navigate(`/wallet/gift-cards/${giftCard.id}`)
  }

  return (
    <div className="space-y-12 pb-20">
      <div className="animate-soft-reveal flex flex-col gap-8 border-b border-primary-container/15 pb-10 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-4">
          <Badge variant="accent">Gift Cards</Badge>
          <h1 className="font-serif text-4xl font-bold uppercase tracking-[0.02em] text-primary-container sm:text-5xl xl:text-7xl">
            Gift Card Shop
          </h1>
          <p className="text-lg font-medium leading-relaxed text-on-surface-variant/85">
            Use points from member QR purchases to buy existing gift cards from partner businesses.
          </p>
          <Button asChild variant="secondary" className="h-12 rounded-full px-5 font-semibold">
            <Link to="/wallet/gift-cards">
              <WalletCards className="size-4" />
              {t('My Gift Cards')}
            </Link>
          </Button>
        </div>
        <div className="luxe-card flex w-full max-w-xs items-center gap-4 rounded-[1.5rem] px-6 py-4 lg:w-auto">
          <div className="luxe-art flex size-12 items-center justify-center rounded-[1rem]">
            <Gift className="size-6" />
          </div>
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Available Points</p>
            <p className="animate-soft-reveal font-serif text-4xl text-primary-container">{balancePoints}</p>
          </div>
        </div>
      </div>

      <VerificationStatusNotice
        status={verificationStatus}
        rejectionReason={profile?.verificationRejectionReason}
        compact
      />

      <section className="rounded-[1.5rem] border border-primary/15 bg-card/92 p-4 shadow-soft">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-primary">{t('Gift card summary')}</h2>
            <p className="mt-1 text-sm font-medium text-[var(--muted-foreground)]">{selectedBusinessName}</p>
          </div>
          <Button
            type="button"
            variant={showClaimableOnly ? 'tertiary' : 'outline'}
            className="rounded-full"
            onClick={() => setShowClaimableOnly((current) => !current)}
          >
            {t('Claimable')}
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Available points', value: `${balancePoints}` },
            { label: 'Total gift cards', value: `${catalogItems.length}` },
            { label: 'Claimable gift cards', value: `${claimableGiftCards.length}` },
            { label: 'Active business', value: selectedBusinessName },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-[var(--border)] bg-[var(--muted)] px-4 py-3">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                {t(item.label)}
              </p>
              <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="luxe-card relative overflow-hidden rounded-[2rem] p-6 md:p-8">
        <div className="absolute right-8 top-8 h-24 w-40 rotate-6 rounded-[1.5rem] border border-primary/20 bg-blush/60" />
        <div className="absolute bottom-6 right-28 h-20 w-32 -rotate-6 rounded-[1.25rem] border border-primary/20 bg-card shadow-soft" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">Giftable moments</p>
            <h2 className="mt-3 font-serif text-4xl leading-none text-primary-container md:text-5xl">
              Buy a partner gift card with points, then show its QR at that business.
            </h2>
            <p className="mt-4 max-w-2xl text-sm font-medium leading-6 text-on-surface-variant/80">
              Staff redeem the gift card first. Then they scan your member QR and points are awarded only on the remaining bill before tax and service charge.
            </p>
          </div>
          <div className="animate-float-soft flex size-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft">
            <Sparkles className="size-9" />
          </div>
        </div>
      </div>

      {(businesses.data ?? []).length > 1 ? (
        <BusinessFilter businesses={businesses.data ?? []} selected={selectedBusiness} onChange={setSelectedBusiness} />
      ) : null}

      {catalog.isLoading ? (
        <div className="space-y-6">
          <div className="max-w-2xl space-y-2">
            <h2 className="font-serif text-4xl font-semibold leading-none text-primary-container md:text-5xl">
              Featured gift cards
            </h2>
            <p className="text-sm font-medium leading-6 text-on-surface-variant/85">
              A warm showcase for credits that feel personal, pretty, and quick to claim.
            </p>
          </div>
          <LoadingState
            className="py-2"
            title={t('Loading')}
            description={t('Preparing gift cards.')}
          />
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,17rem),1fr))] gap-5">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-64 rounded-xl" />
            ))}
          </div>
        </div>
      ) : visibleGiftCards.length === 0 ? (
        <EmptyState
          icon={<Gift className="size-8" />}
          title={t(emptyStateTitle)}
          description={t(emptyStateDescription)}
        />
      ) : (
        <section className="space-y-5">
          <div className="max-w-2xl space-y-2">
            <h2 className="font-serif text-4xl font-semibold leading-none text-primary-container md:text-5xl">
              Featured gift cards
            </h2>
            <p className="text-sm font-medium leading-6 text-on-surface-variant/85">
              A warm showcase for credits that feel personal, pretty, and quick to claim.
            </p>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,17rem),1fr))] gap-5">
            {visibleGiftCards.map((item) => (
              <GiftCardTile
                key={item.id}
                item={item}
                balancePoints={balancePoints}
                businessName={item.business?.name}
                actionLocked={rewardActionsLocked}
                compact
                onSelect={handleSelect}
              />
            ))}
          </div>
        </section>
      )}

      <IssueConfirmationDialog
        item={selectedItem}
        open={Boolean(selectedItem)}
        isSubmitting={issueGiftCard.isPending}
        onOpenChange={(open) => {
          if (!open) setSelectedItem(null)
        }}
        onConfirm={() => void handleIssue()}
      />
    </div>
  )
}
