import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { AuthProvider, useAuth } from './auth'

const mockAuth = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
}))
vi.mock('./supabaseClient', () => ({ supabase: { auth: mockAuth } }))

function Probe() {
  const { user, loading } = useAuth()
  return <div>{loading ? 'loading' : user ? `signed-in:${user.id}` : 'signed-out'}</div>
}

beforeEach(() => { vi.clearAllMocks() })

describe('AuthProvider/useAuth', () => {
  it('starts loading, then reflects a null session as signed-out', async () => {
    mockAuth.getSession.mockResolvedValue({ data: { session: null } })
    render(<AuthProvider><Probe /></AuthProvider>)
    expect(screen.getByText('loading')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('signed-out')).toBeInTheDocument())
  })

  it('reflects an existing session as signed-in with the session user', async () => {
    mockAuth.getSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } })
    render(<AuthProvider><Probe /></AuthProvider>)
    await waitFor(() => expect(screen.getByText('signed-in:u1')).toBeInTheDocument())
  })

  it('updates when onAuthStateChange fires', async () => {
    mockAuth.getSession.mockResolvedValue({ data: { session: null } })
    let callback
    mockAuth.onAuthStateChange.mockImplementation((cb) => {
      callback = cb
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    })
    render(<AuthProvider><Probe /></AuthProvider>)
    await waitFor(() => expect(screen.getByText('signed-out')).toBeInTheDocument())
    act(() => callback('SIGNED_IN', { user: { id: 'u2' } }))
    expect(screen.getByText('signed-in:u2')).toBeInTheDocument()
  })

  it('throws when useAuth is called outside an AuthProvider', () => {
    const Bare = () => { useAuth(); return null }
    expect(() => render(<Bare />)).toThrow(/useAuth must be used within an AuthProvider/)
  })
})
