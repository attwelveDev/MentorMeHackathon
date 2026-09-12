import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getCareerReadinessAnalysis, generateCareerPlan, getDiaryFeedback } from './ai'

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({
      task: 'readiness-analysis',
      text: '{"strengths":[],"skillGaps":[],"experienceGaps":[],"licencesToInvestigate":[],"insufficientInformation":[]}',
    }),
  })
})

describe('getCareerReadinessAnalysis', () => {
  it('instructs the model not to address visa subclass, sponsorship, or migration eligibility', async () => {
    await getCareerReadinessAnalysis({ qualification: 'Bachelor of IT', workRights: 'citizen-or-pr' })
    expect(global.fetch).toHaveBeenCalledWith('/api/generate', expect.objectContaining({ method: 'POST' }))
    const [, options] = global.fetch.mock.calls[0]
    const body = JSON.parse(options.body)
    expect(body.prompt).toMatch(
      /do not comment on, assess, or list visa subclass, sponsorship pathways, or migration eligibility/i
    )
  })
})

describe('generateCareerPlan', () => {
  it('constrains the prompt to the exact expected period labels for the given profile', async () => {
    const profile = { studyStage: 'midway', graduationYear: '2027', courseLengthYears: '4', targetOccupation: 'Data Analyst' }
    await generateCareerPlan(profile)
    const [, options] = global.fetch.mock.calls[0]
    const body = JSON.parse(options.body)
    expect(body.prompt).toContain('"Year 1"')
    expect(body.prompt).toContain('"Year 4"')
    expect(body.prompt).not.toContain('"Now"')
  })

  it('uses the graduate label set and instructs a single completed "Before graduating" summary activity for recently-completed students', async () => {
    const profile = { studyStage: 'recently-completed', graduationYear: '2023', targetOccupation: 'Data Analyst' }
    await generateCareerPlan(profile)
    const [, options] = global.fetch.mock.calls[0]
    const body = JSON.parse(options.body)
    expect(body.prompt).toContain('Before graduating')
    expect(body.prompt).toContain('Year 1 after graduating')
    expect(body.prompt).toMatch(/already graduated/i)
  })
})

describe('getDiaryFeedback', () => {
  it('sends the activity and entry text and returns the feedback text', async () => {
    global.fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ task: 'diary-feedback', text: 'Great progress, keep it up!' }) })
    const result = await getDiaryFeedback({ title: 'Apply for internships', category: 'Work experience' }, 'Applied to two internships this week.')
    expect(result).toBe('Great progress, keep it up!')
    const [, options] = global.fetch.mock.calls[0]
    const body = JSON.parse(options.body)
    expect(body.prompt).toContain('Apply for internships')
    expect(body.prompt).toContain('Applied to two internships this week.')
  })

  it('instructs the model not to provide visa, migration, legal, financial, or licensing advice, or guarantee any outcome', async () => {
    global.fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ task: 'diary-feedback', text: 'ok' }) })
    await getDiaryFeedback({ title: 'x', category: 'y' }, 'entry')
    const [, options] = global.fetch.mock.calls[0]
    const body = JSON.parse(options.body)
    expect(body.prompt).toMatch(/do not comment on, assess, or provide visa, migration, legal, financial, or licensing advice/i)
    expect(body.prompt).toMatch(/do not guarantee any employment or migration outcome/i)
  })
})
