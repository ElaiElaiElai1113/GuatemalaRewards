import type { UserRole } from '@/types/domain'

export function getHomePathForRole(role: UserRole | string) {
  if (role === 'platform-admin') return '/admin/portal'
  if (role === 'business-owner' || role === 'business-staff') return '/business/dashboard'
  return '/dashboard'
}
