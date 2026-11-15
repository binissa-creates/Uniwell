import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
}))

vi.mock('../src/lib/supabase.js', () => ({
  supabase: { from: mocks.from },
}))

vi.mock('../src/lib/data.js', () => ({
  MOOD_META: {
    good: { score: 4, emoji: '😊', label: 'Good' },
  },
  normalizeMoodLog: row => row,
}))

import { formatCapsuleDate, getReflectionCapsuleData } from '../src/lib/reflectionCapsule.js'

function daysAgo(days) {
  return new Date(Date.now() - days * 86400000).toISOString()
}

function configureCapsuleRows(moods, journals) {
  const rowsByTable = { mood_logs: moods, journal_entries: journals }
  mocks.from.mockImplementation(table => {
    const query = {}
    query.select = vi.fn(() => query)
    query.eq = vi.fn(() => query)
    query.order = vi.fn(() => Promise.resolve({ data: rowsByTable[table], error: null }))
    return query
  })
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-11-15T12:00:00.000Z'))
  vi.stubGlobal('localStorage', { getItem: () => null })
  vi.clearAllMocks()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('Reflection Capsule weekly dates', () => {
  it('formats a month-old memory in weeks instead of months', () => {
    expect(formatCapsuleDate(daysAgo(30))).toBe('4 weeks ago')
  })

  it('chooses a memory from around one week ago for the flashback', async () => {
    configureCapsuleRows([
      { id: 'weekly-mood', mood_type: 'good', logged_at: daysAgo(7) },
      { id: 'monthly-mood', mood_type: 'good', logged_at: daysAgo(30) },
    ], [])

    const capsule = await getReflectionCapsuleData('user-1')

    expect(capsule.milestoneType).toBe('7_days')
    expect(capsule.flashback.mood.id).toBe('weekly-mood')
    expect(capsule.flashback.dateLabel).toBe('1 week ago')
  })
})
