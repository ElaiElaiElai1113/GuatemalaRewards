import { Activity, AlertTriangle, CheckCircle2, Clock3, Home, IdCard, MapPin, QrCode } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'

import { useLanguage } from '@/lib/language'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types/domain'

const tabs = [
  { to: '/dashboard', label: 'Home', icon: Home, match: ['/dashboard'] },
  { to: '/shop', label: 'Businesses', icon: MapPin, match: ['/shop'] },
  { to: '/profile', label: 'QR', icon: QrCode, match: ['/profile'] },
  { to: '/activity', label: 'Activity', icon: Activity, match: ['/activity'] },
]

interface CustomerBottomNavProps {
  verificationStatus?: Profile['verificationStatus'] | null
}

function getVerificationStatus(status: Profile['verificationStatus'] | null | undefined) {
  if (status === 'verified') {
    return {
      label: 'Verified',
      to: '/profile',
      icon: CheckCircle2,
      className: 'border-success/20 bg-success/10 text-success',
    }
  }

  if (status === 'submitted') {
    return {
      label: 'Under review',
      to: '/profile#id-verification',
      icon: Clock3,
      className: 'border-warning/20 bg-warning/10 text-warning',
    }
  }

  if (status === 'rejected') {
    return {
      label: 'Needs resubmission',
      to: '/profile#id-verification',
      icon: AlertTriangle,
      className: 'border-red-200 bg-red-50 text-red-600',
    }
  }

  return {
    label: 'Verification required',
    to: '/profile#id-verification',
    icon: IdCard,
    className: 'border-warning/20 bg-warning/10 text-warning',
  }
}

export function CustomerBottomNav({ verificationStatus }: CustomerBottomNavProps) {
  const { pathname } = useLocation()
  const { t } = useLanguage()
  const status = getVerificationStatus(verificationStatus)
  const StatusIcon = status.icon

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-primary/15 bg-card/95 px-3 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 shadow-luxe backdrop-blur xl:hidden">
      <NavLink
        to={status.to}
        className={cn(
          'mb-2 flex items-center justify-center gap-2 rounded-full border px-3 py-2 text-xs font-bold',
          status.className,
        )}
      >
        <StatusIcon className="size-3.5" />
        {t(status.label)}
      </NavLink>
      <div className="grid grid-cols-4 gap-1">
        {tabs.map((item) => {
          const isActive = item.match.some((prefix) => pathname.startsWith(prefix))

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                'relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-[1rem] text-xs font-semibold transition-all',
                isActive
                  ? 'bg-[var(--muted)] text-[var(--foreground)] shadow-soft'
                  : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]',
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="relative">
                <item.icon className="size-5" />
              </span>
              <span>{t(item.label)}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
