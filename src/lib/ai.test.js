import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getCareerReadinessAnalysis } from './ai'

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
