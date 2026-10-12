import { createClient } from '@supabase/supabase-js'

const env = import.meta.env ?? (typeof process !== 'undefined' ? process.env : {})
const url = env.VITE_SUPABASE_URL
const key = env.VITE_SUPABASE_ANON_KEY

export const hasSupabaseConfig = Boolean(url && key)

export const supabase = createClient(
  url || 'https://missing-project.supabase.co',
  key || 'missing-supabase-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
)
