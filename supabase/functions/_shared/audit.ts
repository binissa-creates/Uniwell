import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

export async function writeAudit(
  client: SupabaseClient,
  actorId: string,
  action: string,
  targetId: string | null,
  metadata: Record<string, unknown> = {},
) {
  const { error } = await client.from('audit_log').insert({
    actor_id: actorId,
    action,
    target_id: targetId,
    metadata,
  })
  if (error) throw new Error(`Audit logging failed: ${error.message}`)
}