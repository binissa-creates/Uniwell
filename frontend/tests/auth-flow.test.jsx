import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'

const mocks = vi.hoisted(() => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      updateUser: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(),
    rpc: vi.fn(),
  },
  useAuth: vi.fn(),
}))

vi.mock('../src/lib/supabase.js', () => ({ supabase: mocks.supabase }))
vi.mock('../src/context/AuthContext.jsx', () => ({ useAuth: mocks.useAuth }))

import Login from '../src/pages/Login.jsx'
import Register from '../src/pages/Register.jsx'
import ForgotPassword from '../src/pages/ForgotPassword.jsx'
import AcceptInvite from '../src/pages/AcceptInvite.jsx'
import ProtectedRoute from '../src/components/ProtectedRoute.jsx'
import { ACADEMIC_DEPARTMENTS } from '../src/lib/academicPrograms.js'

function profileQuery(profile, error = null) {
  mocks.supabase.from.mockReturnValue({
    select: () => ({
      eq: () => ({
        maybeSingle: async () => ({ data: profile, error }),
      }),
    }),
  })
}

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<p>Student dashboard reached</p>} />
        <Route path="/staff" element={<p>Staff hub reached</p>} />
        <Route path="/admin" element={<p>Admin dashboard reached</p>} />
        <Route path="/accept-invite" element={<p>Invite acceptance reached</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

function LocationProbe() {
  const location = useLocation()
  return <p data-testid="current-route">{location.pathname}</p>
}

function renderProtectedRoute(initialPath, allowedRoles, profile) {
  mocks.useAuth.mockReturnValue({
    session: { user: { id: 'user-1' } },
    profile,
    loading: false,
    signOut: vi.fn(),
  })

  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/staff" element={<ProtectedRoute allowedRoles={['counselor', 'admin']}><p>Staff hub content</p></ProtectedRoute>} />
        <Route path="/staff/manage" element={<ProtectedRoute allowedRoles={['counselor', 'admin']}><p>Manage staff content</p></ProtectedRoute>} />
        <Route path="/dashboard" element={<p>Student home content</p>} />
        <Route path="/login" element={<p>Login content</p>} />
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.useAuth.mockReturnValue({ signOut: mocks.supabase.auth.signOut })
})

afterEach(() => cleanup())

describe('unified login', () => {
  it.each([
    ['student', '/dashboard', 'Student dashboard reached'],
    ['counselor', '/admin', 'Admin dashboard reached'],
    ['admin', '/admin', 'Admin dashboard reached'],
  ])('redirects an active %s to their home', async (role, route, destination) => {
    mocks.supabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })

    mocks.supabase.rpc.mockResolvedValue({ data: null, error: null })
    profileQuery({ role, status: 'active' })
    renderLogin()

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'member@example.edu' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'StrongPassword123!' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText(destination)).toBeInTheDocument()
    expect(mocks.supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'member@example.edu',
      password: 'StrongPassword123!',
    })
    if (role !== 'student') expect(mocks.supabase.rpc).toHaveBeenCalledWith('log_staff_sign_in')
    expect(route).toBe(role === 'student' ? '/dashboard' : '/admin')
  })

  it('signs a disabled user out and shows the inactive message', async () => {
    mocks.supabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })
    mocks.supabase.auth.signOut.mockResolvedValue({ error: null })
    profileQuery({ role: 'student', status: 'disabled' })
    renderLogin()

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'member@example.edu' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'StrongPassword123!' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This account is inactive. Please contact the guidance office.',
    )
    expect(mocks.supabase.auth.signOut).toHaveBeenCalled()
  })

  it('shows a setup error when the profile schema is missing required columns', async () => {
    mocks.supabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })
    mocks.supabase.auth.signOut.mockResolvedValue({ error: null })
    profileQuery(null, { code: '42703', message: 'column profiles.status does not exist' })
    renderLogin()

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'member@example.edu' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'StrongPassword123!' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Sign-in is temporarily unavailable. Please contact your administrator.',
    )
    expect(mocks.supabase.auth.signOut).toHaveBeenCalled()
  })
})

