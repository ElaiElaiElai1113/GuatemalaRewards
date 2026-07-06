import { AlertTriangle, CheckCircle2, Circle, Clock3 } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/language'
import type { Activity, Profile } from '@/types/domain'

interface CustomerOnboardingChecklistProps {
  verificationStatus?: Profile['verificationStatus'] | null
  points: number
  recentActivity: Activity[]
}

type ChecklistState = 'complete' | 'current' | 'pending'

interface ChecklistStep {
  title: string
  description: string
  state: ChecklistState
  to?: string
  action?: string
}

function verificationStep(status: Profile['verificationStatus'] | null | undefined): ChecklistStep {
  void status
  if (status === 'verified') {
    return {
      title: 'Contact saved',
      description: 'Your account has the basic details needed for launch.',
      state: 'complete',
    }
  }

  return {
    title: 'Contact saved',
    description: 'Full name, email, and WhatsApp or phone keep reward communication clear.',
    state: 'complete',
  }
}

function getStateIcon(state: ChecklistState) {
  if (state === 'complete') return CheckCircle2
  if (state === 'current') return Clock3
  return Circle
}

export function CustomerOnboardingChecklist({
  verificationStatus,
  points,
  recentActivity,
}: CustomerOnboardingChecklistProps) {
  const { t } = useLanguage()
  const hasEarnedReward = points > 0 || recentActivity.some((item) => item.points > 0)

  const steps: ChecklistStep[] = [
    {
      title: 'Account created',
      description: 'Your member profile is ready.',
      state: 'complete',
    },
    verificationStep(verificationStatus),
    {
      title: 'Unlock member QR',
      description: 'Member QR is active in your profile.',
      state: 'complete',
      to: '/profile',
      action: undefined,
    },
    {
      title: 'Make first QR sale',
      description: hasEarnedReward
        ? 'Your account already has QR earning activity.'
        : 'Buy at a partner business and let staff scan your QR to award points.',
      state: hasEarnedReward ? 'complete' : 'current',
      to: '/profile',
      action: hasEarnedReward ? undefined : 'Show QR',
    },
    {
      title: 'Review activity',
      description: recentActivity.length > 0
        ? 'Your QR visits and points are recorded in activity.'
        : 'Your first recorded scan will appear in activity.',
      state: recentActivity.length > 0 ? 'complete' : hasEarnedReward ? 'current' : 'pending',
      to: '/activity',
      action: recentActivity.length > 0 ? undefined : 'View activity',
    },
  ]

  const completedCount = steps.filter((step) => step.state === 'complete').length

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-card p-5 text-card-foreground shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[var(--foreground)]">{t('Next steps')}</h2>
            <Badge variant="outline" className="rounded-full">
              {completedCount}/{steps.length}
            </Badge>
          </div>
          <p className="text-sm font-medium leading-6 text-[var(--muted-foreground)]">
            {t('Use these steps to start earning with your member QR.')}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-5">
        {steps.map((step) => {
          const Icon = getStateIcon(step.state)
          const isBlocked = step.state === 'pending'

          return (
            <div
              key={step.title}
              className={`rounded-xl border p-4 ${
                step.state === 'complete'
                  ? 'border-success/20 bg-success/10'
                  : step.state === 'current'
                    ? 'border-warning/25 bg-warning/10'
                    : 'border-[var(--border)] bg-[var(--muted)]'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 ${step.state === 'complete' ? 'text-success' : step.state === 'current' ? 'text-warning' : 'text-[var(--muted-foreground)]'}`}>
                  {isBlocked ? <AlertTriangle className="size-5" /> : <Icon className="size-5" />}
                </div>
                <div className="min-w-0 space-y-2">
                  <h3 className="text-sm font-bold leading-tight text-[var(--foreground)]">{t(step.title)}</h3>
                  <p className="text-xs font-medium leading-5 text-[var(--muted-foreground)]">{t(step.description)}</p>
                </div>
              </div>
              {step.to && step.action ? (
                <Button asChild size="sm" variant="outline" className="mt-4 h-8 rounded-full px-3 text-xs">
                  <Link to={step.to}>{t(step.action)}</Link>
                </Button>
              ) : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}
