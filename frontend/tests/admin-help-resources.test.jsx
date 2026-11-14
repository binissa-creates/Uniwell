import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../src/components/Navbar.jsx', () => ({ default: () => null }))

import AdminHelpResources from '../src/pages/AdminHelpResources.jsx'

afterEach(() => cleanup())

describe('admin help and resources', () => {
  it('shows practical guidance instead of the planned-feature placeholder', () => {
    render(
      <MemoryRouter>
        <AdminHelpResources />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Help & Resources' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Read wellness patterns responsibly' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Respect privacy boundaries' })).toBeInTheDocument()
    expect(screen.queryByText('Planned Feature')).not.toBeInTheDocument()
  })

  it('opens the approved campus and crisis contacts from the urgent-support section', () => {
    render(
      <MemoryRouter>
        <AdminHelpResources />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'View campus & crisis contacts' }))

    expect(screen.getByRole('dialog', { name: 'Campus Support and Emergency Helplines' })).toBeInTheDocument()
    expect(screen.getByText('Tawag Paglaum – Centro Bisaya')).toBeInTheDocument()
  })
})
