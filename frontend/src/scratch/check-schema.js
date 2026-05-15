import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bojzzzxvezyrpdzmlrjy.supabase.co'
const supabaseKey = 'sb_publishable_L15U0fzi9Ob698CQyCznZg_5i1Mj4ZX'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTable() {
  const { data, error } = await supabase
    .from('coping_strategies')
    .select('*')
    .limit(1)

  if (error) {
    console.error('Error checking coping_strategies:', error)
  } else {
    console.log('Columns found:', Object.keys(data[0] || {}))
  }
}

checkTable()
