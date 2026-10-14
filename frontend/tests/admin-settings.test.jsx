import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '../src/context/ThemeContext'

vi.mock('../src/components/Navbar.jsx', () => ({ default: () => null }))

import AdminSettings from '../src/pages/AdminSettings.jsx'

beforeEach(() => {
  localStorage.clear()
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
})
