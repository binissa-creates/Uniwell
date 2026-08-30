import { supabase } from './supabase'
import { LEGACY_PROGRAM_ALIASES } from './academicPrograms'

/**
 * Normalize course names for consistent display.
 * Converts legacy course names to current standards.
 */
export function normalizeCourse(courseName) {
  if (!courseName) return courseName
  if (courseName.toLowerCase() === 'computer studies') return 'Bachelor of Science in Information Technology'
  return LEGACY_PROGRAM_ALIASES[courseName] || courseName
}

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

export const JOURNAL_PROMPTS = [
  'What made you smile today?',
  'What challenged you today and how did you handle it?',
  'What are three things you are grateful for?',
  'Describe a moment today where you felt at peace.',
  'What is one thing you want to let go of today?',
  'Who made a positive impact on you this week?',
  'What would you tell your past self from a month ago?',
]

export const DAILY_QUOTES = [
  "Your potential is endless. Go do what you were created to do.",
  "Small steps every day lead to big results.",
  "You are capable of amazing things.",
  "Every day is a fresh start. Take a deep breath and begin again.",
  "Your only limit is you.",
  "Believe in yourself and you're halfway there.",
  "Don't stop until you're proud.",
  "The best way to predict the future is to create it.",
  "Focus on the step you're taking, not the whole staircase.",
  "You don't have to be perfect to be amazing."
]

const TRIGGER_PROMPTS = {
  'Academics': [
    'What is one small win you had in your studies today?',
    'How can you break down your current academic workload into manageable steps?',
    'Who is one person you can ask for help with your schoolwork?'
  ],
  'Finance': [
    'What are some things you can control about your current financial situation?',
    'What is one way you can practice gratitude without spending money?',
    'How do you define financial security for yourself?'
  ],
  'Relationships': [
    'What is one quality you appreciate in your closest friend?',
    'How can you communicate your needs more clearly in your relationships?',
    'What boundaries do you need to set to protect your emotional energy?'
  ],
  'Health': [
    'How did you show kindness to your body today?',
    'What is one healthy habit you want to prioritize this week?',
    'What does "rest" look like for you right now?'
  ],
  'Social': [
    'Describe a moment where you felt a sense of belonging.',
    'How can you be more present in your social interactions?',
    'What is one social activity that truly recharges you?'
  ]
}

export function journalPromptForToday(trigger = null) {
  if (trigger && TRIGGER_PROMPTS[trigger]) {
    const list = TRIGGER_PROMPTS[trigger]
    return list[new Date().getDate() % list.length]
  }
  return JOURNAL_PROMPTS[new Date().getDay() % JOURNAL_PROMPTS.length]
}

export function dailyQuoteForToday() {
  return DAILY_QUOTES[new Date().getDate() % DAILY_QUOTES.length]
}

/**
 * Fetch mood logs for the current user over the last `days` days.
 * Returns rows shaped as:
 *   { id, mood_type, intensity, note, logged_at, triggers: string[] }
 * Caller must be authenticated — RLS scopes to auth.uid() automatically.
 */
export async function fetchMoodHistory(days = 7) {
  const { data: sessionData } = await supabase.auth.getSession()
  const userId = sessionData?.session?.user?.id

  const since = new Date(Date.now() - days * 86400000).toISOString()
  let query = supabase
    .from('mood_logs')
    .select('id, mood_type, intensity, note, logged_at, mood_triggers(trigger_category)')
    .gte('logged_at', since)
    .order('logged_at', { ascending: false })

  if (userId) {
    query = query.eq('user_id', userId)
  }

  const { data, error } = await query
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
  const metrics = computeStreakMetrics(logs)
  return metrics.currentStreak
}

/**
 * Compute comprehensive streak & garden metrics:
 * - currentStreak: Unbroken daily chain with 1-day grace period
 * - totalDays: Total unique lifetime check-in days (never resets)
 * - bestStreak: Highest consecutive milestone achieved
 * - loggedToday: Boolean indicating if a check-in happened today
 */
export function computeStreakMetrics(logs) {
  const days = Array.from(
    new Set((logs || []).map((l) => {
      const d = new Date(l.logged_at)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    }))
  ).sort((a, b) => new Date(b) - new Date(a))

  const totalDays = days.length

  let currentStreak = 0
  let now = new Date()
  now.setHours(0, 0, 0, 0)
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const loggedToday = days.includes(todayStr)

  let cursor = now
  for (const d of days) {
    const parts = d.split('-').map(Number)
    const date = new Date(parts[0], parts[1] - 1, parts[2])
    const diff = Math.round((cursor - date) / 86400000)

    // Grace Period: Allow a 1-day gap (diff <= 2) to keep the streak alive
    if (diff <= 2) {
      currentStreak++
      cursor = date
    } else break
  }

  // Calculate historical Best Streak
  let bestStreak = 0
  let tempStreak = 0
  let prevDate = null

  const ascDays = [...days].sort((a, b) => new Date(a) - new Date(b))
  for (const d of ascDays) {
    const parts = d.split('-').map(Number)
    const date = new Date(parts[0], parts[1] - 1, parts[2])
    if (!prevDate) {
      tempStreak = 1
    } else {
      const diff = Math.round((date - prevDate) / 86400000)
      if (diff <= 2) {
        tempStreak++
      } else {
        tempStreak = 1
      }
    }
    prevDate = date
    if (tempStreak > bestStreak) bestStreak = tempStreak
  }

  return {
    currentStreak,
    totalDays,
    bestStreak: Math.max(bestStreak, currentStreak),
    loggedToday
  }
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

/**
 * Delete a mood log by ID.
 * RLS ensures only the owner can delete their own logs.
 */
export async function deleteMoodEntry(id) {
  const { error } = await supabase
    .from('mood_logs')
    .delete()
    .eq('id', id)
  if (error) throw error
  return true
}
