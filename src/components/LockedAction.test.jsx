import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const mockUseAuth = vi.fn()
vi.mock('../lib/auth', () => ({ useAuth: () => mockUseAuth() }))
import LockedAction from './LockedAction'

describe('LockedAction', () => {
  it('renders an active, clickable button when signed in', () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } })
    const onClick = vi.fn()
    render(<MemoryRouter><LockedAction onClick={onClick}>Accept plan</LockedAction></MemoryRouter>)
    const btn = screen.getByRole('button', { name: /accept plan/i })
    expect(btn).not.toBeDisabled()
    fireEvent.click(btn)
    expect(onClick).toHaveBeenCalled()
  })

  it('renders a locked affordance linking to /signup when signed out, and never calls onClick', () => {
    mockUseAuth.mockReturnValue({ user: null })
    const onClick = vi.fn()
    render(<MemoryRouter><LockedAction onClick={onClick}>Accept plan</LockedAction></MemoryRouter>)
    expect(screen.getByText(/create an account to unlock/i)).toBeInTheDocument()
    const link = screen.getByRole('link', { name: /accept plan/i })
    expect(link).toHaveAttribute('href', '/signup')
    fireEvent.click(link)
    expect(onClick).not.toHaveBeenCalled()
  })
})
