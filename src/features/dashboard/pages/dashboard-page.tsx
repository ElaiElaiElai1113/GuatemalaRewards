import { Gift, History, MonitorPlay, Phone, QrCode } from 'lucide-react'
import { Link } from 'react-router-dom'

import { ActivityList } from '@/features/activity/components/activity-list'
import { CustomerOnboardingChecklist } from '@/features/dashboard/components/customer-onboarding-checklist'
import { CustomerWalletSummary } from '@/features/dashboard/components/customer-wallet-summary'
import { MembershipBanner } from '@/features/membership/components/membership-banner'
import { VerificationStatusNotice } from '@/features/membership/components/verification-status-notice'
import {
  useActivities,
  useRewardBalance,
} from '@/hooks/use-customer-data'
import { useAuth } from '@/hooks/use-auth'
import { useLanguage } from '@/lib/language'

export function DashboardPage() {
  const { profile } = useAuth()
  const { t } = useLanguage()
  const rewardBalance = useRewardBalance(profile?.id)
  const activities = useActivities(profile?.id)

  const points = rewardBalance.data?.points ?? 0
  const recentActivity = activities.data?.slice(0, 4) ?? []
  const firstName = profile?.fullName?.split(' ')[0] ?? t('Member')
  const verificationStatus = profile?.verificationStatus ?? 'not_submitted'

  const quickActions = [
    {
      title: t('Show member QR'),
      description: t('Partner staff scan your QR to record purchases and award points.'),
      icon: QrCode,
      to: '/profile',
    },
    {
      title: t('Contact details'),
      description: t('Keep your WhatsApp or phone updated so we can support reward use.'),
      icon: Phone,
      to: '/profile',
    },
    {
      title: t('View history'),
      description: t('Review recorded visits, points earned, and account activity.'),
      icon: History,
      to: '/activity',
    },
    {
      title: t('Buy gift cards'),
      description: t('Use points to buy existing gift cards from partner businesses.'),
      icon: Gift,
      to: '/gift-cards',
    },
  ]

  return (
    <div className="space-y-10 pb-16">
      <MembershipBanner />
      <VerificationStatusNotice
        status={verificationStatus}
        rejectionReason={profile?.verificationRejectionReason}
      />
      <CustomerOnboardingChecklist
        verificationStatus={verificationStatus}
        points={points}
        recentActivity={recentActivity}
      />

      <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[var(--muted)] text-[var(--foreground)]">
              <MonitorPlay className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--muted-foreground)]">{t('Walkthrough demo')}</p>
              <h2 className="mt-1 text-xl font-semibold text-[var(--foreground)]">{t('See the customer walkthrough')}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
                {t('Open the guided demo for the member QR, partner business scan, and admin follow-up flow.')}
              </p>
            </div>
          </div>
          <Link
            to="/guide"
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--foreground)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--foreground)]/90"
          >
            <MonitorPlay className="size-4" />
            {t('Open walkthrough')}
          </Link>
        </div>
      </section>

      <section className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-[var(--foreground)]">
            {t('Welcome back,')} {firstName}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
            {t('Show your member QR at partner businesses, earn points from rewardable purchases, then use points for partner gift cards.')}
          </p>
        </div>

        <CustomerWalletSummary
          verificationStatus={verificationStatus}
          points={points}
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="rounded-xl border border-[var(--border)] bg-white p-5 shadow-sm transition-colors hover:bg-[var(--muted)]"
            >
              <div className="flex size-10 items-center justify-center rounded-lg bg-[var(--muted)] text-[var(--foreground)]">
                <action.icon className="size-5" />
              </div>
              <h2 className="mt-4 text-base font-semibold text-[var(--foreground)]">{action.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{action.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--muted-foreground)]">{t('Activity')}</p>
            <h2 className="text-2xl font-semibold text-[var(--foreground)]">{t('Recent Activity')}</h2>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-white p-2 shadow-sm">
          <ActivityList items={recentActivity} emptyActionTo="/shop" emptyActionLabel="Browse businesses" />
        </div>
      </section>
    </div>
  )
}
