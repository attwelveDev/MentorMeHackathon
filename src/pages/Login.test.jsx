import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useNavigate: () => mockNavigate }
})
const mockSignIn = vi.fn()
vi.mock('../lib/auth', () => ({ useAuth: () => ({ signIn: mockSignIn }) }))
import Login from './Login'

beforeEach(() => {
  mockNavigate.mockClear()
  mockSignIn.mockClear()
})

describe('Login', () => {
  it('navigates to / on successful sign-in', async () => {
    mockSignIn.mockResolvedValue({ data: { session: { user: { id: 'u1' } } }, error: null })
    render(<MemoryRouter><Login /></MemoryRouter>)
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'secret123' } })
    fireEvent.click(screen.getByRole('button', { name: /log in/i }))
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'))
  })

  it('shows the error and does not navigate on failed sign-in', async () => {
    mockSignIn.mockResolvedValue({ data: { session: null }, error: { message: 'Invalid login credentials' } })
    render(<MemoryRouter><Login /></MemoryRouter>)
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: /log in/i }))
    await waitFor(() => expect(screen.getByText(/invalid login credentials/i)).toBeInTheDocument())
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
