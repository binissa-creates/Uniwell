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

// Maps UI mood keys -> DB enum values that are guaranteed to exist in Supabase schema.
// Extended moods that are not in the existing DB enum fallback safely to standard values.
const DB_SAFE_ENUM_MAP = {
  // Core moods
  rad: 'rad',
  glowing: 'rad',
  good: 'good',
  meh: 'meh',
  neutral: 'meh',
  bad: 'bad',
  awful: 'awful',

  // Positive extensions
  excited: 'excited',
  hopeful: 'hopeful',
  grateful: 'grateful',
  calm: 'calm',
  relieved: 'calm',
  content: 'content',
  motivated: 'rad',
  proud: 'proud',
  loved: 'good',
  inspired: 'excited',
  curious: 'meh',

  // Heavy / negative extensions
  nervous: 'nervous',
  anxious: 'nervous',
  scared: 'nervous',
  frustrated: 'frustrated',
  lonely: 'lonely',
  confused: 'confused',
  burned_out: 'burned_out',
  angry: 'angry',
  overwhelmed: 'bad',
  disappointed: 'bad',
  dissapointed: 'bad',
  embarrassed: 'bad',
  sad: 'bad',
  bored: 'meh',
  jealous: 'frustrated',
  guilty: 'bad',
  heartbroken: 'awful',
  disgusted: 'frustrated',
}

/**
 * Normalise a mood key for the DB. Maps to a valid DB enum value
 * so RPC calls never throw an enum constraint error.
 */
export function safeMoodKey(key) {
  if (!key) return 'meh'
  return DB_SAFE_ENUM_MAP[key] || 'meh'
}

/**
 * Universal emotional metadata for all 32 feelings + aliases.
 * Shared across Student and Admin monitoring views.
 */
