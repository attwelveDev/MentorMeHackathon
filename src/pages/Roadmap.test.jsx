import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within, fireEvent, waitFor, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { periodYearFor } from '../lib/roadmap'

const mockUseAuth = vi.fn()
vi.mock('../lib/auth', () => ({ useAuth: () => mockUseAuth() }))

const mockUseLocation = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useLocation: () => mockUseLocation() }
})

vi.mock('../lib/ai', () => ({ generateCareerPlan: vi.fn(), getDiaryFeedback: vi.fn() }))
vi.mock('../lib/db', () => ({
  getPlanWithActivities: vi.fn(),
  createPlanWithActivities: vi.fn(),
  updateActivityStatus: vi.fn(),
  setPlanAccepted: vi.fn(),
  deleteActivity: vi.fn(),
  getDiaryEntriesForActivity: vi.fn(),
  getDiaryEntries: vi.fn(),
  createDiaryEntry: vi.fn(),
  setDiaryEntryFeedback: vi.fn(),
}))
vi.mock('../lib/localPlan', () => ({ saveGuestPlan: vi.fn(), loadGuestPlan: vi.fn() }))

import { generateCareerPlan, getDiaryFeedback } from '../lib/ai'
import {
  getPlanWithActivities, createPlanWithActivities, updateActivityStatus, setPlanAccepted, deleteActivity,
  getDiaryEntriesForActivity, getDiaryEntries, createDiaryEntry, setDiaryEntryFeedback,
} from '../lib/db'
import { saveGuestPlan, loadGuestPlan } from '../lib/localPlan'
import { clearCache } from '../lib/pageCache'
import Roadmap from './Roadmap'

const studentProfile = { studyStage: 'midway', graduationYear: '2027', courseLengthYears: '4', targetOccupation: 'Data Analyst' }

const rawActivities = [
  { title: 'Choose a relevant degree/course', period: 'Year 1', status: 'Completed', category: 'Application preparation', priority: 'High', explanation: 'Foundational.' },
  { title: 'Join a club or student society', period: 'Year 1', status: 'Completed', category: 'Networking', priority: 'Medium', explanation: 'Build network.' },
  { title: 'Take relevant subjects', period: 'Year 2', status: 'Completed', category: 'Technical skills', priority: 'High', explanation: 'Core skills.' },
  { title: 'Apply for a part-time role', period: 'Year 2', status: 'Not started', category: 'Work experience', priority: 'Medium', explanation: 'Get experience.' },
  { title: 'Apply for internships', period: 'Year 3', status: 'Not started', category: 'Work experience', priority: 'High', explanation: 'Real-world exposure.' },
  { title: 'Obtain a relevant certification', period: 'Year 3', status: 'Not started', category: 'Certifications', priority: 'Medium', explanation: 'Boost credibility.' },
  { title: 'Polish my resume and LinkedIn', period: 'Year 4', status: 'Not started', category: 'Application preparation', priority: 'Medium', explanation: 'Ready to apply.' },
]

function renderRoadmap() {
  return render(
    <MemoryRouter>
      <Roadmap />
    </MemoryRouter>
  )
}

beforeEach(() => {
  clearCache()
  mockUseAuth.mockReset()
  mockUseLocation.mockReset()
  generateCareerPlan.mockReset()
  getPlanWithActivities.mockReset()
  createPlanWithActivities.mockReset()
  updateActivityStatus.mockReset().mockResolvedValue(undefined)
  setPlanAccepted.mockReset().mockResolvedValue(undefined)
  deleteActivity.mockReset().mockResolvedValue(undefined)
  saveGuestPlan.mockReset().mockReturnValue({ ok: true })
  loadGuestPlan.mockReset().mockReturnValue(null)
  getDiaryEntriesForActivity.mockReset().mockResolvedValue([])
  getDiaryEntries.mockReset().mockResolvedValue([])
  createDiaryEntry.mockReset()
  setDiaryEntryFeedback.mockReset().mockResolvedValue(undefined)
  getDiaryFeedback.mockReset()
})

