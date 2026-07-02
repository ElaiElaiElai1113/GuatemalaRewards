import { describe, expect, it } from 'vitest'

import { getAgreementGateDecision } from './agreement-gate'
import type { UserRole } from '@/types/domain'

function decision(input: {
  role?: UserRole | null
  isAgreementLoading?: boolean
  hasAgreementError?: boolean
  isAgreementComplete?: boolean
}) {
  return getAgreementGateDecision({
    role: input.role ?? null,
    isAgreementLoading: input.isAgreementLoading ?? false,
    hasAgreementError: input.hasAgreementError ?? false,
    isAgreementComplete: input.isAgreementComplete,
  })
}

describe('agreement route gate', () => {
  it('allows signed-out visitors through public routes', () => {
    expect(decision({ role: null })).toBe('allow')
  })

  it('exempts platform admins from agreement gating', () => {
    expect(
      decision({
        role: 'platform-admin',
        hasAgreementError: true,
        isAgreementComplete: false,
      }),
    ).toBe('allow')
  })

  it('waits while non-admin agreement status is loading', () => {
    expect(
      decision({
        role: 'customer',
        isAgreementLoading: true,
      }),
    ).toBe('loading')
  })

  it('redirects non-admins when required agreements are incomplete', () => {
    expect(
      decision({
        role: 'customer',
        isAgreementComplete: false,
      }),
    ).toBe('redirect-required-agreements')
  })

  it('redirects non-admins when agreement status cannot be loaded', () => {
    expect(
      decision({
        role: 'business-owner',
        hasAgreementError: true,
        isAgreementComplete: true,
      }),
    ).toBe('redirect-required-agreements')
  })

  it('allows non-admins after all required agreements are signed', () => {
    expect(
      decision({
        role: 'business-owner',
        isAgreementComplete: true,
      }),
    ).toBe('allow')
  })
})
