import { X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { useMembership } from '@/hooks/use-membership'
import { useLanguage } from '@/lib/language'

const storageKey = 'membership-banner-dismissed'

export function MembershipBanner() {
  const { t } = useLanguage()
  const { isActive } = useMembership()
  const [dismissed, setDismissed] = useState(() => (
    typeof window !== 'undefined' && sessionStorage.getItem(storageKey) === 'true'
  ))

  if (isActive || dismissed) return null

  return (
    <div className="luxe-card animate-soft-reveal rounded-[1.75rem] p-5 text-card-foreground">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="font-serif text-2xl font-semibold leading-none text-primary-container">{t('$10/mo membership, $10 credit instantly')}</p>
          <p className="text-sm leading-6 text-[var(--muted-foreground)]">
            {t('Demo mode: subscribe with no real charge to earn points and redeem rewards.')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link to="/membership">{t('Subscribe — Demo')}</Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t('Dismiss membership offer')}
            onClick={() => {
              sessionStorage.setItem(storageKey, 'true')
              setDismissed(true)
            }}
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
