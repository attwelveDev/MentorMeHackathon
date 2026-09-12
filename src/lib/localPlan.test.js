import { describe, it, expect, beforeEach } from 'vitest'
import { saveGuestPlan, loadGuestPlan, clearGuestPlan } from './localPlan'

beforeEach(() => localStorage.clear())

describe('localPlan', () => {
  it('round-trips a saved plan through loadGuestPlan', () => {
    const profile = { targetOccupation: 'Data Analyst' }
    const activities = [{ title: 'x' }]
    expect(saveGuestPlan(profile, activities)).toEqual({ ok: true })
    const loaded = loadGuestPlan()
    expect(loaded.profile).toEqual(profile)
    expect(loaded.activities).toEqual(activities)
    expect(typeof loaded.savedAt).toBe('string')
  })

  it('returns null from loadGuestPlan when nothing is saved', () => {
    expect(loadGuestPlan()).toBeNull()
  })

  it('removes the saved plan via clearGuestPlan', () => {
    saveGuestPlan({}, [])
    clearGuestPlan()
    expect(loadGuestPlan()).toBeNull()
  })

  it('returns { ok: false, error } instead of throwing when localStorage.setItem throws', () => {
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = () => { throw new Error('QuotaExceededError') }
    const result = saveGuestPlan({}, [])
    expect(result.ok).toBe(false)
    expect(typeof result.error).toBe('string')
    Storage.prototype.setItem = original
  })
})
