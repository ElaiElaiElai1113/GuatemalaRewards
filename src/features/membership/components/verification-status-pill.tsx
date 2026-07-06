import { CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'

import { useLanguage } from '@/lib/language'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types/domain'

interface VerificationStatusPillProps {
  status?: Profile['verificationStatus'] | null
  className?: string
}

function getPillContent(status: Profile['verificationStatus'] | null | undefined) {
  void status
  if (status === 'verified') {
    return {
      label: 'Verified',
      to: '/profile',
      icon: CheckCircle2,
      className: 'border-success/20 bg-success/10 text-success',
    }
  }

  return {
    label: 'QR active',
    to: '/profile',
    icon: CheckCircle2,
    className: 'border-success/20 bg-success/10 text-success',
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
