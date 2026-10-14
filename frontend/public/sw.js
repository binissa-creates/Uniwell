self.addEventListener('push', event => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch (error) {
    console.error('[UniWell service worker] Invalid push payload:', error)
  }

  const title = typeof payload.title === 'string' ? payload.title : 'Your Daily Dose is ready'
  const options = {
    body: typeof payload.body === 'string' ? payload.body : 'Take a gentle moment for yourself today.',
    icon: '/sunflower.png',
    badge: '/sunflower.png',
    tag: 'uniwell-daily-dose',
    renotify: false,
    data: { url: '/dashboard#daily-dose' },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil((async () => {
    const targetUrl = new URL('/dashboard#daily-dose', self.location.origin).href
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const existing = windows.find(client => new URL(client.url).origin === self.location.origin)
    if (existing) {
      await existing.navigate(targetUrl)
      await existing.focus()
      return
    }
    await self.clients.openWindow(targetUrl)
  })())
})
