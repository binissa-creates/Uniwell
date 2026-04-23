import { supabase } from './supabase.js'

const KNOWN_ROLES = new Set(['student', 'admin'])

const PORTAL_PATH = {
  student: '/login',
  staff: '/login-staff',
}

const PORTAL_ROLE = {
  student: 'student',
  staff: 'admin',
}

const PORTAL_MISMATCH_MESSAGE = {
  student: {
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
  admin: '/admin/analytics',
}

function normalizeRole(role) {
  return KNOWN_ROLES.has(role) ? role : null
}

export async function fetchProfileRole(userId, client = supabase) {
  if (!userId) return null

  const { data, error } = await client
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error

  return normalizeRole(data?.role)
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
  return PORTAL_ROLE[portal] === normalizeRole(role)
}

export function roleCanAccess(allowedRole, role) {
  const requiredRole = normalizeRole(allowedRole)
  const currentRole = normalizeRole(role)

  return Boolean(requiredRole && currentRole && requiredRole === currentRole)
}