describe('staff invitation password setup', () => {
  it('accepts a password with 8 characters without composition rules', async () => {
    const refreshProfile = vi.fn().mockResolvedValue({ role: 'counselor', status: 'active' })
    mocks.useAuth.mockReturnValue({
      session: { user: { id: 'staff-1' } },
      profile: { role: 'counselor', status: 'invited', full_name: 'Bea Benessa Galleto' },
      loading: false,
      refreshProfile,
    })
    mocks.supabase.auth.updateUser.mockResolvedValue({ error: null })
    mocks.supabase.rpc.mockResolvedValue({ error: null })

    render(
      <MemoryRouter initialEntries={['/accept-invite']}>
        <Routes>
          <Route path="/accept-invite" element={<AcceptInvite />} />
          <Route path="/admin" element={<p>Admin dashboard reached</p>} />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'password' } })
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'password' } })
    fireEvent.submit(screen.getByLabelText('Confirm password').closest('form'))

    expect(await screen.findByText('Admin dashboard reached')).toBeInTheDocument()
    expect(mocks.supabase.auth.updateUser).toHaveBeenCalledWith({ password: 'password' })
    expect(mocks.supabase.rpc).toHaveBeenCalledWith('accept_staff_invite', {
      p_full_name: 'Bea Benessa Galleto',
    })
    expect(refreshProfile).toHaveBeenCalled()
  })

  it('rejects staff invitation passwords shorter than 8 characters', async () => {
    mocks.useAuth.mockReturnValue({
      session: { user: { id: 'staff-1' } },
      profile: { role: 'counselor', status: 'invited', full_name: 'Bea Benessa Galleto' },
      loading: false,
      refreshProfile: vi.fn(),
    })

    render(
      <MemoryRouter initialEntries={['/accept-invite']}>
        <Routes><Route path="/accept-invite" element={<AcceptInvite />} /></Routes>
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'short7!' } })
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'short7!' } })
    fireEvent.submit(screen.getByLabelText('Confirm password').closest('form'))

    expect(await screen.findByRole('alert')).toHaveTextContent('Use a password with at least 8 characters.')
    expect(mocks.supabase.auth.updateUser).not.toHaveBeenCalled()
  })
})

describe('role guards', () => {
  it('blocks students from /staff/* and redirects them to the student home', async () => {
    renderProtectedRoute('/staff', ['counselor', 'admin'], { role: 'student', status: 'active' })
    expect(await screen.findByText('Student home content')).toBeInTheDocument()
    expect(screen.queryByText('Staff hub content')).not.toBeInTheDocument()
  })

  it('allows counselors into the shared admin tools', async () => {
    renderProtectedRoute('/staff/manage', ['counselor', 'admin'], { role: 'counselor', status: 'active' })
    expect(await screen.findByText('Manage staff content')).toBeInTheDocument()
  })
})

describe('student signup', () => {
  it('never submits a role or status field', async () => {
    mocks.supabase.auth.signUp.mockResolvedValue({
      data: { session: null },
      error: null,
    })
    render(<MemoryRouter><Register /></MemoryRouter>)

    fireEvent.change(screen.getByPlaceholderText('John Doe'), { target: { value: 'Student Name' } })
    fireEvent.change(screen.getByPlaceholderText('202301684'), { target: { value: 'S-100' } })
    fireEvent.change(screen.getByPlaceholderText('you@university.edu'), { target: { value: 'student@example.edu' } })
    fireEvent.change(screen.getAllByPlaceholderText('••••••••')[0], { target: { value: 'StrongPassword123!' } })

    const department = ACADEMIC_DEPARTMENTS.find(item => item.programs.length > 0)
    const selects = screen.getAllByRole('combobox')
    fireEvent.change(selects[0], { target: { value: department.name } })
    fireEvent.change(await waitFor(() => screen.getAllByRole('combobox')[1]), {
      target: { value: department.programs[0] },
    })
    fireEvent.click(screen.getByRole('button', { name: '1st' }))
    fireEvent.click(screen.getByRole('button', { name: /get started/i }))

    await waitFor(() => expect(mocks.supabase.auth.signUp).toHaveBeenCalled())
    const signupPayload = mocks.supabase.auth.signUp.mock.calls[0][0]
    expect(signupPayload.options.data).not.toHaveProperty('role')
    expect(signupPayload.options.data).not.toHaveProperty('status')
  })
})

describe('password recovery request', () => {
  it('shows the same neutral response when Supabase rejects the request', async () => {
    mocks.supabase.auth.resetPasswordForEmail.mockRejectedValue(new Error('user not found'))
    render(<MemoryRouter><ForgotPassword /></MemoryRouter>)

    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'unknown@example.edu' } })
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }))

    expect(await screen.findByRole('status')).toHaveTextContent(
      'If an account exists, a reset link has been sent.',
    )
    expect(screen.queryByText('user not found')).not.toBeInTheDocument()
  })
})
