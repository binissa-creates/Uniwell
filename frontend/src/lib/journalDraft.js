// Local draft storage manager for UniWell Journal entries
// Automatically persists unfinished writing to localStorage so students
// never lose their reflections when switching tabs, closing browsers, or navigating away.

const DRAFT_PREFIX = 'uniwell_journal_draft_'

export function getDraftKey(userId) {
  return `${DRAFT_PREFIX}${userId || 'guest'}`
}

/**
 * Saves a journal draft to local storage
 */
export function saveJournalDraft(userId, data) {
  try {
    if (!data) return
    const key = getDraftKey(userId)
    const payload = {
      content: data.content ?? '',
      prompt: data.prompt ?? '',
      entryMode: data.entryMode ?? 'prompt',
      customTitle: data.customTitle ?? '',
      updatedAt: Date.now(),
    }
    // Only save if there is actually some content or custom title written
    if (payload.content.trim() || payload.customTitle.trim()) {
      localStorage.setItem(key, JSON.stringify(payload))
    } else {
      // Clear if empty
      localStorage.removeItem(key)
    }
  } catch (err) {
    console.warn('[journalDraft] Failed to save draft to localStorage:', err)
  }
}

/**
 * Retrieves the current journal draft if it exists
 */
export function getJournalDraft(userId) {
  try {
    const key = getDraftKey(userId)
    let raw = localStorage.getItem(key)
    // Fallback to guest key if user key is empty
    if (!raw && userId) {
      raw = localStorage.getItem(`${DRAFT_PREFIX}guest`)
    }
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && (parsed.content?.trim() || parsed.customTitle?.trim())) {
      return parsed
    }
    return null
  } catch (err) {
    console.warn('[journalDraft] Failed to read draft from localStorage:', err)
    return null
  }
}

/**
 * Clears the stored journal draft after successful saving or discard
 */
export function clearJournalDraft(userId) {
  try {
    const key = getDraftKey(userId)
    localStorage.removeItem(key)
    localStorage.removeItem(`${DRAFT_PREFIX}guest`)
  } catch (err) {
    console.warn('[journalDraft] Failed to clear draft from localStorage:', err)
  }
}
