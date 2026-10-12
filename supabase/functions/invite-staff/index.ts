import { HttpError, errorResponse, jsonResponse, preflight } from '../_shared/http.ts'
import { requireActiveAdmin } from '../_shared/auth.ts'
import { writeAudit } from '../_shared/audit.ts'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

Deno.serve(async (request) => {
  const options = preflight(request)
  if (options) return options
  if (request.method !== 'POST') {
    return jsonResponse(request, { error: 'Method not allowed.' }, 405)
  }

  try {
    const { client, user } = await requireActiveAdmin(request)
    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      throw new HttpError(400, 'Request body must be valid JSON.')
    }

    const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const role = body.role

    if (fullName.length < 2 || fullName.length > 150) {
      throw new HttpError(400, 'Full name must be between 2 and 150 characters.')
    }
    if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
      throw new HttpError(400, 'Enter a valid email address.')
    }
    if (role !== 'counselor' && role !== 'admin') {
      throw new HttpError(400, 'Role must be counselor or admin.')
    }

    const allowedDomain = Deno.env.get('ALLOWED_STAFF_EMAIL_DOMAIN')?.trim().toLowerCase().replace(/^@/, '')
    if (allowedDomain && email.split('@')[1] !== allowedDomain) {
      throw new HttpError(400, `Staff email must use the ${allowedDomain} domain.`)
    }

    const { data: existingProfile, error: existingProfileError } = await client
      .from('profiles')
      .select('id, status')
      .eq('email', email)
      .maybeSingle()
    if (existingProfileError) throw new HttpError(500, 'Could not check the account status.')
    if (existingProfile) {
      throw new HttpError(409, existingProfile.status === 'invited'
        ? 'A pending invitation already exists. Use Resend from the staff list.'
        : 'An account is already registered with this email.')
    }

    const { data: pendingInvite, error: pendingError } = await client
      .from('staff_invites')
      .select('id')
      .eq('email', email)
      .eq('status', 'pending')
      .maybeSingle()
    if (pendingError) throw new HttpError(500, 'Could not check existing invitations.')
    if (pendingInvite) throw new HttpError(409, 'A pending invitation already exists.')

    const { data: invite, error: insertError } = await client
      .from('staff_invites')
      .insert({ email, role, full_name: fullName, invited_by: user.id, status: 'pending' })
      .select('id')
      .single()
    if (insertError) {
      if (insertError.code === '23505') throw new HttpError(409, 'A pending invitation already exists.')
      throw new HttpError(500, 'Could not create the staff invitation.')
    }

    const siteUrl = Deno.env.get('SITE_URL')
    if (!siteUrl) throw new HttpError(500, 'Server configuration is incomplete.')
    const redirectTo = new URL('/accept-invite', siteUrl).toString()
    const { data: invited, error: inviteError } = await client.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: { full_name: fullName },
    })

    if (inviteError) {
      const { error: cleanupError } = await client.from('staff_invites').delete().eq('id', invite.id)
      if (cleanupError) console.error('[invite-staff] Could not remove failed invite row:', cleanupError)
      if (/already registered|already exists/i.test(inviteError.message)) {
        throw new HttpError(409, 'An account is already registered with this email.')
      }
      console.error('[invite-staff] Supabase invitation failed:', inviteError)
      throw new HttpError(502, 'The invitation email could not be sent. Try again later.')
    }

    await writeAudit(client, user.id, 'staff.invite.created', invited.user?.id ?? null, {
      invite_id: invite.id,
      email,
      role,
    })

    return jsonResponse(request, { ok: true, inviteId: invite.id })
  } catch (error) {
    return errorResponse(request, error)
  }
})