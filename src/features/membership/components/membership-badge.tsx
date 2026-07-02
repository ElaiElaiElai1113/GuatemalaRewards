import { Award } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { useMembership } from '@/hooks/use-membership'
import { useLanguage } from '@/lib/language'
import { formatDate } from '@/lib/utils'

export function MembershipBadge() {
  const { t } = useLanguage()
  const { membership, isActive, isLoading } = useMembership()
  const isFrozen = Boolean(membership) && !isActive

  return (
    <div className="rounded-2xl border border-primary/20 bg-tenant-soft px-6 py-4 text-foreground shadow-card flex items-center gap-4">
      <div className="size-10 rounded-full bg-primary flex items-center justify-center">
        <Award className="size-5 text-primary-foreground" />
      </div>
      <div className="flex flex-col gap-1">
        <span className="font-serif text-2xl leading-none">
          {isLoading ? t('Checking') : isActive ? t('Active') : isFrozen ? t('Frozen') : t('Not active')}
        </span>
        <span className="text-[0.6rem] font-bold uppercase tracking-[0.1em] text-on-surface-variant">
          {isActive && membership ? t('Renews') + ' ' + formatDate(membership.currentPeriodEnd) : t('Member Status')}
        </span>
        {membership ? (
          <Badge variant={isActive ? 'success' : 'outline'} className="w-fit">
            {membership.status}
          </Badge>
        ) : null}
      </div>
    </div>
  )
}
