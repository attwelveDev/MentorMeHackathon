import { describe, it, expect } from 'vitest'
import { TOPICS, STATUS_LABELS, matchesProfile, recencyBucket, isValidClassifiedItem, filterAndSortUpdates } from './marketUpdates'

describe('matchesProfile', () => {
  it('matches when occupation substring (case-insensitive) and state both match', () => {
    expect(matchesProfile({ occupation: 'Registered Nurse', state: 'NSW' }, { targetOccupation: 'registered nurse', state: 'NSW' })).toBe(true)
  })
  it('matches a National-scope item regardless of profile state', () => {
    expect(matchesProfile({ occupation: 'Carpenter', state: 'National' }, { targetOccupation: 'Carpenter', state: 'QLD' })).toBe(true)
  })
  it('does not match when occupation differs', () => {
    expect(matchesProfile({ occupation: 'Carpenter', state: 'National' }, { targetOccupation: 'Registered Nurse', state: 'QLD' })).toBe(false)
  })
  it('does not match when state differs and item is not National', () => {
    expect(matchesProfile({ occupation: 'Carpenter', state: 'VIC' }, { targetOccupation: 'Carpenter', state: 'QLD' })).toBe(false)
  })
})

describe('recencyBucket', () => {
  it('buckets a date within 7 days as this-week', () => {
    expect(recencyBucket('2026-09-10', new Date('2026-09-13'))).toBe('this-week')
  })
  it('buckets a date within 30 days (but not 7) as this-month', () => {
    expect(recencyBucket('2026-08-20', new Date('2026-09-13'))).toBe('this-month')
  })
  it('buckets anything older as older', () => {
    expect(recencyBucket('2026-01-01', new Date('2026-09-13'))).toBe('older')
  })
})

describe('isValidClassifiedItem', () => {
  it('accepts an item with an in-enum topic and statusLabel and non-empty text fields', () => {
    expect(isValidClassifiedItem({ headline: 'H', summary: 'S', whyItMatters: 'W', topic: 'Technology', statusLabel: 'Forecast' })).toBe(true)
  })
  it('rejects an out-of-enum topic', () => {
    expect(isValidClassifiedItem({ headline: 'H', summary: 'S', whyItMatters: 'W', topic: 'Sports', statusLabel: 'Forecast' })).toBe(false)
  })
  it('rejects an out-of-enum statusLabel', () => {
    expect(isValidClassifiedItem({ headline: 'H', summary: 'S', whyItMatters: 'W', topic: 'Technology', statusLabel: 'Rumour' })).toBe(false)
  })
  it('rejects a missing/empty required text field', () => {
    expect(isValidClassifiedItem({ headline: '', summary: 'S', whyItMatters: 'W', topic: 'Technology', statusLabel: 'Forecast' })).toBe(false)
  })
})

describe('filterAndSortUpdates', () => {
  const items = [
    // publishedDate chosen to be within 7 days of the 'today' used below (2026-09-13),
    // so it falls in the this-week bucket (Phase 1 correction: originally 2026-09-01,
    // 12 days out, which recencyBucket buckets as this-month, not this-week)
    { id: 'a', topic: 'Technology', publishedDate: '2026-09-10', headline: 'AI shortage', summary: 'x', source: 'JSA' },
    { id: 'b', topic: 'Policy', publishedDate: '2026-08-01', headline: 'Visa change', summary: 'y', source: 'Home Affairs' },
  ]
  it('returns all items sorted newest-first when topic is All and recency is All and search is empty', () => {
    expect(filterAndSortUpdates(items, { topic: 'All', recency: 'All', search: '' }, new Date('2026-09-13')).map((i) => i.id)).toEqual(['a', 'b'])
  })
  it('filters by topic', () => {
    expect(filterAndSortUpdates(items, { topic: 'Policy', recency: 'All', search: '' }, new Date('2026-09-13')).map((i) => i.id)).toEqual(['b'])
  })
  it('filters by recency bucket', () => {
    expect(filterAndSortUpdates(items, { topic: 'All', recency: 'this-week', search: '' }, new Date('2026-09-13')).map((i) => i.id)).toEqual(['a'])
  })
  it('filters by case-insensitive search across headline/summary/topic/source', () => {
    expect(filterAndSortUpdates(items, { topic: 'All', recency: 'All', search: 'visa' }, new Date('2026-09-13')).map((i) => i.id)).toEqual(['b'])
  })
})
