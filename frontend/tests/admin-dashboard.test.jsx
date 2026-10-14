import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  rpc: vi.fn(),
  channel: vi.fn(),
  removeChannel: vi.fn(),
}))

vi.mock('../src/lib/supabase.js', () => ({
  supabase: {
    from: mocks.from,
    rpc: mocks.rpc,
    channel: mocks.channel,
    removeChannel: mocks.removeChannel,
  },
}))
vi.mock('../src/components/Navbar.jsx', () => ({ default: () => null }))
vi.mock('recharts', () => {
  const Stub = ({ children }) => <div>{children}</div>
  return {
    PieChart: Stub,
    Pie: Stub,
    Cell: Stub,
    BarChart: Stub,
    Bar: Stub,
    CartesianGrid: Stub,
    XAxis: Stub,
    YAxis: Stub,
    Tooltip: Stub,
    ResponsiveContainer: Stub,
  }
})

import AdminDashboard from '../src/pages/AdminDashboard.jsx'

const lowMoodLogs = [
  { id: 101, user_id: 'student-1', mood_type: 'bad', logged_at: '2026-10-14T09:00:00.000Z' },
  { id: 100, user_id: 'student-1', mood_type: 'burned_out', logged_at: '2026-10-13T09:00:00.000Z' },
  { id: 99, user_id: 'student-2', mood_type: 'awful', logged_at: '2026-10-12T09:00:00.000Z' },
]

const studentProfiles = [
  { id: 'student-1', name: 'Alex Student', student_id: 'S-101', course: 'Nursing', year_level: 2 },
  { id: 'student-2', name: 'Sam Student', student_id: 'S-102', course: 'Psychology', year_level: 1 },
  { id: 'admin-1', name: 'Guidance Admin' },
]

let checkinRows = []
let moodDistributionForTest = []

function mockRpc(name, args) {
  if (name === 'set_student_guidance_checkin') {
    const current = checkinRows.find(row => row.student_id === args.p_student_id) || { student_id: args.p_student_id }
    const marker = args.p_stage === 'reviewed' ? 'reviewed' : 'contacted'
    current[`${marker}_through_log_id`] = args.p_completed
      ? (args.p_student_id === 'student-1' ? 101 : 99)
      : null
    current[`${marker}_at`] = args.p_completed ? '2026-10-14T12:00:00.000Z' : null
    current[`${marker}_by`] = args.p_completed ? 'admin-1' : null
    checkinRows = [...checkinRows.filter(row => row.student_id !== args.p_student_id), current]
    return Promise.resolve({ data: null, error: null })
  }
  return Promise.resolve({
    data: { totalStudents: 2, moodDistribution: moodDistributionForTest, topTriggers: [], byYearLevel: [] },
    error: null,
  })
}

function configureQueries() {
  mocks.from.mockImplementation(table => {
    const state = { ranged: false }
    const result = {
      select: vi.fn(() => result),
      eq: vi.fn(() => result),
      in: vi.fn(() => result),
      gte: vi.fn(() => result),
      order: vi.fn(() => result),
      limit: vi.fn(() => result),
      range: vi.fn(() => {
        state.ranged = true
        return result
      }),
      then: (resolve, reject) => {
        let data = []
        if (table === 'mood_logs' && state.ranged) data = lowMoodLogs
        if (table === 'profiles') data = studentProfiles
        if (table === 'student_guidance_checkins') data = checkinRows
        return Promise.resolve({ data, error: null }).then(resolve, reject)
      },
    }
    return result
  })
}

function renderDashboard(moodDistribution) {
  moodDistributionForTest = moodDistribution
  configureQueries()
  return render(<MemoryRouter><AdminDashboard /></MemoryRouter>)
}

