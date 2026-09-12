import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

import UpdateDetailPanel from './UpdateDetailPanel'

const update = {
  id: 'u1', headline: 'Nurse shortage continues', summary: 'Summary text.',
  whyItMatters: 'This affects your target occupation.', statusLabel: 'Research',
  topic: 'Workforce demand', source: 'Jobs and Skills Australia',
  publishedDate: '2026-08-01', retrievedDate: '2026-09-13',
}

function renderPanel(props = {}) {
  return render(
    <UpdateDetailPanel
      update={update} savedStatus={null} canAddToPlan={true}
      onClose={vi.fn()} onSave={vi.fn()} onDismiss={vi.fn()} onAddToPlan={vi.fn()}
      {...props}
    />
  )
}

it('shows headline, summary, why-it-matters, status label, source, and both dates', () => {
  renderPanel()
  expect(screen.getByText('Nurse shortage continues')).toBeInTheDocument()
  expect(screen.getByText('Summary text.')).toBeInTheDocument()
  expect(screen.getByText('This affects your target occupation.')).toBeInTheDocument()
  expect(screen.getByText('Research')).toBeInTheDocument()
  expect(screen.getByText(/Jobs and Skills Australia/)).toBeInTheDocument()
  expect(screen.getByText(/2026-08-01/)).toBeInTheDocument()
  expect(screen.getByText(/2026-09-13/)).toBeInTheDocument()
})

it('calls onSave when the Save button is clicked, and reflects an already-saved status', () => {
  const onSave = vi.fn()
  renderPanel({ onSave, savedStatus: 'saved' })
  expect(screen.getByRole('button', { name: /saved/i })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /saved/i }))
  expect(onSave).toHaveBeenCalled()
})

it('calls onDismiss when Dismiss is clicked', () => {
  const onDismiss = vi.fn()
  renderPanel({ onDismiss })
  fireEvent.click(screen.getByRole('button', { name: /dismiss/i }))
  expect(onDismiss).toHaveBeenCalled()
})

it('calls onAddToPlan when Add to plan is clicked, and disables it when canAddToPlan is false', () => {
  const onAddToPlan = vi.fn()
  renderPanel({ onAddToPlan })
  fireEvent.click(screen.getByRole('button', { name: /add to plan/i }))
  expect(onAddToPlan).toHaveBeenCalled()
})

it('disables Add to plan when canAddToPlan is false, with an explanatory note', () => {
  renderPanel({ canAddToPlan: false })
  expect(screen.getByRole('button', { name: /add to plan/i })).toBeDisabled()
  expect(screen.getByText(/create a plan first/i)).toBeInTheDocument()
})
