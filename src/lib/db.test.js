import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFrom = vi.fn()
vi.mock('./supabaseClient', () => ({ supabase: { from: (...args) => mockFrom(...args) } }))
import {
  getPlanWithActivities, createPlanWithActivities, updateActivityStatus, setPlanAccepted, deleteActivity, getProfile, saveProfile,
  getDiaryEntriesForActivity, getDiaryEntries, createDiaryEntry, setDiaryEntryFeedback,
  getSavedMarketUpdates, setMarketUpdateStatus, addPlanActivityFromUpdate, setUpdateFrequency,
} from './db'

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

describe('diary entry helpers', () => {
  it('getDiaryEntriesForActivity returns entries ordered most-recent-first', async () => {
    mockFrom.mockReturnValueOnce(chain({ data: [{ id: 'd2' }, { id: 'd1' }], error: null }))
    expect(await getDiaryEntriesForActivity('a1')).toEqual([{ id: 'd2' }, { id: 'd1' }])
  })

  it('getDiaryEntries joins the activity title and respects an optional limit', async () => {
    mockFrom.mockReturnValueOnce(chain({ data: [{ id: 'd1', activity: { title: 'Apply for internships' } }], error: null }))
    const result = await getDiaryEntries('u1', { limit: 3 })
    expect(result).toEqual([{ id: 'd1', activity: { title: 'Apply for internships' } }])
  })

  it('createDiaryEntry inserts and returns the new row', async () => {
    mockFrom.mockReturnValueOnce(chain({ data: { id: 'd3', entry_text: 'text' }, error: null }))
    const result = await createDiaryEntry('a1', 'u1', 'text')
    expect(result).toEqual({ id: 'd3', entry_text: 'text' })
  })

  it('setDiaryEntryFeedback resolves without throwing on success', async () => {
    mockFrom.mockReturnValueOnce(chain({ error: null }))
    await expect(setDiaryEntryFeedback('d1', 'feedback text')).resolves.toBeUndefined()
  })

  it("throws with the underlying message when createDiaryEntry's insert errors", async () => {
    mockFrom.mockReturnValueOnce(chain({ data: null, error: { message: 'boom' } }))
    await expect(createDiaryEntry('a1', 'u1', 'text')).rejects.toThrow('boom')
  })
})

describe('market-update helpers', () => {
  it('getSavedMarketUpdates returns the rows for a user', async () => {
    mockFrom.mockReturnValueOnce(chain({ data: [{ source_id: 's1', status: 'saved' }], error: null }))
    expect(await getSavedMarketUpdates('u1')).toEqual([{ source_id: 's1', status: 'saved' }])
  })

  it('setMarketUpdateStatus upserts a (user_id, source_id) row with the given status', async () => {
    mockFrom.mockReturnValueOnce(chain({ error: null }))
    await expect(setMarketUpdateStatus('u1', 's1', 'saved')).resolves.toBeUndefined()
    expect(mockFrom).toHaveBeenCalledWith('saved_market_updates')
  })

  it('addPlanActivityFromUpdate inserts one activities row and returns it', async () => {
    mockFrom.mockReturnValueOnce(chain({ data: { id: 'a9' }, error: null }))
    const result = await addPlanActivityFromUpdate('p1', 'u1', {
      title: 'Investigate nurse shortage', category: 'Commercial and industry awareness',
      periodLabel: 'Year 2', periodYear: 2026, priority: 'Medium', explanation: 'why',
    })
    expect(result).toEqual({ id: 'a9' })
  })

  it('setUpdateFrequency updates the profiles row for the given user', async () => {
    mockFrom.mockReturnValueOnce(chain({ error: null }))
    await expect(setUpdateFrequency('u1', 'daily')).resolves.toBeUndefined()
    expect(mockFrom).toHaveBeenCalledWith('profiles')
  })

  it('setMarketUpdateStatus throws with the underlying error message on failure', async () => {
    mockFrom.mockReturnValueOnce(chain({ error: { message: 'boom' } }))
    await expect(setMarketUpdateStatus('u1', 's1', 'saved')).rejects.toThrow('boom')
  })
})
