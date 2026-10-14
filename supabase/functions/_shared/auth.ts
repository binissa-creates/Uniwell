import { createClient, type SupabaseClient, type User } from 'https://esm.sh/@supabase/supabase-js@2'
import { HttpError } from './http.ts'

export type StaffProfile = {
  id: string
  full_name: string
  email: string
  role: 'student' | 'counselor' | 'admin'
  status: 'active' | 'invited' | 'disabled'
}

export type StaffContext = {
  client: SupabaseClient
  user: User
  profile: StaffProfile
}

export function createServiceClient() {
  const url = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !serviceKey) throw new HttpError(500, 'Server configuration is incomplete.')

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function requireActiveStaff(request: Request): Promise<StaffContext> {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) throw new HttpError(401, 'Authentication is required.')

  const client = createServiceClient()
  const { data: userData, error: userError } = await client.auth.getUser(token)
  if (userError || !userData.user) throw new HttpError(401, 'Authentication is invalid or expired.')

  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('id, full_name, email, role, status')
    .eq('id', userData.user.id)
    .maybeSingle()

  if (profileError) throw new HttpError(500, 'Could not verify staff access.')
  if (!profile || !['counselor', 'admin'].includes(profile.role) || profile.status !== 'active') {
    throw new HttpError(403, 'Active guidance staff access is required.')
  }

  return { client, user: userData.user, profile }
}