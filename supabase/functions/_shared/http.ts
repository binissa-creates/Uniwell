export class HttpError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

function allowedOrigin(request: Request) {
  const origin = request.headers.get('origin')
  const siteUrl = Deno.env.get('SITE_URL')
  const siteOrigin = siteUrl ? new URL(siteUrl).origin : '*'
  const allowed = new Set([siteOrigin, 'http://localhost:5173'])
  return origin && allowed.has(origin) ? origin : siteOrigin
}

export function corsHeaders(request: Request) {
  return {
    'Access-Control-Allow-Origin': allowedOrigin(request),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  }
}

export function preflight(request: Request) {
  if (request.method !== 'OPTIONS') return null
  return new Response('ok', { headers: corsHeaders(request) })
}

export function jsonResponse(request: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(request), 'Content-Type': 'application/json' },
  })
}

export function errorResponse(request: Request, error: unknown) {
  const status = error instanceof HttpError ? error.status : 500
  const message = error instanceof HttpError
    ? error.message
    : 'An unexpected server error occurred.'
  if (!(error instanceof HttpError)) console.error('[Edge Function]', error)
  return jsonResponse(request, { error: message }, status)
}