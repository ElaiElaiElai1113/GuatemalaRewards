import { AlertTriangle, CheckCircle2, Clock3, IdCard } from 'lucide-react'
import { Link } from 'react-router-dom'

import { useLanguage } from '@/lib/language'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types/domain'

interface VerificationStatusPillProps {
  status?: Profile['verificationStatus'] | null
  className?: string
}

function getPillContent(status: Profile['verificationStatus'] | null | undefined) {
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

export function VerificationStatusPill({ status, className }: VerificationStatusPillProps) {
  const { t } = useLanguage()
  const content = getPillContent(status)
  const Icon = content.icon

  return (
    <Link
      to={content.to}
      className={cn(
        'hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition hover:opacity-85 sm:inline-flex',
        content.className,
        className,
      )}
    >
      <Icon className="size-3.5" />
      {t(content.label)}
    </Link>
  )
}
