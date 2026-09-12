import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const mockUseAuth = vi.fn()
vi.mock('../lib/auth', () => ({ useAuth: () => mockUseAuth() }))
import CheckpointPanel from './CheckpointPanel'

const activity = {
  id: 'a1',
  title: 'Apply for internships',
  category: 'Work experience',
  priority: 'High',
  explanation: 'Real-world exposure.',
  status: 'Not started',
}

function renderPanel(props = {}) {
  return render(
    <MemoryRouter>
      <CheckpointPanel
        activity={activity}
        onClose={vi.fn()}
        onStatusChange={vi.fn()}
        onRemove={vi.fn()}
        onAddEntry={vi.fn()}
        onRequestFeedback={vi.fn()}
        {...props}
      />
    </MemoryRouter>
  )
}

describe('CheckpointPanel', () => {
  it("renders the activity's title, category, priority, and explanation", () => {
    mockUseAuth.mockReturnValue({ user: null })
    renderPanel()
    expect(screen.getByText('Apply for internships')).toBeInTheDocument()
    expect(screen.getByText(/work experience/i)).toBeInTheDocument()
    expect(screen.getByText(/high/i)).toBeInTheDocument()
    expect(screen.getByText('Real-world exposure.')).toBeInTheDocument()
  })

  it('renders status as read-only text, plus a locked status control and a locked Remove control, for a signed-out guest', () => {
    mockUseAuth.mockReturnValue({ user: null })
    renderPanel()
    expect(screen.getByText('Not started')).toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(screen.getAllByText(/create an account to unlock/i).length).toBeGreaterThan(0)
  })

  it('renders an interactive status <select> for a signed-in user, calling onStatusChange(newStatus) when changed', () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } })
    const onStatusChange = vi.fn()
    renderPanel({ onStatusChange })
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'Completed' } })
    expect(onStatusChange).toHaveBeenCalledWith('Completed')
  })

  it('renders an active Remove button for a signed-in user, calling onRemove() when clicked', () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } })
    const onRemove = vi.fn()
    renderPanel({ onRemove })
    fireEvent.click(screen.getByRole('button', { name: /remove/i }))
    expect(onRemove).toHaveBeenCalled()
  })

  it("calls onClose when the panel's close control is clicked", () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } })
    const onClose = vi.fn()
    renderPanel({ onClose })
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('caps the dialog height and scrolls internally, so a long diary entry list stays reachable', () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } })
    renderPanel()
    const dialog = screen.getByRole('dialog', { name: 'Apply for internships' })
    expect(dialog.className).toMatch(/max-h-/)
    expect(dialog.className).toMatch(/overflow-y-auto/)
  })

  it('renders a locked "Create an account to keep a diary" prompt instead of the diary section for a signed-out guest', () => {
    mockUseAuth.mockReturnValue({ user: null })
    renderPanel()
    expect(screen.getByText(/create an account to keep a diary/i)).toBeInTheDocument()
  })

})
