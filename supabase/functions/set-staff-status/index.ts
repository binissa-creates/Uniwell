import { HttpError, errorResponse, jsonResponse, preflight } from '../_shared/http.ts'
import { requireActiveStaff } from '../_shared/auth.ts'
import { writeAudit } from '../_shared/audit.ts'

const LONG_BAN = '876000h'

async function getStaffProfile(client: ReturnType<typeof import('../_shared/auth.ts').createServiceClient>, targetId: unknown) {
  if (typeof targetId !== 'string') throw new HttpError(400, 'A staff account id is required.')
  const { data, error } = await client
    .from('profiles')
    .select('id, full_name, email, role, status')
    .eq('id', targetId)
    .maybeSingle()
  if (error) throw new HttpError(500, 'Could not load the staff account.')
  if (!data || !['counselor', 'admin'].includes(data.role)) {
    throw new HttpError(404, 'Staff account was not found.')
  }
  return data
}

Deno.serve(async (request) => {
  const options = preflight(request)
  if (options) return options
  if (request.method !== 'POST') {
    return jsonResponse(request, { error: 'Method not allowed.' }, 405)
  }

  try {
    const { client, user } = await requireActiveStaff(request)
    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      throw new HttpError(400, 'Request body must be valid JSON.')
    }

    const action = body.action
    if (!['resend', 'revoke', 'deactivate', 'reactivate'].includes(String(action))) {
      throw new HttpError(400, 'Choose a valid staff action.')
    }

    const profile = await getStaffProfile(client, body.targetId)
    if (action === 'resend' || action === 'revoke') {
      if (profile.status !== 'invited') throw new HttpError(409, 'This account has no pending invitation.')
      const { data: invite, error: inviteError } = await client
        .from('staff_invites')
        .select('id, email, role, full_name')
        .eq('email', profile.email)
        .eq('status', 'pending')
        .maybeSingle()
      if (inviteError) throw new HttpError(500, 'Could not load the pending invitation.')
      if (!invite) throw new HttpError(404, 'Pending invitation was not found.')

      const { data: authData, error: authLookupError } = await client.auth.admin.getUserById(profile.id)
      if (authLookupError) throw new HttpError(500, 'Could not verify the staff sign-in account.')
      const authUser = authData?.user
      const confirmed = Boolean(authUser?.email_confirmed_at || authUser?.confirmed_at)

      if (action === 'revoke') {
        if (authUser && !confirmed) {
          const { error } = await client.auth.admin.deleteUser(profile.id)
          if (error) throw new HttpError(500, 'The unconfirmed account could not be removed; the invitation remains pending.')
        } else if (authUser && confirmed) {
          const { error: banError } = await client.auth.admin.updateUserById(profile.id, { ban_duration: LONG_BAN })
          if (banError) throw new HttpError(500, 'The account could not be blocked; the invitation remains pending.')
          const { error: profileError } = await client.rpc('admin_set_staff_status', {
            p_actor_id: user.id,
            p_target_id: profile.id,
            p_status: 'disabled',
          })
          if (profileError) {
            await client.auth.admin.updateUserById(profile.id, { ban_duration: 'none' })
            throw new HttpError(500, 'The profile could not be disabled; sign-in was restored.')
          }
        }

        const { error: revokeError } = await client
          .from('staff_invites')
          .update({ status: 'revoked' })
          .eq('id', invite.id)
          .eq('status', 'pending')
        if (revokeError) throw new HttpError(500, 'The account was blocked, but the invitation status could not be updated.')

        await writeAudit(client, user.id, 'staff.invite.revoked', profile.id, { invite_id: invite.id })
        return jsonResponse(request, { ok: true })
      }

      if (confirmed) throw new HttpError(409, 'This invite was already used. Reactivate the account if needed.')
      if (authUser) {
        const { error } = await client.auth.admin.deleteUser(profile.id)
        if (error) throw new HttpError(500, 'The old unconfirmed invitation could not be replaced.')
      }

      const siteUrl = Deno.env.get('SITE_URL')
      if (!siteUrl) throw new HttpError(500, 'Server configuration is incomplete.')
      const { error: resendError } = await client.auth.admin.inviteUserByEmail(invite.email, {
        redirectTo: new URL('/accept-invite', siteUrl).toString(),
        data: { full_name: invite.full_name },
      })
      if (resendError) {
        const { error: revokeError } = await client.from('staff_invites')
          .update({ status: 'revoked' })
          .eq('id', invite.id)
          .eq('status', 'pending')
        if (revokeError) console.error('[set-staff-status] Could not close failed resend:', revokeError)
        await writeAudit(client, user.id, 'staff.invite.resend_failed', profile.id, { invite_id: invite.id })
        throw new HttpError(502, 'The resend failed and the old invite was closed. Create a new invitation.')
      }

      const { error: inviteUpdateError } = await client.from('staff_invites')
        .update({ created_at: new Date().toISOString(), invited_by: user.id })
        .eq('id', invite.id)
      if (inviteUpdateError) throw new HttpError(500, 'The invitation was resent, but its record could not be updated.')

      await writeAudit(client, user.id, 'staff.invite.resent', null, { invite_id: invite.id, email: invite.email })
      return jsonResponse(request, { ok: true })
    }

    if (action === 'deactivate') {
      if (profile.id === user.id) throw new HttpError(409, 'You cannot deactivate your own account.')
      if (profile.status !== 'active') throw new HttpError(409, 'Only active staff accounts can be deactivated.')
      const { error: profileError } = await client.rpc('admin_set_staff_status', {
        p_actor_id: user.id,
        p_target_id: profile.id,
        p_status: 'disabled',
      })
      if (profileError) throw new HttpError(500, 'Could not deactivate the staff profile.')

      const { error: banError } = await client.auth.admin.updateUserById(profile.id, { ban_duration: LONG_BAN })
      if (banError) {
        const { error: restoreError } = await client.rpc('admin_set_staff_status', {
          p_actor_id: user.id,
          p_target_id: profile.id,
          p_status: 'active',
        })
        if (restoreError) console.error('[set-staff-status] Could not restore profile after ban failure:', restoreError)
        throw new HttpError(500, 'Could not block the staff sign-in; the profile was restored.')
      }

      return jsonResponse(request, { ok: true })
    }

    if (profile.status !== 'disabled') throw new HttpError(409, 'Only disabled staff accounts can be reactivated.')
    const { error: unbanError } = await client.auth.admin.updateUserById(profile.id, { ban_duration: 'none' })
    if (unbanError) throw new HttpError(500, 'Could not restore the staff sign-in.')
    const { error: activateError } = await client.rpc('admin_set_staff_status', {
      p_actor_id: user.id,
      p_target_id: profile.id,
      p_status: 'active',
    })
    if (activateError) {
      await client.auth.admin.updateUserById(profile.id, { ban_duration: LONG_BAN })
      throw new HttpError(500, 'Could not reactivate the profile; sign-in remains blocked.')
    }

    return jsonResponse(request, { ok: true })
  } catch (error) {
    return errorResponse(request, error)
  }
})