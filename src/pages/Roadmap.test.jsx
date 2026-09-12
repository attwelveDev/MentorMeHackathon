import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { periodYearFor } from '../lib/roadmap'

const mockUseAuth = vi.fn()
vi.mock('../lib/auth', () => ({ useAuth: () => mockUseAuth() }))

const mockUseLocation = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useLocation: () => mockUseLocation() }
})

vi.mock('../lib/ai', () => ({ generateCareerPlan: vi.fn() }))
vi.mock('../lib/db', () => ({ getPlanWithActivities: vi.fn() }))

import { generateCareerPlan } from '../lib/ai'
import { getPlanWithActivities } from '../lib/db'
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
  mockUseAuth.mockReset()
  mockUseLocation.mockReset()
  generateCareerPlan.mockReset()
  getPlanWithActivities.mockReset()
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
    expect(screen.getByText('Completed').previousSibling).toHaveTextContent('3')
    expect(screen.getByText('In progress').previousSibling).toHaveTextContent('0')
    expect(screen.getByText('Upcoming').previousSibling).toHaveTextContent('2')
    expect(screen.getByText('Overdue').previousSibling).toHaveTextContent('1')
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
    expect(screen.getByText(/jobs \(coming soon\)/i)).toBeInTheDocument()
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
