import { Role } from '@/lib/types'

export type Permission =
  | 'view:dashboard'
  | 'manage:farms'
  | 'view:farms'
  | 'manage:fields'
  | 'manage:cycles'
  | 'view:cycles'
  | 'view:weather'
  | 'view:intelligence'
  | 'manage:recommendations'
  | 'view:analytics'
  | 'manage:reports'
  | 'conduct:inspections'
  | 'manage:users'
  | 'system:admin'

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    'view:dashboard',
    'manage:farms',
    'view:farms',
    'manage:fields',
    'manage:cycles',
    'view:cycles',
    'view:weather',
    'view:intelligence',
    'manage:recommendations',
    'view:analytics',
    'manage:reports',
    'conduct:inspections',
    'manage:users',
    'system:admin',
  ],
  farm_manager: [
    'view:dashboard',
    'manage:farms',
    'view:farms',
    'manage:fields',
    'manage:cycles',
    'view:cycles',
    'view:weather',
    'view:intelligence',
    'manage:recommendations',
    'view:analytics',
    'manage:reports',
    'conduct:inspections',
  ],
  agronomist: [
    'view:dashboard',
    'view:farms',
    'manage:fields',
    'manage:cycles',
    'view:cycles',
    'view:weather',
    'view:intelligence',
    'manage:recommendations',
    'view:analytics',
    'manage:reports',
    'conduct:inspections',
  ],
  extension_officer: [
    'view:dashboard',
    'view:farms',
    'view:cycles',
    'view:weather',
    'view:intelligence',
    'view:analytics',
    'conduct:inspections',
    'manage:reports',
  ],
  farmer: [
    'view:dashboard',
    'manage:farms',
    'view:farms',
    'manage:fields',
    'manage:cycles',
    'view:cycles',
    'view:weather',
    'view:intelligence',
    'manage:reports',
  ],
  viewer: [
    'view:dashboard',
    'view:farms',
    'view:cycles',
    'view:weather',
    'view:intelligence',
    'view:analytics',
  ],
  weather_analyst: [
    'view:dashboard',
    'view:weather',
    'view:analytics',
    'view:intelligence',
    'manage:reports',
    'view:farms',
    'view:cycles',
  ],
  data_analyst: [
    'view:dashboard',
    'view:weather',
    'view:analytics',
    'view:intelligence',
    'manage:reports',
    'view:farms',
    'view:cycles',
  ],
}

export function hasPermission(role: Role | string | undefined, permission: Permission): boolean {
  if (!role) return false
  const permissions = ROLE_PERMISSIONS[role as Role] || []
  return permissions.includes(permission)
}

export function canAccessRoute(role: Role | string | undefined, pathname: string): boolean {
  if (!role) return false
  if (role === 'admin') return true

  if (pathname.startsWith('/dashboard/admin') && role !== 'admin') {
    return false
  }

  return true
}
