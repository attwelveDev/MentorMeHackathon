import { describe, it, expect } from 'vitest'
import { getNearestActivityNotification, getStreakNotification } from './notifications'

describe('getNearestActivityNotification', () => {
  it('returns null when there are no upcoming/overdue/current activities', () => {
    expect(getNearestActivityNotification([])).toBeNull()
  })
  it('prefers an overdue ("missed") activity over an upcoming one', () => {
    const roadmap = [
      { title: 'Upcoming task', colour: 'upcoming', dueDate: null, period: 'Year 3' },
      { title: 'Overdue task', colour: 'missed', dueDate: null, period: 'Year 2' },
    ]
    expect(getNearestActivityNotification(roadmap).title).toBe('Overdue task')
  })
  it('falls back to the pinned "current" activity when nothing is overdue', () => {
    const roadmap = [{ title: 'Pinned task', colour: 'current', dueDate: '2026-05-01', period: 'Year 3' }]
    expect(getNearestActivityNotification(roadmap)).toEqual({ title: 'Pinned task', dueDate: '2026-05-01', period: 'Year 3' })
  })
})

describe('getStreakNotification', () => {
  it('returns null when there are zero total activities', () => {
    expect(getStreakNotification({ completed: 0, inProgress: 0, upcoming: 0, overdue: 0, byCategory: {} })).toBeNull()
  })
  it('returns the completed/total percentage rounded to the nearest integer', () => {
    const stats = { completed: 2, inProgress: 1, upcoming: 3, overdue: 1, byCategory: {} }
    // total = completed(2) + inProgress(1) + upcoming(3) + overdue(1) = 7; 2/7 = 28.57%
    expect(getStreakNotification(stats)).toEqual({ percent: 29, completed: 2, total: 7 })
  })
})
