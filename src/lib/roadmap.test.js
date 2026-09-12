import { describe, it, expect } from 'vitest'
import { getExpectedPeriodLabels, periodYearFor, computeRoadmap, computeStats, pickCurrentPeriod } from './roadmap'

const studentProfile = { studyStage: 'midway', graduationYear: '2027', courseLengthYears: '4', targetOccupation: 'Data Analyst' }
const gradProfile = { studyStage: 'recently-completed', graduationYear: '2023', targetOccupation: 'Data Analyst' }

describe('getExpectedPeriodLabels', () => {
  it('returns Year 1..N for a studying profile', () => {
    expect(getExpectedPeriodLabels(studentProfile)).toEqual(['Year 1', 'Year 2', 'Year 3', 'Year 4'])
  })
  it('returns the graduate label set for a recently-completed profile', () => {
    expect(getExpectedPeriodLabels(gradProfile)).toEqual(['Before graduating', 'Year 1 after graduating', 'Year 2 after graduating', 'Year 3 after graduating'])
  })
})

describe('periodYearFor', () => {
  it('maps Year N to graduationYear - courseLengthYears + 1 + (N-1)', () => {
    expect(periodYearFor('Year 1', studentProfile)).toBe(2024)
    expect(periodYearFor('Year 3', studentProfile)).toBe(2026)
  })
  it('maps "Before graduating" to null', () => {
    expect(periodYearFor('Before graduating', gradProfile)).toBeNull()
  })
  it('maps "Year N after graduating" to graduationYear + N', () => {
    expect(periodYearFor('Year 2 after graduating', gradProfile)).toBe(2025)
  })
  it('returns null for an unrecognised label', () => {
    expect(periodYearFor('Some other label', studentProfile)).toBeNull()
  })
})

describe('computeRoadmap', () => {
  it('colours and pins checkpoints matching the mockup scenario (currentYear=2026, Year3 pinned)', () => {
    const activities = [
      { title: 'Choose a relevant degree/course', period: 'Year 1', status: 'Completed', category: 'Application preparation', priority: 'High', explanation: '' },
      { title: 'Join a club or student society', period: 'Year 1', status: 'Completed', category: 'Networking', priority: 'Medium', explanation: '' },
      { title: 'Build basic skills', period: 'Year 1', status: 'Completed', category: 'Technical skills', priority: 'High', explanation: '' },
      { title: 'Take relevant subjects', period: 'Year 2', status: 'Completed', category: 'Technical skills', priority: 'High', explanation: '' },
      { title: 'Work on personal projects', period: 'Year 2', status: 'Completed', category: 'Practical competencies/placements/portfolio evidence', priority: 'Medium', explanation: '' },
      { title: 'Apply for a part-time role', period: 'Year 2', status: 'Not started', category: 'Work experience', priority: 'Medium', explanation: '' },
      { title: 'Apply for internships', period: 'Year 3', status: 'Not started', category: 'Work experience', priority: 'High', explanation: '' },
      { title: 'Obtain a relevant certification', period: 'Year 3', status: 'Not started', category: 'Certifications', priority: 'Medium', explanation: '' },
      { title: 'Build a portfolio', period: 'Year 3', status: 'Not started', category: 'Practical competencies/placements/portfolio evidence', priority: 'Medium', explanation: '' },
      { title: 'Polish my resume and LinkedIn', period: 'Year 4', status: 'Not started', category: 'Application preparation', priority: 'Medium', explanation: '' },
      { title: 'Apply for graduate programs', period: 'Year 4', status: 'Not started', category: 'Application preparation', priority: 'High', explanation: '' },
    ]
    const result = computeRoadmap(activities, studentProfile, 2026)
    const byTitle = Object.fromEntries(result.map((a) => [a.title, a]))
    expect(byTitle['Choose a relevant degree/course'].colour).toBe('completed')
    expect(byTitle['Apply for a part-time role'].colour).toBe('missed')
    expect(byTitle['Apply for internships'].colour).toBe('current')
    expect(byTitle['Apply for internships'].isPinned).toBe(true)
    expect(byTitle['Obtain a relevant certification'].colour).toBe('upcoming')
    expect(byTitle['Polish my resume and LinkedIn'].colour).toBe('upcoming')
    expect(result.filter((a) => a.isPinned)).toHaveLength(1)
  })

  it('prefers an activity\'s own already-known periodYear over recomputing from profile (e.g. loaded from Supabase without a full profile)', () => {
    const sparseProfile = { targetOccupation: 'Data Analyst' } // no studyStage/graduationYear/courseLengthYears
    const activities = [
      { title: 'Loaded past activity', period: 'Year 1', periodYear: 2024, status: 'Completed', category: 'Technical skills', priority: 'High', explanation: '' },
      { title: 'Loaded future activity', period: 'Year 3', periodYear: 2026, status: 'Not started', category: 'Work experience', priority: 'High', explanation: '' },
    ]
    const result = computeRoadmap(activities, sparseProfile, 2026)
    const byTitle = Object.fromEntries(result.map((a) => [a.title, a]))
    expect(byTitle['Loaded past activity'].periodYear).toBe(2024)
    expect(byTitle['Loaded past activity'].colour).toBe('completed')
    expect(byTitle['Loaded future activity'].periodYear).toBe(2026)
    expect(byTitle['Loaded future activity'].colour).toBe('current')
  })

  it('forces the "Before graduating" activity to Completed/green regardless of its input status', () => {
    const result = computeRoadmap([
      { title: 'Everything before graduating', period: 'Before graduating', status: 'Not started', category: 'Application preparation', priority: 'Low', explanation: '' },
    ], gradProfile, 2026)
    expect(result[0].status).toBe('Completed')
    expect(result[0].colour).toBe('completed')
  })
})

