import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '../src/context/ThemeContext'

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  upsert: vi.fn(),
  useAuth: vi.fn(() => ({ user: { id: 'staff-1', email: 'staff@example.edu', role: 'admin' } })),
}))

vi.mock('../src/lib/supabase.js', () => ({ supabase: { from: mocks.from } }))
vi.mock('../src/context/AuthContext.jsx', () => ({ useAuth: mocks.useAuth }))
vi.mock('../src/components/Navbar.jsx', () => ({ default: () => null }))

import AdminSettings from '../src/pages/AdminSettings.jsx'

beforeEach(() => {
  localStorage.clear()
  mocks.upsert.mockResolvedValue({ error: null })
  mocks.from.mockImplementation(() => {
    const query = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      maybeSingle: vi.fn(async () => ({ data: null, error: null })),
      upsert: mocks.upsert,
    }
    return query
  })
  window.matchMedia = vi.fn(() => ({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function renderSettings() {
  return render(
    <ThemeProvider>
      <MemoryRouter>
        <AdminSettings />
      </MemoryRouter>
    </ThemeProvider>,
  )
}

describe('admin appearance settings', () => {
  it('defaults to light even when the device prefers dark', () => {
    renderSettings()

    expect(screen.getByRole('heading', { name: 'Admin Settings' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Light' })).toHaveAttribute('aria-pressed', 'true')
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')
  })

  it('migrates the previous device-following default to light once', async () => {
    localStorage.setItem('uniwell-appearance', 'device')
    renderSettings()

    expect(screen.getByRole('button', { name: 'Light' })).toHaveAttribute('aria-pressed', 'true')
    await waitFor(() => {
      expect(localStorage.getItem('uniwell-appearance')).toBe('light')
      expect(localStorage.getItem('uniwell-appearance-light-default-v1')).toBe('true')
    })
  })

  it('lets an admin select and save the device appearance preference', async () => {
    renderSettings()
    fireEvent.click(screen.getByRole('button', { name: 'Device' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Device' })).toHaveAttribute('aria-pressed', 'true')
      expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
      expect(localStorage.getItem('uniwell-appearance')).toBe('device')
    })
  })

  it('supports browsers with legacy media-query listeners', () => {
    const addListener = vi.fn()
    const removeListener = vi.fn()
    window.matchMedia = vi.fn(() => ({
      matches: false,
      addListener,
      removeListener,
    }))

    const { unmount } = render(<ThemeProvider><p>App content</p></ThemeProvider>)

    expect(screen.getByText('App content')).toBeInTheDocument()
    expect(addListener).toHaveBeenCalledWith(expect.any(Function))
    unmount()
    expect(removeListener).toHaveBeenCalledWith(addListener.mock.calls[0][0])
  })

  it('renders when matchMedia is unavailable', () => {
    window.matchMedia = undefined

    render(<ThemeProvider><p>App content</p></ThemeProvider>)

    expect(screen.getByText('App content')).toBeInTheDocument()
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')
  })

  it('lets staff opt in to weekly Campus Wellness emails', async () => {
    renderSettings()

    const emailToggle = await screen.findByRole('checkbox', { name: 'Enable weekly Campus Wellness emails' })
    fireEvent.click(emailToggle)

    await waitFor(() => {
      expect(mocks.from).toHaveBeenCalledWith('notification_preferences')
      expect(emailToggle).toBeChecked()
      expect(mocks.upsert).toHaveBeenCalledWith(expect.objectContaining({
        user_id: 'staff-1',
        staff_wellness_email_enabled: true,
        staff_wellness_email_hour: 9,
      }), { onConflict: 'user_id' })
    })
  })
})
