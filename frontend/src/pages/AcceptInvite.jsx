import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { getHomeForRole } from '../lib/portalAccess'

function meetsPasswordRules(value) {
  return value.length >= 12
    && /[a-z]/.test(value)
    && /[A-Z]/.test(value)
    && /\d/.test(value)
    && /[^A-Za-z0-9]/.test(value)
}

export default function AcceptInvite() {
  const navigate = useNavigate()
  const { session, profile, loading: authLoading, refreshProfile } = useAuth()
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [checking, setChecking] = useState(true)
  const [validInvite, setValidInvite] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (authLoading) return
    if (
      session?.user
      && profile?.status === 'invited'
      && ['counselor', 'admin'].includes(profile.role)
    ) {
      setFullName(profile.full_name || profile.name || '')
      setValidInvite(true)
    } else {
      setValidInvite(false)
    }
    setChecking(false)
  }, [authLoading, session?.user?.id, profile])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    const normalizedName = fullName.trim()
    if (normalizedName.length < 2 || normalizedName.length > 150) {
      setError('Enter a name between 2 and 150 characters.')
      return
    }
    if (!meetsPasswordRules(password)) {
      setError('Use at least 12 characters with uppercase, lowercase, a number, and a symbol.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      const { error: passwordError } = await supabase.auth.updateUser({ password })
      if (passwordError) throw passwordError

      const { error: inviteError } = await supabase.rpc('accept_staff_invite', {
        p_full_name: normalizedName,
      })
      if (inviteError) throw inviteError

      const updatedProfile = await refreshProfile()
      if (updatedProfile?.status !== 'active') {
        throw new Error('The invitation could not be activated.')
      }
      navigate(getHomeForRole(updatedProfile.role), { replace: true })
    } catch (submitError) {
      console.error('[AcceptInvite] Account setup failed:', submitError)
      setError('We could not complete account setup. The invitation may have expired; request a new link or contact your administrator.')
    } finally {
      setSubmitting(false)
    }
  }

  if (checking || authLoading) {
    return (
      <main className="min-h-screen bg-[#FDF9F2] flex items-center justify-center text-[#6B5A10]" role="status" aria-live="polite">
        <Loader2 size={24} className="animate-spin" />
        <span className="ml-3 text-sm font-semibold">Verifying invitation...</span>
      </main>
    )
  }

  if (!validInvite) {
    return (
      <main className="min-h-screen bg-[#FDF9F2] flex items-center justify-center px-6 py-12">
        <section className="w-full max-w-md rounded-[2rem] bg-white p-8 text-center shadow-lift">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F6C945]/20 text-[#755b00]">
            <ShieldCheck size={22} />
          </div>
          <h1 className="font-jakarta text-2xl font-extrabold text-[#3a2b25]">Invitation unavailable</h1>
          <p className="mt-3 text-sm leading-relaxed text-[#3a2b25]/60">
            This invitation link is invalid, expired, or has already been used. Ask your administrator for a new link.
          </p>
          <Link to="/login" className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#F6C945] px-5 text-sm font-bold text-[#3E3006]">
            Back to sign in
          </Link>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#FDF9F2] flex items-center justify-center px-5 py-10">
      <section className="w-full max-w-lg rounded-[2rem] bg-white p-7 shadow-lift sm:p-10">
        <div className="mb-7 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F6C945]/20 text-[#755b00]">
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8C6218]">Staff invitation</p>
            <h1 className="mt-1 font-jakarta text-2xl font-extrabold text-[#3a2b25]">Complete your account</h1>
          </div>
        </div>

        <p className="mb-7 text-sm text-[#3a2b25]/60">Confirm your name and set a password to activate your UniWell account.</p>

        {error && (
          <div role="alert" aria-live="polite" className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="invite-full-name" className="mb-2 block text-xs font-bold text-[#755b00]">Full name</label>
            <input
              id="invite-full-name"
              type="text"
              autoComplete="name"
              minLength={2}
              maxLength={150}
              required
              value={fullName}
              onChange={event => setFullName(event.target.value)}
              className="w-full rounded-xl bg-[#FCF8F4] px-4 py-3.5 text-sm text-[#3a2b25] outline-none focus:ring-2 focus:ring-[#F8D272]"
            />
          </div>

          <div>
            <label htmlFor="invite-password" className="mb-2 block text-xs font-bold text-[#755b00]">New password</label>
            <div className="relative">
              <input
                id="invite-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={password}
                onChange={event => setPassword(event.target.value)}
                className="w-full rounded-xl bg-[#FCF8F4] py-3.5 pl-4 pr-12 text-sm text-[#3a2b25] outline-none focus:ring-2 focus:ring-[#F8D272]"
              />
              <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(value => !value)} className="absolute inset-y-0 right-3 flex items-center text-[#AA8E7E]">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="mt-2 text-xs text-[#3a2b25]/50">At least 12 characters, including uppercase, lowercase, a number, and a symbol.</p>
          </div>

          <div>
            <label htmlFor="invite-confirm-password" className="mb-2 block text-xs font-bold text-[#755b00]">Confirm password</label>
            <div className="relative">
              <input
                id="invite-confirm-password"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={event => setConfirmPassword(event.target.value)}
                className="w-full rounded-xl bg-[#FCF8F4] py-3.5 pl-4 pr-12 text-sm text-[#3a2b25] outline-none focus:ring-2 focus:ring-[#F8D272]"
              />
              <button type="button" aria-label={showConfirm ? 'Hide confirmation password' : 'Show confirmation password'} onClick={() => setShowConfirm(value => !value)} className="absolute inset-y-0 right-3 flex items-center text-[#AA8E7E]">
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={submitting} aria-busy={submitting} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#F8D272] to-[#F6C945] px-4 text-sm font-extrabold text-[#3E3006] shadow-sm transition hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-60">
            {submitting && <Loader2 size={18} className="animate-spin" />}
            {submitting ? 'Activating account...' : 'Complete account setup'}
          </button>
        </form>
      </section>
    </main>
  )
}
