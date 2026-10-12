import { useEffect, useRef } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getHomeForRole } from '../lib/portalAccess'
import LoadingScreen from './LoadingScreen'

// Route guards are a UX layer only; database access is enforced by Supabase RLS.
export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { session, profile, loading, signOut } = useAuth()
  const signOutStarted = useRef(false)

  // Diagnostic: log state on every render so we can trace redirect issues
  console.log('[ProtectedRoute] state:', { 
    hasSession: !!session, 
    hasProfile: !!profile, 
    profileStatus: profile?.status, 
    profileRole: profile?.role,
    loading 
  })

  useEffect(() => {
    if (!session) signOutStarted.current = false
    if (session && profile?.status === 'disabled' && !signOutStarted.current) {
      signOutStarted.current = true
      void signOut()
    }
  }, [session, profile?.status, signOut])

  if (loading) return <LoadingScreen />
  if (!session) return <Navigate to="/login" replace />
  if (!profile) return <Navigate to="/login" replace />
  if (profile.status === 'disabled') return <Navigate to="/login" replace />
  if (profile.status === 'invited') return <Navigate to="/accept-invite" replace />
  if (profile.status !== 'active') return <Navigate to="/login" replace />

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]
  if (!roles.includes(profile.role)) {
    return <Navigate to={getHomeForRole(profile.role)} replace />
  }

  return children
}
