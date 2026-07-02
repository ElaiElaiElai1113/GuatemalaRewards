import type { UserRole } from '@/types/domain'

export function getSignOutRedirectPath(role: UserRole | null | undefined) {
  if (role === 'platform-admin') return '/admin'
  if (role === 'business-owner' || role === 'business-staff') return '/business/login'
  return '/signin'
}
