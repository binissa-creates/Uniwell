import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  range: vi.fn(),
}))

vi.mock('../src/lib/supabase.js', () => ({
  supabase: { from: mocks.from },
}))

import { fetchDistinctCheckInDayCount } from '../src/lib/data.js'

function configureMoodRows(rows) {
  const query = {}
  query.select = vi.fn(() => query)
  query.eq = vi.fn(() => query)
  query.order = vi.fn(() => query)
  mocks.range.mockResolvedValue({ data: rows, error: null })
  query.range = mocks.range
  mocks.from.mockReturnValue(query)
  return query
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('journey wrap check-in milestone', () => {
  it('counts unique check-in days rather than individual mood logs', async () => {
    const query = configureMoodRows([
      { id: 'mood-3', logged_at: '2026-11-13T12:00:00.000Z' },
      { id: 'mood-2', logged_at: '2026-11-13T08:00:00.000Z' },
      { id: 'mood-1', logged_at: '2026-11-13T03:00:00.000Z' },
    ])

    await expect(fetchDistinctCheckInDayCount('user-1')).resolves.toBe(1)
    expect(query.range).toHaveBeenCalledWith(0, 499)
  })

  it('caps the count at the number of days needed to unlock', async () => {
    const query = configureMoodRows(Array.from({ length: 10 }, (_, index) => ({
      id: `mood-${index}`,
      logged_at: `2026-11-${String(13 - index).padStart(2, '0')}T12:00:00.000Z`,
    })))

    await expect(fetchDistinctCheckInDayCount('user-1')).resolves.toBe(7)
    expect(query.range).toHaveBeenCalledTimes(1)
  })
})
