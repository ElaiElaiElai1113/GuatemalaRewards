export const MEMBER_VERIFICATION_BUCKET = 'member-verification-ids'
export const MAX_VERIFICATION_DOCUMENT_BYTES = 8 * 1024 * 1024
export const ACCEPTED_VERIFICATION_DOCUMENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const

export function validateVerificationDocument(file: File | null | undefined) {
  if (!file) {
    return 'Upload a photo or PDF of your ID for account verification.'
  }

  if (!ACCEPTED_VERIFICATION_DOCUMENT_TYPES.includes(file.type as typeof ACCEPTED_VERIFICATION_DOCUMENT_TYPES[number])) {
    return 'Upload a JPG, PNG, WEBP, or PDF ID document.'
  }

  if (file.size > MAX_VERIFICATION_DOCUMENT_BYTES) {
    return 'Keep the ID document under 8 MB.'
  }

  return null
}

export function getVerificationDocumentExtension(file: File) {
  const fromName = file.name.split('.').pop()?.toLowerCase()

  if (fromName && /^[a-z0-9]+$/.test(fromName)) {
    return fromName
  }

  if (file.type === 'application/pdf') return 'pdf'
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/webp') return 'webp'
  return 'jpg'
}
