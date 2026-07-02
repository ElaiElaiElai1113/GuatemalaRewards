import { describe, expect, it } from 'vitest'

import { signAgreementSchema } from './forms'

const drawnSignatureSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 220" data-signature="drawn"><path d="M 10 10 L 60 45" fill="none" stroke="#111827" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>'

describe('signAgreementSchema', () => {
  it('rejects missing e-signature consent confirmations', () => {
    const result = signAgreementSchema.safeParse({
      typedSignature: 'Ava Member',
      signatureSvg: drawnSignatureSvg,
      acceptedElectronicRecords: false,
      acceptedTerms: false,
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.acceptedElectronicRecords).toContain(
        'Electronic records consent is required',
      )
      expect(result.error.flatten().fieldErrors.acceptedTerms).toContain(
        'Agreement confirmation is required',
      )
    }
  })

  it('rejects blank typed signatures', () => {
    const result = signAgreementSchema.safeParse({
      typedSignature: '',
      signatureSvg: drawnSignatureSvg,
      acceptedElectronicRecords: true,
      acceptedTerms: true,
    })

    expect(result.success).toBe(false)
  })

  it('rejects missing drawn signatures', () => {
    const result = signAgreementSchema.safeParse({
      typedSignature: 'Ava Member',
      signatureSvg: '',
      acceptedElectronicRecords: true,
      acceptedTerms: true,
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.signatureSvg).toContain('Draw your signature')
    }
  })

  it('accepts typed and drawn signatures with both confirmations', () => {
    const result = signAgreementSchema.safeParse({
      typedSignature: 'Ava Member',
      signatureSvg: drawnSignatureSvg,
      acceptedElectronicRecords: true,
      acceptedTerms: true,
    })

    expect(result.success).toBe(true)
  })
})
