import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFrom = vi.fn()
vi.mock('./supabaseClient', () => ({ supabase: { from: (...args) => mockFrom(...args) } }))
import { getPlanWithActivities, createPlanWithActivities, updateActivityStatus, setPlanAccepted, deleteActivity, getProfile, saveProfile } from './db'

beforeEach(() => { mockFrom.mockReset() })

function chain(result) {
  const builder = {
    select: () => builder, eq: () => builder, order: () => builder,
    limit: () => builder, single: () => Promise.resolve(result), maybeSingle: () => Promise.resolve(result),
    insert: () => builder, update: () => builder, delete: () => builder, upsert: () => builder,
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  }
  return builder
}

describe('getPlanWithActivities', () => {
  it('returns null when the user has no plan', async () => {
    mockFrom.mockReturnValueOnce(chain({ data: null, error: null }))
    expect(await getPlanWithActivities('u1')).toBeNull()
  })

  it('returns the most recent plan with its activities ordered by sort_order', async () => {
    mockFrom
      .mockReturnValueOnce(chain({ data: { id: 'p1', user_id: 'u1' }, error: null }))
      .mockReturnValueOnce(chain({ data: [{ id: 'a1', sort_order: 0 }], error: null }))
    const result = await getPlanWithActivities('u1')
    expect(result.plan).toEqual({ id: 'p1', user_id: 'u1' })
    expect(result.activities).toEqual([{ id: 'a1', sort_order: 0 }])
  })
})

describe('createPlanWithActivities', () => {
  it('inserts a plans row then an activities row per activity, mapping period->period_label and periodYear->period_year', async () => {
    mockFrom
      .mockReturnValueOnce(chain({ data: { id: 'p1' }, error: null }))
      .mockReturnValueOnce(chain({ data: [{ id: 'a1' }], error: null }))
    const activities = [{ title: 'x', category: 'Technical skills', period: 'Year 1', periodYear: 2024, priority: 'High', explanation: 'why', status: 'Not started' }]
    const result = await createPlanWithActivities('u1', 'Data Analyst', activities)
    expect(result.plan).toEqual({ id: 'p1' })
    expect(result.activities).toEqual([{ id: 'a1' }])
  })

  it('throws when the plans insert errors', async () => {
    mockFrom.mockReturnValueOnce(chain({ data: null, error: { message: 'boom' } }))
    await expect(createPlanWithActivities('u1', 'Data Analyst', [])).rejects.toThrow('boom')
  })
})

describe('updateActivityStatus / setPlanAccepted', () => {
  it('updateActivityStatus resolves without throwing on success', async () => {
    mockFrom.mockReturnValueOnce(chain({ error: null }))
    await expect(updateActivityStatus('a1', 'Completed')).resolves.toBeUndefined()
  })
  it('setPlanAccepted resolves without throwing on success', async () => {
    mockFrom.mockReturnValueOnce(chain({ error: null }))
    await expect(setPlanAccepted('p1', true)).resolves.toBeUndefined()
  })
  it('deleteActivity resolves without throwing on success', async () => {
    mockFrom.mockReturnValueOnce(chain({ error: null }))
    await expect(deleteActivity('a1')).resolves.toBeUndefined()
  })
  it('deleteActivity throws with the underlying error message on failure', async () => {
    mockFrom.mockReturnValueOnce(chain({ error: { message: 'boom' } }))
    await expect(deleteActivity('a1')).rejects.toThrow('boom')
  })
})

describe('getProfile / saveProfile', () => {
  it('getProfile returns null when the user has no saved profile', async () => {
    mockFrom.mockReturnValueOnce(chain({ data: null, error: null }))
    expect(await getProfile('u1')).toBeNull()
  })

  it('getProfile returns the saved row when present', async () => {
    mockFrom.mockReturnValueOnce(chain({ data: { user_id: 'u1', target_occupation: 'Data Analyst' }, error: null }))
    expect(await getProfile('u1')).toEqual({ user_id: 'u1', target_occupation: 'Data Analyst' })
  })

  it('saveProfile upserts the profile, mapping camelCase fields to snake_case columns', async () => {
    mockFrom.mockReturnValueOnce(chain({ error: null }))
    await saveProfile('u1', {
      qualification: 'Bachelor of IT',
      specialisation: '',
      educationSector: 'higher-education',
      studyStage: 'midway',
      graduationYear: '2027',
      courseLengthYears: '4',
      targetOccupation: 'Data Analyst',
      state: '',
      workRights: 'citizen-or-pr',
      skills: 'SQL',
      certifications: '',
      experience: 'Retail',
      employmentArrangement: '',
      workLocationMode: '',
      otherPreferences: '',
      licences: '',
    })
    expect(mockFrom).toHaveBeenCalledWith('profiles')
  })

  it('saveProfile throws with the underlying error message on failure', async () => {
    mockFrom.mockReturnValueOnce(chain({ error: { message: 'boom' } }))
    await expect(saveProfile('u1', {})).rejects.toThrow('boom')
  })
})
