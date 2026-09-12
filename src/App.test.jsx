import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

const mockUseAuth = vi.fn()
vi.mock('./lib/auth', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useAuth: () => mockUseAuth() }
})
import { MemoryRouter } from 'react-router-dom'
import App from './App'

describe('App nav auth switch', () => {
  it('shows Sign up and Log in links when signed out', () => {
    mockUseAuth.mockReturnValue({ user: null, signOut: vi.fn() })
    render(<MemoryRouter><App /></MemoryRouter>)
    expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /log in/i })).toBeInTheDocument()
  })

  it('shows a Sign out action when signed in', () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' }, signOut: vi.fn() })
    render(<MemoryRouter><App /></MemoryRouter>)
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
  })
})
