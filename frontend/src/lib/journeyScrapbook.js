import { supabase } from './supabase'
import { computeStreakMetrics } from './data'
import { getReflectionCapsuleData } from './reflectionCapsule'

/**
 * UniWell — My Journey Scrapbook Data Layer
 * 
 * Provides:
 * 1. User-curated memory storage (localStorage scoped to authenticated user).
 * 2. Dynamic scrapbook page builder assembling real moments into an editorial story.
 * 
 * Strict compliance:
 * - No fake data.
 * - Private by default.
 * - No clinical claims.
 * - Solar Pulse design integration.
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. User-Curated Memories Store (localStorage per userId)
// ─────────────────────────────────────────────────────────────────────────────

function getStorageKey(userId) {
  return `uniwell_journey_memories_${userId}`
}

/**
 * Retrieve user-curated memories for the journey scrapbook.
 */
export function getJourneyMemories(userId) {
  if (!userId) return []
  try {
    const raw = localStorage.getItem(getStorageKey(userId))
    return raw ? JSON.parse(raw) : []
  } catch (err) {
    console.error('[getJourneyMemories error]', err)
    return []
  }
}

/**
 * Save or update a curated memory.
 * memory: { id?, sourceType, sourceId?, title, note, photoUrl?, date, tags?, emoji?, visibility? }
 */
