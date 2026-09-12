import { describe, it, expect } from 'vitest'
import { getReflectionPrompt } from './reflectionPrompts'

describe('getReflectionPrompt', () => {
  it('returns the Work-experience-specific prompt', () => {
    expect(getReflectionPrompt('Work experience')).toBe('What did you experience? What did you learn?')
  })
  it('returns the Networking-specific prompt', () => {
    expect(getReflectionPrompt('Networking')).toBe('Who did you meet? What insights did you gain?')
  })
  it('returns the shared skills-learning prompt for Technical skills and Certifications', () => {
    expect(getReflectionPrompt('Technical skills')).toBe('What did you learn? How will you apply it?')
    expect(getReflectionPrompt('Certifications')).toBe('What did you learn? How will you apply it?')
  })
  it('returns the generic fallback prompt for any other category', () => {
    expect(getReflectionPrompt('Networking-adjacent-typo')).toBe("How did it go? What's your next step?")
    expect(getReflectionPrompt('Application preparation')).toBe("How did it go? What's your next step?")
  })
})
