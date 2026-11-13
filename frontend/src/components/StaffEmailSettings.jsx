import { useCallback, useEffect, useState } from 'react'
import { Mail } from 'lucide-react'
import { supabase } from '../lib/supabase'

function getTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
}

export default function StaffEmailSettings({ userId, email }) {
  const [enabled, setEnabled] = useState(false)
  const [timeZone, setTimeZone] = useState('UTC')
  const [busy, setBusy] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadPreference = useCallback(async () => {
    setBusy(true)
    setError('')
    try {
      const { data, error: loadError } = await supabase
        .from('notification_preferences')
        .select('staff_wellness_email_enabled, staff_wellness_email_timezone')
        .eq('user_id', userId)
        .maybeSingle()
      if (loadError) throw loadError
      setEnabled(data?.staff_wellness_email_enabled ?? false)
      setTimeZone(data?.staff_wellness_email_timezone || getTimeZone())
    } catch (loadError) {
      console.error('[StaffEmailSettings] Could not load email preference:', loadError)
      setError('Email preference could not be loaded. Please try again.')
    } finally {
      setBusy(false)
    }
  }, [userId])

  useEffect(() => {
    loadPreference()
  }, [loadPreference])

  const handleChange = async event => {
    const nextEnabled = event.target.checked
    const nextTimeZone = getTimeZone()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const { error: saveError } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          staff_wellness_email_enabled: nextEnabled,
          staff_wellness_email_timezone: nextTimeZone,
          staff_wellness_email_hour: 9,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
      if (saveError) throw saveError
      setEnabled(nextEnabled)
      setTimeZone(nextTimeZone)
      setNotice(nextEnabled
        ? 'Weekly Campus Wellness emails are enabled.'
        : 'Weekly Campus Wellness emails are turned off.')
    } catch (saveError) {
      console.error('[StaffEmailSettings] Could not save email preference:', saveError)
      setError('Could not save your email preference. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="rounded-2xl border border-outline-variant bg-surface-lowest p-5 shadow-suncast sm:rounded-3xl sm:p-8">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-container/15 text-primary">
          <Mail size={18} />
        </div>
        <div>
          <h2 className="font-jakarta font-bold text-warm">Weekly Campus Wellness email</h2>
          <p className="text-xs text-warm/60">A short follow-up for counselors and administrators.</p>
        </div>
      </div>

      {busy ? (
        <p className="text-sm text-warm/60" role="status">Loading email preference…</p>
      ) : (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4 rounded-2xl border border-outline-variant bg-surface p-4">
            <div>
              <h3 className="text-sm font-bold text-warm">Email updates to your sign-in address</h3>
              <p className="mt-1 break-all text-xs text-warm/60">{email || 'Your UniWell account email'}</p>
              <p className="mt-2 text-xs leading-relaxed text-warm/60">
                Every Monday at 9:00 a.m. ({timeZone}), we’ll send aggregate check-in, approved-strategy,
                and pending-moderation counts with a sign-in link. No student names, journal entries,
                or individual wellness details are included.
              </p>
            </div>
            <input
              type="checkbox"
              aria-label="Enable weekly Campus Wellness emails"
              checked={enabled}
              disabled={saving}
              onChange={handleChange}
              className="mt-1 h-4 w-4 shrink-0 accent-[#755b00]"
            />
          </div>

          {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-xs text-red-700">{error}</p>}
          {notice && <p role="status" className="rounded-xl bg-[#EAF5EE] px-3 py-2.5 text-xs text-[#2D6B47]">{notice}</p>}
        </div>
      )}
    </section>
  )
}
