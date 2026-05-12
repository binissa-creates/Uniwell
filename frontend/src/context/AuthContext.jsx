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
  const [loading, setLoading] = useState(true)
  const [portalValidation, setPortalValidation] = useState(null)

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session ?? null)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next ?? null)
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
      setLoading(false)
      return
    }
    setLoading(true)
    supabase
      .from('profiles')
      .select('id, name, student_id, course, year_level, role, created_at')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(async ({ data }) => {
        if (!active) return
        
        // SELF-HEALING: If profile is missing but user is logged in, create it from metadata.
        if (!data && session.user) {
          console.warn('Profile missing for user. Attempting to heal...')
          const meta = session.user.user_metadata || {}
          const { data: healed, error: healError } = await supabase
            .from('profiles')
            .insert({
              id: session.user.id,
              name: meta.name || splitEmail(session.user.email),
              student_id: meta.student_id || session.user.id.substring(0, 8),
              course: meta.course || 'Unspecified',
              year_level: meta.year_level || 1,
              role: meta.role || 'student'
            })
            .select()
            .maybeSingle()
            
          if (!healError && healed) {
            setProfile(healed)
          } else {
            console.error('Heal failed:', healError)
            setProfile(null)
          }
        } else {
          setProfile(data ?? null)
        }
        setLoading(false)
      })

    function splitEmail(email) {
      return email ? email.split('@')[0] : 'User'
    }
    return () => {
      active = false
    }
  }, [session?.user?.id])

  const signOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
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
      }
    : null

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        signOut,
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
