import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  invoke: vi.fn(),
  useAuth: vi.fn(),
}))

vi.mock('../src/lib/supabase.js', () => ({
  supabase: {
    from: mocks.from,
    functions: { invoke: mocks.invoke },
  },
}))
vi.mock('../src/context/AuthContext.jsx', () => ({ useAuth: mocks.useAuth }))
vi.mock('../src/components/Navbar.jsx', () => ({ default: () => null }))

import ManageStaff from '../src/pages/ManageStaff.jsx'

const staffAccounts = [
  {
    id: 'admin-1',
    full_name: 'Guidance Admin',
    email: 'admin@example.edu',
    role: 'admin',
    status: 'active',
  },
  {
    id: 'counselor-1',
    full_name: 'Alex Counselor',
    email: 'alex@example.edu',
    role: 'counselor',
    status: 'active',
  },
]

function configureStaffQuery() {
  const query = {
    select: vi.fn(() => query),
    in: vi.fn(() => query),
    order: vi.fn().mockResolvedValue({ data: staffAccounts, error: null }),
  }
  mocks.from.mockReturnValue(query)
}

function renderPage() {
  configureStaffQuery()
  mocks.useAuth.mockReturnValue({ user: { id: 'admin-1' } })
  return render(<ManageStaff />)
}

function fillInviteForm() {
  fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Casey Counselor' } })
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'casey@example.edu' } })
  fireEvent.click(screen.getByRole('button', { name: 'Send Invite' }))
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.invoke.mockResolvedValue({ data: { ok: true }, error: null })
})

afterEach(() => cleanup())

describe('staff action confirmations', () => {
  it('requires confirmation before sending a staff invitation', async () => {
    renderPage()
    fillInviteForm()

    expect(await screen.findByRole('alertdialog')).toHaveTextContent(
      'Are you sure you want to invite Casey Counselor (casey@example.edu) as a counselor?',
    )
    expect(mocks.invoke).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(mocks.invoke).not.toHaveBeenCalled()

    fillInviteForm()
    fireEvent.click(await screen.findByRole('button', { name: 'Send invitation' }))
    await waitFor(() => expect(mocks.invoke).toHaveBeenCalledWith('invite-staff', expect.any(Object)))
  })

  it('requires confirmation before deactivating staff and prevents self-deactivation', async () => {
    renderPage()
    const adminRow = screen.getByRole('row', { name: /Guidance Admin/ })
    expect(within(adminRow).queryByRole('button', { name: 'Deactivate' })).not.toBeInTheDocument()

    fireEvent.click(await screen.findByRole('button', { name: 'Deactivate' }))
    expect(screen.getByRole('alertdialog')).toHaveTextContent(
      'Are you sure you want to deactivate the staff account for Alex Counselor?',
    )
    expect(mocks.invoke).not.toHaveBeenCalled()

    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Deactivate' }))
    await waitFor(() => expect(mocks.invoke).toHaveBeenCalledWith('set-staff-status', {
      body: { targetId: 'counselor-1', action: 'deactivate' },
    }))
  })

  it('explains likely Edge Function deployment or origin configuration issues', async () => {
    mocks.invoke.mockResolvedValue({
      data: null,
      error: { name: 'FunctionsFetchError', message: 'Failed to send a request to the Edge Function' },
    })
    renderPage()
    fillInviteForm()
    fireEvent.click(await screen.findByRole('button', { name: 'Send invitation' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Confirm it is deployed and that SITE_URL or ALLOWED_ORIGINS includes',
    )
    expect(screen.getByRole('alert')).toHaveTextContent(window.location.origin)
  })
})
