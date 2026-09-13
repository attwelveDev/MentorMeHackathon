import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import {
  EDUCATION_SECTORS,
  STUDY_STAGES,
  AU_STATES,
  EMPLOYMENT_ARRANGEMENTS,
  WORK_LOCATION_MODES,
  WORK_RIGHTS,
} from '../lib/profileOptions'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useNavigate: () => mockNavigate }
})

const mockUseAuth = vi.fn()
vi.mock('../lib/auth', () => ({ useAuth: () => mockUseAuth() }))

vi.mock('../lib/localPlan', () => ({ loadGuestPlan: vi.fn(), saveGuestPlan: vi.fn() }))
vi.mock('../lib/db', () => ({ getProfile: vi.fn(), saveProfile: vi.fn(), getPlanWithActivities: vi.fn() }))

import { loadGuestPlan, saveGuestPlan } from '../lib/localPlan'
import { getProfile, saveProfile, getPlanWithActivities } from '../lib/db'
import Profile from './Profile'

beforeEach(() => {
  mockNavigate.mockClear()
  mockUseAuth.mockReset().mockReturnValue({ user: null })
  loadGuestPlan.mockReset().mockReturnValue(null)
  saveGuestPlan.mockReset().mockReturnValue({ ok: true })
  getProfile.mockReset().mockResolvedValue(null)
  saveProfile.mockReset().mockResolvedValue(undefined)
  getPlanWithActivities.mockReset().mockResolvedValue(null)
})

