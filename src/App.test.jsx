import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

const mockUseAuth = vi.fn()
vi.mock('./lib/auth', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useAuth: () => mockUseAuth() }
})
import { MemoryRouter } from 'react-router-dom'
import App from './App'

describe('App', () => {
  it('no longer renders the site-wide top nav header', () => {
    mockUseAuth.mockReturnValue({ user: null, signOut: vi.fn() })
    render(<MemoryRouter><App /></MemoryRouter>)
    expect(screen.queryByRole('link', { name: /^careercompass au$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /^updates$/i })).not.toBeInTheDocument()
  })

  it('no longer renders a Dashboard nav link', () => {
    mockUseAuth.mockReturnValue({ user: null, signOut: vi.fn() })
    render(<MemoryRouter><App /></MemoryRouter>)
    expect(screen.queryByRole('link', { name: /^dashboard$/i })).not.toBeInTheDocument()
  })
})
