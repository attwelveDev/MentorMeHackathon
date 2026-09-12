import { describe, it, expect } from 'vitest'
import {
  EDUCATION_SECTORS,
  STUDY_STAGES,
  AU_STATES,
  EMPLOYMENT_ARRANGEMENTS,
  WORK_LOCATION_MODES,
} from './profileOptions'

describe('profileOptions', () => {
  it('exports 3 education sectors', () => {
    expect(EDUCATION_SECTORS).toEqual([
      { value: 'higher-education', label: 'Higher education (university)' },
      { value: 'vet', label: 'Vocational education and training (VET)' },
      { value: 'other', label: 'Other' },
    ])
  })
  it('exports 4 study stages', () => {
    expect(STUDY_STAGES).toEqual([
      { value: 'just-started', label: 'Just started' },
      { value: 'midway', label: 'Midway through' },
      { value: 'final-stage', label: 'Final year or stage' },
      { value: 'recently-completed', label: 'Recently completed' },
    ])
  })
  it('exports all 8 Australian states/territories', () => {
    expect(AU_STATES).toHaveLength(8)
    expect(AU_STATES.map((s) => s.value)).toEqual([
      'NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT',
    ])
  })
  it('exports 5 employment arrangements', () => {
    expect(EMPLOYMENT_ARRANGEMENTS).toEqual([
      { value: 'full-time', label: 'Full-time' },
      { value: 'part-time', label: 'Part-time' },
      { value: 'casual', label: 'Casual' },
      { value: 'apprenticeship-traineeship', label: 'Apprenticeship or traineeship' },
      { value: 'no-preference', label: 'No preference' },
    ])
  })
  it('exports 4 work location modes', () => {
    expect(WORK_LOCATION_MODES).toEqual([
      { value: 'onsite', label: 'Onsite' },
      { value: 'remote', label: 'Remote' },
      { value: 'hybrid', label: 'Hybrid' },
      { value: 'no-preference', label: 'No preference' },
    ])
  })
})