describe('Roadmap — guest, fresh generation', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ user: null })
    mockUseLocation.mockReturnValue({ state: { profile: studentProfile } })
  })

  it('shows the loading state, then renders roadmap periods grouped by Year label', async () => {
    generateCareerPlan.mockResolvedValue(JSON.stringify(rawActivities))
    renderRoadmap()
    expect(screen.getByText(/building your plan/i)).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Year 1' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Year 3' })).toBeInTheDocument()
  })

  it('shows the existing error-banner copy and does not render a roadmap when generation fails', async () => {
    generateCareerPlan.mockRejectedValue(new Error('boom'))
    renderRoadmap()
    expect(await screen.findByText('We could not generate your plan. Please try again.')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Year 1' })).not.toBeInTheDocument()
  })

  it('renders exactly one "you are here" pin, at the checkpoint computeRoadmap marks isPinned', async () => {
    generateCareerPlan.mockResolvedValue(JSON.stringify(rawActivities))
    renderRoadmap()
    await screen.findByRole('heading', { name: 'Year 1' })
    const pins = screen.getAllByText(/you are here/i)
    expect(pins).toHaveLength(1)
    const checkpoint = screen.getByTestId('checkpoint-Apply for internships')
    expect(within(checkpoint).getByText(/you are here/i)).toBeInTheDocument()
  })

  it('renders the goal card with the text "Become a {targetOccupation}" at the end', async () => {
    generateCareerPlan.mockResolvedValue(JSON.stringify(rawActivities))
    renderRoadmap()
    expect(await screen.findByText('Become a Data Analyst')).toBeInTheDocument()
  })

  it('renders the stats strip with counts matching computeStats for the loaded activities', async () => {
    generateCareerPlan.mockResolvedValue(JSON.stringify(rawActivities))
    renderRoadmap()
    await screen.findByRole('heading', { name: 'Year 1' })
    // completed: 3, inProgress: 0, upcoming: 2, overdue: 1 for this fixture at currentYear 2026
    // ("Apply for a part-time role", Year 2/2025, is the only entry before the pin that isn't completed)
    expect(screen.getByText(/^Completed \(\d+%\)$/).previousSibling).toHaveTextContent('3')
    expect(screen.getByText(/^In progress \(\d+%\)$/).previousSibling).toHaveTextContent('0')
    expect(screen.getByText(/^Upcoming \(\d+%\)$/).previousSibling).toHaveTextContent('2')
    expect(screen.getByText(/^Overdue \(\d+%\)$/).previousSibling).toHaveTextContent('1')
  })

  it('shows "No diary entries yet" in the stats strip', async () => {
    generateCareerPlan.mockResolvedValue(JSON.stringify(rawActivities))
    renderRoadmap()
    expect(await screen.findByText('No diary entries yet')).toBeInTheDocument()
  })

  it('renders a left-nav tab list with Diary, News, Jobs, and Profile entries', async () => {
    generateCareerPlan.mockResolvedValue(JSON.stringify(rawActivities))
    renderRoadmap()
    await screen.findByRole('heading', { name: 'Year 1' })
    expect(screen.getByRole('link', { name: /diary/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /news/i })).toBeInTheDocument()
    expect(screen.getByText('Jobs')).toHaveAttribute('title', 'Coming soon')
    expect(screen.getByRole('link', { name: /profile/i })).toBeInTheDocument()
  })

  it('renders Diary as a link to /diary and News as a link to /updates', async () => {
    generateCareerPlan.mockResolvedValue(JSON.stringify(rawActivities))
    renderRoadmap()
    await screen.findByRole('heading', { name: 'Year 1' })
    expect(screen.getByRole('link', { name: /diary/i })).toHaveAttribute('href', '/diary')
    expect(screen.getByRole('link', { name: /news/i })).toHaveAttribute('href', '/updates')
  })

  it('renders Profile as a link to /profile', async () => {
    generateCareerPlan.mockResolvedValue(JSON.stringify(rawActivities))
    renderRoadmap()
    await screen.findByRole('heading', { name: 'Year 1' })
    expect(screen.getByRole('link', { name: /profile/i })).toHaveAttribute('href', '/profile')
  })

  it('renders Jobs as a non-interactive "Coming soon" label, not a link', async () => {
    generateCareerPlan.mockResolvedValue(JSON.stringify(rawActivities))
    renderRoadmap()
    await screen.findByRole('heading', { name: 'Year 1' })
    expect(screen.queryByRole('link', { name: /jobs/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /jobs/i })).not.toBeInTheDocument()
  })
})