beforeEach(() => {
  vi.clearAllMocks()
  checkinRows = []
  moodDistributionForTest = []
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  const channel = {
    on: vi.fn(() => channel),
    subscribe: vi.fn(callback => {
      callback('SUBSCRIBED')
      return channel
    }),
  }
  mocks.channel.mockReturnValue(channel)
  mocks.rpc.mockImplementation(mockRpc)
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('admin campus guidance check-in', () => {
  it('opens a selected-period list grouped by affected student', async () => {
    renderDashboard([{ mood_type: 'bad', count: 1 }, { mood_type: 'burned_out', count: 1 }, { mood_type: 'awful', count: 1 }])

    expect(await screen.findByRole('heading', { name: 'Wellness Analytics' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /^3 low or difficult mood entries/i }))

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('Students with difficult mood entries')
    expect(screen.getByText('Alex Student')).toBeInTheDocument()
    expect(screen.getByText('Sam Student')).toBeInTheDocument()
    expect(screen.getByText('2 entries')).toBeInTheDocument()
    expect(within(dialog).getByText('3')).toBeInTheDocument()
    expect(mocks.from).toHaveBeenCalledWith('mood_logs')
    expect(mocks.from).toHaveBeenCalledWith('profiles')
    expect(screen.getByText(/Private journal content is not shown/)).toBeInTheDocument()
  })

  it('uses the calm community state when the selected period has no low entries', async () => {
    renderDashboard([{ mood_type: 'good', count: 3 }])

    expect(await screen.findByText('Community Wellness')).toBeInTheDocument()
    expect(screen.getByText('NO LOW ENTRIES')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Review affected students/ })).not.toBeInTheDocument()
  })

  it('tracks reviewed and contacted independently and allows reopening either status', async () => {
    renderDashboard([{ mood_type: 'bad', count: 2 }])
    fireEvent.click(await screen.findByRole('button', { name: /^2 low or difficult mood entries/i }))

    const student = await screen.findByText('Alex Student')
    fireEvent.click(within(student.closest('li')).getByRole('button', { name: 'Mark reviewed' }))
    await waitFor(() => expect(within(screen.getByText('Alex Student').closest('li')).getByRole('button', { name: 'Reviewed' })).toHaveAttribute('aria-pressed', 'true'))

    fireEvent.click(within(screen.getByText('Alex Student').closest('li')).getByRole('button', { name: 'Mark contacted' }))
    expect(await screen.findByRole('button', { name: 'Needs follow-up (1)' })).toBeInTheDocument()
    expect(screen.queryByText('Alex Student')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /All affected/ }))
    await waitFor(() => expect(within(screen.getByText('Alex Student').closest('li')).getByRole('button', { name: 'Contacted' })).toHaveAttribute('aria-pressed', 'true'))
    expect(screen.getByText(/Contacted by Guidance Admin/)).toBeInTheDocument()

    expect(mocks.rpc).toHaveBeenCalledWith('set_student_guidance_checkin', {
      p_student_id: 'student-1',
      p_stage: 'reviewed',
      p_completed: true,
    })
    expect(mocks.rpc).toHaveBeenCalledWith('set_student_guidance_checkin', {
      p_student_id: 'student-1',
      p_stage: 'contacted',
      p_completed: true,
    })
    expect(mocks.channel).toHaveBeenCalledWith('admin-guidance-monitoring')
  })

  it('reopens a completed marker when a newer difficult entry is present', async () => {
    checkinRows = [{
      student_id: 'student-1',
      reviewed_through_log_id: 100,
      reviewed_at: '2026-10-13T12:00:00.000Z',
      contacted_through_log_id: 100,
      contacted_at: '2026-10-13T12:00:00.000Z',
    }]
    renderDashboard([{ mood_type: 'bad', count: 2 }])
    fireEvent.click(await screen.findByRole('button', { name: /^2 low or difficult mood entries/i }))

    const studentRow = (await screen.findByText('Alex Student')).closest('li')
    expect(within(studentRow).getByRole('button', { name: 'Mark reviewed' })).toHaveAttribute('aria-pressed', 'false')
    expect(within(studentRow).getByRole('button', { name: 'Mark contacted' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('keeps fully completed students out of the default follow-up list', async () => {
    checkinRows = [{
      student_id: 'student-1',
      reviewed_through_log_id: 101,
      reviewed_at: '2026-10-14T12:00:00.000Z',
      contacted_through_log_id: 101,
      contacted_at: '2026-10-14T12:00:00.000Z',
    }, {
      student_id: 'student-2',
      reviewed_through_log_id: 99,
      reviewed_at: '2026-10-14T12:00:00.000Z',
      contacted_through_log_id: 99,
      contacted_at: '2026-10-14T12:00:00.000Z',
    }]
    renderDashboard([{ mood_type: 'bad', count: 2 }])
    fireEvent.click(await screen.findByRole('button', { name: /^2 low or difficult mood entries/i }))

    expect(await screen.findByText('All follow-up stages are complete')).toBeInTheDocument()
    expect(screen.queryByText('Alex Student')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /All affected/ }))
    expect(await screen.findByText('Alex Student')).toBeInTheDocument()
  })
})