export const MOOD_META = {
  // Core Radiance
  rad:          { emoji: '🤩', label: 'Glowing',      color: '#F6C945', bg: '#FEF9E7', text: '#8A6A00', score: 5 },
  glowing:      { emoji: '🤩', label: 'Glowing',      color: '#F6C945', bg: '#FEF9E7', text: '#8A6A00', score: 5 },
  radiant:      { emoji: '🤩', label: 'Glowing',      color: '#F6C945', bg: '#FEF9E7', text: '#8A6A00', score: 5 },
  good:         { emoji: '😊', label: 'Good',         color: '#81B29A', bg: '#EAF5EE', text: '#2D6B47', score: 4 },
  meh:          { emoji: '😐', label: 'Neutral',      color: '#E6B86A', bg: '#FDF3E3', text: '#7A4F0D', score: 3 },
  neutral:      { emoji: '😐', label: 'Neutral',      color: '#E6B86A', bg: '#FDF3E3', text: '#7A4F0D', score: 3 },
  bad:          { emoji: '😔', label: 'Bad',          color: '#EF7B6C', bg: '#FEE9E7', text: '#A3302A', score: 2, isLow: true, isCritical: true },
  awful:        { emoji: '😢', label: 'Awful',        color: '#E53E3E', bg: '#FEE2E2', text: '#991B1B', score: 1, isLow: true, isCritical: true },

  // Uplifting & Radiant
  excited:      { emoji: '😆', label: 'Excited',      color: '#F6C945', bg: '#FEF9E7', text: '#8A6A00', score: 5 },
  hopeful:      { emoji: '🌟', label: 'Hopeful',      color: '#81B29A', bg: '#EAF5EE', text: '#2D6B47', score: 4 },
  grateful:     { emoji: '🙏', label: 'Grateful',     color: '#81B29A', bg: '#EAF5EE', text: '#2D6B47', score: 5 },
  loved:        { emoji: '🥰', label: 'Loved',        color: '#F6C945', bg: '#FEF9E7', text: '#8A6A00', score: 5 },
  content:      { emoji: '🥰', label: 'Content',      color: '#81B29A', bg: '#EAF5EE', text: '#2D6B47', score: 4 },
  inspired:     { emoji: '💡', label: 'Inspired',     color: '#F6C945', bg: '#FEF9E7', text: '#8A6A00', score: 5 },
  motivated:    { emoji: '🎯', label: 'Motivated',    color: '#F6C945', bg: '#FEF9E7', text: '#8A6A00', score: 5 },
  proud:        { emoji: '💪', label: 'Proud',        color: '#81B29A', bg: '#EAF5EE', text: '#2D6B47', score: 5 },

  // Peaceful & Grounded
  calm:         { emoji: '🍃', label: 'Calm',         color: '#81B29A', bg: '#EAF5EE', text: '#2D6B47', score: 4 },
  relieved:     { emoji: '😌', label: 'Relieved',     color: '#81B29A', bg: '#EAF5EE', text: '#2D6B47', score: 4 },
  curious:      { emoji: '🧐', label: 'Curious',      color: '#E6B86A', bg: '#FDF3E3', text: '#7A4F0D', score: 3 },

  // Tension & Unease
  anxious:      { emoji: '🫨', label: 'Anxious',      color: '#EF7B6C', bg: '#FEE9E7', text: '#A3302A', score: 2, isLow: true },
  nervous:      { emoji: '😰', label: 'Nervous',      color: '#EF7B6C', bg: '#FEE9E7', text: '#A3302A', score: 2, isLow: true },
  scared:       { emoji: '😨', label: 'Scared',       color: '#EF7B6C', bg: '#FEE9E7', text: '#A3302A', score: 2, isLow: true },
  overwhelmed:  { emoji: '🫠', label: 'Overwhelmed',  color: '#EF7B6C', bg: '#FEE9E7', text: '#A3302A', score: 2, isLow: true },
  bored:        { emoji: '😑', label: 'Bored',        color: '#E6B86A', bg: '#FDF3E3', text: '#7A4F0D', score: 3 },
  embarrassed:  { emoji: '😳', label: 'Embarrassed',  color: '#EF7B6C', bg: '#FEE9E7', text: '#A3302A', score: 2, isLow: true },
  confused:     { emoji: '🤔', label: 'Confused',     color: '#E6B86A', bg: '#FDF3E3', text: '#7A4F0D', score: 2, isLow: true },

  // Heavy & Vulnerable
  sad:          { emoji: '😥', label: 'Sad',          color: '#EF7B6C', bg: '#FEE9E7', text: '#A3302A', score: 2, isLow: true, isCritical: true },
  heartbroken:  { emoji: '💔', label: 'Heartbroken',  color: '#E53E3E', bg: '#FEE2E2', text: '#991B1B', score: 1, isLow: true, isCritical: true },
  disappointed: { emoji: '😕', label: 'Disappointed', color: '#EF7B6C', bg: '#FEE9E7', text: '#A3302A', score: 2, isLow: true },
  dissapointed: { emoji: '😕', label: 'Disappointed', color: '#EF7B6C', bg: '#FEE9E7', text: '#A3302A', score: 2, isLow: true },
  lonely:       { emoji: '🥺', label: 'Lonely',       color: '#EF7B6C', bg: '#FEE9E7', text: '#A3302A', score: 2, isLow: true },
  frustrated:   { emoji: '😤', label: 'Frustrated',   color: '#EF7B6C', bg: '#FEE9E7', text: '#A3302A', score: 2, isLow: true },
  jealous:      { emoji: '😒', label: 'Jealous',      color: '#EF7B6C', bg: '#FEE9E7', text: '#A3302A', score: 2, isLow: true },
  guilty:       { emoji: '🫣', label: 'Guilty',       color: '#EF7B6C', bg: '#FEE9E7', text: '#A3302A', score: 2, isLow: true },
  burned_out:   { emoji: '🥱', label: 'Burnt Out',    color: '#E53E3E', bg: '#FEE2E2', text: '#991B1B', score: 1, isLow: true },
  angry:        { emoji: '😠', label: 'Angry',        color: '#E53E3E', bg: '#FEE2E2', text: '#991B1B', score: 1, isLow: true },
  disgusted:    { emoji: '🤢', label: 'Disgusted',    color: '#EF7B6C', bg: '#FEE9E7', text: '#A3302A', score: 2, isLow: true },
}

export const LOW_MOOD_KEYS = Object.keys(MOOD_META).filter(k => MOOD_META[k].isLow)
export const LOW_MOOD_DB_KEYS = [...new Set(LOW_MOOD_KEYS.map(safeMoodKey))]
export const CRITICAL_MOOD_KEYS = Object.keys(MOOD_META).filter(k => MOOD_META[k].isCritical)
export const MOOD_SCORE = Object.fromEntries(
  Object.entries(MOOD_META).map(([k, v]) => [k, v.score || 3])
)

