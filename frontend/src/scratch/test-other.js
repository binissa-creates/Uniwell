import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bojzzzxvezyrpdzmlrjy.supabase.co'
const supabaseKey = 'sb_publishable_L15U0fzi9Ob698CQyCznZg_5i1Mj4ZX'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testOther() {
  const { error } = await supabase.from('coping_strategies').insert({
    submitter_id: 'd9b5bc52-1891-4187-a0e6-037f173f6b05',
    category: 'Other',
    title: 'Test Other',
    description: 'Test Description',
    status: 'pending'
  })

  if (error) {
    console.error('Insert "Other" failed:', error.message)
  } else {
    console.log('Insert "Other" successful!');
    await supabase.from('coping_strategies').delete().eq('title', 'Test Other')
  }
}

testOther()
