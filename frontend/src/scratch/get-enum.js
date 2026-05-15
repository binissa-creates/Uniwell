import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bojzzzxvezyrpdzmlrjy.supabase.co'
const supabaseKey = 'sb_publishable_L15U0fzi9Ob698CQyCznZg_5i1Mj4ZX'

const supabase = createClient(supabaseUrl, supabaseKey)

async function getEnumValues() {
  const { data, error } = await supabase.rpc('get_enum_values', { enum_name: 'coping_category' })
  if (error) {
     // Fallback: try to find it in information_schema via a raw query if RPC fails
     console.error('RPC failed, checking via select...')
     const { data: cols, error: err2 } = await supabase.from('coping_strategies').select('category').limit(10)
     console.log('Sample values in DB:', [...new Set(cols?.map(c => c.category))])
  } else {
    console.log('Allowed enum values:', data)
  }
}

getEnumValues()
