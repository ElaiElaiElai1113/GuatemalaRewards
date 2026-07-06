import { type CSSProperties, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'

import { Coffee, Cookie, Gift, Shirt, Ticket } from 'lucide-react'
import { BusinessFilter } from '@/components/business-filter'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { LuxeCarousel } from '@/components/ui/luxe-carousel'
import { LoadingState } from '@/components/ui/loading-state'
import { Skeleton } from '@/components/ui/skeleton'
import { VerificationStatusNotice } from '@/features/membership/components/verification-status-notice'
import { useAuth } from '@/hooks/use-auth'
import { useLoginGate } from '@/hooks/use-login-gate'
import { useMembership } from '@/hooks/use-membership'
import { useBusinesses, useRedeemReward, useRewardBalance, useRewards } from '@/hooks/use-customer-data'
import { useLanguage } from '@/lib/language'
import type { Reward } from '@/types/domain'

import { RedeemRewardPanel } from '../components/redeem-reward-panel'
import { RewardCard } from '../components/reward-card'

const filters = ['All', 'Claimable', 'Drink', 'Pastry', 'Merch', 'Experience'] as const

export function RewardsPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { t } = useLanguage()
  const requireAuth = useLoginGate()
  const { isActive: isMembershipActive } = useMembership()
  const rewardBalance = useRewardBalance(profile?.id)
  const businesses = useBusinesses()
  const redeemReward = useRedeemReward(profile?.id)

  const [selectedReward, setSelectedReward] = useState<Reward | null>(null)
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]>('All')
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null)
  const portalRoot = typeof document === 'undefined' ? null : document.body

  const rewards = useRewards(selectedBusiness ?? undefined)
  const balancePoints = rewardBalance.data?.points ?? 0
  const verificationStatus = profile?.verificationStatus ?? 'not_submitted'
  const rewardActionsLocked = Boolean(profile) && !profile?.phone?.trim()
  const allRewards = rewards.data ?? []
  const claimableRewards = allRewards.filter((reward) =>
    reward.inventory > 0
    && balancePoints >= reward.pointsCost
    && !rewardActionsLocked
    && isMembershipActive
  )
  const categoryFilteredRewards = allRewards.filter((reward) =>
    activeFilter === 'All' || activeFilter === 'Claimable' ? true : reward.category === activeFilter,
  )
  const filteredRewards = activeFilter === 'Claimable'
    ? claimableRewards
    : categoryFilteredRewards
  const featuredRewards = filteredRewards.filter((reward) => reward.featured).slice(0, 5)
  const emptyStateTitle = activeFilter === 'Claimable'
    ? 'No claimable rewards yet'
    : allRewards.length > 0
      ? 'No rewards match this filter'
      : 'No rewards yet'
  const emptyStateDescription = activeFilter === 'Claimable'
    ? 'Earn more points, add contact details, or check back when new rewards are available.'
    : allRewards.length > 0
      ? 'Try a different category or business filter.'
      : 'Rewards from participating businesses will appear here when they are available.'

  const getBusinessName = (businessId: string) =>
    businesses.data?.find((b) => b.id === businessId)?.name ?? ''

  const handleRedeem = (reward: Reward) => {
    requireAuth(() => {
      if (rewardActionsLocked) {
        navigate('/profile')
        return
      }
      setSelectedReward(reward)
    })
  }

  return (
    <div className="ornate-page relative isolate w-full overflow-hidden rounded-[2rem] px-4 py-8 pb-20 sm:px-6 lg:px-8">
      <div className="space-y-12 sm:space-y-16">
      <div className="relative z-10 animate-soft-reveal flex flex-col gap-8 border-b border-primary/15 pb-10 lg:flex-row lg:items-end lg:justify-between">
        <span className="botanical-corner -right-20 top-0 hidden lg:block" />
        <div className="space-y-4 max-w-2xl">
          <Badge variant="accent">
            {t('Rewards Catalog')}
          </Badge>
          <h1 className="font-serif text-[clamp(3rem,7vw,7.5rem)] font-bold uppercase leading-[0.98] tracking-[0.02em] text-primary-container">
            {t('Rewards Marketplace')}
          </h1>
          <p className="text-lg font-medium leading-relaxed text-on-surface-variant/85">
            {t('Use points for perks, reward credits, and offers from participating businesses.')}
          </p>
        </div>

        {profile && (
          <div className="flex flex-col items-start gap-4 lg:items-end">
            <span className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-primary">{t('Your Points')}</span>
            <div className="luxe-card flex items-center gap-4 rounded-[1.5rem] px-6 py-4">
              <div className="luxe-art flex size-12 items-center justify-center rounded-[1rem]">
                <Gift className="size-6" />
              </div>
              <div className="flex flex-col">
                <span className="animate-soft-reveal font-serif text-4xl leading-none text-primary-container">{balancePoints}</span>
                <span className="text-xs font-medium text-[var(--muted-foreground)]">{t('Available Points')}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {!isMembershipActive ? (
        <div className="luxe-card rounded-[1.5rem] p-4 text-sm leading-6 text-[var(--muted-foreground)]">
          <strong className="text-[var(--foreground)]">{t('Membership unlocks redemption.')}</strong>{' '}
          {t('Catalog browsing stays open. Subscribe in demo mode only when you are ready to redeem.')}
        </div>
      ) : null}
      {profile ? (
        <VerificationStatusNotice
          status={verificationStatus}
          rejectionReason={profile.verificationRejectionReason}
          compact
        />
      ) : null}

      <section className="relative z-10 rounded-[1.5rem] border border-primary/15 bg-card/92 p-4 shadow-soft">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-primary">{t('Catalog summary')}</h2>
          <Badge variant="outline" className="rounded-full">
            {t(activeFilter)}
          </Badge>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Available points', value: `${balancePoints}` },
            { label: 'Total rewards', value: `${allRewards.length}` },
            { label: 'Claimable rewards', value: `${claimableRewards.length}` },
            { label: 'Active filter', value: t(activeFilter) },
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

      <div className="relative z-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Drink', icon: Coffee },
          { label: 'Pastry', icon: Cookie },
          { label: 'Merch', icon: Shirt },
          { label: 'Experience', icon: Ticket },
        ].map((category, index) => (
          <div
            key={category.label}
            className="ornate-frame animate-card-stagger flex items-center gap-4 rounded-[1.5rem] p-5"
            style={{ '--stagger': index } as CSSProperties}
          >
            <div className="luxe-art flex size-12 items-center justify-center rounded-[1rem]">
              <category.icon className="size-6" />
            </div>
            <div>
              <p className="font-serif text-2xl leading-none text-primary-container">{t(category.label)}</p>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-on-surface-variant/70">{t('Rewards')}</p>
            </div>
          </div>
        ))}
      </div>

      {featuredRewards.length > 0 ? (
        <LuxeCarousel
          className="relative z-10"
          eyebrow={t('Golden perks')}
          title={t('Featured rewards circle')}
          description={t('Showcase the most tempting redemptions with soft motion, warm highlights, and clear value.')}
        >
          {featuredRewards.map((reward) => (
            <RewardCard
              key={reward.id}
              reward={reward}
              balancePoints={balancePoints}
              businessName={getBusinessName(reward.businessId)}
              requirePoints={Boolean(profile)}
              actionLocked={rewardActionsLocked}
              onRedeem={handleRedeem}
            />
          ))}
        </LuxeCarousel>
      ) : null}

      <div className="sticky top-16 z-40 -mx-4 space-y-3 border-y border-primary/15 bg-card/92 px-4 py-4 shadow-soft backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        {(businesses.data ?? []).length > 1 && (
          <BusinessFilter
            businesses={businesses.data ?? []}
            selected={selectedBusiness}
            onChange={setSelectedBusiness}
          />
        )}
        <div className="flex flex-wrap items-center gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <span className="mr-2 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-primary">{t('Item Type:')}</span>
          {filters.map((filter) => (
            <Button
              key={filter}
              variant={activeFilter === filter ? 'tertiary' : 'ghost'}
              size="sm"
              className={`rounded-full transition-all ${
                activeFilter === filter
                  ? 'px-8'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
              onClick={() => setActiveFilter(filter)}
            >
              {t(filter)}
            </Button>
          ))}
        </div>
      </div>

      {rewards.isLoading ? (
        <div className="relative z-10 space-y-6">
          <LoadingState
            className="py-2"
            title={t('Loading')}
            description={t('Preparing available rewards.')}
          />
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="rounded-[2rem] border border-[var(--border)] bg-white p-6 shadow-sm">
                <Skeleton className="h-7 w-24 rounded-full" />
                <Skeleton className="mt-8 h-9 w-3/4" />
                <Skeleton className="mt-4 h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-2/3" />
                <Skeleton className="mt-8 h-11 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ) : filteredRewards.length === 0 ? (
        <EmptyState
          icon={<Gift className="size-8" />}
          title={t(emptyStateTitle)}
          description={t(emptyStateDescription)}
        />
      ) : (
        <div className="relative z-10 grid gap-8 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 min-[1900px]:grid-cols-5 min-[2400px]:grid-cols-6">
          {filteredRewards.map((reward) => (
            <RewardCard
              key={reward.id}
              reward={reward}
              balancePoints={balancePoints}
              businessName={getBusinessName(reward.businessId)}
              requirePoints={Boolean(profile)}
              actionLocked={rewardActionsLocked}
              onRedeem={handleRedeem}
            />
          ))}
        </div>
      )}

      {selectedReward && portalRoot ? createPortal(
        <>
          <div
            className="fixed inset-0 z-[900] bg-[var(--espresso)]/45 backdrop-blur-sm"
            onClick={() => setSelectedReward(null)}
          />
          <div
            className="rounded-[1.75rem] border border-[var(--primary)]/20 bg-[var(--card)] p-6 text-[var(--foreground)] shadow-luxe sm:p-7"
            style={{
              position: 'fixed',
              left: '50%',
              top: '50%',
              zIndex: 910,
              width: 'min(92vw, 48rem)',
              transform: 'translate(-50%, -50%)',
            }}
          >
              <button
                type="button"
                className="absolute right-5 top-5 rounded-full p-2 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                aria-label={t('Close')}
                onClick={() => setSelectedReward(null)}
              >
                x
              </button>
              <div className="mb-5 grid gap-1.5 pr-10">
                <h2 className="font-serif text-2xl font-semibold text-primary-container">{t('Redeem reward')}</h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  {t('Confirm the reward details, choose a pickup window, and submit.')}
                </p>
              </div>
            <RedeemRewardPanel
              reward={selectedReward}
              balancePoints={balancePoints}
              isSubmitting={redeemReward.isPending}
              onSubmit={async (values) => {
                await redeemReward.mutateAsync({
                  rewardId: selectedReward.id,
                  ...values,
                })
                setSelectedReward(null)
                navigate('/activity')
              }}
            />
          </div>
        </>,
        portalRoot,
      ) : null}
      </div>
    </div>
  )
}
