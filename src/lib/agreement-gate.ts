import type { UserRole } from '@/types/domain'

export type AgreementGateDecision = 'allow' | 'loading' | 'redirect-required-agreements'

type AgreementGateInput = {
  role: UserRole | null
  isAgreementLoading: boolean
  hasAgreementError: boolean
  isAgreementComplete?: boolean
}

export function getAgreementGateDecision({
  role,
  isAgreementLoading,
  hasAgreementError,
  isAgreementComplete,
}: AgreementGateInput): AgreementGateDecision {
  if (!role || role === 'platform-admin') return 'allow'
  if (isAgreementLoading) return 'loading'
  if (hasAgreementError || !isAgreementComplete) return 'redirect-required-agreements'
  return 'allow'
}
