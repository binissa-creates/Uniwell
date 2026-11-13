import { createServiceClient } from '../_shared/auth.ts'
import { errorResponse, getSiteUrl, HttpError, jsonResponse, preflight } from '../_shared/http.ts'

type EmailPreference = {
  user_id: string
  staff_wellness_email_timezone: string
  staff_wellness_email_hour: number
  last_staff_wellness_email_local_date: string | null
}

function localDateAndHour(timezone: string, date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
    weekday: 'short',
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]))
  return {
    date: `${values.year}-${values.month}-${values.day}`,
    hour: Number(values.hour),
    weekday: values.weekday,
  }
}

async function loadPreferences(client: ReturnType<typeof createServiceClient>) {
  const rows: EmailPreference[] = []
  const pageSize = 500
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await client
      .from('notification_preferences')
      .select('user_id, staff_wellness_email_timezone, staff_wellness_email_hour, last_staff_wellness_email_local_date')
      .eq('staff_wellness_email_enabled', true)
      .order('user_id')
      .range(offset, offset + pageSize - 1)
    if (error) throw new HttpError(500, 'Could not load staff email preferences.')
    rows.push(...(data || []))
    if (!data || data.length < pageSize) break
  }
  return rows
}

async function sendEmail(apiKey: string, from: string, to: string, subject: string, text: string, html: string) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: [to], subject, text, html }),
  })
  if (!response.ok) {
    console.error('[send-weekly-wellness-email] Email provider returned status:', response.status)
    throw new Error('Email delivery failed.')
  }
}

Deno.serve(async request => {
  const options = preflight(request)
  if (options) return options
  if (request.method !== 'POST') {
    return jsonResponse(request, { error: 'Method not allowed.' }, 405)
  }

  try {
    const cronSecret = Deno.env.get('WELLNESS_EMAIL_CRON_SECRET')
    if (!cronSecret) throw new HttpError(500, 'Email scheduler configuration is incomplete.')
    if (request.headers.get('x-cron-secret') !== cronSecret) {
      throw new HttpError(401, 'Scheduled email authorization is invalid.')
    }

    const apiKey = Deno.env.get('RESEND_API_KEY')
    const from = Deno.env.get('WELLNESS_EMAIL_FROM')
    if (!apiKey || !from) throw new HttpError(500, 'Email delivery configuration is incomplete.')

    const client = createServiceClient()
    const preferences = await loadPreferences(client)
    const userIds = [...new Set(preferences.map(preference => preference.user_id))]
    const activeStaffIds = new Set<string>()
    for (let index = 0; index < userIds.length; index += 200) {
      const { data, error } = await client
        .from('profiles')
        .select('id, role, status')
        .in('id', userIds.slice(index, index + 200))
      if (error) throw new HttpError(500, 'Could not verify staff email recipients.')
      for (const profile of data || []) {
        if (
          ['admin', 'counselor'].includes(profile.role)
          && profile.status === 'active'
        ) activeStaffIds.add(profile.id)
      }
    }

    const since = new Date(Date.now() - 7 * 86400000).toISOString()
    const [pendingResult, approvedResult, checkInResult] = await Promise.all([
      client.from('coping_strategies').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      client.from('audit_log').select('id', { count: 'exact', head: true })
        .eq('action', 'coping_strategy.approved').gte('created_at', since),
      client.from('mood_logs').select('id', { count: 'exact', head: true }).gte('logged_at', since),
    ])
    if (pendingResult.error || approvedResult.error || checkInResult.error) {
      throw new HttpError(500, 'Could not prepare the campus wellness summary.')
    }

    const summary = {
      pendingStrategies: pendingResult.count || 0,
      approvedStrategies: approvedResult.count || 0,
      moodCheckIns: checkInResult.count || 0,
    }
    const siteUrl = getSiteUrl(request)
    const loginUrl = new URL('/login', siteUrl).toString()
    let sent = 0
    let skipped = 0
    let failed = 0

    for (const preference of preferences) {
      if (!activeStaffIds.has(preference.user_id)) {
        skipped += 1
        continue
      }

      let localTime: ReturnType<typeof localDateAndHour>
      try {
        localTime = localDateAndHour(preference.staff_wellness_email_timezone)
      } catch (error) {
        console.error('[send-weekly-wellness-email] Ignoring a preference with an invalid time zone:', error)
        failed += 1
        continue
      }
      if (
        localTime.weekday !== 'Mon'
        || localTime.hour !== preference.staff_wellness_email_hour
        || localTime.date === preference.last_staff_wellness_email_local_date
      ) continue

      const { data: claimed, error: claimError } = await client
        .from('notification_preferences')
        .update({ last_staff_wellness_email_local_date: localTime.date })
        .eq('user_id', preference.user_id)
        .eq('staff_wellness_email_enabled', true)
        .or(`last_staff_wellness_email_local_date.is.null,last_staff_wellness_email_local_date.neq.${localTime.date}`)
        .select('user_id')
        .maybeSingle()
      if (claimError) {
        console.error('[send-weekly-wellness-email] Could not claim email send:', claimError)
        failed += 1
        continue
      }
      if (!claimed) continue

      try {
        const { data: authData, error: authError } = await client.auth.admin.getUserById(preference.user_id)
        if (authError) throw new Error('Could not resolve staff email.')
        const email = authData.user?.email
        if (!email) throw new Error('Staff account has no email address.')

        const subject = 'Your weekly UniWell Campus Wellness update'
        const text = [
          'Here is this week’s high-level Campus Wellness update:',
          `• Mood check-ins this week: ${summary.moodCheckIns}`,
          `• Coping strategies approved this week: ${summary.approvedStrategies}`,
          `• Strategies waiting for moderation: ${summary.pendingStrategies}`,
          '',
          'This email contains campus-wide totals only, not individual student information.',
          `Sign in to UniWell: ${loginUrl}`,
          '',
          'You can turn off these emails at any time in Admin Settings.',
        ].join('\n')
        const html = `<div style="font-family:Arial,sans-serif;color:#3a2b25;line-height:1.6"><h2 style="color:#6b5a10">Campus Wellness · Weekly update</h2><p>A quick, campus-wide snapshot for this week:</p><ul><li>Mood check-ins: <strong>${summary.moodCheckIns}</strong></li><li>Coping strategies approved: <strong>${summary.approvedStrategies}</strong></li><li>Strategies awaiting moderation: <strong>${summary.pendingStrategies}</strong></li></ul><p>This email contains aggregate totals only, not individual student information.</p><p><a href="${loginUrl}" style="display:inline-block;background:#f6c945;color:#3e3006;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:bold">Sign in to UniWell</a></p><p style="font-size:12px;color:#806e60">You can turn off these emails at any time in Admin Settings.</p></div>`
        await sendEmail(apiKey, from, email, subject, text, html)
        sent += 1
      } catch (error) {
        const { error: releaseError } = await client
          .from('notification_preferences')
          .update({ last_staff_wellness_email_local_date: preference.last_staff_wellness_email_local_date })
          .eq('user_id', preference.user_id)
          .eq('last_staff_wellness_email_local_date', localTime.date)
        if (releaseError) console.error('[send-weekly-wellness-email] Could not release failed email claim:', releaseError)
        console.error('[send-weekly-wellness-email] Email delivery failed for a staff account:', error)
        failed += 1
      }
    }

    return jsonResponse(request, { sent, skipped, failed })
  } catch (error) {
    return errorResponse(request, error)
  }
})
