import { HttpError, errorResponse, jsonResponse, preflight } from '../_shared/http.ts'
import { requireActiveStaff } from '../_shared/auth.ts'
import { writeAudit } from '../_shared/audit.ts'

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

    const targetId = typeof body.targetId === 'string' ? body.targetId.trim() : ''
    if (!targetId) throw new HttpError(400, 'targetId is required.')

    // Confirm the target is actually a student (role === 'student') to prevent
    // accidental deletion of admin / counselor accounts through this endpoint.
    const { data: profile, error: profileError } = await client
      .from('profiles')
      .select('id, name, student_id, role')
      .eq('id', targetId)
      .maybeSingle()

    if (profileError) throw new HttpError(500, 'Could not look up the student profile.')
    if (!profile) throw new HttpError(404, 'Student profile not found.')
    if (profile.role !== 'student') {
      throw new HttpError(403, 'This endpoint can only delete student accounts.')
    }

    // Deleting from auth.users cascades to public.profiles and all child rows
    // (mood_logs, journal_entries, etc.) because of ON DELETE CASCADE.
    const { error: deleteError } = await client.auth.admin.deleteUser(targetId)
    if (deleteError) {
      console.error('[delete-student] auth.admin.deleteUser failed:', deleteError)
      throw new HttpError(500, 'The student account could not be deleted.')
    }

    await writeAudit(client, user.id, 'student.deleted', targetId, {
      student_id: profile.student_id,
      name: profile.name,
    })

    return jsonResponse(request, { ok: true })
  } catch (error) {
    return errorResponse(request, error)
  }
})
