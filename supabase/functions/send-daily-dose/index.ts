import webpush from 'npm:web-push@3.6.7'
import { createServiceClient } from '../_shared/auth.ts'
import { errorResponse, HttpError, jsonResponse, preflight } from '../_shared/http.ts'

type PushSubscriptionRow = {
  endpoint: string
  user_id: string
  p256dh: string
  auth_key: string
  timezone: string
  notification_hour: number
  last_sent_local_date: string | null
}

function localDateAndHour(timezone: string, date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]))
  return {
    date: `${values.year}-${values.month}-${values.day}`,
    hour: Number(values.hour),
  }
}

async function loadSubscriptions(client: ReturnType<typeof createServiceClient>) {
  const rows: PushSubscriptionRow[] = []
  const pageSize = 500
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await client
      .from('push_subscriptions')
      .select('endpoint, user_id, p256dh, auth_key, timezone, notification_hour, last_sent_local_date')
      .order('created_at', { ascending: true })
      .range(offset, offset + pageSize - 1)
    if (error) throw new HttpError(500, 'Could not load push subscriptions.')
    rows.push(...(data || []))
    if (!data || data.length < pageSize) break
  }
  return rows
}

function isSupportedPushEndpoint(endpoint: string) {
  try {
    const url = new URL(endpoint)
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return false
    const host = url.hostname.toLowerCase()
    return host === 'fcm.googleapis.com'
      || host.endsWith('.fcm.googleapis.com')
      || host.endsWith('.push.services.mozilla.com')
      || host.endsWith('.push.apple.com')
      || host.endsWith('.notify.windows.com')
  } catch {
    return false
  }
}

Deno.serve(async request => {
  const options = preflight(request)
  if (options) return options
  if (request.method !== 'POST') {
    return jsonResponse(request, { error: 'Method not allowed.' }, 405)
  }

  try {
    const cronSecret = Deno.env.get('PUSH_CRON_SECRET')
    if (!cronSecret) throw new HttpError(500, 'Push scheduler configuration is incomplete.')
    if (request.headers.get('x-cron-secret') !== cronSecret) {
      throw new HttpError(401, 'Scheduled push authorization is invalid.')
    }

    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
    const vapidSubject = Deno.env.get('VAPID_SUBJECT')
    if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
      throw new HttpError(500, 'Push delivery configuration is incomplete.')
    }

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
    const client = createServiceClient()
    const subscriptions = await loadSubscriptions(client)
    const subscriptionUserIds = [...new Set(subscriptions.map(subscription => subscription.user_id))]
    const activeStudentIds = new Set<string>()
    for (let index = 0; index < subscriptionUserIds.length; index += 200) {
      const { data, error } = await client
        .from('profiles')
        .select('id, role, status')
        .in('id', subscriptionUserIds.slice(index, index + 200))
      if (error) throw new HttpError(500, 'Could not verify notification recipients.')
      for (const profile of data || []) {
        if (profile.role === 'student' && (!profile.status || profile.status === 'active')) {
          activeStudentIds.add(profile.id)
        }
      }
    }
    let sent = 0
    let removed = 0
    let failed = 0

    for (const subscription of subscriptions) {
      if (!activeStudentIds.has(subscription.user_id)) continue
      if (!isSupportedPushEndpoint(subscription.endpoint)) {
        console.error('[send-daily-dose] Ignoring an untrusted push endpoint.')
        failed += 1
        continue
      }
      let localTime: ReturnType<typeof localDateAndHour>
      try {
        localTime = localDateAndHour(subscription.timezone)
      } catch (error) {
        console.error('[send-daily-dose] Ignoring a subscription with an invalid saved timezone:', error)
        failed += 1
        continue
      }
      if (
        localTime.hour !== subscription.notification_hour
        || localTime.date === subscription.last_sent_local_date
      ) continue

      const { data: claimed, error: claimError } = await client
        .from('push_subscriptions')
        .update({ last_sent_local_date: localTime.date })
        .eq('endpoint', subscription.endpoint)
        .or(`last_sent_local_date.is.null,last_sent_local_date.neq.${localTime.date}`)
        .select('endpoint')
        .maybeSingle()
      if (claimError) {
        console.error('[send-daily-dose] Could not claim scheduled notification:', claimError)
        failed += 1
        continue
      }
      if (!claimed) continue

      try {
        await webpush.sendNotification({
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth_key },
        }, JSON.stringify({
          title: 'Your Daily Dose is ready',
          body: 'A little encouragement is waiting for you. Take a moment for yourself today.',
        }))
        sent += 1
      } catch (error) {
        const statusCode = typeof error === 'object' && error !== null && 'statusCode' in error
          ? Number(error.statusCode)
          : 0
        if (statusCode === 404 || statusCode === 410) {
          const { error: deleteError } = await client
            .from('push_subscriptions')
            .delete()
            .eq('endpoint', subscription.endpoint)
          if (deleteError) console.error('[send-daily-dose] Could not remove expired subscription:', deleteError)
          else removed += 1
          continue
        }

        const { error: releaseError } = await client
          .from('push_subscriptions')
          .update({ last_sent_local_date: null })
          .eq('endpoint', subscription.endpoint)
          .eq('last_sent_local_date', localTime.date)
        if (releaseError) console.error('[send-daily-dose] Could not release failed send claim:', releaseError)
        console.error('[send-daily-dose] Push delivery failed with status:', statusCode || 'unknown')
        failed += 1
      }
    }

    return jsonResponse(request, { sent, removed, failed })
  } catch (error) {
    return errorResponse(request, error)
  }
})
