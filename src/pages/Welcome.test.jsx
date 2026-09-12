import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Welcome from './Welcome'

describe('Welcome', () => {
  it('renders a responsible-AI notice and a separate privacy statement', () => {
    render(<MemoryRouter><Welcome /></MemoryRouter>)
    const aiNotice = screen.getByTestId('ai-notice')
    const privacyStatement = screen.getByTestId('privacy-statement')
    expect(aiNotice).toBeInTheDocument()
    expect(privacyStatement).toBeInTheDocument()
    expect(aiNotice).not.toBe(privacyStatement)
    expect(privacyStatement.textContent).toMatch(/session/i)
    expect(privacyStatement.textContent).toMatch(/not saved to an account/i)
  })

  it('links the CTA to /profile', () => {
    render(<MemoryRouter><Welcome /></MemoryRouter>)
    expect(screen.getByRole('link', { name: /create my career plan/i })).toHaveAttribute('href', '/profile')
  })
})
