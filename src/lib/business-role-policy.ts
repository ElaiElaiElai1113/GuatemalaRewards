import type { UserRole } from '@/types/domain'

export const businessOwnerOnlyPaths = [
  '/business/products',
  '/business/rewards',
  '/business/promotions',
  '/business/gift-cards',
  '/business/settings',
] as const

export const businessStaffOperationalPaths = [
  '/business/dashboard',
  '/business/redemptions',
  '/business/member-sale',
  '/business/members',
  '/business/partners',
  '/business/guide',
] as const

export function isBusinessOwnerRole(role: UserRole | null | undefined) {
  return role === 'business-owner'
}

export function isBusinessStaffRole(role: UserRole | null | undefined) {
  return role === 'business-staff'
}

function pathMatches(candidate: string, allowedPath: string) {
  return candidate === allowedPath || candidate.startsWith(`${allowedPath}/`)
}

export function canAccessBusinessPath(role: UserRole | null | undefined, path: string) {
  if (isBusinessOwnerRole(role)) return true
  if (!isBusinessStaffRole(role)) return false

  return businessStaffOperationalPaths.some((allowedPath) => pathMatches(path, allowedPath))
}

export function isOwnerOnlyBusinessPath(path: string) {
  return businessOwnerOnlyPaths.some((ownerOnlyPath) => pathMatches(path, ownerOnlyPath))
}
