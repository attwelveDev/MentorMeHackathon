import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const mockUseAuth = vi.fn()
vi.mock('../lib/auth', () => ({ useAuth: () => mockUseAuth() }))

import MarketUpdates from './MarketUpdates'

beforeEach(() => {
  mockUseAuth.mockReset()
})

describe('MarketUpdates gating', () => {
  it('shows a locked prompt linking to /signup for a signed-out guest, and not the empty-state copy', () => {
    mockUseAuth.mockReturnValue({ user: null })
    render(<MemoryRouter><MarketUpdates /></MemoryRouter>)
    expect(screen.getByText(/create an account to view job market/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute('href', '/signup')
    expect(screen.queryByText(/no sufficiently relevant recent updates/i)).not.toBeInTheDocument()
  })

  it('renders the existing empty-state content unchanged for a signed-in user', () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } })
    render(<MemoryRouter><MarketUpdates /></MemoryRouter>)
    expect(screen.getByText(/no sufficiently relevant recent updates/i)).toBeInTheDocument()
  })
})
