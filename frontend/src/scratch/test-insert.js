import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bojzzzxvezyrpdzmlrjy.supabase.co'
const supabaseKey = 'sb_publishable_L15U0fzi9Ob698CQyCznZg_5i1Mj4ZX'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testInsert() {
  const { error } = await supabase.from('coping_strategies').insert({
    submitter_id: 'd9b5bc52-1891-4187-a0e6-037f173f6b05', // Random valid UUID
    category: 'Custom Category Test',
    title: 'Test Title',
    description: 'Test Description',
    status: 'pending'
  })

  if (error) {
    console.error('Insert failed:', error.message)
    if (error.message.includes('check constraint') || error.message.includes('invalid input value for enum')) {
       console.log('ISSUE FOUND: Category must be one of the predefined values.');
    }
  } else {
    console.log('Insert successful! Custom categories ARE allowed.');
    // Cleanup
    await supabase.from('coping_strategies').delete().eq('title', 'Test Title')
  }
}

testInsert()
