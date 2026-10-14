import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { ArrowRight, Bell, CheckCircle2, Clock3, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import LoadingIndicator from './LoadingIndicator'

const LOW_MOOD_KEYS = ['awful', 'bad', 'angry', 'burned_out', 'lonely', 'frustrated', 'nervous', 'confused']
const MS_PER_DAY = 24 * 60 * 60 * 1000

function localDayKey(value) {
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function dayDifference(from, to) {
  const [fromYear, fromMonth, fromDay] = from.split('-').map(Number)
  const [toYear, toMonth, toDay] = to.split('-').map(Number)
  return Math.round((new Date(toYear, toMonth - 1, toDay) - new Date(fromYear, fromMonth - 1, fromDay)) / MS_PER_DAY)
}

function getStudentReminder(latestEntry, recentEntries, name) {
  const firstName = name && !name.includes('@') ? name.split(' ')[0] : 'there'
  if (!latestEntry) {
    return {
      title: `A gentle check-in for you, ${firstName}`,
      message: 'Your sunflower is ready for a little care. Express how you feel whenever you are ready.',
    }
  }

  const today = localDayKey(new Date())
  const daysSince = dayDifference(localDayKey(latestEntry), today)
  if (daysSince === 0) return null

  if (daysSince >= 3) {
    return {
      title: `Welcome back, ${firstName}`,
      message: `It has been ${daysSince} days since your last mood check-in. Your feelings are welcome here, whenever you are ready.`,
    }
  }

  const recentDays = [...new Set(recentEntries.map(entry => localDayKey(entry.logged_at)))]
  let currentStreak = 0
  for (let index = 0; index < recentDays.length; index += 1) {
    const expectedDay = new Date(`${localDayKey(latestEntry)}T12:00:00`)
    expectedDay.setDate(expectedDay.getDate() - index)
    if (recentDays[index] !== localDayKey(expectedDay)) break
    currentStreak += 1
  }

  return {
    title: 'A little care for your sunflower',
    message: currentStreak > 0
      ? `A check-in today can help keep your ${currentStreak}-day care streak growing. How are you feeling?`
      : 'Take a gentle moment to check in with yourself and share how you feel today.',
  }
}

function isStageComplete(checkin, stage, latestLogId) {
  const completedThrough = checkin?.[`${stage}_through_log_id`]
  return completedThrough != null && Number(completedThrough) >= latestLogId
}

function NotificationTrigger({ mobile, count, open, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${mobile
        ? 'fixed right-[6.5rem] top-3 md:hidden'
        : 'relative hidden h-10 w-10 items-center justify-center rounded-full border border-[#AA8E7E]/10 bg-white text-[#755b00] shadow-sm transition hover:-translate-y-0.5 hover:shadow-suncast md:flex'}`}
      aria-label={count ? `Notifications, ${count} pending` : 'Notifications'}
      aria-haspopup="dialog"
      aria-expanded={open}
    >
      <Bell size={17} />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-[#FDF9F2] bg-[#C95B4A] px-1 text-[9px] font-black leading-none text-white">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  )
}

export default function NotificationCenter({ user, isStudent, isStaff, pathname }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [summary, setSummary] = useState(null)

  const loadNotifications = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      if (isStudent) {
        const since = new Date(Date.now() - 30 * MS_PER_DAY).toISOString()
        const [latestResult, recentResult, preferencesResult] = await Promise.all([
          supabase
            .from('mood_logs')
            .select('logged_at')
            .eq('user_id', user.id)
            .order('logged_at', { ascending: false })
            .limit(1),
          supabase
            .from('mood_logs')
            .select('logged_at')
            .eq('user_id', user.id)
            .gte('logged_at', since)
            .order('logged_at', { ascending: false })
            .limit(100),
          supabase
            .from('notification_preferences')
            .select('in_app_enabled')
            .eq('user_id', user.id)
            .maybeSingle(),
        ])
        if (latestResult.error) throw latestResult.error
        if (recentResult.error) throw recentResult.error
        if (preferencesResult.error) throw preferencesResult.error
        const inAppEnabled = preferencesResult.data?.in_app_enabled ?? true
        setSummary({
          inAppEnabled,
          reminder: inAppEnabled ? getStudentReminder(
            latestResult.data?.[0]?.logged_at,
            recentResult.data || [],
            user.name,
          ) : null,
        })
        return
      }

      const since = new Date(Date.now() - 30 * MS_PER_DAY).toISOString()
      const [strategiesResult, logs] = await Promise.all([
        supabase
          .from('coping_strategies')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
        (async () => {
          const rows = []
          const pageSize = 500
          let offset = 0
          while (true) {
            const { data, error: logsError } = await supabase
              .from('mood_logs')
              .select('id, user_id')
              .in('mood_type', LOW_MOOD_KEYS)
              .gte('logged_at', since)
              .order('logged_at', { ascending: false })
              .order('id', { ascending: false })
              .range(offset, offset + pageSize - 1)
            if (logsError) throw logsError
            rows.push(...(data || []))
            if (!data || data.length < pageSize) break
            offset += pageSize
          }
          return rows
        })(),
      ])
      if (strategiesResult.error) throw strategiesResult.error

      const latestLogs = new Map()
      for (const log of logs) {
        if (!latestLogs.has(log.user_id)) latestLogs.set(log.user_id, Number(log.id))
      }
      const studentIds = [...latestLogs.keys()]
      const checkinRows = []
      for (let index = 0; index < studentIds.length; index += 200) {
        const { data, error: checkinError } = await supabase
          .from('student_guidance_checkins')
          .select('student_id, reviewed_through_log_id, contacted_through_log_id')
          .in('student_id', studentIds.slice(index, index + 200))
        if (checkinError) throw checkinError
        checkinRows.push(...(data || []))
      }

      const checkins = new Map(checkinRows.map(row => [row.student_id, row]))
      const followUps = [...latestLogs].filter(([studentId, latestLogId]) => {
        const checkin = checkins.get(studentId)
        return !isStageComplete(checkin, 'reviewed', latestLogId)
          || !isStageComplete(checkin, 'contacted', latestLogId)
      }).length

      setSummary({
        followUps,
        pendingStrategies: strategiesResult.count || 0,
      })
    } catch (loadError) {
      console.error('[NotificationCenter] Could not load notifications:', loadError)
      setError('Notifications could not be loaded. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [isStaff, isStudent, user.id, user.name])

  useEffect(() => {
    loadNotifications()
    let channel = supabase
      .channel(`notification-center-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'mood_logs',
        ...(isStudent ? { filter: `user_id=eq.${user.id}` } : {}),
      }, loadNotifications)
    if (isStaff) {
      channel = channel.on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'student_guidance_checkins',
      }, loadNotifications)
    }
    if (isStudent) {
      channel = channel.on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notification_preferences',
        filter: `user_id=eq.${user.id}`,
      }, loadNotifications)
    }
    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isStaff, isStudent, loadNotifications, user.id])

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  const count = useMemo(() => {
    if (isStudent) return summary?.reminder ? 1 : 0
    return (summary?.followUps || 0) + (summary?.pendingStrategies || 0)
  }, [isStudent, summary])

  const noticeLinks = isStaff
    ? [
      {
        count: summary?.followUps || 0,
        title: 'Student follow-ups',
        message: 'Affected students still need a review or contact check-in.',
        to: '/admin?panel=follow-up',
      },
      {
        count: summary?.pendingStrategies || 0,
        title: 'Strategies awaiting review',
        message: 'Coping strategies are waiting in the moderation queue.',
        to: '/admin/moderation',
      },
    ].filter(item => item.count > 0)
    : []

  return (
    <>
      {createPortal(
        <NotificationTrigger
          mobile
          count={count}
          open={open}
          onClick={() => {
            const nextOpen = !open
            setOpen(nextOpen)
            if (nextOpen) loadNotifications()
          }}
        />,
        document.body,
      )}
      <NotificationTrigger
        count={count}
        open={open}
        onClick={() => {
          const nextOpen = !open
          setOpen(nextOpen)
          if (nextOpen) loadNotifications()
        }}
      />

      {open && (
        createPortal(<section
          role="dialog"
          aria-label="Notifications"
          className="fixed right-3 top-16 z-[70] w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-3xl border border-white/80 bg-[#FFFDF9] shadow-[0_20px_60px_rgba(58,43,37,0.2)] animate-scaleIn md:right-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))] md:top-24"
        >
          <header className="flex items-start justify-between border-b border-[#AA8E7E]/10 px-5 py-4">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#8C6218]">
                {isStaff ? 'Guidance updates' : 'A moment for you'}
              </p>
              <h2 className="mt-1 font-jakarta text-lg font-extrabold text-[#3a2b25]">Notifications</h2>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close notifications"
              className="rounded-full p-2 text-[#AA8E7E] transition hover:bg-[#F3EEE4] hover:text-[#3a2b25]"
            >
              <X size={16} />
            </button>
          </header>

          <div className="max-h-[min(65vh,28rem)] overflow-y-auto p-3">
            {loading ? (
              <div className="flex justify-center px-3 py-8">
                <LoadingIndicator size={18} message="Checking for updates…" />
              </div>
            ) : error ? (
              <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700" role="alert">
                <p>{error}</p>
                <button type="button" onClick={loadNotifications} className="mt-2 font-bold underline underline-offset-2">
                  Try again
                </button>
              </div>
            ) : isStudent && summary?.inAppEnabled === false ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm font-bold text-[#3a2b25]">In-app reminders are off</p>
                <p className="mt-1 text-xs leading-relaxed text-[#8A786C]">You can change this any time in your profile notification settings.</p>
                <Link to="/profile" onClick={() => setOpen(false)} className="mt-3 inline-flex text-[10px] font-black uppercase tracking-wider text-[#755b00]">
                  Open Settings <ArrowRight size={13} className="ml-1" />
                </Link>
              </div>
            ) : isStudent ? (
              summary?.reminder ? (
                <article className="rounded-2xl border border-[#F6C945]/25 bg-gradient-to-br from-white to-[#FFF8E8] p-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F6C945]/20 text-[#755b00]">
                      <Clock3 size={16} />
                    </span>
                    <div>
                      <h3 className="font-jakarta text-sm font-extrabold text-[#3a2b25]">{summary.reminder.title}</h3>
                      <p className="mt-1 text-xs leading-relaxed text-[#6D5B50]">{summary.reminder.message}</p>
                      <Link
                        to="/mood"
                        onClick={() => setOpen(false)}
                        className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[#755b00] hover:text-[#3E3006]"
                      >
                        Check in today <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                </article>
              ) : (
                <div className="flex flex-col items-center px-4 py-8 text-center">
                  <CheckCircle2 size={24} className="text-[#4D8062]" />
                  <p className="mt-3 text-sm font-bold text-[#3a2b25]">You’re all caught up</p>
                  <p className="mt-1 max-w-[17rem] text-xs leading-relaxed text-[#8A786C]">
                    You have checked in today. Take your time and keep caring for yourself at your own pace.
                  </p>
                </div>
              )
            ) : noticeLinks.length > 0 ? (
              <div className="space-y-2">
                {noticeLinks.map(item => (
                  <Link
                    key={item.title}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 rounded-2xl border border-[#AA8E7E]/10 bg-white p-4 transition hover:border-[#F6C945]/50 hover:bg-[#FFFDF8]"
                  >
                    <span className="flex h-9 min-w-9 items-center justify-center rounded-xl bg-[#F6C945]/20 px-2 text-xs font-black text-[#755b00]">
                      {item.count > 99 ? '99+' : item.count}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-jakarta text-sm font-extrabold text-[#3a2b25]">{item.title}</span>
                      <span className="mt-1 block text-xs leading-relaxed text-[#8A786C]">{item.message}</span>
                    </span>
                    <ArrowRight size={15} className="mt-1 shrink-0 text-[#AA8E7E]" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center px-4 py-8 text-center">
                <CheckCircle2 size={24} className="text-[#4D8062]" />
                <p className="mt-3 text-sm font-bold text-[#3a2b25]">Nothing needs your attention</p>
                <p className="mt-1 text-xs leading-relaxed text-[#8A786C]">New follow-ups and review reminders will appear here.</p>
              </div>
            )}
          </div>
        </section>, document.body)
      )}
    </>
  )
}
