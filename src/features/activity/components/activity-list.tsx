import { CircleDollarSign, Gift, ShieldCheck, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { useLanguage } from '@/lib/language'
import { formatDate, formatPoints, formatTime } from '@/lib/utils'
import type { Activity } from '@/types/domain'

interface ActivityListProps {
  items: Activity[]
  emptyActionTo?: string
  emptyActionLabel?: string
}

function getIcon(type: Activity['type']) {
  switch (type) {
    case 'earned':
      return CircleDollarSign
    case 'bonus':
      return Sparkles
    case 'adjustment':
      return ShieldCheck
    default:
      return Gift
  }
}

function getActivityKind(type: Activity['type']) {
  switch (type) {
    case 'earned':
      return 'Earned'
    case 'redeemed':
      return 'Redeemed'
    case 'bonus':
      return 'Bonus'
    case 'adjustment':
      return 'Adjusted'
    case 'gift_card_issued':
      return 'Gift card issued'
    case 'gift_card_redeemed':
      return 'Gift card redeemed'
  }
}

export function ActivityList({ items, emptyActionTo, emptyActionLabel }: ActivityListProps) {
  const { t } = useLanguage()

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Gift className="size-8" />}
        title={t('No activity yet')}
        description={t('Points, redemptions, and account activity will appear here.')}
        action={
          emptyActionTo && emptyActionLabel ? (
            <Button asChild>
              <Link to={emptyActionTo}>{t(emptyActionLabel)}</Link>
            </Button>
          ) : undefined
        }
      />
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const Icon = getIcon(item.type)
        const activityKind = getActivityKind(item.type)

        return (
          <div key={item.id} className="group relative flex flex-col gap-4 rounded-2xl bg-surface-low p-4 transition-all hover:bg-surface-highest/40 sm:p-5 md:flex-row md:items-center md:justify-between md:gap-6 md:p-6">
            <div className="flex min-w-0 items-start gap-3 sm:gap-4 md:items-center md:gap-6">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-surface-lowest text-primary shadow-sm transition-all group-hover:shadow-md sm:size-12 md:size-14">
                <Icon className="size-5 md:size-6" />
              </div>
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                  <h3 className="min-w-0 break-words font-serif text-lg leading-tight tracking-tight text-primary sm:text-xl">{t(item.title)}</h3>
                  <Badge variant="outline" className="rounded-full px-2 py-1 text-[0.65rem] tracking-[0.08em] md:px-3">
                    {t(activityKind)}
                  </Badge>
                  <Badge variant={item.points >= 0 ? 'success' : 'default'} className="rounded-full px-2 py-1 text-[0.65rem] tracking-[0.08em] md:px-3">
                    {item.points >= 0 ? `+${formatPoints(item.points)} ${t('points')}` : `${formatPoints(item.points)} ${t('points')}`}
                  </Badge>
                  {item.status === 'pending' ? (
                    <Badge variant="secondary" className="rounded-full px-2 py-1 text-[0.65rem] tracking-[0.08em] md:px-3">
                      {t('Pending')}
                    </Badge>
                  ) : null}
                </div>
                <p className="break-words text-sm font-medium leading-6 text-on-surface-variant/80">{t(item.description)}</p>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-outline-variant/10 pt-3 md:flex-col md:items-end md:gap-1 md:border-t-0 md:pt-0">
              <div className="flex flex-col md:items-end">
                <span className="text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/70">{t('Date')}</span>
                <p className="text-sm font-semibold text-on-surface-variant/70">{formatDate(item.createdAt)}</p>
              </div>
              <p className="hidden text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/65 italic md:block">{formatTime(item.createdAt)}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
