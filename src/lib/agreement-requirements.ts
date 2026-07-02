import type { AgreementAcceptance, AgreementKind, AgreementVersion, UserRole } from '@/types/domain'

const requiredAgreementsByRole: Record<UserRole, AgreementKind[]> = {
  customer: ['member'],
  'business-owner': ['business_affiliate', 'business_custom'],
  'business-staff': [],
  'platform-admin': [],
}

type PendingAgreementInput = {
  role: UserRole
  businessId?: string | null
  activeAgreements: AgreementVersion[]
  acceptances: AgreementAcceptance[]
}

export function getRequiredAgreementKindsForRole(role: UserRole): AgreementKind[] {
  return requiredAgreementsByRole[role]
}

function hasMatchingAcceptance(
  agreement: AgreementVersion,
  acceptances: AgreementAcceptance[],
) {
  return acceptances.some(
    (acceptance) =>
      acceptance.agreementVersionId === agreement.id &&
      acceptance.agreementKind === agreement.kind &&
      acceptance.agreementVersion === agreement.version &&
      acceptance.contentHash === agreement.contentHash &&
      acceptance.acceptedElectronicRecords &&
      acceptance.acceptedTerms &&
      Boolean(acceptance.signatureSvg && acceptance.signatureSvg.length >= 80),
  )
}

export function getPendingRequiredAgreements({
  role,
  businessId,
  activeAgreements,
  acceptances,
}: PendingAgreementInput): AgreementVersion[] {
  const requiredKinds = getRequiredAgreementKindsForRole(role)
  if (requiredKinds.length === 0) return []

  return activeAgreements.filter(
    (agreement) =>
      agreement.isActive &&
      agreement.requiredRole === role &&
      (!agreement.businessId || agreement.businessId === businessId) &&
      requiredKinds.includes(agreement.kind) &&
      !hasMatchingAcceptance(agreement, acceptances),
  )
}

export function hasCompletedRequiredAgreements(pendingAgreements: AgreementVersion[]) {
  return pendingAgreements.length === 0
}
