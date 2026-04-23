import test from 'node:test'
import assert from 'node:assert/strict'

process.env.VITE_SUPABASE_URL = 'https://example.supabase.co'
process.env.VITE_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_test'

const {
  fetchProfileRole,
  getPortalForPath,
  getHomeForRole,
  getPortalDeniedMessage,
  isPortalValidationActive,
  roleCanAccess,
  roleMatchesPortal,
} = await import('../src/lib/portalAccess.js')

test('getHomeForRole maps known roles to their landing pages', () => {
  assert.equal(getHomeForRole('student'), '/dashboard')
  assert.equal(getHomeForRole('admin'), '/admin/analytics')
  assert.equal(getHomeForRole('unknown'), '/login')
  assert.equal(getHomeForRole(null), '/login')
})

test('roleMatchesPortal only allows the matching portal for each role', () => {
  assert.equal(roleMatchesPortal('student', 'student'), true)
  assert.equal(roleMatchesPortal('student', 'admin'), false)
  assert.equal(roleMatchesPortal('staff', 'admin'), true)
  assert.equal(roleMatchesPortal('staff', 'student'), false)
  assert.equal(roleMatchesPortal('staff', null), false)
})

test('roleCanAccess only allows protected routes for the required role', () => {
  assert.equal(roleCanAccess('student', 'student'), true)
  assert.equal(roleCanAccess('student', 'admin'), false)
  assert.equal(roleCanAccess('admin', 'admin'), true)
  assert.equal(roleCanAccess('admin', 'student'), false)
  assert.equal(roleCanAccess('admin', null), false)
})

test('getPortalDeniedMessage returns role-specific mismatch copy', () => {
  assert.equal(
    getPortalDeniedMessage('student', 'admin'),
    'Use Staff & Guidance Portal for Admin Login.'
  )
  assert.equal(
    getPortalDeniedMessage('staff', 'student'),
    'Use Student Portal for Student Login.'
  )
  assert.equal(
    getPortalDeniedMessage('student', null),
    'Access denied. This account cannot use the Student Portal.'
  )
})

test('getPortalForPath resolves the correct portal from the route path', () => {
  assert.equal(getPortalForPath('/login'), 'student')
  assert.equal(getPortalForPath('/login-staff'), 'staff')
  assert.equal(getPortalForPath('/register'), null)
})

test('isPortalValidationActive only holds the matching login route', () => {
  assert.equal(isPortalValidationActive('/login', 'student'), true)
  assert.equal(isPortalValidationActive('/login-staff', 'staff'), true)
  assert.equal(isPortalValidationActive('/login', 'staff'), false)
  assert.equal(isPortalValidationActive('/register', 'student'), false)
  assert.equal(isPortalValidationActive('/login', null), false)
})

test('fetchProfileRole returns a known role from profiles', async () => {
  const client = {
    from(table) {
      assert.equal(table, 'profiles')
      return {
        select(columns) {
          assert.equal(columns, 'role')
          return {
            eq(column, value) {
              assert.equal(column, 'id')
              assert.equal(value, 'user-1')
              return {
                async maybeSingle() {
                  return { data: { role: 'student' }, error: null }
                },
              }
            },
          }
        },
      }
    },
  }

  await assert.doesNotReject(async () => {
    assert.equal(await fetchProfileRole('user-1', client), 'student')
  })
})

test('fetchProfileRole collapses missing or unexpected roles to null', async () => {
  const client = {
    from() {
      return {
        select() {
          return {
            eq() {
              return {
                async maybeSingle() {
                  return { data: { role: 'guest' }, error: null }
                },
              }
            },
          }
        },
      }
    },
  }

  assert.equal(await fetchProfileRole('user-2', client), null)
})
