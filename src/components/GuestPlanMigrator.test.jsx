import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const mockUseAuth = vi.fn()
vi.mock('../lib/auth', () => ({ useAuth: () => mockUseAuth() }))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../lib/localPlan', () => ({ loadGuestPlan: vi.fn(), clearGuestPlan: vi.fn() }))
vi.mock('../lib/db', () => ({ getPlanWithActivities: vi.fn(), createPlanWithActivities: vi.fn(), saveProfile: vi.fn() }))

import { loadGuestPlan, clearGuestPlan } from '../lib/localPlan'
import { getPlanWithActivities, createPlanWithActivities, saveProfile } from '../lib/db'
import GuestPlanMigrator from './GuestPlanMigrator'

const guestPlan = {
  profile: { targetOccupation: 'Data Analyst' },
  activities: [{ title: 'x', period: 'Year 1', status: 'Not started', category: 'Technical skills', priority: 'High', explanation: 'why' }],
}

function renderMigrator() {
  return render(<MemoryRouter><GuestPlanMigrator /></MemoryRouter>)
}

beforeEach(() => {
  mockUseAuth.mockReset()
  mockNavigate.mockReset()
  loadGuestPlan.mockReset()
  clearGuestPlan.mockReset()
  getPlanWithActivities.mockReset()
  createPlanWithActivities.mockReset()
  saveProfile.mockReset().mockResolvedValue(undefined)
})

describe('GuestPlanMigrator', () => {
  it('does nothing when signed out', async () => {
    mockUseAuth.mockReturnValue({ user: null })
    loadGuestPlan.mockReturnValue(guestPlan)
    renderMigrator()
    await new Promise((r) => setTimeout(r, 0))
    expect(createPlanWithActivities).not.toHaveBeenCalled()
    expect(getPlanWithActivities).not.toHaveBeenCalled()
  })

  it('does nothing when signed in but no guest plan is saved', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } })
    loadGuestPlan.mockReturnValue(null)
    renderMigrator()
    await new Promise((r) => setTimeout(r, 0))
    expect(getPlanWithActivities).not.toHaveBeenCalled()
    expect(createPlanWithActivities).not.toHaveBeenCalled()
  })

  it('migrates the guest plan and profile to Supabase, clears it, and navigates to /plan when the user has no existing plan', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } })
    loadGuestPlan.mockReturnValue(guestPlan)
    getPlanWithActivities.mockResolvedValue(null)
    createPlanWithActivities.mockResolvedValue({ plan: { id: 'p1' }, activities: [] })
    renderMigrator()
    await waitFor(() => expect(saveProfile).toHaveBeenCalledWith('u1', guestPlan.profile))
    await waitFor(() => expect(createPlanWithActivities).toHaveBeenCalledWith('u1', 'Data Analyst', guestPlan.activities))
    await waitFor(() => expect(clearGuestPlan).toHaveBeenCalled())
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/plan'))
  })

  it('clears the stale guest plan without creating a duplicate when the user already has an existing Supabase plan', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } })
    loadGuestPlan.mockReturnValue(guestPlan)
    getPlanWithActivities.mockResolvedValue({ plan: { id: 'existing' }, activities: [] })
    renderMigrator()
    await waitFor(() => expect(clearGuestPlan).toHaveBeenCalled())
    expect(createPlanWithActivities).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('leaves the guest plan in place if migration fails, so it is not lost', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } })
    loadGuestPlan.mockReturnValue(guestPlan)
    getPlanWithActivities.mockResolvedValue(null)
    createPlanWithActivities.mockRejectedValue(new Error('boom'))
    renderMigrator()
    await waitFor(() => expect(createPlanWithActivities).toHaveBeenCalled())
    expect(clearGuestPlan).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
