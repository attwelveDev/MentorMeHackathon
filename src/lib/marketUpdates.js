export const TOPICS = ['Economy', 'Policy', 'Regulation', 'Technology', 'Workforce demand', 'Employer activity']
export const STATUS_LABELS = ['Confirmed change', 'Proposal', 'Forecast', 'Research', 'Commentary']

export function matchesProfile(item, profile) {
  const occupationMatches = (item.occupation ?? '').toLowerCase().includes((profile.targetOccupation ?? '').toLowerCase())
  const stateMatches = item.state === 'National' || item.state === profile.state
  return occupationMatches && stateMatches
}

export function recencyBucket(publishedDate, today = new Date()) {
  const days = (today - new Date(publishedDate)) / (1000 * 60 * 60 * 24)
  if (days <= 7) return 'this-week'
  if (days <= 30) return 'this-month'
  return 'older'
}

export function isValidClassifiedItem(item) {
  return TOPICS.includes(item.topic)
    && STATUS_LABELS.includes(item.statusLabel)
    && Boolean(item.headline) && Boolean(item.summary) && Boolean(item.whyItMatters)
}

export function filterAndSortUpdates(items, { topic, recency, search }, today = new Date()) {
  const q = search.trim().toLowerCase()
  return items
    .filter((i) => topic === 'All' || i.topic === topic)
    .filter((i) => recency === 'All' || recencyBucket(i.publishedDate, today) === recency)
    .filter((i) => !q || [i.headline, i.summary, i.topic, i.source].some((f) => (f ?? '').toLowerCase().includes(q)))
    .sort((a, b) => new Date(b.publishedDate) - new Date(a.publishedDate))
}
