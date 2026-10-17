async function testOrigin(fn, origin) {
  const url = `https://bojzzzxvezyrpdzmlrjy.supabase.co/functions/v1/${fn}`
  const res = await fetch(url, {
    method: 'OPTIONS',
    headers: {
      'Origin': origin,
      'Access-Control-Request-Method': 'POST',
    }
  })
  const allowOrigin = res.headers.get('access-control-allow-origin')
  const status = res.status
  console.log(`[${fn}] Origin: "${origin}" -> Status: ${status}, Allow-Origin: "${allowOrigin}"`)
}

async function run() {
  for (const fn of ['set-staff-status', 'invite-staff']) {
    await testOrigin(fn, 'https://uniwell-20.vercel.app')
    await testOrigin(fn, 'http://localhost:5173')
    await testOrigin(fn, 'http://localhost:5174')
    await testOrigin(fn, 'https://uniwell-preview.vercel.app')
  }
}

run()
