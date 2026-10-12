import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

/**
 * Auth state = { session, profile }.
 * `session` is the Supabase auth session (null when signed out).
 * `profile` is the matching row in public.profiles (name, role, course, etc.).
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const [portalValidation, setPortalValidation] = useState(null)

  useEffect(() => {
    let active = true
    let receivedAuthEvent = false

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      receivedAuthEvent = true
      setSession(next ?? null)
      setProfile(current => {
        // If current profile belongs to the next user, keep it without re-locking the screen
        if (current?.id === next?.user?.id && current) {
          setProfileLoading(false)
          return current
        }
        setProfileLoading(Boolean(next?.user?.id))
        return null
      })
      setAuthLoading(false)
    })

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      if (!receivedAuthEvent) {
        setSession(data.session ?? null)
        setProfile(current => {
          if (current?.id === data.session?.user?.id && current) {
            setProfileLoading(false)
            return current
          }
          setProfileLoading(Boolean(data.session?.user?.id))
          return null
        })
      }
      setAuthLoading(false)
    }).catch(error => {
      console.error('[AuthContext] Could not restore session:', error)
      if (active) {
        if (!receivedAuthEvent) setSession(null)
        setProfileLoading(false)
        setAuthLoading(false)
      }
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    let active = true
    if (!session?.user?.id) {
      setProfile(null)
      setProfileLoading(false)
      return
    }

    // If profile is already valid for this session user, do not lock screen
    if (profile?.id === session.user.id) {
      setProfileLoading(false)
      return
    }

    setProfileLoading(true)

    // Safety timeout: GUARANTEES profile loading never hangs indefinitely
    const safetyTimer = setTimeout(() => {
      if (!active) return
      console.warn('[AuthContext] Profile load exceeded 3s timeout — unblocking with session fallback')
      const fallbackRole = session.user.email?.toLowerCase().includes('admin') ? 'admin' : 'student'
      setProfile(prev => prev || {
        id: session.user.id,
        email: session.user.email,
        name: session.user.user_metadata?.name || (fallbackRole === 'admin' ? 'Guidance' : 'Student'),
        full_name: session.user.user_metadata?.name || (fallbackRole === 'admin' ? 'Guidance' : 'Student'),
        role: session.user.user_metadata?.role || fallbackRole,
        status: 'active',
      })
      setProfileLoading(false)
    }, 3000)

    // Query columns that actually exist in the profiles table
    supabase.from('profiles')
      .select('id, name, student_id, course, year_level, role, created_at')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        clearTimeout(safetyTimer)
        if (!active) return

        if (!error && data) {
          // Full profile loaded cleanly
          setProfile({
            ...data,
            full_name: data.name,
            status: 'active',
          })
          setProfileLoading(false)
          return
        }

        if (error) console.warn('[AuthContext] profiles fetch failed, trying get_my_role RPC:', error?.message)
        return supabase.rpc('get_my_role').then(({ data: rpcRole }) => {
          if (!active) return
          clearTimeout(safetyTimer)
          const fallbackRole = rpcRole || (session.user.email?.toLowerCase().includes('admin') ? 'admin' : 'student')
          const minimalProfile = {
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.name || (fallbackRole === 'admin' ? 'Guidance' : session.user.email?.split('@')[0] || 'Student'),
            full_name: session.user.user_metadata?.full_name || (fallbackRole === 'admin' ? 'Guidance' : session.user.email?.split('@')[0] || 'Student'),
            role: fallbackRole,
            status: 'active',
          }
          console.log('[AuthContext] Loaded profile via fallback:', minimalProfile)
          setProfile(minimalProfile)
          setProfileLoading(false)
        })
      })
      .catch(error => {
        clearTimeout(safetyTimer)
        if (!active) return
        console.error('[AuthContext] Could not load profile:', error)
        const fallbackRole = session.user.email?.toLowerCase().includes('admin') ? 'admin' : 'student'
        setProfile({
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.name || (fallbackRole === 'admin' ? 'Guidance' : 'Student'),
          full_name: session.user.user_metadata?.full_name || (fallbackRole === 'admin' ? 'Guidance' : 'Student'),
          role: fallbackRole,
          status: 'active',
        })
        setProfileLoading(false)
      })

    return () => {
      active = false
      clearTimeout(safetyTimer)
    }
  }, [session?.user?.id])

  const signOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
    setProfileLoading(false)
  }

  const refreshProfile = async () => {
    const userId = session?.user?.id
    if (!userId) return null

    setProfileLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, student_id, course, year_level, role, created_at')
        .eq('id', userId)
        .maybeSingle()
      if (error) throw error

      const nextProfile = data ? { ...data, full_name: data.name, status: 'active' } : null
      setProfile(nextProfile)
      return nextProfile
    } catch (error) {
      console.warn('[refreshProfile] failed:', error)
      return null
    } finally {
      setProfileLoading(false)
    }
  }

  const beginPortalValidation = (portal) => {
    setPortalValidation(portal)
  }

  const endPortalValidation = () => {
    setPortalValidation(null)
  }

  const user = session?.user
    ? {
      id: session.user.id,
      email: session.user.email,
      ...(profile ?? {}),
      name: (profile?.role === 'admin' && (!profile?.name || profile?.name?.includes('@')))
        ? 'Guidance'
        : (profile?.name || profile?.full_name || ''),
    }
    : null

  const loading = authLoading || profileLoading

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        signOut,
        refreshProfile,
        portalValidation,
        beginPortalValidation,
        endPortalValidation,
        isAdmin: profile?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
