import { ROLES } from '../constants/roles'

const PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: ['*'],
  [ROLES.ADMIN]: ['dashboard', 'bot', 'leads', 'campaigns', 'automation', 'inbox', 'analytics', 'settings'],
  [ROLES.AGENT]: ['dashboard', 'leads', 'inbox'],
  [ROLES.VIEWER]: ['dashboard', 'analytics'],
}

export const canAccess = (role, resource) => {
  const perms = PERMISSIONS[role] || []
  return perms.includes('*') || perms.includes(resource)
}
