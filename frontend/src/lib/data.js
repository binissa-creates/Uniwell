import { supabase } from './supabase'

/**
 * Shared data access helpers. Each one performs a Supabase query and
 * returns normalized shapes that pages can consume directly.
 */

// Maps every UI mood key -> the nearest core DB enum value.
// Extended moods that have been added to the DB enum via the migration
// will be passed through directly. If the migration hasn't been run yet,
// these fallbacks prevent enum constraint errors.
const MOOD_DB_FALLBACK = {
  // Core moods — pass through
  rad: 'rad', good: 'good', meh: 'meh', bad: 'bad', awful: 'awful',
  // Extended positive
  excited: 'excited', hopeful: 'hopeful', grateful: 'grateful',
  calm: 'calm', content: 'content', proud: 'proud',
  // Extended negative/neutral
  nervous: 'nervous', frustrated: 'frustrated', lonely: 'lonely',
  angry: 'angry', burned_out: 'burned_out', confused: 'confused',
}

const CORE_FALLBACK = {
  // Fallback to core enum if extended not yet in DB
  excited: 'rad', hopeful: 'good', grateful: 'rad',
  calm: 'good', content: 'good', proud: 'rad',
  nervous: 'bad', frustrated: 'bad', lonely: 'bad',
  angry: 'awful', burned_out: 'awful', confused: 'meh',
}

/**
 * Normalise a mood key for the DB. Prefers exact key; falls back to a core
 * enum value so RPC calls never throw an enum constraint error.
 */
export function safeMoodKey(key) {
  if (!key) return 'meh'
  return MOOD_DB_FALLBACK[key] ?? CORE_FALLBACK[key] ?? 'meh'
}

const JOURNAL_PROMPTS = [
  'What made you smile today?',
  'What challenged you today and how did you handle it?',
  'What are three things you are grateful for?',
  'Describe a moment today where you felt at peace.',
  'What is one thing you want to let go of today?',
  'Who made a positive impact on you this week?',
  'What would you tell your past self from a month ago?',
]

export function journalPromptForToday() {
  return JOURNAL_PROMPTS[new Date().getDay() % JOURNAL_PROMPTS.length]
}

/**
 * Fetch mood logs for the current user over the last `days` days.
 * Returns rows shaped as:
 *   { id, mood_type, intensity, note, logged_at, triggers: string[] }
 * Caller must be authenticated — RLS scopes to auth.uid() automatically.
 */
export async function fetchMoodHistory(days = 7) {
  const since = new Date(Date.now() - days * 86400000).toISOString()
  const { data, error } = await supabase
    .from('mood_logs')
    .select('id, mood_type, intensity, note, logged_at, mood_triggers(trigger_category)')
    .gte('logged_at', since)
    .order('logged_at', { ascending: false })
  if (error) throw error
  return (data || []).map((row) => ({
    id: row.id,
    mood_type: row.mood_type,
    intensity: row.intensity,
    note: row.note,
    logged_at: row.logged_at,
    triggers: (row.mood_triggers || []).map((t) => t.trigger_category),
  }))
}

/**
 * Compute the current log streak (consecutive days ending today or yesterday)
 * from an array of mood logs sorted DESC by logged_at.
 */
export function computeStreak(logs) {
  const days = Array.from(
    new Set((logs || []).map((l) => new Date(l.logged_at).toISOString().slice(0, 10)))
  )
  let streak = 0
  let current = new Date()
  current.setHours(0, 0, 0, 0)
  for (const d of days) {
    const date = new Date(d)
    date.setHours(0, 0, 0, 0)
    const diff = Math.floor((current - date) / 86400000)
    if (diff <= 1) {
      streak++
      current = date
    } else break
  }
  return streak
}

/**
 * Log a mood + optional triggers atomically via the log_mood RPC.
 * Returns the new mood log id.
 */
export async function logMood({ mood_type, intensity = 3, note = null, triggers = [] }) {
  const { data, error } = await supabase.rpc('log_mood', {
    p_mood_type: mood_type,
    p_intensity: intensity,
    p_note: note,
    p_triggers: Array.isArray(triggers) && triggers.length > 0 ? triggers : null,
  })
  if (error) throw error
  return data
}
