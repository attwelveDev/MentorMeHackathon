import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

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
    fireEvent.change(screen.getByLabelText(/current study stage/i), { target: { value: 'Midway' } })
    fireEvent.change(screen.getByLabelText(/target occupation/i), { target: { value: 'Carpenter' } })
    fireEvent.click(screen.getByRole('button', { name: /create my plan/i }))
    expect(screen.getByText(/check the required information/i)).toBeInTheDocument()
    expect(screen.getByText(/this field is required/i)).toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('navigates to /analysis with the profile when all required fields are filled', () => {
    render(<Profile />)
    fireEvent.change(screen.getByLabelText(/course or qualification/i), { target: { value: 'Bachelor of IT' } })
    fireEvent.change(screen.getByLabelText(/current study stage/i), { target: { value: 'Midway' } })
    fireEvent.change(screen.getByLabelText(/target occupation/i), { target: { value: 'Software Developer' } })
    fireEvent.click(screen.getByRole('button', { name: /create my plan/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/analysis', {
      state: { profile: expect.objectContaining({
        qualification: 'Bachelor of IT',
        studyStage: 'Midway',
        targetOccupation: 'Software Developer',
      }) },
    })
  })
})