describe('Profile validation', () => {
  it('shows a per-field error and a summary banner when a required field is empty, and does not navigate', () => {
    render(<MemoryRouter><Profile /></MemoryRouter>)
    fireEvent.change(screen.getByLabelText(/current study stage/i), { target: { value: STUDY_STAGES[0].value } })
    fireEvent.change(screen.getByLabelText(/target occupation/i), { target: { value: 'Carpenter' } })
    fireEvent.click(screen.getByRole('button', { name: /create my plan/i }))
    expect(screen.getByText(/check the required information/i)).toBeInTheDocument()
    expect(screen.getAllByText(/this field is required/i).length).toBeGreaterThan(0)
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('navigates to /analysis with the profile when all required fields are filled', () => {
    render(<MemoryRouter><Profile /></MemoryRouter>)
    fireEvent.change(screen.getByLabelText(/course or qualification/i), { target: { value: 'Bachelor of IT' } })
    fireEvent.change(screen.getByLabelText(/education sector/i), { target: { value: EDUCATION_SECTORS[0].value } })
    fireEvent.change(screen.getByLabelText(/current study stage/i), { target: { value: STUDY_STAGES[0].value } })
    fireEvent.change(screen.getByLabelText(/target occupation/i), { target: { value: 'Software Developer' } })
    fireEvent.change(screen.getByLabelText(/current skills/i), { target: { value: 'JavaScript basics' } })
    fireEvent.change(screen.getByLabelText(/employment or volunteer experience/i), { target: { value: 'Internship, 3 months' } })
    fireEvent.change(screen.getByLabelText(/work rights/i), { target: { value: 'no-restriction' } })
    fireEvent.change(screen.getByLabelText(/expected graduation year/i), { target: { value: '2028' } })
    fireEvent.change(screen.getByLabelText(/course\/program length in years/i), { target: { value: '3' } })
    fireEvent.click(screen.getByRole('button', { name: /create my plan/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/analysis', {
      state: { profile: expect.objectContaining({
        qualification: 'Bachelor of IT',
        educationSector: EDUCATION_SECTORS[0].value,
        studyStage: STUDY_STAGES[0].value,
        targetOccupation: 'Software Developer',
      }) },
    })
  })
})

describe('Profile dropdown fields', () => {
  it('renders Education sector as a select with the configured options', () => {
    render(<MemoryRouter><Profile /></MemoryRouter>)
    const select = screen.getByLabelText(/education sector/i)
    expect(select.tagName).toBe('SELECT')
    EDUCATION_SECTORS.forEach((opt) => {
      expect(screen.getByRole('option', { name: opt.label })).toBeInTheDocument()
    })
  })

  it('blocks submission and shows an error when Education sector is left unselected', () => {
    render(<MemoryRouter><Profile /></MemoryRouter>)
    fireEvent.change(screen.getByLabelText(/course or qualification/i), { target: { value: 'Diploma of Early Childhood Education' } })
    fireEvent.change(screen.getByLabelText(/current study stage/i), { target: { value: STUDY_STAGES[0].value } })
    fireEvent.change(screen.getByLabelText(/target occupation/i), { target: { value: 'Early Childhood Educator' } })
    fireEvent.click(screen.getByRole('button', { name: /create my plan/i }))
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('renders Study stage and State/territory as selects with the configured options', () => {
    render(<MemoryRouter><Profile /></MemoryRouter>)
    expect(screen.getByLabelText(/current study stage/i).tagName).toBe('SELECT')
    expect(screen.getByLabelText(/australian state or territory/i).tagName).toBe('SELECT')
    expect(STUDY_STAGES.length + AU_STATES.length).toBeGreaterThan(0)
  })
})

describe('Profile work-preference fields', () => {
  it('renders employment arrangement and work location mode as selects, and other preferences as free text', () => {
    render(<MemoryRouter><Profile /></MemoryRouter>)
    expect(screen.getByLabelText(/preferred employment arrangement/i).tagName).toBe('SELECT')
    expect(screen.getByLabelText(/preferred work location mode/i).tagName).toBe('SELECT')
    expect(screen.getByLabelText(/other work preferences/i).tagName).toBe('INPUT')
    EMPLOYMENT_ARRANGEMENTS.forEach((opt) => expect(screen.getAllByRole('option', { name: opt.label }).length).toBeGreaterThan(0))
  })

  it('does not render a "preferred work setting" field anymore', () => {
    render(<MemoryRouter><Profile /></MemoryRouter>)
    expect(screen.queryByLabelText(/preferred work setting/i)).not.toBeInTheDocument()
  })

  it('allows submission with these three fields left blank as long as required fields are filled', () => {
    render(<MemoryRouter><Profile /></MemoryRouter>)
    fireEvent.change(screen.getByLabelText(/course or qualification/i), { target: { value: 'Bachelor of Nursing' } })
    fireEvent.change(screen.getByLabelText(/education sector/i), { target: { value: EDUCATION_SECTORS[0].value } })
    fireEvent.change(screen.getByLabelText(/current study stage/i), { target: { value: STUDY_STAGES[0].value } })
    fireEvent.change(screen.getByLabelText(/target occupation/i), { target: { value: 'Registered Nurse' } })
    fireEvent.change(screen.getByLabelText(/current skills/i), { target: { value: 'Patient care basics' } })
    fireEvent.change(screen.getByLabelText(/employment or volunteer experience/i), { target: { value: 'Aged care volunteering' } })
    fireEvent.change(screen.getByLabelText(/work rights/i), { target: { value: 'no-restriction' } })
    fireEvent.change(screen.getByLabelText(/expected graduation year/i), { target: { value: '2028' } })
    fireEvent.change(screen.getByLabelText(/course\/program length in years/i), { target: { value: '3' } })
    fireEvent.click(screen.getByRole('button', { name: /create my plan/i }))
    expect(mockNavigate).toHaveBeenCalled()
  })
})

function fillRequiredExcept(omit) {
  const values = {
    qualification: 'Certificate III in Carpentry',
    educationSector: EDUCATION_SECTORS[0].value,
    studyStage: STUDY_STAGES[0].value,
    targetOccupation: 'Carpenter',
    skills: 'Basic hand and power tool use',
    experience: 'Work placement, 2 weeks',
    workRights: 'no-restriction',
    graduationYear: '2028',
    courseLengthYears: '3',
  }
  render(<MemoryRouter><Profile /></MemoryRouter>)
  const labelFor = {
    qualification: /course or qualification/i,
    educationSector: /education sector/i,
    studyStage: /current study stage/i,
    targetOccupation: /target occupation/i,
    skills: /current skills/i,
    experience: /employment or volunteer experience/i,
    workRights: /work rights/i,
    graduationYear: /expected graduation year/i,
    courseLengthYears: /course\/program length in years/i,
  }
  Object.entries(values).forEach(([key, val]) => {
    if (key === omit) return
    fireEvent.change(screen.getByLabelText(labelFor[key]), { target: { value: val } })
  })
  fireEvent.click(screen.getByRole('button', { name: /create my plan/i }))
}

describe('Profile final required-field set', () => {
  it('blocks submission when Current skills is empty', () => {
    fillRequiredExcept('skills')
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('blocks submission when Experience is empty', () => {
    fillRequiredExcept('experience')
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('navigates when all required fields are filled and every optional field is left blank', () => {
    fillRequiredExcept(null)
    expect(mockNavigate).toHaveBeenCalledWith('/analysis', {
      state: { profile: expect.objectContaining({
        qualification: 'Certificate III in Carpentry',
        educationSector: EDUCATION_SECTORS[0].value,
        studyStage: STUDY_STAGES[0].value,
        targetOccupation: 'Carpenter',
        skills: 'Basic hand and power tool use',
        experience: 'Work placement, 2 weeks',
        specialisation: '',
        graduationYear: '2028',
        courseLengthYears: '3',
        state: '',
        certifications: '',
        employmentArrangement: '',
        workLocationMode: '',
        otherPreferences: '',
        licences: '',
      }) },
    })
  })

  it('blocks submission when Expected graduation year is empty', () => {
    fillRequiredExcept('graduationYear')
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})

async function fillOtherRequiredFields({ studyStage = STUDY_STAGES[0].value } = {}) {
  await screen.findByLabelText(/course or qualification/i)
  fireEvent.change(screen.getByLabelText(/course or qualification/i), { target: { value: 'Certificate III in Carpentry' } })
  fireEvent.change(screen.getByLabelText(/education sector/i), { target: { value: EDUCATION_SECTORS[0].value } })
  fireEvent.change(screen.getByLabelText(/current study stage/i), { target: { value: studyStage } })
  fireEvent.change(screen.getByLabelText(/target occupation/i), { target: { value: 'Carpenter' } })
  fireEvent.change(screen.getByLabelText(/current skills/i), { target: { value: 'Basic hand and power tool use' } })
  fireEvent.change(screen.getByLabelText(/employment or volunteer experience/i), { target: { value: 'Work placement, 2 weeks' } })
  fireEvent.change(screen.getByLabelText(/work rights/i), { target: { value: 'no-restriction' } })
  fireEvent.change(screen.getByLabelText(/expected graduation year/i), { target: { value: '2028' } })
}

describe('Profile course length field', () => {
  it('renders Course/program length in years as a required text field', async () => {
    render(<MemoryRouter><Profile /></MemoryRouter>)
    await fillOtherRequiredFields()
    const field = screen.getByLabelText(/course\/program length in years/i)
    expect(field.tagName).toBe('INPUT')
    fireEvent.click(screen.getByRole('button', { name: /create my plan/i }))
    expect(mockNavigate).not.toHaveBeenCalled()
    expect(screen.getAllByText(/this field is required/i).length).toBeGreaterThan(0)
  })

  it('blocks submission when Course/program length in years is empty and study stage is not Recently completed', () => {
    fillRequiredExcept('courseLengthYears')
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it.each(['0', '7', 'abc'])('blocks submission when Course/program length in years is %s', async (value) => {
    render(<MemoryRouter><Profile /></MemoryRouter>)
    await fillOtherRequiredFields()
    fireEvent.change(screen.getByLabelText(/course\/program length in years/i), { target: { value } })
    fireEvent.click(screen.getByRole('button', { name: /create my plan/i }))
    expect(mockNavigate).not.toHaveBeenCalled()
    expect(screen.getByText(/enter a whole number between 1 and 6/i)).toBeInTheDocument()
  })

  it.each(['1', '6'])('allows submission when Course/program length in years is the boundary value %s', async (value) => {
    render(<MemoryRouter><Profile /></MemoryRouter>)
    await fillOtherRequiredFields()
    fireEvent.change(screen.getByLabelText(/course\/program length in years/i), { target: { value } })
    fireEvent.click(screen.getByRole('button', { name: /create my plan/i }))
    expect(mockNavigate).toHaveBeenCalled()
  })

  it('hides the Course/program length in years field when study stage is Recently completed', () => {
    render(<MemoryRouter><Profile /></MemoryRouter>)
    fireEvent.change(screen.getByLabelText(/current study stage/i), { target: { value: 'recently-completed' } })
    expect(screen.queryByLabelText(/course\/program length in years/i)).not.toBeInTheDocument()
  })

  it('does not require Course/program length in years when study stage is Recently completed', async () => {
    render(<MemoryRouter><Profile /></MemoryRouter>)
    await fillOtherRequiredFields({ studyStage: 'recently-completed' })
    fireEvent.click(screen.getByRole('button', { name: /create my plan/i }))
    expect(mockNavigate).toHaveBeenCalled()
  })
})

describe('Profile qualification "none yet" checkbox', () => {
  it('disables the qualification input and satisfies the required check when checked', () => {
    render(<MemoryRouter><Profile /></MemoryRouter>)
    fireEvent.click(screen.getByLabelText(/i don't have a qualification yet/i))
    expect(screen.getByLabelText(/course or qualification/i)).toBeDisabled()
    expect(screen.getByLabelText(/course or qualification/i)).toHaveValue('No formal qualification yet')
  })

  it('re-enables and clears the qualification input when unchecked', () => {
    render(<MemoryRouter><Profile /></MemoryRouter>)
    const checkbox = screen.getByLabelText(/i don't have a qualification yet/i)
    fireEvent.click(checkbox)
    fireEvent.click(checkbox)
    expect(screen.getByLabelText(/course or qualification/i)).not.toBeDisabled()
    expect(screen.getByLabelText(/course or qualification/i)).toHaveValue('')
  })

  it('allows submission using the "no qualification yet" sentinel in place of free text', () => {
    render(<MemoryRouter><Profile /></MemoryRouter>)
    fireEvent.click(screen.getByLabelText(/i don't have a qualification yet/i))
    fireEvent.change(screen.getByLabelText(/education sector/i), { target: { value: EDUCATION_SECTORS[0].value } })
    fireEvent.change(screen.getByLabelText(/current study stage/i), { target: { value: STUDY_STAGES[0].value } })
    fireEvent.change(screen.getByLabelText(/target occupation/i), { target: { value: 'Carpenter' } })
    fireEvent.change(screen.getByLabelText(/current skills/i), { target: { value: 'Basic tool use' } })
    fireEvent.change(screen.getByLabelText(/employment or volunteer experience/i), { target: { value: 'None yet' } })
    fireEvent.change(screen.getByLabelText(/work rights/i), { target: { value: 'no-restriction' } })
    fireEvent.change(screen.getByLabelText(/expected graduation year/i), { target: { value: '2028' } })
    fireEvent.change(screen.getByLabelText(/course\/program length in years/i), { target: { value: '3' } })
    fireEvent.click(screen.getByRole('button', { name: /create my plan/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/analysis', {
      state: { profile: expect.objectContaining({ qualification: 'No formal qualification yet' }) },
    })
  })
})

describe('Profile specialisation "none yet" checkbox', () => {
  it('disables the specialisation input and sets the sentinel value when checked', () => {
    render(<MemoryRouter><Profile /></MemoryRouter>)
    fireEvent.click(screen.getByLabelText(/i don't have a major, specialisation or trade yet/i))
    expect(screen.getByLabelText(/^major, specialisation or trade$/i)).toBeDisabled()
    expect(screen.getByLabelText(/^major, specialisation or trade$/i)).toHaveValue('No specific major or specialisation')
  })

  it('re-enables and clears the specialisation input when unchecked', () => {
    render(<MemoryRouter><Profile /></MemoryRouter>)
    const checkbox = screen.getByLabelText(/i don't have a major, specialisation or trade yet/i)
    fireEvent.click(checkbox)
    fireEvent.click(checkbox)
    expect(screen.getByLabelText(/^major, specialisation or trade$/i)).not.toBeDisabled()
    expect(screen.getByLabelText(/^major, specialisation or trade$/i)).toHaveValue('')
  })

  it('still allows submission when specialisation is left blank (unaffected by this checkbox)', () => {
    fillRequiredExcept(null)
    expect(mockNavigate).toHaveBeenCalled()
  })
})

describe('Profile work rights field', () => {
  it('renders Work rights as a select with the configured options', () => {
    render(<MemoryRouter><Profile /></MemoryRouter>)
    const select = screen.getByLabelText(/work rights/i)
    expect(select.tagName).toBe('SELECT')
    WORK_RIGHTS.forEach((opt) => {
      expect(screen.getByRole('option', { name: opt.label })).toBeInTheDocument()
    })
  })

  it('renders the self-reported disclaimer near the field', () => {
    render(<MemoryRouter><Profile /></MemoryRouter>)
    expect(screen.getByText(/self-reported.*doesn't verify this or provide visa\/migration advice/i)).toBeInTheDocument()
  })

  it('blocks submission and shows an error when Work rights is left unselected', () => {
    render(<MemoryRouter><Profile /></MemoryRouter>)
    fireEvent.change(screen.getByLabelText(/course or qualification/i), { target: { value: 'Certificate III in Carpentry' } })
    fireEvent.change(screen.getByLabelText(/education sector/i), { target: { value: EDUCATION_SECTORS[0].value } })
    fireEvent.change(screen.getByLabelText(/current study stage/i), { target: { value: STUDY_STAGES[0].value } })
    fireEvent.change(screen.getByLabelText(/target occupation/i), { target: { value: 'Carpenter' } })
    fireEvent.change(screen.getByLabelText(/current skills/i), { target: { value: 'Basic tool use' } })
    fireEvent.change(screen.getByLabelText(/employment or volunteer experience/i), { target: { value: 'Work placement' } })
    fireEvent.click(screen.getByRole('button', { name: /create my plan/i }))
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('allows submission when "Prefer not to say" is selected, alongside the other required fields', () => {
    render(<MemoryRouter><Profile /></MemoryRouter>)
    fireEvent.change(screen.getByLabelText(/course or qualification/i), { target: { value: 'Certificate III in Carpentry' } })
    fireEvent.change(screen.getByLabelText(/education sector/i), { target: { value: EDUCATION_SECTORS[0].value } })
    fireEvent.change(screen.getByLabelText(/current study stage/i), { target: { value: STUDY_STAGES[0].value } })
    fireEvent.change(screen.getByLabelText(/target occupation/i), { target: { value: 'Carpenter' } })
    fireEvent.change(screen.getByLabelText(/current skills/i), { target: { value: 'Basic tool use' } })
    fireEvent.change(screen.getByLabelText(/employment or volunteer experience/i), { target: { value: 'Work placement' } })
    fireEvent.change(screen.getByLabelText(/work rights/i), { target: { value: 'prefer-not-to-say' } })
    fireEvent.change(screen.getByLabelText(/expected graduation year/i), { target: { value: '2028' } })
    fireEvent.change(screen.getByLabelText(/course\/program length in years/i), { target: { value: '3' } })
    fireEvent.click(screen.getByRole('button', { name: /create my plan/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/analysis', {
      state: { profile: expect.objectContaining({ workRights: 'prefer-not-to-say' }) },
    })
  })
})

describe('Profile persistence', () => {
  it('prefills the form from a guest\'s previously-saved profile in localStorage', async () => {
    loadGuestPlan.mockReturnValue({
      profile: { qualification: 'Bachelor of IT', targetOccupation: 'Data Analyst' },
      activities: [],
    })
    render(<MemoryRouter><Profile /></MemoryRouter>)
    await waitFor(() => expect(screen.getByLabelText(/course or qualification/i)).toHaveValue('Bachelor of IT'))
    expect(screen.getByLabelText(/target occupation/i)).toHaveValue('Data Analyst')
  })

  it('saves the profile to localStorage for a guest on submit', async () => {
    render(<MemoryRouter><Profile /></MemoryRouter>)
    await fillOtherRequiredFields()
    fireEvent.change(screen.getByLabelText(/course\/program length in years/i), { target: { value: '3' } })
    fireEvent.click(screen.getByRole('button', { name: /create my plan/i }))
    expect(saveGuestPlan).toHaveBeenCalledWith(expect.objectContaining({ targetOccupation: 'Carpenter' }), [])
    expect(mockNavigate).toHaveBeenCalled()
  })

  it('shows a loading state for a signed-in user until their profile is fetched, then reveals the form', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } })
    let resolveProfile
    getProfile.mockReturnValue(new Promise((resolve) => { resolveProfile = resolve }))
    render(<MemoryRouter><Profile /></MemoryRouter>)
    expect(screen.getByText(/loading your profile/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/course or qualification/i)).not.toBeInTheDocument()
    resolveProfile(null)
    await waitFor(() => expect(screen.getByLabelText(/course or qualification/i)).toBeInTheDocument())
    expect(screen.queryByText(/loading your profile/i)).not.toBeInTheDocument()
  })

  it('does not show a loading state for a guest', () => {
    render(<MemoryRouter><Profile /></MemoryRouter>)
    expect(screen.queryByText(/loading your profile/i)).not.toBeInTheDocument()
    expect(screen.getByLabelText(/course or qualification/i)).toBeInTheDocument()
  })

  it('prefills the form from a signed-in user\'s saved Supabase profile', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } })
    getProfile.mockResolvedValue({
      qualification: 'Diploma of Early Childhood Education',
      target_occupation: 'Early Childhood Educator',
    })
    render(<MemoryRouter><Profile /></MemoryRouter>)
    await waitFor(() => expect(screen.getByLabelText(/course or qualification/i)).toHaveValue('Diploma of Early Childhood Education'))
    expect(screen.getByLabelText(/target occupation/i)).toHaveValue('Early Childhood Educator')
  })

  it('shows plan-aware descriptions for a signed-in user who already has a plan', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } })
    getPlanWithActivities.mockResolvedValue({ plan: { id: 'p1' }, activities: [] })
    render(<MemoryRouter><Profile /></MemoryRouter>)
    await waitFor(() => expect(screen.getByLabelText(/course or qualification/i)).toBeInTheDocument())
    expect(screen.getByText(/keep this up to date so your existing plan stays on point/i)).toBeInTheDocument()
    expect(screen.getByText(/re-create your plan to refresh your existing roadmap/i)).toBeInTheDocument()
  })

  it('shows the first-time descriptions for a signed-in user without a plan yet', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } })
    getPlanWithActivities.mockResolvedValue(null)
    render(<MemoryRouter><Profile /></MemoryRouter>)
    await waitFor(() => expect(screen.getByLabelText(/course or qualification/i)).toBeInTheDocument())
    expect(screen.getByText(/sketch out a plan that actually fits you/i)).toBeInTheDocument()
    expect(screen.getByText(/this shapes the roadmap we build for you next/i)).toBeInTheDocument()
  })

  it('shows the first-time descriptions for a guest', () => {
    render(<MemoryRouter><Profile /></MemoryRouter>)
    expect(screen.getByText(/sketch out a plan that actually fits you/i)).toBeInTheDocument()
    expect(screen.getByText(/this shapes the roadmap we build for you next/i)).toBeInTheDocument()
  })

  it('saves the profile to Supabase for a signed-in user on submit, then navigates', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } })
    render(<MemoryRouter><Profile /></MemoryRouter>)
    await fillOtherRequiredFields()
    fireEvent.change(screen.getByLabelText(/course\/program length in years/i), { target: { value: '3' } })
    fireEvent.click(screen.getByRole('button', { name: /create my plan/i }))
    await waitFor(() => expect(saveProfile).toHaveBeenCalledWith('u1', expect.objectContaining({ targetOccupation: 'Carpenter' })))
    await waitFor(() => expect(mockNavigate).toHaveBeenCalled())
  })

  it('shows an error and does not navigate when saving a signed-in user\'s profile fails', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } })
    saveProfile.mockRejectedValue(new Error('boom'))
    render(<MemoryRouter><Profile /></MemoryRouter>)
    await fillOtherRequiredFields()
    fireEvent.change(screen.getByLabelText(/course\/program length in years/i), { target: { value: '3' } })
    fireEvent.click(screen.getByRole('button', { name: /create my plan/i }))
    expect(await screen.findByText(/we could not save your profile/i)).toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})

describe('Profile free-text field placeholders', () => {
  it('renders the example placeholder text on each free-text field', () => {
    render(<MemoryRouter><Profile /></MemoryRouter>)
    expect(screen.getByLabelText(/course or qualification/i)).toHaveAttribute(
      'placeholder', 'e.g. Bachelor of Nursing, Diploma of Early Childhood Education, Certificate III in Carpentry')
    expect(screen.getByLabelText(/^major, specialisation or trade$/i)).toHaveAttribute(
      'placeholder', 'e.g. Paediatric nursing, Cabinetmaking, Financial accounting')
    expect(screen.getByLabelText(/target occupation/i)).toHaveAttribute(
      'placeholder', 'e.g. Registered Nurse, Cabinetmaker, Financial Accountant, Early Childhood Educator')
    expect(screen.getByLabelText(/current skills/i)).toHaveAttribute(
      'placeholder', 'e.g. Basic bookkeeping, MS Excel, customer service, First Aid certificate')
    expect(screen.getByLabelText(/certifications/i)).toHaveAttribute(
      'placeholder', 'e.g. White Card, Responsible Service of Alcohol (RSA), First Aid Certificate')
    expect(screen.getByLabelText(/employment or volunteer experience/i)).toHaveAttribute(
      'placeholder', 'e.g. Part-time retail assistant (6 months), unpaid childcare placement (3 weeks)')
    expect(screen.getByLabelText(/other work preferences/i)).toHaveAttribute(
      'placeholder', 'e.g. prefer a supportive team culture, interested in the not-for-profit sector')
    expect(screen.getByLabelText(/existing licences/i)).toHaveAttribute(
      'placeholder', "e.g. Provisional driver's licence, Working with Children Check, White Card")
  })
})
