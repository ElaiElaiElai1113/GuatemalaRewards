import { AlertTriangle, CheckCircle2, Clock3, IdCard } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/language'
import type { Profile } from '@/types/domain'

type VerificationStatus = NonNullable<Profile['verificationStatus']>

interface VerificationStatusNoticeProps {
  status?: Profile['verificationStatus'] | null
  rejectionReason?: string | null
  compact?: boolean
}

function getVerificationContent(status: VerificationStatus, rejectionReason?: string | null) {
  if (status === 'verified') {
    return {
      icon: CheckCircle2,
      title: 'ID verified',
      body: 'Reward actions are unlocked for this member account.',
      action: null,
    }
  }

  if (status === 'submitted') {
    return {
      icon: Clock3,
      title: 'Your ID is submitted',
      body: 'Reward actions stay locked until admin approval.',
      action: null,
    }
  }

  if (status === 'rejected') {
    return {
      icon: AlertTriangle,
      title: 'ID verification needs another look',
      body: rejectionReason || 'Your submission was not approved. Update your ID details to request another review.',
      action: 'Resubmit in profile',
    }
  }

  return {
    icon: IdCard,
    title: 'Finish ID verification',
    body: 'Upload your ID in profile before earning points, redeeming rewards, issuing gift cards, or activating reward credits.',
    action: 'Verify in profile',
  }
}

export function VerificationStatusNotice({
  status,
  rejectionReason,
  compact = false,
}: VerificationStatusNoticeProps) {
  const { t } = useLanguage()
  const normalizedStatus = status ?? 'not_submitted'
  if (normalizedStatus === 'verified') return null

  const content = getVerificationContent(normalizedStatus, rejectionReason)
  const Icon = content.icon

  return (
    <div className={`rounded-2xl border border-warning/25 bg-warning/10 text-[var(--foreground)] ${compact ? 'p-4' : 'p-5 sm:p-6'}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-warning">
            <Icon className="size-5" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-base font-bold text-[var(--foreground)]">{t(content.title)}</h2>
            <p className="max-w-2xl text-sm font-medium leading-6 text-[var(--muted-foreground)]">
              {t(content.body)}
            </p>
          </div>
        </div>
        {content.action ? (
          <Button asChild size="sm" variant="outline" className="shrink-0 rounded-full">
            <Link to="/profile">{t(content.action)}</Link>
          </Button>
        ) : null}
      </div>
    </div>
  )
}
