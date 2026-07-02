import { BadgeCheck, IdCard, QrCode, Ticket } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/language'
import { formatPoints } from '@/lib/utils'
import type { Profile } from '@/types/domain'

interface CustomerWalletSummaryProps {
  verificationStatus?: Profile['verificationStatus'] | null
  points: number
}

function getPrimaryAction({
  isVerified,
  points,
}: {
  isVerified: boolean
  points: number
}) {
  if (!isVerified) {
    return {
      label: 'Verify ID',
      to: '/profile#id-verification',
      helper: 'Verify your ID to activate your member QR.',
    }
  }

  if (points > 0) {
    return {
      label: 'Show member QR',
      to: '/profile',
      status: 'Ready to earn',
      helper: 'Show your QR at a Guatemala Rewards partner business so staff can award points.',
    }
  }

  return {
    label: 'Show member QR',
    to: '/profile',
    status: 'Start earning',
    helper: 'Buy at a participating business and show your QR to earn points.',
  }
}

export function CustomerWalletSummary({
  verificationStatus,
  points,
}: CustomerWalletSummaryProps) {
  const { t } = useLanguage()
  const isVerified = verificationStatus === 'verified'
  const primaryAction = getPrimaryAction({ isVerified, points })

  const stats = [
    {
      label: 'Total Points',
      value: formatPoints(points),
      icon: Ticket,
    },
    {
      label: 'QR status',
      value: isVerified ? t('Active') : t('Locked'),
      icon: QrCode,
    },
    {
      label: 'Account status',
      value: isVerified ? t('Verified') : t('Needs ID check'),
      icon: BadgeCheck,
    },
  ]

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="rounded-full">
              {t('Reward wallet')}
            </Badge>
            {primaryAction.status ? (
              <Badge variant="secondary" className="rounded-full">
                {t(primaryAction.status)}
              </Badge>
            ) : null}
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-[var(--foreground)]">{t('Your member wallet')}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
              {t(primaryAction.helper)}
            </p>
          </div>
        </div>

        <Button asChild className="w-full rounded-full sm:w-auto">
          <Link to={primaryAction.to}>
            <IdCard className="mr-2 size-4" />
            {t(primaryAction.label)}
          </Link>
        </Button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-[var(--border)] bg-[var(--muted)] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                {t(stat.label)}
              </p>
              <stat.icon className="size-4 text-[var(--muted-foreground)]" />
            </div>
            <p className="mt-3 text-2xl font-semibold text-[var(--foreground)]">{stat.value}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
