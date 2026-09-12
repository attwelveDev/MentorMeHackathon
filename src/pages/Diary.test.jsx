import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const mockUseAuth = vi.fn()
vi.mock('../lib/auth', () => ({ useAuth: () => mockUseAuth() }))

const mockGetDiaryEntries = vi.fn()
vi.mock('../lib/db', () => ({ getDiaryEntries: (...args) => mockGetDiaryEntries(...args) }))

import Diary from './Diary'

beforeEach(() => {
  mockUseAuth.mockReset()
  mockGetDiaryEntries.mockReset().mockResolvedValue([])
})

describe('Diary screen', () => {
  it('shows a locked "Create an account to keep a diary" prompt linking to /signup for a signed-out guest', () => {
    mockUseAuth.mockReturnValue({ user: null })
    render(<MemoryRouter><Diary /></MemoryRouter>)
    expect(screen.getByText(/create an account to keep a diary/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute('href', '/signup')
  })

  it("renders each entry's activity title, entry text, and timestamp, most recent first, for a signed-in user", async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } })
    mockGetDiaryEntries.mockResolvedValue([
      { id: 'd2', entry_text: 'Second entry', created_at: '2026-09-10T00:00:00Z', activity: { title: 'Apply for internships' } },
      { id: 'd1', entry_text: 'First entry', created_at: '2026-09-01T00:00:00Z', activity: { title: 'Build a portfolio' } },
    ])
    render(<MemoryRouter><Diary /></MemoryRouter>)
    await waitFor(() => expect(screen.getByText('Second entry')).toBeInTheDocument())
    const entries = screen.getAllByRole('article')
    expect(entries[0]).toHaveTextContent('Apply for internships')
    expect(entries[1]).toHaveTextContent('Build a portfolio')
  })

  it('renders ai_feedback under an entry when present', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } })
    mockGetDiaryEntries.mockResolvedValue([
      { id: 'd1', entry_text: 'Entry', created_at: '2026-09-01T00:00:00Z', ai_feedback: 'Nice work!', activity: { title: 'x' } },
    ])
    render(<MemoryRouter><Diary /></MemoryRouter>)
    await waitFor(() => expect(screen.getByText('Nice work!')).toBeInTheDocument())
  })
})
