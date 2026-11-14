import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  update: vi.fn(),
  useAuth: vi.fn(),
}))

vi.mock('../src/lib/supabase.js', () => ({ supabase: { from: mocks.from } }))
vi.mock('../src/context/AuthContext.jsx', () => ({ useAuth: mocks.useAuth }))
vi.mock('../src/components/Navbar.jsx', () => ({ default: () => null }))

import FirstLoginGuidePrompt from '../src/components/FirstLoginGuidePrompt.jsx'
import GuidedProductTour from '../src/components/GuidedProductTour.jsx'
import GettingStartedGuide from '../src/pages/GettingStartedGuide.jsx'

function renderOnboarding() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route
          path="/dashboard"
          element={(
            <>
              <p>Student home</p>
              <div data-tour="dashboard-streak">Check-in streak</div>
              <button type="button" data-tour="dashboard-log-mood">Water your sunflower</button>
            </>
          )}
        />
        <Route
          path="/mood"
          element={(
            <>
              <div data-tour="mood-picker">Mood picker</div>
              <div data-tour="mood-intensity">Mood intensity</div>
              <div data-tour="mood-triggers">Mood triggers</div>
              <button type="button" data-tour="mood-save">Save mood</button>
              <div data-tour="mood-history">Mood history</div>
            </>
          )}
        />
        <Route
          path="/journal"
          element={(
            <>
              <button type="button" data-tour="journal-compose">Write entry</button>
              <button type="button" data-tour="journal-prompt">Choose prompt</button>
              <button type="button" data-tour="journal-prompt-option">Try prompt</button>
              <textarea data-tour="journal-entry" aria-label="Journal entry" />
              <button type="button" data-tour="journal-save">Save reflection</button>
              <div data-tour="journal-timeline">Reflection timeline</div>
            </>
          )}
        />
        <Route
          path="/peer-insights"
          element={(
            <>
              <div data-tour="peer-for-you">For you</div>
              <button type="button" data-tour="peer-community-tab">Community</button>
              <div data-tour="peer-community">Community strategies</div>
              <button type="button" data-tour="peer-share">Share strategy</button>
              <div data-tour="peer-strategy-category">Strategy category</div>
              <button type="button" data-tour="peer-strategy-submit">Submit strategy</button>
              <button type="button" data-tour="peer-strategy-close">Close form</button>
              <button type="button" data-tour="peer-mine-tab">My strategies</button>
              <div data-tour="peer-my-strategies">Submitted strategies</div>
            </>
          )}
        />
        <Route path="/admin" element={<div data-tour="staff-overview">Staff home</div>} />
        <Route path="/admin/students" element={<div data-tour="staff-student-monitor">Student monitor</div>} />
        <Route path="/admin/moderation" element={<div data-tour="staff-moderation">Moderation</div>} />
        <Route path="/admin/settings" element={<div data-tour="staff-guide-setting">Settings</div>} />
        <Route path="/guide" element={<GettingStartedGuide />} />
      </Routes>
      <FirstLoginGuidePrompt />
      <GuidedProductTour />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.resetAllMocks()
  const maybeSingle = vi.fn().mockResolvedValue({ data: { id: 'user-1' }, error: null })
  const select = vi.fn(() => ({ maybeSingle }))
  const eq = vi.fn(() => ({ select }))
  mocks.update.mockReturnValue({ eq })
  mocks.from.mockReturnValue({ update: mocks.update })
  mocks.useAuth.mockReturnValue({
    user: { id: 'user-1', role: 'student' },
    profile: { id: 'user-1', role: 'student', status: 'active', onboarding_completed: false },
  })

  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    top: 100,
    left: 100,
    width: 200,
    height: 40,
    right: 300,
    bottom: 140,
    x: 100,
    y: 100,
    toJSON: () => ({}),
  })
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('first-login product tour', () => {
  it('offers the guide only to eligible first-time students and counselors', () => {
    mocks.useAuth.mockReturnValue({
      user: { id: 'admin-1', role: 'admin' },
      profile: { id: 'admin-1', role: 'admin', status: 'active', onboarding_completed: false },
    })
    const { rerender } = renderOnboarding()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    mocks.useAuth.mockReturnValue({
      user: { id: 'user-1', role: 'student' },
      profile: { id: 'user-1', role: 'student', status: 'active', onboarding_completed: true },
    })
    rerender(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={<p>Student home</p>} />
        </Routes>
        <FirstLoginGuidePrompt />
        <GuidedProductTour />
      </MemoryRouter>,
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('saves the skip choice and lets a student continue to their home', async () => {
    renderOnboarding()

    fireEvent.click(screen.getByRole('button', { name: /explore on my own/i }))

    await waitFor(() => {
      expect(mocks.from).toHaveBeenCalledWith('profiles')
      expect(mocks.update).toHaveBeenCalledWith({ onboarding_completed: true })
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  it('starts on the real dashboard and follows the highlighted mood check-in control', async () => {
    renderOnboarding()

    fireEvent.click(screen.getByRole('button', { name: /show me around/i }))

    expect(await screen.findByRole('heading', { name: 'Your bloom and check-in streak' })).toBeInTheDocument()
    expect(screen.getByText('Student home')).toBeInTheDocument()
    await waitFor(() => {
      expect(document.querySelector('div[aria-hidden="true"].border-primary-container')).not.toBeNull()
    })
    expect(mocks.update).toHaveBeenCalledWith({ onboarding_completed: true })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(await screen.findByRole('heading', { name: 'Start a daily check-in' })).toBeInTheDocument()
    expect(await screen.findByText('Tap the highlighted control to continue.')).toBeInTheDocument()
    expect(await screen.findByText('Use the highlighted control')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Water your sunflower' }))

    expect(await screen.findByRole('heading', { name: 'Choose how you feel' })).toBeInTheDocument()
    expect(screen.getByText('Mood picker')).toBeInTheDocument()
  })

  it('starts counselors in their staff hub and navigates to the next real screen', async () => {
    mocks.useAuth.mockReturnValue({
      user: { id: 'counselor-1', role: 'counselor' },
      profile: { id: 'counselor-1', role: 'counselor', status: 'active', onboarding_completed: false },
    })
    renderOnboarding()

    expect(screen.getByRole('heading', { name: 'Welcome to your staff hub.' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /show me around/i }))

    expect(await screen.findByRole('heading', { name: 'Your Staff Hub' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(await screen.findByRole('heading', { name: 'Review student wellness' })).toBeInTheDocument()
    expect(screen.getByText('Student monitor')).toBeInTheDocument()
  })
})
