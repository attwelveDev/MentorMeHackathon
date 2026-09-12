import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import DiarySection from './DiarySection'

describe('DiarySection', () => {
  it('renders the passed-in diaryEntries list (entry text + timestamp) for a signed-in user', () => {
    render(
      <DiarySection
        diaryEntries={[
          { id: 'd1', entry_text: 'Applied to two internships this week.', created_at: '2026-09-01T00:00:00Z' },
        ]}
        onAddEntry={vi.fn()}
        onRequestFeedback={vi.fn()}
      />
    )
    expect(screen.getByText('Applied to two internships this week.')).toBeInTheDocument()
    expect(screen.getByText(/2026/)).toBeInTheDocument()
  })

  it('submitting the diary entry form calls onAddEntry(text) with the entered text, for a signed-in user', async () => {
    const onAddEntry = vi.fn()
    render(<DiarySection diaryEntries={[]} onAddEntry={onAddEntry} onRequestFeedback={vi.fn()} />)
    fireEvent.change(screen.getByRole('textbox', { name: /diary entry/i }), { target: { value: 'Made progress today.' } })
    fireEvent.click(screen.getByRole('button', { name: /add entry/i }))
    expect(onAddEntry).toHaveBeenCalledWith('Made progress today.')
  })

  it('clicking "Get AI feedback" on an entry without existing feedback calls onRequestFeedback(entry.id)', async () => {
    const onRequestFeedback = vi.fn()
    render(
      <DiarySection
        diaryEntries={[{ id: 'd1', entry_text: 'Entry text', created_at: '2026-09-01T00:00:00Z' }]}
        onAddEntry={vi.fn()}
        onRequestFeedback={onRequestFeedback}
      />
    )
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /get ai feedback/i }))
      await Promise.resolve()
    })
    expect(onRequestFeedback).toHaveBeenCalledWith('d1')
  })

  it('renders existing ai_feedback text under an entry when present, without a "Get AI feedback" button for that entry', () => {
    render(
      <DiarySection
        diaryEntries={[{ id: 'd1', entry_text: 'Entry text', created_at: '2026-09-01T00:00:00Z', ai_feedback: 'Nice work!' }]}
        onAddEntry={vi.fn()}
        onRequestFeedback={vi.fn()}
      />
    )
    expect(screen.getByText('Nice work!')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /get ai feedback/i })).not.toBeInTheDocument()
  })

  it('renders a "Feedback" heading above existing ai_feedback text', () => {
    render(
      <DiarySection
        diaryEntries={[{ id: 'd1', entry_text: 'Entry text', created_at: '2026-09-01T00:00:00Z', ai_feedback: 'Nice work!' }]}
        onAddEntry={vi.fn()}
        onRequestFeedback={vi.fn()}
      />
    )
    expect(screen.getByText('Feedback')).toBeInTheDocument()
  })

  it('shows a loading indicator while feedback is pending for an entry, then clears it once resolved', async () => {
    let resolveFeedback
    const onRequestFeedback = vi.fn(() => new Promise((resolve) => { resolveFeedback = resolve }))
    render(
      <DiarySection
        diaryEntries={[{ id: 'd1', entry_text: 'Entry text', created_at: '2026-09-01T00:00:00Z' }]}
        onAddEntry={vi.fn()}
        onRequestFeedback={onRequestFeedback}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /get ai feedback/i }))
    expect(screen.getByText(/getting feedback/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /get ai feedback/i })).not.toBeInTheDocument()
    await act(async () => {
      resolveFeedback()
      await Promise.resolve()
    })
    expect(screen.queryByText(/getting feedback/i)).not.toBeInTheDocument()
  })

  it('renders the given prompt text as the textarea label when provided', () => {
    render(
      <DiarySection
        diaryEntries={[]}
        onAddEntry={vi.fn()}
        onRequestFeedback={vi.fn()}
        prompt="What did you experience? What did you learn?"
      />
    )
    expect(screen.getByText('What did you experience? What did you learn?')).toBeInTheDocument()
  })
})
