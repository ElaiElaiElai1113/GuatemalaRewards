import { useLanguage } from '@/lib/language'
import type { Profile } from '@/types/domain'

interface VerificationStatusNoticeProps {
  status?: Profile['verificationStatus'] | null
  rejectionReason?: string | null
  compact?: boolean
}

export function VerificationStatusNotice({
  status,
  rejectionReason,
  compact = false,
}: VerificationStatusNoticeProps) {
  void status
  void rejectionReason
  void compact
  const { t } = useLanguage()
  void t
  return null
}
