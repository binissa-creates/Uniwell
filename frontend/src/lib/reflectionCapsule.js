import { supabase } from './supabase'

const MOOD_VALUES = {
  rad: 5, glowing: 5, excited: 5, proud: 5, motivated: 5,
  good: 4, hopeful: 4, grateful: 4, calm: 4, relieved: 4,
  meh: 3, neutral: 3, content: 3, confused: 3,
  bad: 2, nervous: 2, frustrated: 2, lonely: 2, overwhelmed: 2, disappointed: 2, dissapointed: 2, embarrassed: 2,
  awful: 1, angry: 1, burned_out: 1
}

const MOOD_EMOJIS = {
  rad: '🤩', glowing: '🤩', excited: '😆', proud: '💪', motivated: '🎯',
  good: '😊', hopeful: '🌟', grateful: '🙏', calm: '😌', relieved: '😌',
  meh: '😐', neutral: '😐', content: '🎯', confused: '🤔',
  bad: '😔', nervous: '😰', frustrated: '😤', lonely: '🥺', overwhelmed: '🫠', disappointed: '😕', dissapointed: '😕', embarrassed: '😳',
  awful: '😢', angry: '😠', burned_out: '🥱'
}

const MOOD_LABELS = {
  rad: 'Glowing', glowing: 'Glowing', excited: 'Excited', proud: 'Proud', motivated: 'Motivated',
  good: 'Good', hopeful: 'Hopeful', grateful: 'Grateful', calm: 'Relieved', relieved: 'Relieved',
  meh: 'Neutral', neutral: 'Neutral', content: 'Motivated', confused: 'Confused',
  bad: 'Bad', nervous: 'Nervous', frustrated: 'Frustrated', lonely: 'Lonely', overwhelmed: 'Overwhelmed', disappointed: 'Disappointed', dissapointed: 'Disappointed', embarrassed: 'Embarrassed',
  awful: 'Awful', angry: 'Angry', burned_out: 'Burnt Out'
}

/**
 * Calculates time difference label (e.g., "30 days ago", "4 weeks ago", "July 26")
 */
export function formatCapsuleDate(dateString) {
  if (!dateString) return 'Past memory'
  const date = new Date(dateString)
  const now = new Date()
  const diffDays = Math.round((now - date) / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays >= 28 && diffDays <= 32) return '1 month ago today'
  if (diffDays > 1 && diffDays < 7) return `${diffDays} days ago`
  if (diffDays >= 7 && diffDays < 14) return '1 week ago'
  if (diffDays >= 14 && diffDays < 28) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays > 32 && diffDays < 60) return `${Math.floor(diffDays / 30)} month ago`
  if (diffDays >= 60) return `${Math.floor(diffDays / 30)} months ago`
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/**
 * Fetches and synthesizes all retrospective capsule data for the active user.
 */
