import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
}))

vi.mock('../src/lib/supabase.js', () => ({
  supabase: { auth: { getUser: mocks.getUser } },
}))
vi.mock('../src/components/Navbar.jsx', () => ({ default: () => null }))

import Journal from '../src/pages/Journal.jsx'

beforeEach(() => {
  mocks.getUser.mockResolvedValue({ data: { user: null } })
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('journal page', () => {
  it('renders the journal screen when no capsule data is available', () => {
    render(<Journal />)

    expect(screen.getByRole('heading', { name: /Journal Sanctuary/ })).toBeInTheDocument()
    expect(screen.getByText('Memory Vault')).toBeInTheDocument()
  })
})
