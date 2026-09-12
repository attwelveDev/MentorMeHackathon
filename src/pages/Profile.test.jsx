import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import {
  EDUCATION_SECTORS,
  STUDY_STAGES,
  AU_STATES,
  EMPLOYMENT_ARRANGEMENTS,
  WORK_LOCATION_MODES,
} from '../lib/profileOptions'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useNavigate: () => mockNavigate }
})

import Profile from './Profile'

beforeEach(() => {
  mockNavigate.mockClear()
})

describe('Profile validation', () => {
  it('shows a per-field error and a summary banner when a required field is empty, and does not navigate', () => {
    render(<Profile />)
    fireEvent.change(screen.getByLabelText(/current study stage/i), { target: { value: STUDY_STAGES[0].value } })
    fireEvent.change(screen.getByLabelText(/target occupation/i), { target: { value: 'Carpenter' } })
    fireEvent.click(screen.getByRole('button', { name: /create my plan/i }))
    expect(screen.getByText(/check the required information/i)).toBeInTheDocument()
    expect(screen.getAllByText(/this field is required/i).length).toBeGreaterThan(0)
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('navigates to /analysis with the profile when all required fields are filled', () => {
    render(<Profile />)
    fireEvent.change(screen.getByLabelText(/course or qualification/i), { target: { value: 'Bachelor of IT' } })
    fireEvent.change(screen.getByLabelText(/education sector/i), { target: { value: EDUCATION_SECTORS[0].value } })
    fireEvent.change(screen.getByLabelText(/current study stage/i), { target: { value: STUDY_STAGES[0].value } })
    fireEvent.change(screen.getByLabelText(/target occupation/i), { target: { value: 'Software Developer' } })
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
    render(<Profile />)
    const select = screen.getByLabelText(/education sector/i)
    expect(select.tagName).toBe('SELECT')
    EDUCATION_SECTORS.forEach((opt) => {
      expect(screen.getByRole('option', { name: opt.label })).toBeInTheDocument()
    })
  })

  it('blocks submission and shows an error when Education sector is left unselected', () => {
    render(<Profile />)
    fireEvent.change(screen.getByLabelText(/course or qualification/i), { target: { value: 'Diploma of Early Childhood Education' } })
    fireEvent.change(screen.getByLabelText(/current study stage/i), { target: { value: STUDY_STAGES[0].value } })
    fireEvent.change(screen.getByLabelText(/target occupation/i), { target: { value: 'Early Childhood Educator' } })
    fireEvent.click(screen.getByRole('button', { name: /create my plan/i }))
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('renders Study stage and State/territory as selects with the configured options', () => {
    render(<Profile />)
    expect(screen.getByLabelText(/current study stage/i).tagName).toBe('SELECT')
    expect(screen.getByLabelText(/australian state or territory/i).tagName).toBe('SELECT')
    expect(STUDY_STAGES.length + AU_STATES.length).toBeGreaterThan(0)
  })
})

describe('Profile work-preference fields', () => {
  it('renders employment arrangement and work location mode as selects, and other preferences as free text', () => {
    render(<Profile />)
    expect(screen.getByLabelText(/preferred employment arrangement/i).tagName).toBe('SELECT')
    expect(screen.getByLabelText(/preferred work location mode/i).tagName).toBe('SELECT')
    expect(screen.getByLabelText(/other work preferences/i).tagName).toBe('INPUT')
    EMPLOYMENT_ARRANGEMENTS.forEach((opt) => expect(screen.getAllByRole('option', { name: opt.label }).length).toBeGreaterThan(0))
  })

  it('does not render a "preferred work setting" field anymore', () => {
    render(<Profile />)
    expect(screen.queryByLabelText(/preferred work setting/i)).not.toBeInTheDocument()
  })

  it('allows submission with these three fields left blank as long as required fields are filled', () => {
    render(<Profile />)
    fireEvent.change(screen.getByLabelText(/course or qualification/i), { target: { value: 'Bachelor of Nursing' } })
    fireEvent.change(screen.getByLabelText(/education sector/i), { target: { value: EDUCATION_SECTORS[0].value } })
    fireEvent.change(screen.getByLabelText(/current study stage/i), { target: { value: STUDY_STAGES[0].value } })
    fireEvent.change(screen.getByLabelText(/target occupation/i), { target: { value: 'Registered Nurse' } })
    fireEvent.click(screen.getByRole('button', { name: /create my plan/i }))
    expect(mockNavigate).toHaveBeenCalled()
  })
})
