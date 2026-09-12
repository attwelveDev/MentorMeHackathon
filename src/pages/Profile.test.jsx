import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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
  render(<Profile />)
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

function fillOtherRequiredFields({ studyStage = STUDY_STAGES[0].value } = {}) {
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
  it('renders Course/program length in years as a required text field', () => {
    render(<Profile />)
    fillOtherRequiredFields()
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

  it.each(['0', '7', 'abc'])('blocks submission when Course/program length in years is %s', (value) => {
    render(<Profile />)
    fillOtherRequiredFields()
    fireEvent.change(screen.getByLabelText(/course\/program length in years/i), { target: { value } })
    fireEvent.click(screen.getByRole('button', { name: /create my plan/i }))
    expect(mockNavigate).not.toHaveBeenCalled()
    expect(screen.getByText(/enter a whole number between 1 and 6/i)).toBeInTheDocument()
  })

  it.each(['1', '6'])('allows submission when Course/program length in years is the boundary value %s', (value) => {
    render(<Profile />)
    fillOtherRequiredFields()
    fireEvent.change(screen.getByLabelText(/course\/program length in years/i), { target: { value } })
    fireEvent.click(screen.getByRole('button', { name: /create my plan/i }))
    expect(mockNavigate).toHaveBeenCalled()
  })

  it('hides the Course/program length in years field when study stage is Recently completed', () => {
    render(<Profile />)
    fireEvent.change(screen.getByLabelText(/current study stage/i), { target: { value: 'recently-completed' } })
    expect(screen.queryByLabelText(/course\/program length in years/i)).not.toBeInTheDocument()
  })

  it('does not require Course/program length in years when study stage is Recently completed', () => {
    render(<Profile />)
    fillOtherRequiredFields({ studyStage: 'recently-completed' })
    fireEvent.click(screen.getByRole('button', { name: /create my plan/i }))
    expect(mockNavigate).toHaveBeenCalled()
  })
})

describe('Profile qualification "none yet" checkbox', () => {
  it('disables the qualification input and satisfies the required check when checked', () => {
    render(<Profile />)
    fireEvent.click(screen.getByLabelText(/i don't have a qualification yet/i))
    expect(screen.getByLabelText(/course or qualification/i)).toBeDisabled()
    expect(screen.getByLabelText(/course or qualification/i)).toHaveValue('No formal qualification yet')
  })

  it('re-enables and clears the qualification input when unchecked', () => {
    render(<Profile />)
    const checkbox = screen.getByLabelText(/i don't have a qualification yet/i)
    fireEvent.click(checkbox)
    fireEvent.click(checkbox)
    expect(screen.getByLabelText(/course or qualification/i)).not.toBeDisabled()
    expect(screen.getByLabelText(/course or qualification/i)).toHaveValue('')
  })

  it('allows submission using the "no qualification yet" sentinel in place of free text', () => {
    render(<Profile />)
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
    render(<Profile />)
    fireEvent.click(screen.getByLabelText(/i don't have a major, specialisation or trade yet/i))
    expect(screen.getByLabelText(/^major, specialisation or trade$/i)).toBeDisabled()
    expect(screen.getByLabelText(/^major, specialisation or trade$/i)).toHaveValue('No specific major or specialisation')
  })

  it('re-enables and clears the specialisation input when unchecked', () => {
    render(<Profile />)
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
    render(<Profile />)
    const select = screen.getByLabelText(/work rights/i)
    expect(select.tagName).toBe('SELECT')
    WORK_RIGHTS.forEach((opt) => {
      expect(screen.getByRole('option', { name: opt.label })).toBeInTheDocument()
    })
  })

  it('renders the self-reported disclaimer near the field', () => {
    render(<Profile />)
    expect(screen.getByText(/self-reported.*doesn't verify this or provide visa\/migration advice/i)).toBeInTheDocument()
  })

  it('blocks submission and shows an error when Work rights is left unselected', () => {
    render(<Profile />)
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
    render(<Profile />)
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

describe('Profile free-text field placeholders', () => {
  it('renders the example placeholder text on each free-text field', () => {
    render(<Profile />)
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
