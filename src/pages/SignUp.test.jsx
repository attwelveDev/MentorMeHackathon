import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useNavigate: () => mockNavigate }
})
const mockSignUp = vi.fn()
vi.mock('../lib/auth', () => ({ useAuth: () => ({ signUp: mockSignUp }) }))
import SignUp from './SignUp'

beforeEach(() => {
  mockNavigate.mockClear()
  mockSignUp.mockClear()
})

describe('SignUp', () => {
  it('navigates to / when signUp returns an active session', async () => {
    mockSignUp.mockResolvedValue({ data: { session: { user: { id: 'u1' } } }, error: null })
    render(<SignUp />)
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'secret123' } })
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }))
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'))
  })

  it('shows a confirm-your-email message and does not navigate when no session is returned', async () => {
    mockSignUp.mockResolvedValue({ data: { session: null }, error: null })
    render(<SignUp />)
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'secret123' } })
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }))
    await waitFor(() => expect(screen.getByText(/check your email/i)).toBeInTheDocument())
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('shows the error message and does not navigate when signUp fails', async () => {
    mockSignUp.mockResolvedValue({ data: { session: null }, error: { message: 'User already registered' } })
    render(<SignUp />)
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'secret123' } })
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }))
    await waitFor(() => expect(screen.getByText(/user already registered/i)).toBeInTheDocument())
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
