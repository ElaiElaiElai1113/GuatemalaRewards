import { ChartNoAxesColumn, Gift, History, Wallet } from 'lucide-react'

import { MetricCard } from '@/components/metric-card'
import { Badge } from '@/components/ui/badge'
import { ActivityList } from '@/features/activity/components/activity-list'
import { useActivities, useRewardBalance } from '@/hooks/use-customer-data'
import { useAuth } from '@/hooks/use-auth'
import { useLanguage } from '@/lib/language'

export function ActivityPage() {
  const { profile } = useAuth()
  const { t } = useLanguage()
  const activities = useActivities(profile?.id)
  const rewardBalance = useRewardBalance(profile?.id)

  const postedCount = activities.data?.filter((item) => item.status === 'posted').length ?? 0
  const earnedThisMonth =
    activities.data?.filter((item) => item.points > 0).reduce((sum, item) => sum + item.points, 0) ?? 0
  const redeemedThisMonth =
    activities.data?.filter((item) => item.points < 0).reduce((sum, item) => sum + Math.abs(item.points), 0) ?? 0

  return (
    <div className="space-y-16 pb-20">
      <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between border-b border-outline-variant/10 pb-12">
        <div className="space-y-4 max-w-2xl">
          <Badge variant="accent" className="bg-tertiary/20 text-primary">
            {t('Activity History')}
          </Badge>
          <h1 className="font-serif text-5xl tracking-tight text-primary md:text-7xl leading-[1.1]">
            {t('Your Timeline')}
          </h1>
          <p className="text-lg leading-relaxed text-on-surface-variant/85 font-medium">
            {t('Every recorded QR purchase, point award, and account update in one clear timeline.')}
          </p>
        </div>

        <div className="flex flex-col items-start gap-4 lg:items-end">
          <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">{t('Loyalty Status')}</span>
          <div className="rounded-2xl bg-surface-low px-6 py-4 text-primary shadow-sm flex items-center gap-4 border border-outline-variant/10">
             <div className="size-10 rounded-full bg-primary flex items-center justify-center">
                <Wallet className="size-5 text-primary" />
             </div>
             <div className="flex flex-col">
                <span className="font-serif text-2xl leading-none">{rewardBalance.data?.points ?? 0}</span>
                <span className="text-[0.6rem] font-bold uppercase tracking-[0.1em] text-on-surface-variant/80">{t('Total Points')}</span>
             </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <MetricCard
          label={t('Visits')}
          value={`${postedCount}`}
          icon={History}
          helper={t('Total recorded visits')}
        />
        <MetricCard
          label={t('Points Earned')}
          value={`${earnedThisMonth}`}
          icon={ChartNoAxesColumn}
          helper={t('Recent points earned')}
        />
        <MetricCard
          label={t('Redemptions')}
          value={`${redeemedThisMonth}`}
          icon={Gift}
          helper={t('Rewards redeemed')}
        />
      </div>

      <div className="space-y-8">
        <div className="flex items-end justify-between border-b border-outline-variant/5 pb-4">
          <h2 className="font-serif text-3xl text-primary">{t('Timeline')}</h2>
          <span className="text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/80 italic">{t('Most Recent First')}</span>
        </div>
        <ActivityList
          items={activities.data ?? []}
          emptyActionTo="/shop"
          emptyActionLabel="Browse businesses"
        />
      </div>
    </div>
  )
}
