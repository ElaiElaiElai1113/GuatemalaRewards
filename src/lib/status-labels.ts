import type {
  AmbassadorLeadStatus,
  EarlyAccessLeadStatus,
  PartnerReferralStatus,
  Redemption,
  ReferralStatus,
} from '@/types/domain'

export function getVerificationStatusLabel(status?: string | null) {
  if (status === 'pending_document') return 'Needs document'
  if (status === 'submitted') return 'Under review'
  if (status === 'verified') return 'Verified'
  if (status === 'rejected') return 'Rejected'
  return 'Not submitted'
}

export function getAmbassadorLeadStatusLabel(status: AmbassadorLeadStatus) {
  if (status === 'new') return 'New'
  if (status === 'contacted') return 'Contacted'
  if (status === 'converted') return 'Converted'
  return 'Archived'
}

export function getEarlyAccessLeadStatusLabel(status: EarlyAccessLeadStatus) {
  if (status === 'new') return 'New'
  if (status === 'contacted') return 'Contacted'
  if (status === 'invited') return 'Invited'
  return 'Archived'
}

export function getReferralStatusLabel(status: ReferralStatus) {
  if (status === 'approved') return 'Approved'
  if (status === 'rejected') return 'Rejected'
  return 'Pending review'
}

export function getPartnerReferralStatusLabel(status: PartnerReferralStatus) {
  if (status === 'credited') return 'Credited'
  if (status === 'voided') return 'Voided'
  return 'Attributed'
}

export function getRedemptionStatusLabel(status: Redemption['status']) {
  return status === 'fulfilled' ? 'Fulfilled' : 'Ready for pickup'
}
