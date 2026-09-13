import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const mockUseAuth = vi.fn()
vi.mock('../lib/auth', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useAuth: () => mockUseAuth() }
})
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useNavigate: () => mockNavigate }
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

  it('navigates to the landing page after signing out', async () => {
    const signOut = vi.fn().mockResolvedValue(undefined)
    mockUseAuth.mockReturnValue({ user: { id: 'u1' }, signOut })
    mockNavigate.mockClear()
    render(
      <MemoryRouter initialEntries={['/diary']}>
        <NotebookFrame leftPage={<div />} rightPage={<div />} />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('button', { name: /sign out/i }))
    await waitFor(() => expect(signOut).toHaveBeenCalled())
    expect(mockNavigate).toHaveBeenCalledWith('/')
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
