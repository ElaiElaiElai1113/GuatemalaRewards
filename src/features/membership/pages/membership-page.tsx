import { CreditCard, RefreshCw, ShieldCheck } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  MEMBERSHIP_PRICE_CENTS,
  MEMBERSHIP_PRICE_USD,
  MEMBERSHIP_REWARD_CREDIT_USD,
} from '@/features/membership/membership-pricing'
import { useAuth } from '@/hooks/use-auth'
import { useMembership } from '@/hooks/use-membership'
import { useLanguage } from '@/lib/language'
import { formatCurrency, formatDate } from '@/lib/utils'

export function MembershipPage() {
  const { t } = useLanguage()
  const { profile } = useAuth()
  const { membership, isActive, isLoading, isDemoBillingEnabled, subscribe, renew, cancel } = useMembership()
  const hasMembership = Boolean(membership)
  const isFrozen = hasMembership && !isActive
  const verificationStatus = profile?.verificationStatus ?? 'not_submitted'
  void verificationStatus
  const rewardActionsLocked = !profile?.phone?.trim()

  return (
    <div className="mx-auto max-w-4xl space-y-10 pb-20">
      <div className="space-y-4 border-b border-[var(--border)] pb-8">
        <Badge>{t('Mock Membership')}</Badge>
        <h1 className="text-3xl font-semibold text-[var(--foreground)]">{t('Monthly Membership')}</h1>
        <p className="max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
          {t('Portfolio demo billing: buttons call Supabase RPCs directly and never process a real payment.')}
        </p>
      </div>

      <section className="rounded-xl border border-[var(--border)] bg-card p-6 text-card-foreground shadow-sm">
        {!isDemoBillingEnabled ? (
          <div className="mb-6 rounded-2xl border border-warning/25 bg-warning/10 p-4 text-sm font-semibold text-warning">
            {t('Live membership payments are not connected yet. Billing actions are disabled to prevent simulated subscriptions in production.')}
          </div>
        ) : null}
        {rewardActionsLocked ? (
          <div className="mb-6 rounded-2xl border border-warning/25 bg-warning/10 p-4 text-sm font-semibold text-warning">
            {t('Add WhatsApp or phone in your profile before using membership rewards.')}
          </div>
        ) : null}

        <div className="grid gap-8 md:grid-cols-[1fr_260px] md:items-start">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-lg bg-[var(--muted)]">
                <ShieldCheck className="size-5 text-[var(--foreground)]" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[var(--foreground)]">{t('$25/mo flat')}</h2>
                <p className="text-sm text-[var(--muted-foreground)]">{t('Get $10 credit instantly + earn rewards.')}</p>
              </div>
            </div>

            {isActive && membership ? (
              <div className="rounded-lg bg-[var(--muted)] p-4 text-sm leading-6 text-[var(--muted-foreground)]">
                <strong className="text-[var(--foreground)]">{t('Active.')}</strong>{' '}
                {t('Your current renewal date is')} {formatDate(membership.currentPeriodEnd)}.
              </div>
            ) : isFrozen ? (
              <div className="rounded-lg bg-[var(--muted)] p-4 text-sm leading-6 text-[var(--muted-foreground)]">
                <strong className="text-[var(--foreground)]">{t('Frozen')}</strong>{' '}
                {t('your balance is safe. Resubscribe to start earning again.')}
              </div>
            ) : (
              <div className="rounded-lg bg-[var(--muted)] p-4 text-sm leading-6 text-[var(--muted-foreground)]">
                {t('Subscribe in demo mode to unlock earning and redemption actions.')}
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-[var(--border)] p-4">
                <p className="text-sm font-medium text-[var(--muted-foreground)]">{t('Monthly price')}</p>
                <p className="mt-2 text-2xl font-semibold">
                  {formatCurrency((membership?.priceCents ?? MEMBERSHIP_PRICE_CENTS) / 100)}
                </p>
              </div>
              <div className="rounded-lg border border-[var(--border)] p-4">
                <p className="text-sm font-medium text-[var(--muted-foreground)]">{t('Instant credit')}</p>
                <p className="mt-2 text-2xl font-semibold">{formatCurrency(MEMBERSHIP_REWARD_CREDIT_USD)}</p>
              </div>
              <div className="rounded-lg border border-[var(--border)] p-4">
                <p className="text-sm font-medium text-[var(--muted-foreground)]">{t('Provider')}</p>
                <p className="mt-2 text-2xl font-semibold">{membership?.provider ?? 'mock'}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-semibold text-[var(--foreground)]">
                {formatCurrency(MEMBERSHIP_PRICE_USD)}
              </span>
              <span className="text-sm font-medium text-[var(--muted-foreground)]">/mo</span>
            </div>
            <p className="mt-2 text-xs leading-5 text-[var(--muted-foreground)]">
              {t('Demo mode - no real charge.')}
            </p>

            <div className="mt-6 grid gap-3">
              {isActive ? (
                <>
                  <Button type="button" disabled={!isDemoBillingEnabled || renew.isPending || isLoading || rewardActionsLocked} onClick={() => renew.mutate()}>
                    <RefreshCw className="size-4" />
                    {rewardActionsLocked ? t('Add contact details to renew') : renew.isPending ? t('Renewing...') : t('Renew now - Demo')}
                  </Button>
                  <Button type="button" variant="outline" disabled={!isDemoBillingEnabled || cancel.isPending} onClick={() => cancel.mutate()}>
                    {cancel.isPending ? t('Canceling...') : t('Cancel')}
                  </Button>
                </>
              ) : (
                <Button type="button" disabled={!isDemoBillingEnabled || subscribe.isPending || isLoading || rewardActionsLocked} onClick={() => subscribe.mutate()}>
                  <CreditCard className="size-4" />
                  {rewardActionsLocked
                    ? t('Add contact details to subscribe')
                    : subscribe.isPending
                      ? t('Subscribing...')
                      : isFrozen
                        ? t('Resubscribe - Demo')
                        : t('Subscribe - Demo')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
