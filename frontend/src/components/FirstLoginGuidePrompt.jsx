import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, BookOpen, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function FirstLoginGuidePrompt() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [handledUserId, setHandledUserId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const shouldShow = user?.id
    && profile?.status === 'active'
    && ['student', 'counselor'].includes(profile.role)
    && profile.onboarding_completed === false
    && handledUserId !== user.id

  const choosePath = async (path) => {
    setSaving(true)
    setError('')

    try {
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id)
        .select('id')
        .maybeSingle()

      if (updateError) throw updateError
      if (!data) throw new Error('No profile was updated.')

      setHandledUserId(user.id)
      if (path === 'guide') navigate('/guide')
    } catch (saveError) {
      console.error('[FirstLoginGuidePrompt] Could not save onboarding choice:', saveError)
      setError('We could not save your choice. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (!shouldShow) return null

  const isStudent = profile.role === 'student'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#3a2b25]/45 px-4 py-6 backdrop-blur-sm">
      <section
        aria-labelledby="first-login-title"
        aria-modal="true"
        className="w-full max-w-lg rounded-[2rem] bg-surface-lowest p-6 shadow-lift sm:rounded-[2.5rem] sm:p-9"
        role="dialog"
      >
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-container/30 text-primary">
          <Sparkles size={25} />
        </div>
        <p className="text-center text-[10px] font-black uppercase tracking-[0.25em] text-primary">
          Welcome to UniWell
        </p>
        <h1 id="first-login-title" className="mt-2 text-center font-jakarta text-2xl font-extrabold text-warm sm:text-3xl">
          {isStudent ? 'Make this space yours.' : 'Welcome to your staff hub.'}
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-center text-sm leading-relaxed text-warm/70">
          {isStudent
            ? 'Would you like a quick, step-by-step tour, or would you rather explore on your own?'
            : 'Would you like a quick, step-by-step tour of your staff tools, or would you rather explore on your own?'}
        </p>

        {error && (
          <p className="mt-5 rounded-xl bg-error-container px-4 py-3 text-center text-sm text-error" role="alert">
            {error}
          </p>
        )}

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => choosePath('guide')}
            className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary-container px-5 py-3 text-sm font-bold text-[#3E3006] transition hover:shadow-glow disabled:cursor-wait disabled:opacity-60"
          >
            <BookOpen size={17} />
            {saving ? 'Saving…' : 'Show me around'}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => choosePath('home')}
            className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-surface-low px-5 py-3 text-sm font-bold text-warm transition hover:bg-surface-container disabled:cursor-wait disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'I’ll explore on my own'}
            {!saving && <ArrowRight size={16} />}
          </button>
        </div>
      </section>
    </div>
  )
}