describe('Roadmap — registered user', () => {
  it('for a signed-in user with an existing Supabase plan, loads it via getPlanWithActivities instead of calling generateCareerPlan', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } })
    mockUseLocation.mockReturnValue({ state: undefined })
    const dbActivities = rawActivities.map((a, i) => ({
      id: `a${i}`,
      title: a.title,
      category: a.category,
      period_label: a.period,
      period_year: periodYearFor(a.period, studentProfile),
      priority: a.priority,
      explanation: a.explanation,
      status: a.status,
    }))
    getPlanWithActivities.mockResolvedValue({
      plan: { id: 'p1', target_occupation: 'Data Analyst' },
      activities: dbActivities,
    })
    renderRoadmap()
    expect(await screen.findByRole('heading', { name: 'Year 1' })).toBeInTheDocument()
    expect(getPlanWithActivities).toHaveBeenCalledWith('u1')
    expect(generateCareerPlan).not.toHaveBeenCalled()
  })

  it('for a signed-in user with no existing plan and a router-state profile, calls generateCareerPlan and does not call getPlanWithActivities a second time', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } })
    mockUseLocation.mockReturnValue({ state: { profile: studentProfile } })
    getPlanWithActivities.mockResolvedValue(null)
    generateCareerPlan.mockResolvedValue(JSON.stringify(rawActivities))
    renderRoadmap()
    expect(await screen.findByRole('heading', { name: 'Year 1' })).toBeInTheDocument()
    expect(getPlanWithActivities).toHaveBeenCalledTimes(1)
    expect(generateCareerPlan).toHaveBeenCalledTimes(1)
  })
})