/**
 * Universal mood row normalizer.
 * Restores true student emotion from note metadata [Feeling: XYZ] and custom triggers [Other Trigger: ABC].
 * Strips raw tags so notes are clean and human-readable for both students and guidance counselors.
 */
export function normalizeMoodLog(row) {
  if (!row) return row

  let resolvedMood = row.mood_type || 'meh'
  let rawNote = row.note || ''
  let customTrigger = null

  // 1. Extract [Feeling: XYZ]
  if (rawNote && rawNote.includes('[Feeling:')) {
    const feelingMatch = rawNote.match(/\[Feeling:\s*([a-zA-Z_]+)\]/)
    if (feelingMatch && feelingMatch[1]) {
      resolvedMood = feelingMatch[1].toLowerCase()
      rawNote = rawNote.replace(/\[Feeling:\s*[a-zA-Z_]+\]\s*/g, '')
    }
  }

  // 2. Extract [Other Trigger: XYZ]
  if (rawNote && rawNote.includes('[Other Trigger:')) {
    const triggerMatch = rawNote.match(/\[Other Trigger:\s*([^\]]+)\]/)
    if (triggerMatch && triggerMatch[1]) {
      customTrigger = triggerMatch[1].trim()
      rawNote = rawNote.replace(/\[Other Trigger:\s*[^\]]+\]\s*/g, '')
    }
  }

  const cleanedNote = rawNote.trim() || null

  // 3. Assemble triggers array cleanly
  const rawTriggers = Array.isArray(row.triggers)
    ? row.triggers
    : (row.mood_triggers || []).map((t) => t.trigger_category).filter(Boolean)

  let combinedTriggers = [...rawTriggers]
  if (customTrigger) {
    if (combinedTriggers.includes('Other')) {
      combinedTriggers = combinedTriggers.map((t) => (t === 'Other' ? customTrigger : t))
    } else if (!combinedTriggers.includes(customTrigger)) {
      combinedTriggers.push(customTrigger)
    }
  }

  return {
    ...row,
    mood_type: resolvedMood,
    intensity: row.intensity || 3,
    note: cleanedNote,
    logged_at: row.logged_at,
    triggers: combinedTriggers,
    raw_mood_type: row.mood_type,
  }
}

export const JOURNAL_PROMPTS = [
  'What made you smile today?',
  'What challenged you today and how did you handle it?',
  'What are three things you are grateful for?',
  'Describe a moment today where you felt at peace.',
  'What is one thing you want to let go of today?',
  'Who made a positive impact on you this week?',
  'What would you tell your past self from a month ago?',
  'Who are you when you are not performing for the people inside your mind?',
  'What is one value you want your daily choices to reflect more?',
  'When do you feel the most connected to yourself?',
  'What would it look like to treat yourself the way you treat the people you love?',
  'What is your definition of success?',
  "Are you living by someone else's definition of success?",
  'What did I love to do as a kid?',
  'What childhood memory still affects me?',
  'What were your childhood fears?',
  'What version of me did I hide to be accepted?',
  'If I could go back and hold my younger self, what would I say to soothe them?',
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
  return (data || []).map((row) => normalizeMoodLog(row))
}

function getLocalCheckInDay(loggedAt) {
  const date = new Date(loggedAt)
  if (Number.isNaN(date.getTime())) return null
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export async function fetchDistinctCheckInDayCount(userId, targetCount = 7) {
  if (!userId) return 0
  if (!Number.isInteger(targetCount) || targetCount < 1) {
    throw new RangeError('targetCount must be a positive integer')
  }

  const pageSize = 500
  const distinctDays = new Set()
  let offset = 0

  while (distinctDays.size < targetCount) {
    const { data, error } = await supabase
      .from('mood_logs')
      .select('id, logged_at')
      .eq('user_id', userId)
      .order('logged_at', { ascending: false })
      .order('id', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (error) throw error

    const rows = data || []
    rows.forEach(row => {
      const day = getLocalCheckInDay(row.logged_at)
      if (day) distinctDays.add(day)
    })

    if (rows.length < pageSize) break
    offset += pageSize
  }

  return Math.min(distinctDays.size, targetCount)
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
      return getLocalCheckInDay(l.logged_at)
    }).filter(Boolean))
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
