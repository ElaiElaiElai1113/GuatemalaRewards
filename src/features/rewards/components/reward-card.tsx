import { CheckCircle, Coffee, Cookie, Lock, Shirt, Sparkles, Ticket } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EarnRedeemGate } from '@/features/membership/components/earn-redeem-gate'
import { useMembership } from '@/hooks/use-membership'
import { useLanguage } from '@/lib/language'
import { formatPoints } from '@/lib/utils'
import type { Reward } from '@/types/domain'

interface RewardCardProps {
  reward: Reward
  balancePoints?: number
  businessName?: string
  requirePoints?: boolean
  actionLocked?: boolean
  onRedeem: (reward: Reward) => void
}

export function RewardCard({
  reward,
  balancePoints = 0,
  businessName,
  requirePoints = true,
  actionLocked = false,
  onRedeem,
}: RewardCardProps) {
  const { t } = useLanguage()
  const { isActive: isMembershipActive } = useMembership()
  const hasInventory = reward.inventory > 0
  const hasEnoughPoints = balancePoints >= reward.pointsCost
  const canRedeem = hasInventory && !actionLocked && (!requirePoints || hasEnoughPoints)
  const canOpenMembershipGate = hasInventory && !actionLocked && !isMembershipActive
  const pointsRemaining = Math.max(reward.pointsCost - balancePoints, 0)
  const buttonLabel = actionLocked && hasInventory
    ? 'Verify ID to redeem'
    : !hasInventory
      ? 'Sold Out'
      : canRedeem || canOpenMembershipGate
        ? 'Redeem'
        : 'Need More Points'
  const CategoryIcon =
    reward.category === 'Drink'
      ? Coffee
      : reward.category === 'Pastry'
        ? Cookie
        : reward.category === 'Merch'
          ? Shirt
          : Ticket

  return (
    <div
      data-tenant={reward.businessId}
      className="compact-catalog-card group flex h-full flex-col gap-4 p-4 text-card-foreground transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-card"
    >
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <Badge variant="tenant">
              {t(reward.category)}
            </Badge>
            {businessName && (
              <Badge variant="outline" className="text-[0.7rem] text-[var(--muted-foreground)]">
                {businessName}
              </Badge>
            )}
            {reward.featured ? (
              <Badge variant="accent" className="gap-1 text-[0.62rem]">
                <Sparkles className="size-3" />
                Featured
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="luxe-art relative min-h-32 overflow-hidden rounded-[1.15rem] p-4 shadow-soft">
          <div className="absolute -left-8 -top-10 size-32 rounded-full bg-[var(--champagne)]/20 blur-2xl transition-transform duration-500 group-hover:scale-125" />
          <div className="relative flex h-full items-end justify-between">
            <div>
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.22em] text-[var(--champagne)]/80">
                {canRedeem ? t('Ready to redeem') : t('Unlock the treat')}
              </p>
              <p className="mt-2 font-serif text-3xl leading-none text-[var(--cream)]">
                {formatPoints(reward.pointsCost)}
              </p>
            </div>
            <div className="animate-float-soft flex size-14 items-center justify-center rounded-[1.1rem] border border-[var(--champagne)]/30 bg-[var(--cream)]/12 text-[var(--champagne)] shadow-soft">
              {canRedeem ? <CategoryIcon className="size-7" /> : <Lock className="size-7" />}
            </div>
          </div>
        </div>

        <div className="grow space-y-3">
          <h3 className="text-lg font-bold leading-tight text-[var(--foreground)]">
            {t(reward.title)}
          </h3>
          <p className="line-clamp-2 text-sm leading-5 text-[var(--muted-foreground)]">
            {t(reward.description)}
          </p>
        </div>

        <div className="mt-4 grid gap-3">
          <span className="justify-self-end text-xs font-medium text-[var(--muted-foreground)]">
            {reward.inventory} {t('left')}
          </span>

          <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-24 space-y-1">
            <span className="text-xs font-medium text-[var(--muted-foreground)]">{t('Points Cost')}</span>
            <p className="text-2xl font-semibold text-[var(--tenant-accent)]">
              {formatPoints(reward.pointsCost)}
            </p>
            {!canRedeem && hasInventory && requirePoints ? (
              <p className="text-xs font-medium text-[var(--muted-foreground)]">{formatPoints(pointsRemaining)} {t('points needed')}</p>
            ) : null}
          </div>

          <div className="shrink-0">
            {actionLocked ? (
              <Button
                onClick={() => onRedeem(reward)}
                disabled={!hasInventory}
                variant="outline"
                size="sm"
              >
                {t(buttonLabel)}
              </Button>
            ) : (
              <EarnRedeemGate action="redeem">
                <Button
                  onClick={() => onRedeem(reward)}
                  disabled={!canRedeem && !canOpenMembershipGate}
                  variant={canRedeem || canOpenMembershipGate ? 'tenant' : 'outline'}
                  size="sm"
                >
                  {canRedeem || canOpenMembershipGate ? <CheckCircle className="size-4" /> : null}
                  {t(buttonLabel)}
                </Button>
              </EarnRedeemGate>
            )}
          </div>
          </div>
        </div>
    </div>
  )
}
