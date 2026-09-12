import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const mockUseAuth = vi.fn()
vi.mock('../lib/auth', () => ({ useAuth: () => mockUseAuth() }))

const mockGetPlanWithActivities = vi.fn()
const mockUpdateActivityStatus = vi.fn()
const mockUpdateActivity = vi.fn()
const mockDeleteActivity = vi.fn()
const mockCreateActivity = vi.fn()
const mockGetDiaryEntriesForActivity = vi.fn()
const mockCreateDiaryEntry = vi.fn()
const mockSetDiaryEntryFeedback = vi.fn()
vi.mock('../lib/db', () => ({
  getPlanWithActivities: (...args) => mockGetPlanWithActivities(...args),
  updateActivityStatus: (...args) => mockUpdateActivityStatus(...args),
  updateActivity: (...args) => mockUpdateActivity(...args),
  deleteActivity: (...args) => mockDeleteActivity(...args),
  createActivity: (...args) => mockCreateActivity(...args),
  getDiaryEntriesForActivity: (...args) => mockGetDiaryEntriesForActivity(...args),
  createDiaryEntry: (...args) => mockCreateDiaryEntry(...args),
  setDiaryEntryFeedback: (...args) => mockSetDiaryEntryFeedback(...args),
}))

const mockGetDiaryFeedback = vi.fn()
vi.mock('../lib/ai', () => ({ getDiaryFeedback: (...args) => mockGetDiaryFeedback(...args) }))

import Diary from './Diary'

