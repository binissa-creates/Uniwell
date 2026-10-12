import { supabase } from './supabase.js'

const KNOWN_ROLES = new Set(['student', 'counselor', 'admin'])

const PORTAL_PATH = {
  student: '/login',
  staff: '/login-staff',
}

const PORTAL_ROLE = {
  student: 'student',
  staff: ['counselor', 'admin'],
}

const PORTAL_MISMATCH_MESSAGE = {
  student: {
    counselor: 'Use the unified UniWell login.',
    admin: 'Use Staff & Guidance Portal for Admin Login.',
  },
  staff: {
    student: 'Use Student Portal for Student Login.',
  },
}

const PORTAL_FALLBACK_MESSAGE = {
  student: 'Access denied. This account cannot use the Student Portal.',
  staff: 'Access denied. This account cannot use the Staff & Guidance Portal.',
}

const ROLE_HOME = {
  student: '/dashboard',
  counselor: '/staff',
  admin: '/staff',
}

function normalizeRole(role) {
  return KNOWN_ROLES.has(role) ? role : null
}

export async function fetchProfileRole(userId, client = supabase) {
  if (!userId) return null

  // Use the SECURITY DEFINER RPC to avoid any RLS recursion issues.
  // If get_my_role() isn't available yet (pre-migration), fall back to
  // a direct table query so the app still partially works.
  try {
    const { data, error } = await client.rpc('get_my_role')
    if (error) throw error
    return normalizeRole(data)
  } catch (rpcErr) {
    console.warn('[portalAccess] get_my_role() RPC failed, falling back to direct query:', rpcErr?.message)
    const { data, error } = await client
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle()
    if (error) throw error
    return normalizeRole(data?.role)
  }
}

export function getHomeForRole(role) {
  return ROLE_HOME[normalizeRole(role)] ?? '/login'
}

export function getPortalForPath(pathname) {
  if (pathname === PORTAL_PATH.student) return 'student'
  if (pathname === PORTAL_PATH.staff) return 'staff'
  return null
}

export function isPortalValidationActive(pathname, portal) {
  return Boolean(portal && getPortalForPath(pathname) === portal)
}

export function getPortalDeniedMessage(portal, role) {
  const normalizedRole = normalizeRole(role)

  return PORTAL_MISMATCH_MESSAGE[portal]?.[normalizedRole]
    ?? PORTAL_FALLBACK_MESSAGE[portal]
    ?? 'Access denied.'
}

export function roleMatchesPortal(portal, role) {
  const expectedRole = PORTAL_ROLE[portal]
  const normalizedRole = normalizeRole(role)
  return Array.isArray(expectedRole)
    ? expectedRole.includes(normalizedRole)
    : expectedRole === normalizedRole
}

export function roleCanAccess(allowedRoles, role) {
  const currentRole = normalizeRole(role)
  const requiredRoles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]

  return Boolean(currentRole && requiredRoles.map(normalizeRole).includes(currentRole))
}
