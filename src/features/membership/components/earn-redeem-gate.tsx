import type { ReactNode } from 'react'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'

import { CheckCircle2, CreditCard, Gift, Sparkles } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  MEMBERSHIP_PRICE_USD,
  MEMBERSHIP_REWARD_CREDIT_USD,
} from '@/features/membership/membership-pricing'
import { useAuth } from '@/hooks/use-auth'
import { useMembership } from '@/hooks/use-membership'
import { useLanguage } from '@/lib/language'
import { formatCurrency } from '@/lib/utils'

interface EarnRedeemGateProps {
  children: ReactNode
  action: 'earn' | 'redeem'
}

export function EarnRedeemGate({ children, action }: EarnRedeemGateProps) {
  const { t } = useLanguage()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const { isActive, subscribe } = useMembership()
  const [open, setOpen] = useState(false)
  const isGuest = !profile
  const portalRoot = typeof document === 'undefined' ? null : document.body

  if (isActive) return <>{children}</>

  return (
    <>
      <div
        onClickCapture={(event) => {
          event.preventDefault()
          event.stopPropagation()
          setOpen(true)
        }}
      >
        {children}
      </div>

      {open && portalRoot ? createPortal(
        <>
          <div className="fixed inset-0 z-[900] bg-[var(--espresso)]/45 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="fixed left-1/2 top-1/2 z-[910] max-h-[calc(100svh-2rem)] w-[min(92vw,34rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[1.75rem] border border-[var(--primary)]/25 bg-[var(--card)] text-[var(--foreground)] shadow-luxe outline-none">
          <div className="border-b border-[var(--border)] warm-hero px-6 py-5 sm:px-8 sm:py-6">
            <div className="flex items-start justify-between gap-6">
              <div className="space-y-3">
                <Badge className="bg-white/12 text-white">
                  {t('Demo mode - no real charge')}
                </Badge>
                <div className="mb-0 grid gap-2">
                  <h2 className="font-serif text-2xl font-semibold leading-tight text-white sm:text-3xl">
                    {action === 'earn' ? t('Unlock points on this order') : t('Unlock reward redemption')}
                  </h2>
                  <p className="text-sm leading-6 text-white/75">
                    {isGuest
                      ? t('Create an account or sign in first, then subscribe in demo mode to unlock this action.')
                      : t('Subscribe in demo mode to start earning and redeeming while keeping the catalog open to browse.')}
                  </p>
                </div>
              </div>
              <div className="hidden size-12 shrink-0 items-center justify-center rounded-xl bg-white/12 sm:flex">
                <Sparkles className="size-7" />
              </div>
            </div>
          </div>

          <div className="space-y-4 px-6 py-5 sm:px-8">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-[var(--border)] bg-card p-3 text-card-foreground shadow-sm">
                <p className="text-xs font-medium text-[var(--muted-foreground)]">{t('Monthly')}</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
                  {formatCurrency(MEMBERSHIP_PRICE_USD)}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-card p-3 text-card-foreground shadow-sm">
                <p className="text-xs font-medium text-[var(--muted-foreground)]">{t('Instant credit')}</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
                  {formatCurrency(MEMBERSHIP_REWARD_CREDIT_USD)}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-card p-3 text-card-foreground shadow-sm">
                <p className="text-xs font-medium text-[var(--muted-foreground)]">{t('Payment')}</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{t('Mock')}</p>
              </div>
            </div>

            <div className="grid gap-3 text-sm text-[var(--muted-foreground)]">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="size-5 text-[var(--foreground)]" />
                <span>{t('Get $10 reward credit immediately after subscribing.')}</span>
              </div>
              <div className="flex items-center gap-3">
                <Gift className="size-5 text-[var(--foreground)]" />
                <span>{t('Earn points at checkout and redeem rewards while active.')}</span>
              </div>
              <div className="flex items-center gap-3">
                <CreditCard className="size-5 text-[var(--foreground)]" />
                <span>{t('Portfolio demo only: no card, processor, or real charge.')}</span>
              </div>
            </div>

            {isGuest ? (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)] p-4 text-sm leading-6 text-[var(--muted-foreground)]">
                <strong className="text-[var(--foreground)]">{t('Account required.')}</strong>{' '}
                {t('Memberships are tied to your rewards balance, so guests must sign in or register before subscribing.')}
              </div>
            ) : null}
          </div>

          <div className="mt-0 flex justify-end gap-3 border-t border-[var(--border)] bg-[var(--muted)] px-6 py-4 sm:px-8 sm:py-5">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              {t('Not now')}
            </Button>
            <Button
              type="button"
              className="px-6"
              isLoading={!isGuest && subscribe.isPending}
              disabled={!isGuest && subscribe.isPending}
              onClick={() => {
                if (isGuest) {
                  navigate('/signin')
                  return
                }

                void subscribe.mutateAsync().then(() => setOpen(false))
              }}
            >
              {isGuest
                ? t('Sign in or register')
                : subscribe.isPending
                  ? t('Subscribing...')
                  : t('Subscribe - Demo')}
            </Button>
          </div>
          </div>
        </>
      , portalRoot) : null}
    </>
  )
}
