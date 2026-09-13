import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

const mockUseAuth = vi.fn()
vi.mock('../lib/auth', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useAuth: () => mockUseAuth() }
})
import { MemoryRouter } from 'react-router-dom'
import NotebookFrame from './NotebookFrame'

describe('NotebookFrame book tabs', () => {
  it('shows a Sign out button below the tabs when signed in', () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' }, signOut: vi.fn() })
    render(
      <MemoryRouter>
        <NotebookFrame leftPage={<div />} rightPage={<div />} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
  })

  it('hides the Sign out button when signed out', () => {
    mockUseAuth.mockReturnValue({ user: null, signOut: vi.fn() })
    render(
      <MemoryRouter>
        <NotebookFrame leftPage={<div />} rightPage={<div />} />
      </MemoryRouter>,
    )
    expect(screen.queryByRole('button', { name: /sign out/i })).not.toBeInTheDocument()
  })
})