export async function getReflectionCapsuleData(userId) {
  if (!userId) return null

  try {
    const [moodsRes, journalsRes] = await Promise.all([
      supabase
        .from('mood_logs')
        .select('id, mood_type, intensity, note, logged_at, mood_triggers(trigger_category)')
        .eq('user_id', userId)
        .order('logged_at', { ascending: false }),
      supabase
        .from('journal_entries')
        .select('id, content, prompt, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
    ])

    const moodLogs = (moodsRes.data || []).map(row => ({
      id: row.id,
      mood_type: row.mood_type,
      intensity: row.intensity || MOOD_VALUES[row.mood_type] || 3,
      note: row.note,
      logged_at: row.logged_at,
      triggers: (row.mood_triggers || []).map(t => t.trigger_category)
    }))

    const journalEntries = journalsRes.data || []

    const now = Date.now()
    const msPerDay = 86400000

    // 1. Find Memory Flashback ("1 month ago" ± 4 days window)
    const target30DaysAgo = now - (30 * msPerDay)
    const toleranceWindow = 4 * msPerDay

    let flashbackMood = moodLogs.find(m => {
      const logTime = new Date(m.logged_at).getTime()
      return Math.abs(logTime - target30DaysAgo) <= toleranceWindow
    })

    let flashbackJournal = journalEntries.find(j => {
      const entryTime = new Date(j.created_at).getTime()
      return Math.abs(entryTime - target30DaysAgo) <= toleranceWindow
    })

    let milestoneType = '30_days'

    // If no 30-day memory, fallback to 14 days, 7 days, or earliest memory
    if (!flashbackMood && !flashbackJournal) {
      const target14Days = now - (14 * msPerDay)
      flashbackMood = moodLogs.find(m => Math.abs(new Date(m.logged_at).getTime() - target14Days) <= (2 * msPerDay))
      flashbackJournal = journalEntries.find(j => Math.abs(new Date(j.created_at).getTime() - target14Days) <= (2 * msPerDay))
      if (flashbackMood || flashbackJournal) {
        milestoneType = '14_days'
      }
    }

    if (!flashbackMood && !flashbackJournal) {
      const target7Days = now - (7 * msPerDay)
      flashbackMood = moodLogs.find(m => Math.abs(new Date(m.logged_at).getTime() - target7Days) <= (2 * msPerDay))
      flashbackJournal = journalEntries.find(j => Math.abs(new Date(j.created_at).getTime() - target7Days) <= (2 * msPerDay))
      if (flashbackMood || flashbackJournal) {
        milestoneType = '7_days'
      }
    }

    // If still none, check earliest record
    if (!flashbackMood && !flashbackJournal) {
      if (moodLogs.length > 0) flashbackMood = moodLogs[moodLogs.length - 1]
      if (journalEntries.length > 0) flashbackJournal = journalEntries[journalEntries.length - 1]
      milestoneType = 'first_milestone'
    }

    // 2. Compute Emotional Growth Snapshot (Recent 7 days vs Previous period)
    const recentLogs = moodLogs.filter(m => (now - new Date(m.logged_at).getTime()) <= (7 * msPerDay))
    const pastLogs = moodLogs.filter(m => (now - new Date(m.logged_at).getTime()) > (7 * msPerDay))

    const recentScoreAvg = recentLogs.length > 0 
      ? (recentLogs.reduce((acc, curr) => acc + (MOOD_VALUES[curr.mood_type] || 3), 0) / recentLogs.length) 
      : 3.5

    const pastScoreAvg = pastLogs.length > 0
      ? (pastLogs.reduce((acc, curr) => acc + (MOOD_VALUES[curr.mood_type] || 3), 0) / pastLogs.length)
      : 3.0

    const scoreDelta = parseFloat((recentScoreAvg - pastScoreAvg).toFixed(1))

    // Determine dominant moods then vs now
    const getTopMood = (logs) => {
      if (!logs.length) return null
      const counts = logs.reduce((acc, m) => {
        acc[m.mood_type] = (acc[m.mood_type] || 0) + 1
        return acc
      }, {})
      return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
    }

    const recentDominant = getTopMood(recentLogs) || (moodLogs[0]?.mood_type || 'good')
    const pastDominant = getTopMood(pastLogs) || flashbackMood?.mood_type || 'meh'

    // Growth Insight text
    let growthTitle = 'Steadily Blooming'
    let growthInsight = "You've shown consistency in honoring your mental space. Every entry builds your emotional grounding."
    
    if (scoreDelta > 0.3) {
      growthTitle = 'Radiant Uplift'
      growthInsight = `Your overall emotional radiance is up by +${scoreDelta} pts compared to your earlier baseline. You are navigating life with greater emotional lightness.`
    } else if (scoreDelta < -0.3) {
      growthTitle = 'Resilience in Progress'
      growthInsight = 'You have weathered some heavier storms recently. Acknowledging low moments is a profound sign of inner strength and self-awareness.'
    } else if (moodLogs.length >= 7) {
      growthTitle = 'Harmonious Balance'
      growthInsight = `You have maintained steady emotional equilibrium over the past weeks with a solid foundation in ${MOOD_LABELS[recentDominant] || 'wellbeing'}.`
    }

    // 3. Meaningful Journal Excerpt
    let goldenExcerpt = journalEntries.find(j => {
      const diff = (now - new Date(j.created_at).getTime()) / msPerDay
      return diff >= 7 && (j.content?.length > 40 || j.prompt?.toLowerCase().includes('grateful'))
    }) || journalEntries[0] || null

    // 4. Future Self Capsule (from localStorage)
    const storageKey = `uniwell_future_capsules_${userId}`
    let savedFutureNotes = []
    try {
      savedFutureNotes = JSON.parse(localStorage.getItem(storageKey) || '[]')
    } catch {
      savedFutureNotes = []
    }

    const unlockedNotes = savedFutureNotes.filter(n => new Date(n.unlockAt).getTime() <= now)
    const lockedNotes = savedFutureNotes.filter(n => new Date(n.unlockAt).getTime() > now)

    return {
      hasData: moodLogs.length > 0 || journalEntries.length > 0,
      totalMoodCount: moodLogs.length,
      totalJournalCount: journalEntries.length,
      milestoneType,
      flashback: {
        mood: flashbackMood ? {
          ...flashbackMood,
          emoji: MOOD_EMOJIS[flashbackMood.mood_type] || '✨',
          label: MOOD_LABELS[flashbackMood.mood_type] || 'Mood'
        } : null,
        journal: flashbackJournal,
        date: flashbackMood?.logged_at || flashbackJournal?.created_at || new Date(target30DaysAgo).toISOString(),
        dateLabel: formatCapsuleDate(flashbackMood?.logged_at || flashbackJournal?.created_at || target30DaysAgo)
      },
      growth: {
        recentAvg: recentScoreAvg.toFixed(1),
        pastAvg: pastScoreAvg.toFixed(1),
        scoreDelta,
        recentDominant: {
          key: recentDominant,
          emoji: MOOD_EMOJIS[recentDominant] || '✨',
          label: MOOD_LABELS[recentDominant] || 'Good'
        },
        pastDominant: {
          key: pastDominant,
          emoji: MOOD_EMOJIS[pastDominant] || '🌱',
          label: MOOD_LABELS[pastDominant] || 'Reflective'
        },
        growthTitle,
        growthInsight
      },
      goldenExcerpt: goldenExcerpt ? {
        id: goldenExcerpt.id,
        content: goldenExcerpt.content,
        prompt: goldenExcerpt.prompt || 'Personal Reflection',
        dateLabel: formatCapsuleDate(goldenExcerpt.created_at),
        created_at: goldenExcerpt.created_at
      } : null,
      futureCapsule: {
        unlockedNotes,
        lockedNotes,
        totalNotes: savedFutureNotes.length
      }
    }
  } catch (err) {
    console.error('[getReflectionCapsuleData error]', err)
    return null
  }
}

/**
 * Saves a new "Note to Future Self" to unlock in N days (defaults to 30 days).
 */
export function saveFutureSelfNote(userId, noteText, daysToLock = 30) {
  if (!userId || !noteText.trim()) return false
  const storageKey = `uniwell_future_capsules_${userId}`
  try {
    const existing = JSON.parse(localStorage.getItem(storageKey) || '[]')
    const now = new Date()
    const unlockAt = new Date(now.getTime() + (daysToLock * 86400000)).toISOString()

    const newNote = {
      id: 'capsule_' + Date.now(),
      createdAt: now.toISOString(),
      unlockAt,
      daysLocked: daysToLock,
      text: noteText.trim()
    }

    existing.unshift(newNote)
    localStorage.setItem(storageKey, JSON.stringify(existing))
    return true
  } catch (err) {
    console.error('[saveFutureSelfNote error]', err)
    return false
  }
}
