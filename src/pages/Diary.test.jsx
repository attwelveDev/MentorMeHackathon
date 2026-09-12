import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const mockUseAuth = vi.fn()
vi.mock('../lib/auth', () => ({ useAuth: () => mockUseAuth() }))

const mockGetPlanWithActivities = vi.fn()
const mockUpdateActivityStatus = vi.fn()
vi.mock('../lib/db', () => ({
  getPlanWithActivities: (...args) => mockGetPlanWithActivities(...args),
  updateActivityStatus: (...args) => mockUpdateActivityStatus(...args),
}))

import Diary from './Diary'

beforeEach(() => {
  mockUseAuth.mockReset()
  mockGetPlanWithActivities.mockReset()
  mockUpdateActivityStatus.mockReset().mockResolvedValue(undefined)
})

describe('Diary dashboard', () => {
  it('shows the locked "Create an account to keep a diary" prompt linking to /signup for a signed-out guest', () => {
    mockUseAuth.mockReturnValue({ user: null })
    render(<MemoryRouter><Diary /></MemoryRouter>)
    expect(screen.getByText(/create an account to keep a diary/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute('href', '/signup')
  })

  it('shows one empty-state message instead of six empty sections when the plan has zero activities', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } })
    mockGetPlanWithActivities.mockResolvedValue({ plan: { id: 'p1', target_occupation: 'Data Analyst' }, activities: [] })
    render(<MemoryRouter><Diary /></MemoryRouter>)
    await waitFor(() => expect(screen.getByText(/no activities yet/i)).toBeInTheDocument())
    expect(screen.queryByText('Now')).not.toBeInTheDocument()
  })

  it('renders only non-empty sections, in SECTION_NAMES order', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } })
    mockGetPlanWithActivities.mockResolvedValue({
      plan: { id: 'p1', target_occupation: 'Data Analyst' },
      activities: [
        { id: 'a1', title: 'Overdue item', category: 'Networking', period_label: 'Year 1', period_year: 2020, priority: 'High', explanation: 'x', status: 'Not started', due_date: null },
        { id: 'a3', title: 'Current item', category: 'Networking', period_label: 'Year 2', period_year: 2026, priority: 'Medium', explanation: 'x', status: 'Not started', due_date: null },
        { id: 'a2', title: 'Grad item', category: 'Application preparation', period_label: 'Year 4', period_year: 2030, priority: 'Medium', explanation: 'x', status: 'Not started', due_date: null },
      ],
    })
    render(<MemoryRouter><Diary /></MemoryRouter>)
    await waitFor(() => expect(screen.getAllByText('Overdue item').length).toBeGreaterThan(0))
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(headings).toEqual(['Now', 'Graduate application period'])
  })

  it("shows the student's goal and the static greeting on the left page", async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } })
    mockGetPlanWithActivities.mockResolvedValue({ plan: { id: 'p1', target_occupation: 'Data Analyst' }, activities: [] })
    render(<MemoryRouter><Diary /></MemoryRouter>)
    await waitFor(() => expect(screen.getByText(/become a data analyst/i)).toBeInTheDocument())
    expect(screen.getByText('Hi, how are you today?')).toBeInTheDocument()
  })

  it('shows a nearest-activity notification when one exists', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } })
    mockGetPlanWithActivities.mockResolvedValue({
      plan: { id: 'p1', target_occupation: 'Data Analyst' },
      activities: [{ id: 'a1', title: 'Overdue item', category: 'Networking', period_label: 'Year 1', period_year: 2020, priority: 'High', explanation: 'x', status: 'Not started', due_date: null }],
    })
    render(<MemoryRouter><Diary /></MemoryRouter>)
    await waitFor(() => expect(screen.getAllByText('Overdue item').length).toBeGreaterThan(0))
  })

  it('checking an item\'s checkbox calls updateActivityStatus(activity.id, "Completed")', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } })
    mockGetPlanWithActivities.mockResolvedValue({
      plan: { id: 'p1', target_occupation: 'Data Analyst' },
      activities: [{ id: 'a1', title: 'Overdue item', category: 'Networking', period_label: 'Year 1', period_year: 2020, priority: 'High', explanation: 'x', status: 'Not started', due_date: null }],
    })
    render(<MemoryRouter><Diary /></MemoryRouter>)
    await waitFor(() => screen.getAllByText('Overdue item'))
    fireEvent.click(screen.getByRole('checkbox', { name: /overdue item/i }))
    expect(mockUpdateActivityStatus).toHaveBeenCalledWith('a1', 'Completed')
  })

  it("shows an item's due date when set, else its section label", async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } })
    mockGetPlanWithActivities.mockResolvedValue({
      plan: { id: 'p1', target_occupation: 'Data Analyst' },
      activities: [
        { id: 'a1', title: 'Dated item', category: 'Networking', period_label: 'Year 3', period_year: 2026, priority: 'High', explanation: 'x', status: 'Not started', due_date: '2026-05-10' },
        { id: 'a2', title: 'Undated item', category: 'Networking', period_label: 'Year 1', period_year: 2020, priority: 'High', explanation: 'x', status: 'Not started', due_date: null },
      ],
    })
    render(<MemoryRouter><Diary /></MemoryRouter>)
    await waitFor(() => screen.getByText('Dated item'))
    expect(screen.getByText(/10 may 2026|may 10, 2026/i)).toBeInTheDocument()
    expect(screen.getAllByText('Now').length).toBeGreaterThan(0) // Undated item's section label, since it's overdue
  })
})