beforeEach(() => {
  mockUseAuth.mockReset()
  mockGetPlanWithActivities.mockReset()
  mockUpdateActivityStatus.mockReset().mockResolvedValue(undefined)
  mockUpdateActivity.mockReset().mockResolvedValue(undefined)
  mockDeleteActivity.mockReset().mockResolvedValue(undefined)
  mockCreateActivity.mockReset()
  mockGetDiaryEntriesForActivity.mockReset().mockResolvedValue([])
  mockCreateDiaryEntry.mockReset()
  mockSetDiaryEntryFeedback.mockReset().mockResolvedValue(undefined)
  mockGetDiaryFeedback.mockReset()
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

  it('submitting the Edit form calls updateActivity(activity.id, fields) and the card reflects the change', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } })
    mockGetPlanWithActivities.mockResolvedValue({
      plan: { id: 'p1', target_occupation: 'Data Analyst' },
      activities: [{ id: 'a1', title: 'Overdue item', category: 'Networking', period_label: 'Year 1', period_year: 2020, priority: 'High', explanation: 'x', status: 'Not started', due_date: null }],
    })
    render(<MemoryRouter><Diary /></MemoryRouter>)
    await waitFor(() => screen.getAllByText('Overdue item'))
    fireEvent.click(screen.getByRole('button', { name: /^edit$/i }))
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'New title' } })
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }))
    expect(mockUpdateActivity).toHaveBeenCalledWith('a1', expect.objectContaining({ title: 'New title' }))
    await waitFor(() => expect(screen.getAllByText('New title').length).toBeGreaterThan(0))
  })

  it('clicking Remove then confirming calls deleteActivity(activity.id) and the card disappears', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } })
    mockGetPlanWithActivities.mockResolvedValue({
      plan: { id: 'p1', target_occupation: 'Data Analyst' },
      activities: [{ id: 'a1', title: 'Overdue item', category: 'Networking', period_label: 'Year 1', period_year: 2020, priority: 'High', explanation: 'x', status: 'Not started', due_date: null }],
    })
    render(<MemoryRouter><Diary /></MemoryRouter>)
    await waitFor(() => screen.getAllByText('Overdue item'))
    fireEvent.click(screen.getByRole('button', { name: /^remove$/i }))
    fireEvent.click(screen.getByRole('button', { name: /^yes$/i }))
    await waitFor(() => expect(mockDeleteActivity).toHaveBeenCalledWith('a1'))
    expect(screen.queryByText('Overdue item')).not.toBeInTheDocument()
  })

  it('clicking Remove without confirming does not call deleteActivity', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } })
    mockGetPlanWithActivities.mockResolvedValue({
      plan: { id: 'p1', target_occupation: 'Data Analyst' },
      activities: [{ id: 'a1', title: 'Overdue item', category: 'Networking', period_label: 'Year 1', period_year: 2020, priority: 'High', explanation: 'x', status: 'Not started', due_date: null }],
    })
    render(<MemoryRouter><Diary /></MemoryRouter>)
    await waitFor(() => screen.getAllByText('Overdue item'))
    fireEvent.click(screen.getByRole('button', { name: /^remove$/i }))
    expect(mockDeleteActivity).not.toHaveBeenCalled()
    expect(screen.getAllByText('Overdue item').length).toBeGreaterThan(0)
  })

  it('submitting "Add a new item" calls createActivity(plan.id, user.id, fields) with the chosen section as period, and the new item appears under that section', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } })
    mockGetPlanWithActivities.mockResolvedValue({ plan: { id: 'p1', target_occupation: 'Data Analyst' }, activities: [] })
    mockCreateActivity.mockResolvedValue({
      id: 'a9', title: 'Talk to a mentor', category: 'Networking', period_label: 'Next break',
      period_year: null, priority: 'Medium', explanation: '', status: 'Not started', due_date: null,
    })
    render(<MemoryRouter><Diary /></MemoryRouter>)
    await waitFor(() => expect(screen.getByText(/no activities yet/i)).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /add a new item/i }))
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Talk to a mentor' } })
    fireEvent.change(screen.getByLabelText(/category/i), { target: { value: 'Networking' } })
    fireEvent.change(screen.getByLabelText(/priority/i), { target: { value: 'Medium' } })
    fireEvent.change(screen.getByLabelText(/section/i), { target: { value: 'Next break' } })
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }))
    expect(mockCreateActivity).toHaveBeenCalledWith('p1', 'u1', expect.objectContaining({ title: 'Talk to a mentor', period: 'Next break' }))
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Next break' })).toBeInTheDocument())
    expect(screen.getByText('Talk to a mentor')).toBeInTheDocument()
  })

  it("expanding an item's Reflection section shows its category-specific prompt and loads its diary entries", async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } })
    mockGetPlanWithActivities.mockResolvedValue({
      plan: { id: 'p1', target_occupation: 'Data Analyst' },
      activities: [{ id: 'a1', title: 'Overdue item', category: 'Networking', period_label: 'Year 1', period_year: 2020, priority: 'High', explanation: 'x', status: 'Not started', due_date: null }],
    })
    render(<MemoryRouter><Diary /></MemoryRouter>)
    await waitFor(() => screen.getAllByText('Overdue item'))
    fireEvent.click(screen.getByRole('button', { name: /reflection/i }))
    await waitFor(() => expect(mockGetDiaryEntriesForActivity).toHaveBeenCalledWith('a1'))
    expect(screen.getByText('Who did you meet? What insights did you gain?')).toBeInTheDocument()
  })

  it('submitting a reflection entry calls createDiaryEntry(activity.id, user.id, text) and the entry appears', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } })
    mockGetPlanWithActivities.mockResolvedValue({
      plan: { id: 'p1', target_occupation: 'Data Analyst' },
      activities: [{ id: 'a1', title: 'Overdue item', category: 'Networking', period_label: 'Year 1', period_year: 2020, priority: 'High', explanation: 'x', status: 'Not started', due_date: null }],
    })
    mockCreateDiaryEntry.mockResolvedValue({ id: 'd1', entry_text: 'Met a mentor today.', created_at: '2026-09-01T00:00:00Z' })
    render(<MemoryRouter><Diary /></MemoryRouter>)
    await waitFor(() => screen.getAllByText('Overdue item'))
    fireEvent.click(screen.getByRole('button', { name: /reflection/i }))
    await waitFor(() => expect(mockGetDiaryEntriesForActivity).toHaveBeenCalledWith('a1'))
    fireEvent.change(screen.getByRole('textbox', { name: /diary entry/i }), { target: { value: 'Met a mentor today.' } })
    fireEvent.click(screen.getByRole('button', { name: /add entry/i }))
    expect(mockCreateDiaryEntry).toHaveBeenCalledWith('a1', 'u1', 'Met a mentor today.')
    await waitFor(() => expect(screen.getByText('Met a mentor today.')).toBeInTheDocument())
  })

  it('a "View roadmap" link navigates to /plan', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } })
    mockGetPlanWithActivities.mockResolvedValue({ plan: { id: 'p1', target_occupation: 'Data Analyst' }, activities: [] })
    render(<MemoryRouter><Diary /></MemoryRouter>)
    await waitFor(() => expect(screen.getByRole('link', { name: /view roadmap/i })).toHaveAttribute('href', '/plan'))
  })
})
