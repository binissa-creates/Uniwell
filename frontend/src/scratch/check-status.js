import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bojzzzxvezyrpdzmlrjy.supabase.co'
const supabaseKey = 'sb_publishable_L15U0fzi9Ob698CQyCznZg_5i1Mj4ZX'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDefault() {
  const { data, error } = await supabase
    .from('coping_strategies')
    .select('status')
    .limit(1)

  if (error) {
     console.error('Error:', error)
  } else {
     console.log('Current status values in DB:', data.map(d => d.status))
  }
}

checkDefault()
