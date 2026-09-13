import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const mockUseAuth = vi.fn()
vi.mock('../lib/auth', () => ({ useAuth: () => mockUseAuth() }))
vi.mock('../lib/db', () => ({
  getProfile: vi.fn(), getPlanWithActivities: vi.fn(), getSavedMarketUpdates: vi.fn(),
  setMarketUpdateStatus: vi.fn(), addPlanActivityFromUpdate: vi.fn(), setUpdateFrequency: vi.fn(),
}))
vi.mock('../lib/ai', () => ({ summariseMarketUpdate: vi.fn() }))
vi.mock('../data/marketSources', () => ({ marketSources: [
  { id: 's1', occupation: 'Registered Nurse', state: 'NSW', source: 'JSA', sourceText: 'x', publishedDate: '2026-09-01', retrievedDate: '2026-09-13' },
] }))

import * as db from '../lib/db'
import * as ai from '../lib/ai'
import { clearCache } from '../lib/pageCache'
import MarketUpdates from './MarketUpdates'

beforeEach(() => {
  clearCache()
  mockUseAuth.mockReset()
  vi.clearAllMocks()
})

describe('MarketUpdates gating', () => {
  it('shows a locked prompt linking to /signup for a signed-out guest, and not the empty-state copy', () => {
    mockUseAuth.mockReturnValue({ user: null })
    render(<MemoryRouter><MarketUpdates /></MemoryRouter>)
    expect(screen.getByText(/create an account to view job market/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute('href', '/signup')
  })
})

describe('MarketUpdates feed', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } })
    db.getProfile.mockResolvedValue({
      target_occupation: 'Registered Nurse', state: 'NSW', update_frequency: 'weekly',
      study_stage: 'midway', graduation_year: '2027', course_length_years: 4,
    })
    db.getPlanWithActivities.mockResolvedValue({ plan: { id: 'p1' }, activities: [] })
    db.getSavedMarketUpdates.mockResolvedValue([])
    ai.summariseMarketUpdate.mockResolvedValue(JSON.stringify({
      headline: 'Nurse shortage continues', summary: 'Summary.', statusLabel: 'Research',
      topic: 'Workforce demand', whyItMatters: 'Relevant to you.',
    }))
  })

  it('shows a matching card with headline, status label, and dates once loaded', async () => {
    render(<MemoryRouter><MarketUpdates /></MemoryRouter>)
    expect(await screen.findByText('Nurse shortage continues')).toBeInTheDocument()
    expect(screen.getByText('Research')).toBeInTheDocument()
  })

  it('shows the "nothing seeded" empty state when no source item matches the profile', async () => {
    db.getProfile.mockResolvedValue({ target_occupation: 'Carpenter', state: 'VIC', update_frequency: 'weekly' })
    render(<MemoryRouter><MarketUpdates /></MemoryRouter>)
    expect(await screen.findByText(/nothing has been curated for your profile yet/i)).toBeInTheDocument()
  })

  it('shows the "no filter matches" empty state distinctly from the "nothing seeded" one', async () => {
    render(<MemoryRouter><MarketUpdates /></MemoryRouter>)
    await screen.findByText('Nurse shortage continues')
    fireEvent.click(screen.getByRole('button', { name: 'Regulation' }))
    expect(await screen.findByText(/no updates match your current filters/i)).toBeInTheDocument()
  })

  it('excludes an item whose classified topic is outside the fixed enum', async () => {
    ai.summariseMarketUpdate.mockResolvedValue(JSON.stringify({
      headline: 'Bad item', summary: 'x', statusLabel: 'Research', topic: 'Sports', whyItMatters: 'x',
    }))
    render(<MemoryRouter><MarketUpdates /></MemoryRouter>)
    expect(await screen.findByText(/nothing has been curated for your profile yet/i)).toBeInTheDocument()
    expect(screen.queryByText('Bad item')).not.toBeInTheDocument()
  })

  it('displays the general-career-information disclaimer', async () => {
    render(<MemoryRouter><MarketUpdates /></MemoryRouter>)
    await screen.findByText('Nurse shortage continues')
    expect(screen.getByText(/general career information, not financial, investment, legal or migration advice/i)).toBeInTheDocument()
  })

  it('toggles save on a card via the detail panel and calls setMarketUpdateStatus', async () => {
    render(<MemoryRouter><MarketUpdates /></MemoryRouter>)
    fireEvent.click(await screen.findByText('Nurse shortage continues'))
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }))
    expect(db.setMarketUpdateStatus).toHaveBeenCalledWith('u1', 's1', 'saved')
  })

  it('dismisses a card via the detail panel and removes it from the feed', async () => {
    render(<MemoryRouter><MarketUpdates /></MemoryRouter>)
    fireEvent.click(await screen.findByText('Nurse shortage continues'))
    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }))
    expect(db.setMarketUpdateStatus).toHaveBeenCalledWith('u1', 's1', 'dismissed')
    expect(screen.queryByText('Nurse shortage continues')).not.toBeInTheDocument()
  })

  it('adds a card to the plan via addPlanActivityFromUpdate', async () => {
    render(<MemoryRouter><MarketUpdates /></MemoryRouter>)
    fireEvent.click(await screen.findByText('Nurse shortage continues'))
    fireEvent.click(screen.getByRole('button', { name: /add to plan/i }))
    expect(db.addPlanActivityFromUpdate).toHaveBeenCalledWith('p1', 'u1', expect.objectContaining({ title: 'Nurse shortage continues' }))
  })

  it('changes and persists the update-frequency preference', async () => {
    render(<MemoryRouter><MarketUpdates /></MemoryRouter>)
    await screen.findByText('Nurse shortage continues')
    fireEvent.change(screen.getByLabelText(/update frequency/i), { target: { value: 'daily' } })
    expect(db.setUpdateFrequency).toHaveBeenCalledWith('u1', 'daily')
  })
})