export function saveJourneyMemory(userId, memory) {
  if (!userId) return null
  try {
    const memories = getJourneyMemories(userId)
    const id = memory.id || `mem_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
    const updatedMemory = {
      ...memory,
      id,
      visibility: memory.visibility || 'journey', // 'private' | 'journey' | 'shareable'
      createdAt: memory.createdAt || new Date().toISOString(),
      date: memory.date || new Date().toISOString(),
    }

    const existingIndex = memories.findIndex(m => m.id === id || (memory.sourceType && memory.sourceId && m.sourceType === memory.sourceType && String(m.sourceId) === String(memory.sourceId)))
    if (existingIndex >= 0) {
      memories[existingIndex] = { ...memories[existingIndex], ...updatedMemory }
    } else {
      memories.unshift(updatedMemory)
    }

    localStorage.setItem(getStorageKey(userId), JSON.stringify(memories))
    return updatedMemory
  } catch (err) {
    console.error('[saveJourneyMemory error]', err)
    return null
  }
}

/**
 * Remove a curated memory.
 */
export function removeJourneyMemory(userId, memoryId) {
  if (!userId || !memoryId) return false
  try {
    const memories = getJourneyMemories(userId)
    const filtered = memories.filter(m => m.id !== memoryId && String(m.sourceId) !== String(memoryId))
    localStorage.setItem(getStorageKey(userId), JSON.stringify(filtered))
    return true
  } catch (err) {
    console.error('[removeJourneyMemory error]', err)
    return false
  }
}

/**
 * Toggle whether a mood, journal, or coping item is saved to My Journey.
 */
export function toggleSaveToJourney(userId, { sourceType, sourceId, title, note, date, tags, emoji, photoUrl }) {
  if (!userId || !sourceType) return false
  try {
    const memories = getJourneyMemories(userId)
    const existingIndex = memories.findIndex(m => m.sourceType === sourceType && String(m.sourceId) === String(sourceId))
    
    if (existingIndex >= 0) {
      memories.splice(existingIndex, 1)
      localStorage.setItem(getStorageKey(userId), JSON.stringify(memories))
      return false // removed
    } else {
      const newMemory = {
        id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        sourceType,
        sourceId,
        title: title || 'A moment from my journey',
        note: note || '',
        photoUrl: photoUrl || null,
        date: date || new Date().toISOString(),
        tags: tags || [],
        emoji: emoji || '🌻',
        visibility: 'journey',
        createdAt: new Date().toISOString(),
      }
      memories.unshift(newMemory)
      localStorage.setItem(getStorageKey(userId), JSON.stringify(memories))
      return true // saved
    }
  } catch (err) {
    console.error('[toggleSaveToJourney error]', err)
    return false
  }
}

/**
 * Check if a source item is already saved to My Journey.
 */
export function isSavedToJourney(userId, sourceType, sourceId) {
  if (!userId || !sourceId) return false
  const memories = getJourneyMemories(userId)
  return memories.some(m => m.sourceType === sourceType && String(m.sourceId) === String(sourceId))
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Dynamic Scrapbook Page Builder
// ─────────────────────────────────────────────────────────────────────────────

const MOOD_EMOJIS = {
  rad: '🤩', glowing: '🤩', excited: '😆', proud: '💪', motivated: '🎯',
  good: '😊', hopeful: '🌟', grateful: '🙏', calm: '😌', relieved: '😌',
  meh: '😐', neutral: '😐', content: '🎯', confused: '🤔',
  bad: '😔', nervous: '😰', frustrated: '😤', lonely: '🥺', overwhelmed: '🫠',
  disappointed: '😕', dissapointed: '😕', embarrassed: '😳',
  awful: '😢', angry: '😠', burned_out: '🥱',
}

const MOOD_LABELS = {
  rad: 'Glowing', glowing: 'Glowing', excited: 'Excited', proud: 'Proud', motivated: 'Motivated',
  good: 'Good', hopeful: 'Hopeful', grateful: 'Grateful', calm: 'Calm', relieved: 'Relieved',
  meh: 'Neutral', neutral: 'Neutral', content: 'Content', confused: 'Confused',
  bad: 'Difficult', nervous: 'Nervous', frustrated: 'Frustrated', lonely: 'Lonely',
  overwhelmed: 'Overwhelmed', disappointed: 'Disappointed', dissapointed: 'Disappointed',
  embarrassed: 'Embarrassed', awful: 'Tough', angry: 'Frustrated', burned_out: 'Burnt Out',
}

function formatDate(dateStr, format = 'month-year') {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (format === 'month-year') {
      return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return ''
  }
}

/**
 * Builds the structured, narrative-first scrapbook data payload.
 */
export async function buildJourneyScrapbook(userId) {
  if (!userId) return null

  try {
    // 1. Parallel fetch of real data
    const [moodsRes, journalsRes, favsRes, capsuleData] = await Promise.all([
      supabase
        .from('mood_logs')
        .select('id, mood_type, intensity, note, logged_at, mood_triggers(trigger_category)')
        .eq('user_id', userId)
        .order('logged_at', { ascending: true })
        .limit(365),
      supabase
        .from('journal_entries')
        .select('id, content, prompt, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('strategy_favorites')
        .select('strategy_id, coping_strategies(id, title, category, description)')
        .eq('user_id', userId)
        .limit(10),
      getReflectionCapsuleData(userId),
    ])

    const moodLogs = (moodsRes.data || []).map(r => ({
      id: r.id,
      mood_type: r.mood_type,
      intensity: r.intensity,
      note: r.note,
      logged_at: r.logged_at,
      triggers: (r.mood_triggers || []).map(t => t.trigger_category).filter(Boolean),
    }))

    const journals = journalsRes.data || []
    const favStrategies = (favsRes.data || []).map(r => r.coping_strategies).filter(Boolean)
    const curatedMemories = getJourneyMemories(userId)

    // Calculate streaks
    const moodsDesc = [...moodLogs].sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at))
    const metrics = computeStreakMetrics(moodsDesc)

    const pages = []

    // ─────────────────────────────────────────────────────────────────────────
    // PAGE 0: INTRO COVER
    // ─────────────────────────────────────────────────────────────────────────
    const firstCheckIn = moodLogs[0]?.logged_at || journals[journals.length - 1]?.created_at || null
    pages.push({
      type: 'INTRO',
      id: 'page_intro',
      title: 'MY JOURNEY SCRAPBOOK',
      subtitle: 'A collection of moments from your wellness journey.',
      since: formatDate(firstCheckIn, 'month-year'),
      hasData: moodLogs.length > 0 || journals.length > 0 || curatedMemories.length > 0,
    })

    // ─────────────────────────────────────────────────────────────────────────
    // PAGE A: THE BEGINNING
    // "IT STARTED HERE"
    // ─────────────────────────────────────────────────────────────────────────
    if (firstCheckIn || curatedMemories.length > 0) {
      const firstMemory = curatedMemories.find(m => m.sourceType === 'mood' || m.photoUrl)
      const earliestMood = moodLogs[0]
      const earliestJournal = journals[journals.length - 1]

      let beginningDate = firstCheckIn
      let caption = 'Your very first check-in. A small, intentional moment to pause.'
      let badge = '🌱 First Step'
      let photoUrl = firstMemory?.photoUrl || null

      if (earliestMood) {
        const moodName = MOOD_LABELS[earliestMood.mood_type] || 'Checking in'
        const moodEmoji = MOOD_EMOJIS[earliestMood.mood_type] || '🌱'
        caption = `You showed up and checked in feeling ${moodName} ${moodEmoji}.`
      } else if (earliestJournal) {
        caption = 'You put your first thoughts onto paper.'
        badge = '📖 First Reflection'
      }

      pages.push({
        type: 'THE_BEGINNING',
        id: 'page_beginning',
        eyebrow: '✦ IT STARTED HERE ✦',
        title: 'The First Seed',
        dateLabel: formatDate(beginningDate, 'month-year'),
        caption,
        badge,
        photoUrl,
      })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PAGE B: A MOMENT TO REMEMBER (Meaningful Mood Check-in)
    // ─────────────────────────────────────────────────────────────────────────
    // Check if user specifically curated a mood memory first
    const curatedMoodMem = curatedMemories.find(m => m.sourceType === 'mood')
    // Otherwise look for a meaningful log with a note or positive tone
    const meaningfulMood = curatedMoodMem 
      ? moodLogs.find(m => String(m.id) === String(curatedMoodMem.sourceId)) || moodLogs[Math.floor(moodLogs.length / 2)]
      : moodLogs.find(m => m.note && m.note.length > 10) || moodLogs.find(m => ['rad', 'good', 'calm', 'grateful', 'proud'].includes(m.mood_type))

    if (meaningfulMood || curatedMoodMem) {
      const targetMood = meaningfulMood || {
        mood_type: 'good',
        logged_at: curatedMoodMem?.date,
        note: curatedMoodMem?.note,
        triggers: curatedMoodMem?.tags || [],
      }
      const moodLabel = MOOD_LABELS[targetMood.mood_type] || 'Peaceful'
      const moodEmoji = MOOD_EMOJIS[targetMood.mood_type] || '😊'
      const noteClean = targetMood.note ? targetMood.note.replace(/\[Feeling:[^\]]+\]/, '').replace(/\[Other Trigger:[^\]]+\]/, '').trim() : ''

      pages.push({
        type: 'MOMENT_TO_REMEMBER',
        id: 'page_moment',
        eyebrow: 'A MOMENT TO REMEMBER',
        moodEmoji,
        moodLabel,
        caption: noteClean ? `"${noteClean}"` : 'A moment when you gave yourself space to pause and be present.',
        triggers: targetMood.triggers || [],
        dateLabel: formatDate(targetMood.logged_at, 'full'),
        photoUrl: curatedMoodMem?.photoUrl || null,
        sourceId: targetMood.id,
      })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PAGE C: JOURNAL MEMORY (Selected reflection)
    // ─────────────────────────────────────────────────────────────────────────
    // Check if user curated a journal entry
    const curatedJournalMem = curatedMemories.find(m => m.sourceType === 'journal')
    const selectedJournal = curatedJournalMem
      ? journals.find(j => String(j.id) === String(curatedJournalMem.sourceId)) || journals[0]
      : journals.find(j => j.content && j.content.length > 30) || journals[0]

    if (selectedJournal) {
      const excerpt = selectedJournal.content ? selectedJournal.content.slice(0, 160) + (selectedJournal.content.length > 160 ? '…' : '') : ''
      pages.push({
        type: 'JOURNAL_MEMORY',
        id: 'page_journal',
        eyebrow: 'WORDS YOU LEFT FOR YOURSELF',
        prompt: selectedJournal.prompt || 'Personal Reflection',
        excerpt: `"${excerpt}"`,
        dateLabel: formatDate(selectedJournal.created_at, 'month-year'),
        photoUrl: curatedJournalMem?.photoUrl || null,
        sourceId: selectedJournal.id,
      })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PAGE D: COPING MOMENT (A way you cared for yourself)
    // ─────────────────────────────────────────────────────────────────────────
    const curatedCopingMem = curatedMemories.find(m => m.sourceType === 'coping')
    const strategy = curatedCopingMem
      ? favStrategies.find(s => String(s.id) === String(curatedCopingMem.sourceId)) || favStrategies[0]
      : favStrategies[0]

    if (strategy || curatedCopingMem) {
      pages.push({
        type: 'COPING_MOMENT',
        id: 'page_coping',
        eyebrow: 'A WAY YOU CARED FOR YOURSELF',
        title: strategy?.title || curatedCopingMem?.title || 'Mindful Moment',
        category: strategy?.category || 'Relaxation',
        caption: curatedCopingMem?.note || 'You chose this as one of your ways to care for yourself and recharge.',
        photoUrl: curatedCopingMem?.photoUrl || null,
        sourceId: strategy?.id,
      })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PAGE E: A LITTLE WIN (Milestone)
    // ─────────────────────────────────────────────────────────────────────────
    if (metrics.totalDays >= 1 || metrics.bestStreak >= 1) {
      let winBadge = 'First Check-In'
      let winEmoji = '🌱'
      let daysCount = metrics.totalDays

      if (metrics.bestStreak >= 30 || metrics.totalDays >= 30) {
        winBadge = '30 Days of Care'
        winEmoji = '🌻'
      } else if (metrics.bestStreak >= 14 || metrics.totalDays >= 14) {
        winBadge = '14 Days of Care'
        winEmoji = '🌿'
      } else if (metrics.bestStreak >= 7 || metrics.totalDays >= 7) {
        winBadge = '7 Days of Care'
        winEmoji = '💧'
      }

      pages.push({
        type: 'LITTLE_WIN',
        id: 'page_win',
        eyebrow: '✦ A LITTLE WIN ✦',
        title: 'YOU KEPT SHOWING UP',
        badge: winBadge,
        emoji: winEmoji,
        statDays: metrics.bestStreak || metrics.totalDays,
        subtext: 'Small steps still count. Consistency is about returning, not being perfect.',
      })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PAGE F: REFLECTION CAPSULE INTEGRATION
    // ─────────────────────────────────────────────────────────────────────────
    if (capsuleData?.hasData && capsuleData?.flashback) {
      pages.push({
        type: 'REFLECTION_CAPSULE',
        id: 'page_capsule',
        eyebrow: 'A MEMORY WORTH KEEPING',
        title: 'Reflection Capsule',
        dateLabel: capsuleData.flashback.dateLabel || 'Past memory',
        moodLabel: capsuleData.flashback.mood?.label || null,
        moodEmoji: capsuleData.flashback.mood?.emoji || '✨',
        capsuleData,
      })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PAGE G: LOOK HOW FAR YOU'VE COME (Collage of curated moments)
    // ─────────────────────────────────────────────────────────────────────────
    if (moodLogs.length >= 3 || curatedMemories.length > 0) {
      pages.push({
        type: 'FAR_YOUVE_COME',
        id: 'page_far',
        eyebrow: 'LOOK HOW FAR YOU\'VE COME',
        title: 'Moments to Remember',
        caption: 'These are small moments and quiet reflections you chose to remember along the way.',
        memories: curatedMemories.slice(0, 3),
        totalCheckIns: moodLogs.length,
        totalJournals: journals.length,
      })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PAGE H: CLOSING MESSAGE & SHARE TRANSITION
    // ─────────────────────────────────────────────────────────────────────────
    pages.push({
      type: 'CLOSING',
      id: 'page_closing',
      title: 'YOUR STORY SO FAR',
      messageLines: [
        'Not every day was easy.',
        'But you kept making space for yourself.',
        'Every check-in, reflection, and little win became part of your story.',
      ],
      finalPrompt: 'Keep nurturing your bloom. 🌻',
    })

    return {
      pages,
      curatedMemories,
      stats: {
        totalCheckIns: moodLogs.length,
        totalJournals: journals.length,
        bestStreak: metrics.bestStreak,
        currentStreak: metrics.currentStreak,
        totalDays: metrics.totalDays,
      },
      capsuleData,
    }
  } catch (err) {
    console.error('[buildJourneyScrapbook error]', err)
    return null
  }
}
