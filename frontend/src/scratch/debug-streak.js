import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bojzzzxvezyrpdzmlrjy.supabase.co'
const supabaseKey = 'sb_publishable_L15U0fzi9Ob698CQyCznZg_5i1Mj4ZX'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugStreak() {
  const { data: logs, error } = await supabase
    .from('mood_logs')
    .select('logged_at')
    .order('logged_at', { ascending: false })

  if (error) return;

  const days = Array.from(
    new Set(logs.map((l) => {
      const d = new Date(l.logged_at)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    }))
  ).sort((a, b) => new Date(b) - new Date(a))

  let streak = 0
  let current = new Date()
  current.setHours(0, 0, 0, 0)

  for (const d of days) {
    const parts = d.split('-').map(Number)
    const date = new Date(parts[0], parts[1] - 1, parts[2])
    const diff = Math.round((current - date) / 86400000)

    if (diff <= 2) { // NEW GRACE PERIOD LOGIC
      streak++
      current = date
    } else break
  }

  console.log('Final streak with grace period:', streak)
}

debugStreak()
