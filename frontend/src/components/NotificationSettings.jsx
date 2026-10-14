import { useCallback, useEffect, useState } from 'react'
import { Bell, BellOff, CheckCircle2, Clock3, Smartphone } from 'lucide-react'
import { supabase } from '../lib/supabase'

const DEFAULT_HOUR = 8

function getTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
}

function applicationServerKey(value) {
  const padding = '='.repeat((4 - value.length % 4) % 4)
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  return Uint8Array.from(raw, character => character.charCodeAt(0))
}

function getSubscriptionKeys(subscription) {
  const json = subscription.toJSON()
  const p256dh = json.keys?.p256dh
  const authKey = json.keys?.auth
  if (!p256dh || !authKey) throw new Error('This browser could not provide the secure push keys.')
  return { p256dh, auth_key: authKey }
}

function formatHour(hour) {
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).format(new Date(2020, 0, 1, hour))
}

export default function NotificationSettings({ userId }) {
  const vapidPublicKey = import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY
  const [supported, setSupported] = useState(false)
  const [permission, setPermission] = useState('default')
  const [pushEnabled, setPushEnabled] = useState(false)
  const [inAppEnabled, setInAppEnabled] = useState(true)
  const [hour, setHour] = useState(DEFAULT_HOUR)
  const [busy, setBusy] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadSettings = useCallback(async () => {
    setBusy(true)
    setError('')
    try {
      const hasPushSupport = typeof window !== 'undefined'
        && 'Notification' in window
        && 'serviceWorker' in navigator
        && 'PushManager' in window
        && window.isSecureContext
      setSupported(hasPushSupport)
      if (hasPushSupport) setPermission(Notification.permission)

      const [preferencesResult, subscriptionsResult] = await Promise.all([
        supabase.from('notification_preferences').select('in_app_enabled, push_timezone, push_hour').eq('user_id', userId).maybeSingle(),
        supabase.from('push_subscriptions').select('endpoint').eq('user_id', userId),
      ])
      if (preferencesResult.error) throw preferencesResult.error
      if (subscriptionsResult.error) throw subscriptionsResult.error

      setInAppEnabled(preferencesResult.data?.in_app_enabled ?? true)
      setHour(preferencesResult.data?.push_hour ?? DEFAULT_HOUR)

      if (hasPushSupport && Notification.permission === 'granted') {
        const registration = await navigator.serviceWorker.getRegistration('/')
        const subscription = await registration?.pushManager.getSubscription()
        setPushEnabled(Boolean(
          subscription
          && subscriptionsResult.data?.some(row => row.endpoint === subscription.endpoint),
        ))
      } else {
        setPushEnabled(false)
      }
    } catch (loadError) {
      console.error('[NotificationSettings] Could not load preferences:', loadError)
      setError('Notification preferences could not be loaded. Please try again.')
    } finally {
      setBusy(false)
    }
  }, [userId])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const savePreferences = async (updates) => {
    const { error: saveError } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: userId,
        in_app_enabled: updates.in_app_enabled ?? inAppEnabled,
        push_timezone: updates.push_timezone ?? getTimeZone(),
        push_hour: updates.push_hour ?? hour,
      }, { onConflict: 'user_id' })
    if (saveError) throw saveError
  }

  const handleInAppChange = async (enabled) => {
    setSaving(true)
    setError('')
    setNotice('')
    try {
      await savePreferences({ in_app_enabled: enabled })
      setInAppEnabled(enabled)
      setNotice(enabled ? 'In-app reminders are on.' : 'In-app reminders are off.')
    } catch (saveError) {
      console.error('[NotificationSettings] Could not update in-app preference:', saveError)
      setError('Could not save this preference. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const syncSubscription = async (subscription, selectedHour) => {
    const { p256dh, auth_key } = getSubscriptionKeys(subscription)
    const { error: saveError } = await supabase
      .from('push_subscriptions')
      .upsert({
        endpoint: subscription.endpoint,
        user_id: userId,
        p256dh,
        auth_key,
        timezone: getTimeZone(),
        notification_hour: selectedHour,
      }, { onConflict: 'endpoint' })
    if (saveError) throw saveError
  }

  const handlePushEnable = async () => {
    if (!supported || !vapidPublicKey) return
    setSaving(true)
    setError('')
    setNotice('')
    let subscription
    try {
      let nextPermission = Notification.permission
      if (nextPermission === 'default') nextPermission = await Notification.requestPermission()
      setPermission(nextPermission)
      if (nextPermission !== 'granted') {
        setError(nextPermission === 'denied'
          ? 'Notifications are blocked for UniWell in your browser or device settings.'
          : 'Allow notifications to enable your Daily Dose reminder.')
        return
      }

      const registration = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready
      subscription = await registration.pushManager.getSubscription()
        || await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey(vapidPublicKey),
        })
      await syncSubscription(subscription, hour)
      await savePreferences({ push_hour: hour, push_timezone: getTimeZone() })
      setPushEnabled(true)
      setNotice('Daily Dose notifications are enabled for this device.')
    } catch (enableError) {
      console.error('[NotificationSettings] Could not enable push notifications:', enableError)
      if (subscription) {
        const { error: deleteError } = await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', userId)
          .eq('endpoint', subscription.endpoint)
        if (deleteError) console.error('[NotificationSettings] Could not remove incomplete database subscription:', deleteError)
        try {
          await subscription.unsubscribe()
        } catch (unsubscribeError) {
          console.error('[NotificationSettings] Could not clean up incomplete subscription:', unsubscribeError)
        }
      }
      setError('Could not enable phone notifications. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handlePushDisable = async () => {
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const registration = await navigator.serviceWorker.getRegistration('/')
      const subscription = await registration?.pushManager.getSubscription()
      if (subscription) {
        const { error: deleteError } = await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', userId)
          .eq('endpoint', subscription.endpoint)
        if (deleteError) throw deleteError
        const unsubscribed = await subscription.unsubscribe()
        if (!unsubscribed) throw new Error('The browser did not unsubscribe this device.')
      }
      setPushEnabled(false)
      setNotice('Daily Dose notifications are off for this device.')
    } catch (disableError) {
      console.error('[NotificationSettings] Could not disable push notifications:', disableError)
      setError('Could not turn off phone notifications. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleHourChange = async (event) => {
    const nextHour = Number(event.target.value)
    setHour(nextHour)
    setError('')
    setNotice('')
    try {
      setSaving(true)
      await savePreferences({ push_hour: nextHour, push_timezone: getTimeZone() })
      if (pushEnabled) {
        const registration = await navigator.serviceWorker.getRegistration('/')
        const subscription = await registration?.pushManager.getSubscription()
        if (!subscription) throw new Error('The browser subscription is missing.')
        await syncSubscription(subscription, nextHour)
      }
      setNotice('Your reminder time has been saved.')
    } catch (saveError) {
      console.error('[NotificationSettings] Could not update reminder time:', saveError)
      setError('Could not save your reminder time. Please try again.')
      await loadSettings()
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="rounded-2xl border border-outline-variant bg-surface-lowest p-5 shadow-suncast sm:rounded-3xl sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-container/15 text-primary">
          <Bell size={18} />
        </div>
        <div>
          <h2 className="font-jakarta font-bold text-warm">Notifications</h2>
          <p className="text-xs text-warm/60">Choose how UniWell can gently remind you.</p>
        </div>
      </div>

      {busy ? (
        <p className="text-sm text-warm/60" role="status">Loading notification preferences…</p>
      ) : (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4 rounded-2xl border border-outline-variant bg-surface p-4">
            <div className="flex gap-3">
              <BellOff size={17} className="mt-0.5 shrink-0 text-primary" />
              <div>
                <h3 className="text-sm font-bold text-warm">In-app reminders</h3>
                <p className="mt-1 text-xs leading-relaxed text-warm/60">
                  Show gentle check-in reminders in UniWell while you are using the app.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              aria-label="Enable in-app reminders"
              checked={inAppEnabled}
              disabled={saving}
              onChange={event => handleInAppChange(event.target.checked)}
              className="mt-1 h-4 w-4 accent-[#755b00]"
            />
          </div>

          <div className="rounded-2xl border border-outline-variant bg-surface p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <Smartphone size={17} className="mt-0.5 shrink-0 text-primary" />
                <div>
                  <h3 className="text-sm font-bold text-warm">Phone notifications</h3>
                  <p className="mt-1 text-xs leading-relaxed text-warm/60">
                    Receive a private “Your Daily Dose is ready” reminder once a day. You can turn it off at any time.
                  </p>
                </div>
              </div>
              {pushEnabled ? (
                <span className="shrink-0 rounded-full bg-[#EAF5EE] px-2.5 py-1 text-[10px] font-bold text-[#2D6B47]">On</span>
              ) : null}
            </div>

            {!supported ? (
              <p className="mt-4 rounded-xl bg-[#FDF3E3] px-3 py-2.5 text-xs leading-relaxed text-[#7A4F0D]">
                This browser or device does not support web push notifications, or the page is not using a secure connection.
              </p>
            ) : !vapidPublicKey ? (
              <p className="mt-4 rounded-xl bg-[#FDF3E3] px-3 py-2.5 text-xs leading-relaxed text-[#7A4F0D]">
                Phone notifications are not configured for this deployment yet.
              </p>
            ) : (
              <>
                <label htmlFor="daily-dose-time" className="mb-1.5 mt-4 block text-xs font-bold text-warm/70">
                  Daily reminder time (your device time)
                </label>
                <select
                  id="daily-dose-time"
                  value={hour}
                  disabled={saving}
                  onChange={handleHourChange}
                  className="w-full rounded-xl border border-outline-variant bg-surface-lowest px-3 py-2.5 text-sm text-warm outline-none focus:ring-2 focus:ring-primary"
                >
                  {Array.from({ length: 24 }, (_, value) => (
                    <option key={value} value={value}>{formatHour(value)}</option>
                  ))}
                </select>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={saving || (pushEnabled && permission === 'granted')}
                    onClick={handlePushEnable}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary-container px-4 py-2 text-xs font-bold text-[#3E3006] transition hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    {pushEnabled ? <CheckCircle2 size={15} /> : <Bell size={15} />}
                    {pushEnabled ? 'Enabled on this device' : 'Enable phone notifications'}
                  </button>
                  {pushEnabled && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={handlePushDisable}
                      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-outline-variant px-4 py-2 text-xs font-bold text-warm/70 transition hover:bg-surface disabled:opacity-55"
                    >
                      Turn off
                    </button>
                  )}
                </div>
                <p className="mt-3 flex items-start gap-2 text-[11px] leading-relaxed text-warm/55">
                  <Clock3 size={13} className="mt-0.5 shrink-0" />
                  Delivery requires internet access. On iPhone, add UniWell to your Home Screen and allow notifications when prompted.
                </p>
              </>
            )}
          </div>

          {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-xs text-red-700">{error}</p>}
          {notice && <p role="status" className="rounded-xl bg-[#EAF5EE] px-3 py-2.5 text-xs text-[#2D6B47]">{notice}</p>}
        </div>
      )}
    </section>
  )
}