describe('Roadmap — checkpoint panel, Save, Accept', () => {
  it('clicking a checkpoint opens CheckpointPanel showing that activity\'s title', async () => {
    mockUseAuth.mockReturnValue({ user: null })
    mockUseLocation.mockReturnValue({ state: { profile: studentProfile } })
    generateCareerPlan.mockResolvedValue(JSON.stringify(rawActivities))
    renderRoadmap()
    await screen.findByRole('heading', { name: 'Year 1' })
    fireEvent.click(screen.getByTestId('checkpoint-Apply for internships'))
    expect(screen.getByRole('dialog', { name: 'Apply for internships' })).toBeInTheDocument()
  })

  it('opens the checkpoint as a dimmed, full-screen overlay rather than inline in the page flow', async () => {
    mockUseAuth.mockReturnValue({ user: null })
    mockUseLocation.mockReturnValue({ state: { profile: studentProfile } })
    generateCareerPlan.mockResolvedValue(JSON.stringify(rawActivities))
    renderRoadmap()
    await screen.findByRole('heading', { name: 'Year 1' })
    fireEvent.click(screen.getByTestId('checkpoint-Apply for internships'))
    const dialog = screen.getByRole('dialog', { name: 'Apply for internships' })
    const overlay = dialog.closest('.fixed.inset-0')
    expect(overlay).toBeTruthy()
    expect(overlay.className).toMatch(/bg-black/)
  })

  it('clicking the dimmed backdrop closes the panel', async () => {
    mockUseAuth.mockReturnValue({ user: null })
    mockUseLocation.mockReturnValue({ state: { profile: studentProfile } })
    generateCareerPlan.mockResolvedValue(JSON.stringify(rawActivities))
    renderRoadmap()
    await screen.findByRole('heading', { name: 'Year 1' })
    fireEvent.click(screen.getByTestId('checkpoint-Apply for internships'))
    const overlay = screen.getByRole('dialog', { name: 'Apply for internships' }).closest('.fixed.inset-0')
    fireEvent.click(overlay)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('clicking inside the panel itself does not close it', async () => {
    mockUseAuth.mockReturnValue({ user: null })
    mockUseLocation.mockReturnValue({ state: { profile: studentProfile } })
    generateCareerPlan.mockResolvedValue(JSON.stringify(rawActivities))
    renderRoadmap()
    await screen.findByRole('heading', { name: 'Year 1' })
    fireEvent.click(screen.getByTestId('checkpoint-Apply for internships'))
    fireEvent.click(screen.getByRole('dialog', { name: 'Apply for internships' }))
    expect(screen.getByRole('dialog', { name: 'Apply for internships' })).toBeInTheDocument()
  })

  it('closing the panel via its close control hides it', async () => {
    mockUseAuth.mockReturnValue({ user: null })
    mockUseLocation.mockReturnValue({ state: { profile: studentProfile } })
    generateCareerPlan.mockResolvedValue(JSON.stringify(rawActivities))
    renderRoadmap()
    await screen.findByRole('heading', { name: 'Year 1' })
    fireEvent.click(screen.getByTestId('checkpoint-Apply for internships'))
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('clicking Save as a guest calls saveGuestPlan and shows the on-device-only notice text (not "lost if you close the tab")', async () => {
    mockUseAuth.mockReturnValue({ user: null })
    mockUseLocation.mockReturnValue({ state: { profile: studentProfile } })
    generateCareerPlan.mockResolvedValue(JSON.stringify(rawActivities))
    renderRoadmap()
    await screen.findByRole('heading', { name: 'Year 1' })
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }))
    expect(saveGuestPlan).toHaveBeenCalledWith(studentProfile, expect.any(Array))
    const notice = await screen.findByText(/only saved (on|to) this (browser|device)/i)
    expect(notice.textContent).not.toMatch(/lost if you close the tab/i)
  })

  it('shows an inline error, not a silent no-op, when saveGuestPlan returns { ok: false, error }', async () => {
    mockUseAuth.mockReturnValue({ user: null })
    mockUseLocation.mockReturnValue({ state: { profile: studentProfile } })
    generateCareerPlan.mockResolvedValue(JSON.stringify(rawActivities))
    saveGuestPlan.mockReturnValue({ ok: false, error: 'Could not save to this browser.' })
    renderRoadmap()
    await screen.findByRole('heading', { name: 'Year 1' })
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }))
    expect(await screen.findByText('Could not save to this browser.')).toBeInTheDocument()
  })

  it('renders Accept as a locked LockedAction, linking to /signup, for a signed-out guest', async () => {
    mockUseAuth.mockReturnValue({ user: null })
    mockUseLocation.mockReturnValue({ state: { profile: studentProfile } })
    generateCareerPlan.mockResolvedValue(JSON.stringify(rawActivities))
    renderRoadmap()
    await screen.findByRole('heading', { name: 'Year 1' })
    const acceptLink = screen.getByRole('link', { name: /accept/i })
    expect(acceptLink).toHaveAttribute('href', '/signup')
  })

  it('renders Accept as an active button for a signed-in user, calling setPlanAccepted(plan.id, true) when clicked', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } })
    mockUseLocation.mockReturnValue({ state: undefined })
    const dbActivities = rawActivities.map((a, i) => ({
      id: `a${i}`, title: a.title, category: a.category, period_label: a.period,
      period_year: periodYearFor(a.period, studentProfile), priority: a.priority,
      explanation: a.explanation, status: a.status,
    }))
    getPlanWithActivities.mockResolvedValue({ plan: { id: 'p1', target_occupation: 'Data Analyst' }, activities: dbActivities })
    renderRoadmap()
    await screen.findByRole('heading', { name: 'Year 1' })
    fireEvent.click(screen.getByRole('button', { name: /accept/i }))
    expect(setPlanAccepted).toHaveBeenCalledWith('p1', true)
  })

  it('changing an activity\'s status inside the open panel, as a signed-in user, calls updateActivityStatus(activity.id, newStatus) and the checkpoint\'s rendered colour updates', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } })
    mockUseLocation.mockReturnValue({ state: undefined })
    const dbActivities = rawActivities.map((a, i) => ({
      id: `a${i}`, title: a.title, category: a.category, period_label: a.period,
      period_year: periodYearFor(a.period, studentProfile), priority: a.priority,
      explanation: a.explanation, status: a.status,
    }))
    getPlanWithActivities.mockResolvedValue({ plan: { id: 'p1', target_occupation: 'Data Analyst' }, activities: dbActivities })
    renderRoadmap()
    await screen.findByRole('heading', { name: 'Year 1' })
    fireEvent.click(screen.getByTestId('checkpoint-Apply for internships'))
    fireEvent.change(await screen.findByRole('combobox'), { target: { value: 'Completed' } })
    await waitFor(() => expect(updateActivityStatus).toHaveBeenCalledWith('a4', 'Completed'))
    // once completed, this checkpoint is no longer the pinned "current" one (colour green, no pin marker on it)
    await waitFor(() => {
      const checkpoint = screen.getByTestId('checkpoint-Apply for internships')
      expect(within(checkpoint).queryByText(/you are here/i)).not.toBeInTheDocument()
      expect(checkpoint.style.borderColor).toBe('rgb(22, 163, 74)')
    })
  })

  it('removing an activity inside the open panel, as a signed-in user, removes it from the rendered roadmap', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } })
    mockUseLocation.mockReturnValue({ state: undefined })
    const dbActivities = rawActivities.map((a, i) => ({
      id: `a${i}`, title: a.title, category: a.category, period_label: a.period,
      period_year: periodYearFor(a.period, studentProfile), priority: a.priority,
      explanation: a.explanation, status: a.status,
    }))
    getPlanWithActivities.mockResolvedValue({ plan: { id: 'p1', target_occupation: 'Data Analyst' }, activities: dbActivities })
    renderRoadmap()
    await screen.findByRole('heading', { name: 'Year 1' })
    fireEvent.click(screen.getByTestId('checkpoint-Apply for internships'))
    fireEvent.click(await screen.findByRole('button', { name: /remove/i }))
    await waitFor(() => expect(deleteActivity).toHaveBeenCalledWith('a4'))
    await waitFor(() => expect(screen.queryAllByText('Apply for internships')).toHaveLength(0))
  })

  it('for a signed-in user with a freshly-generated plan (no existing saved plan), clicking Save calls createPlanWithActivities and persists it to Supabase', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } })
    mockUseLocation.mockReturnValue({ state: { profile: studentProfile } })
    getPlanWithActivities.mockResolvedValue(null)
    generateCareerPlan.mockResolvedValue(JSON.stringify(rawActivities))
    createPlanWithActivities.mockResolvedValue({
      plan: { id: 'p1', target_occupation: 'Data Analyst' },
      activities: rawActivities.map((a, i) => ({
        id: `a${i}`, title: a.title, category: a.category, period_label: a.period,
        period_year: periodYearFor(a.period, studentProfile), priority: a.priority,
        explanation: a.explanation, status: a.status,
      })),
    })
    renderRoadmap()
    await screen.findByRole('heading', { name: 'Year 1' })
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }))
    await waitFor(() => expect(createPlanWithActivities).toHaveBeenCalledWith('u1', 'Data Analyst', rawActivities))
    // once persisted, activities carry real ids - status changes now target them
    fireEvent.click(screen.getByTestId('checkpoint-Apply for internships'))
    fireEvent.change(await screen.findByRole('combobox'), { target: { value: 'Completed' } })
    await waitFor(() => expect(updateActivityStatus).toHaveBeenCalledWith('a4', 'Completed'))
  })

  it('shows a loading indicator instead of the checkpoint panel while diary entries are being fetched for a signed-in user, then reveals the panel with entries loaded', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } })
    mockUseLocation.mockReturnValue({ state: undefined })
    const dbActivities = rawActivities.map((a, i) => ({
      id: `a${i}`, title: a.title, category: a.category, period_label: a.period,
      period_year: periodYearFor(a.period, studentProfile), priority: a.priority,
      explanation: a.explanation, status: a.status,
    }))
    getPlanWithActivities.mockResolvedValue({ plan: { id: 'p1', target_occupation: 'Data Analyst' }, activities: dbActivities })
    let resolveEntries
    getDiaryEntriesForActivity.mockReturnValue(new Promise((resolve) => { resolveEntries = resolve }))
    renderRoadmap()
    await screen.findByRole('heading', { name: 'Year 1' })
    fireEvent.click(screen.getByTestId('checkpoint-Apply for internships'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
    await act(async () => {
      resolveEntries([{ id: 'd1', entry_text: 'Existing entry', created_at: '2026-09-01T00:00:00Z' }])
      await Promise.resolve()
    })
    expect(await screen.findByRole('dialog', { name: 'Apply for internships' })).toBeInTheDocument()
    expect(screen.getByText('Existing entry')).toBeInTheDocument()
  })

  it('opening the panel for a signed-in user calls getDiaryEntriesForActivity(activity.id) and passes the result to CheckpointPanel', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } })
    mockUseLocation.mockReturnValue({ state: undefined })
    const dbActivities = rawActivities.map((a, i) => ({
      id: `a${i}`, title: a.title, category: a.category, period_label: a.period,
      period_year: periodYearFor(a.period, studentProfile), priority: a.priority,
      explanation: a.explanation, status: a.status,
    }))
    getPlanWithActivities.mockResolvedValue({ plan: { id: 'p1', target_occupation: 'Data Analyst' }, activities: dbActivities })
    getDiaryEntriesForActivity.mockResolvedValue([{ id: 'd1', entry_text: 'Existing entry', created_at: '2026-09-01T00:00:00Z' }])
    renderRoadmap()
    await screen.findByRole('heading', { name: 'Year 1' })
    fireEvent.click(screen.getByTestId('checkpoint-Apply for internships'))
    await waitFor(() => expect(getDiaryEntriesForActivity).toHaveBeenCalledWith('a4'))
    expect(await screen.findByText('Existing entry')).toBeInTheDocument()
  })

  it('submitting a diary entry calls createDiaryEntry(activity.id, user.id, text) and the new entry appears in the panel', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } })
    mockUseLocation.mockReturnValue({ state: undefined })
    const dbActivities = rawActivities.map((a, i) => ({
      id: `a${i}`, title: a.title, category: a.category, period_label: a.period,
      period_year: periodYearFor(a.period, studentProfile), priority: a.priority,
      explanation: a.explanation, status: a.status,
    }))
    getPlanWithActivities.mockResolvedValue({ plan: { id: 'p1', target_occupation: 'Data Analyst' }, activities: dbActivities })
    getDiaryEntriesForActivity.mockResolvedValue([])
    createDiaryEntry.mockResolvedValue({ id: 'd1', entry_text: 'New entry text', created_at: '2026-09-13T00:00:00Z' })
    renderRoadmap()
    await screen.findByRole('heading', { name: 'Year 1' })
    fireEvent.click(screen.getByTestId('checkpoint-Apply for internships'))
    fireEvent.change(await screen.findByRole('textbox', { name: /diary entry/i }), { target: { value: 'New entry text' } })
    fireEvent.click(screen.getByRole('button', { name: /add entry/i }))
    await waitFor(() => expect(createDiaryEntry).toHaveBeenCalledWith('a4', 'u1', 'New entry text'))
    expect(await screen.findByText('New entry text')).toBeInTheDocument()
  })

  it('requesting AI feedback calls getDiaryFeedback(activity, entryText) then setDiaryEntryFeedback(entry.id, feedback) and the feedback appears under the entry', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } })
    mockUseLocation.mockReturnValue({ state: undefined })
    const dbActivities = rawActivities.map((a, i) => ({
      id: `a${i}`, title: a.title, category: a.category, period_label: a.period,
      period_year: periodYearFor(a.period, studentProfile), priority: a.priority,
      explanation: a.explanation, status: a.status,
    }))
    getPlanWithActivities.mockResolvedValue({ plan: { id: 'p1', target_occupation: 'Data Analyst' }, activities: dbActivities })
    getDiaryEntriesForActivity.mockResolvedValue([{ id: 'd1', entry_text: 'Existing entry', created_at: '2026-09-01T00:00:00Z' }])
    getDiaryFeedback.mockResolvedValue('Great progress!')
    renderRoadmap()
    await screen.findByRole('heading', { name: 'Year 1' })
    fireEvent.click(screen.getByTestId('checkpoint-Apply for internships'))
    expect(await screen.findByText('Existing entry')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /get ai feedback/i }))
    await waitFor(() => expect(getDiaryFeedback).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Apply for internships' }), 'Existing entry'
    ))
    await waitFor(() => expect(setDiaryEntryFeedback).toHaveBeenCalledWith('d1', 'Great progress!'))
    expect(await screen.findByText('Great progress!')).toBeInTheDocument()
  })

  it('shows the 3 most recent diary entries in the stats strip for a signed-in user with entries', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } })
    mockUseLocation.mockReturnValue({ state: undefined })
    const dbActivities = rawActivities.map((a, i) => ({
      id: `a${i}`, title: a.title, category: a.category, period_label: a.period,
      period_year: periodYearFor(a.period, studentProfile), priority: a.priority,
      explanation: a.explanation, status: a.status,
    }))
    getPlanWithActivities.mockResolvedValue({ plan: { id: 'p1', target_occupation: 'Data Analyst' }, activities: dbActivities })
    getDiaryEntries.mockResolvedValue([
      { id: 'd1', entry_text: 'Applied today', activity: { title: 'Apply for internships' } },
    ])
    renderRoadmap()
    await waitFor(() => expect(screen.getByText('Applied today')).toBeInTheDocument())
  })

  it('still shows the "No diary entries yet" stub for a signed-out guest', async () => {
    mockUseAuth.mockReturnValue({ user: null })
    mockUseLocation.mockReturnValue({ state: { profile: studentProfile } })
    generateCareerPlan.mockResolvedValue(JSON.stringify(rawActivities))
    renderRoadmap()
    expect(await screen.findByText(/no diary entries yet/i)).toBeInTheDocument()
  })

  it('does not render a Save button for a signed-in user who already has a persisted plan', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } })
    mockUseLocation.mockReturnValue({ state: undefined })
    const dbActivities = rawActivities.map((a, i) => ({
      id: `a${i}`, title: a.title, category: a.category, period_label: a.period,
      period_year: periodYearFor(a.period, studentProfile), priority: a.priority,
      explanation: a.explanation, status: a.status,
    }))
    getPlanWithActivities.mockResolvedValue({ plan: { id: 'p1', target_occupation: 'Data Analyst' }, activities: dbActivities })
    renderRoadmap()
    await screen.findByRole('heading', { name: 'Year 1' })
    expect(screen.queryByRole('button', { name: /^save$/i })).not.toBeInTheDocument()
  })
})

describe('Roadmap — guest plan persistence across navigation', () => {
  it('for a guest with a previously-saved plan and no router-state profile, loads it from localStorage instead of redirecting to /profile', async () => {
    mockUseAuth.mockReturnValue({ user: null })
    mockUseLocation.mockReturnValue({ state: undefined })
    loadGuestPlan.mockReturnValue({ profile: studentProfile, activities: rawActivities })
    renderRoadmap()
    expect(await screen.findByRole('heading', { name: 'Year 1' })).toBeInTheDocument()
    expect(generateCareerPlan).not.toHaveBeenCalled()
  })

  it('auto-saves a freshly generated guest plan to localStorage without requiring the Save button to be clicked', async () => {
    mockUseAuth.mockReturnValue({ user: null })
    mockUseLocation.mockReturnValue({ state: { profile: studentProfile } })
    generateCareerPlan.mockResolvedValue(JSON.stringify(rawActivities))
    renderRoadmap()
    await screen.findByRole('heading', { name: 'Year 1' })
    await waitFor(() => expect(saveGuestPlan).toHaveBeenCalledWith(studentProfile, rawActivities))
  })
})
