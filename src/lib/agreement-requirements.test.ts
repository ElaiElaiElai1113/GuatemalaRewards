import { describe, expect, it } from 'vitest'

import {
  getPendingRequiredAgreements,
  getRequiredAgreementKindsForRole,
  hasCompletedRequiredAgreements,
} from './agreement-requirements'
import type { AgreementAcceptance, AgreementVersion } from '@/types/domain'

const activeMemberAgreement: AgreementVersion = {
  id: 'agreement-member-v1',
  kind: 'member',
  requiredRole: 'customer',
  businessId: null,
  version: 1,
  title: 'Member Agreement',
  body: 'Member agreement body',
  contentHash: 'member-hash-v1',
  isActive: true,
  effectiveAt: '2026-06-01T00:00:00.000Z',
}

const activeAffiliateAgreement: AgreementVersion = {
  id: 'agreement-affiliate-v1',
  kind: 'business_affiliate',
  requiredRole: 'business-owner',
  businessId: null,
  version: 1,
  title: 'Business Affiliate Agreement',
  body: 'Business affiliate agreement body',
  contentHash: 'affiliate-hash-v1',
  isActive: true,
  effectiveAt: '2026-06-01T00:00:00.000Z',
}

const activeCustomBusinessAgreement: AgreementVersion = {
  id: 'agreement-custom-business-v1',
  kind: 'business_custom',
  requiredRole: 'business-owner',
  businessId: 'business-1',
  version: 1,
  title: 'Updated Partner Terms',
  body: 'Custom business agreement body',
  contentHash: 'custom-business-hash-v1',
  isActive: true,
  effectiveAt: '2026-06-01T00:00:00.000Z',
}

const activeTradeDealAgreement: AgreementVersion = {
  id: 'agreement-trade-v1',
  kind: 'trade_deal',
  requiredRole: null,
  businessId: null,
  version: 1,
  title: 'Trade Deal Agreement',
  body: 'Trade deal agreement body',
  contentHash: 'trade-hash-v1',
  isActive: true,
  effectiveAt: '2026-06-01T00:00:00.000Z',
}

const drawnSignatureSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 220" data-signature="drawn"><path d="M 10 10 L 60 45" fill="none" stroke="#111827" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>'

function accepted(version: AgreementVersion): AgreementAcceptance {
  return {
    id: `acceptance-${version.id}`,
    profileId: 'profile-1',
    businessId: null,
    agreementVersionId: version.id,
    agreementKind: version.kind,
    agreementVersion: version.version,
    contentHash: version.contentHash,
    typedSignature: 'Ava Member',
    signatureSvg: drawnSignatureSvg,
    acceptedElectronicRecords: true,
    acceptedTerms: true,
    signedAt: '2026-06-01T01:00:00.000Z',
  } as AgreementAcceptance
}

describe('agreement requirements', () => {
  it('maps required agreement kinds by role', () => {
    expect(getRequiredAgreementKindsForRole('customer')).toEqual(['member'])
    expect(getRequiredAgreementKindsForRole('business-owner')).toEqual(['business_affiliate', 'business_custom'])
    expect(getRequiredAgreementKindsForRole('business-staff')).toEqual([])
    expect(getRequiredAgreementKindsForRole('platform-admin')).toEqual([])
  })

  it('ignores active trade-deal agreements for normal access gating', () => {
    const pending = getPendingRequiredAgreements({
      role: 'business-owner',
      businessId: 'business-1',
      activeAgreements: [activeAffiliateAgreement, activeCustomBusinessAgreement, activeTradeDealAgreement],
      acceptances: [],
    })

    expect(pending).toEqual([activeAffiliateAgreement, activeCustomBusinessAgreement])
  })

  it('requires signing every active required agreement version', () => {
    const pendingCustomer = getPendingRequiredAgreements({
      role: 'customer',
      activeAgreements: [activeMemberAgreement, activeAffiliateAgreement],
      acceptances: [],
    })

    expect(pendingCustomer).toEqual([activeMemberAgreement])
    expect(hasCompletedRequiredAgreements(pendingCustomer)).toBe(false)
  })

  it('requires business-specific contracts only for the matching business owner', () => {
    const customBusinessContract: AgreementVersion = {
      ...activeCustomBusinessAgreement,
      id: 'agreement-custom-business-1',
      businessId: 'business-1',
      title: 'Harbor Roast Partner Contract',
      contentHash: 'business-1-contract-hash',
    }

    const pendingForMatchingBusiness = getPendingRequiredAgreements({
      role: 'business-owner',
      businessId: 'business-1',
      activeAgreements: [activeAffiliateAgreement, customBusinessContract],
      acceptances: [accepted(activeAffiliateAgreement)],
    })

    const pendingForOtherBusiness = getPendingRequiredAgreements({
      role: 'business-owner',
      businessId: 'business-2',
      activeAgreements: [activeAffiliateAgreement, customBusinessContract],
      acceptances: [accepted(activeAffiliateAgreement)],
    })

    expect(pendingForMatchingBusiness).toEqual([customBusinessContract])
    expect(pendingForOtherBusiness).toEqual([])
  })

  it('requires every matching custom document added to an active business account', () => {
    const secondCustomDocument: AgreementVersion = {
      ...activeCustomBusinessAgreement,
      id: 'agreement-custom-business-v2',
      version: 2,
      title: 'New Seasonal Participation Terms',
      contentHash: 'custom-business-hash-v2',
    }

    const pending = getPendingRequiredAgreements({
      role: 'business-owner',
      businessId: 'business-1',
      activeAgreements: [
        activeAffiliateAgreement,
        activeCustomBusinessAgreement,
        secondCustomDocument,
      ],
      acceptances: [accepted(activeAffiliateAgreement), accepted(activeCustomBusinessAgreement)],
    })

    expect(pending).toEqual([secondCustomDocument])
  })

  it('treats matching acceptance records as complete', () => {
    const pending = getPendingRequiredAgreements({
      role: 'customer',
      activeAgreements: [activeMemberAgreement],
      acceptances: [accepted(activeMemberAgreement)],
    })

    expect(pending).toEqual([])
    expect(hasCompletedRequiredAgreements(pending)).toBe(true)
  })

  it('does not treat typed-only acceptance records as complete', () => {
    const typedOnlyAcceptance = {
      ...accepted(activeMemberAgreement),
      signatureSvg: null,
    } as AgreementAcceptance

    const pending = getPendingRequiredAgreements({
      role: 'customer',
      activeAgreements: [activeMemberAgreement],
      acceptances: [typedOnlyAcceptance],
    })

    expect(pending).toEqual([activeMemberAgreement])
  })

  it('requires re-signing when the active agreement version or hash changes', () => {
    const memberV2: AgreementVersion = {
      ...activeMemberAgreement,
      id: 'agreement-member-v2',
      version: 2,
      contentHash: 'member-hash-v2',
    }

    const pending = getPendingRequiredAgreements({
      role: 'customer',
      activeAgreements: [memberV2],
      acceptances: [accepted(activeMemberAgreement)],
    })

    expect(pending).toEqual([memberV2])
  })
})