describe('pickCurrentPeriod', () => {
  it('picks the first Year N period whose derived year is >= currentYear', () => {
    const profile = { studyStage: 'midway', graduationYear: '2028', courseLengthYears: '4' }
    // Year 1=2025, Year 2=2026, Year 3=2027, Year 4=2028
    expect(pickCurrentPeriod(profile, 2026)).toEqual({ periodLabel: 'Year 2', periodYear: 2026 })
  })

  it('falls back to the last defined period when currentYear is past every period', () => {
    const profile = { studyStage: 'midway', graduationYear: '2024', courseLengthYears: '2' }
    // Year 1=2023, Year 2=2024
    expect(pickCurrentPeriod(profile, 2026)).toEqual({ periodLabel: 'Year 2', periodYear: 2024 })
  })

  it('never returns "Before graduating" for a recently-completed profile', () => {
    const profile = { studyStage: 'recently-completed', graduationYear: '2025' }
    const result = pickCurrentPeriod(profile, 2026)
    expect(result.periodLabel).not.toBe('Before graduating')
    expect(result).toEqual({ periodLabel: 'Year 1 after graduating', periodYear: 2026 })
  })
})

describe('computeStats', () => {
  it('counts completed/inProgress/upcoming/overdue and groups by category, excluding "Before graduating"', () => {
    const roadmap = [
      { period: 'Before graduating', status: 'Completed', colour: 'completed', category: 'Application preparation' },
      { period: 'Year 1', status: 'Completed', colour: 'completed', category: 'Technical skills' },
      { period: 'Year 2', status: 'In progress', colour: 'upcoming', category: 'Technical skills' },
      { period: 'Year 2', status: 'Not started', colour: 'missed', category: 'Work experience' },
      { period: 'Year 3', status: 'Not started', colour: 'current', category: 'Work experience' },
    ]
    const stats = computeStats(roadmap)
    expect(stats).toEqual({
      completed: 1,
      inProgress: 1,
      upcoming: 1,
      overdue: 1,
      byCategory: {
        'Technical skills': { completed: 1, total: 2 },
        'Work experience': { completed: 0, total: 2 },
      },
    })
  })
})
