export function getExpectedPeriodLabels(profile) {
  if (profile.studyStage === 'recently-completed') {
    return ['Before graduating', 'Year 1 after graduating', 'Year 2 after graduating', 'Year 3 after graduating']
  }
  const n = Number(profile.courseLengthYears)
  return Array.from({ length: n }, (_, i) => `Year ${i + 1}`)
}

export function periodYearFor(periodLabel, profile) {
  const graduationYear = Number(profile.graduationYear)
  if (periodLabel === 'Before graduating') return null
  const afterMatch = /^Year (\d+) after graduating$/.exec(periodLabel)
  if (afterMatch) return graduationYear + Number(afterMatch[1])
  const yearMatch = /^Year (\d+)$/.exec(periodLabel)
  if (yearMatch) {
    const courseLengthYears = Number(profile.courseLengthYears)
    const startYear = graduationYear - courseLengthYears + 1
    return startYear + Number(yearMatch[1]) - 1
  }
  return null
}

export function computeRoadmap(activities, profile, currentYear = new Date().getFullYear()) {
  const withYear = activities.map((a) => ({
    ...a,
    status: a.period === 'Before graduating' ? 'Completed' : a.status,
    periodYear: periodYearFor(a.period, profile),
  }))
  const ordered = [...withYear].sort((a, b) => {
    if (a.periodYear === b.periodYear) return 0
    if (a.periodYear === null) return -1
    if (b.periodYear === null) return 1
    return a.periodYear - b.periodYear
  })
  const pinIndex = ordered.findIndex(
    (a) => a.status !== 'Completed' && a.periodYear !== null && a.periodYear >= currentYear
  )
  return ordered.map((a, i) => {
    let colour
    if (a.status === 'Completed') colour = 'completed'
    else if (a.periodYear !== null && a.periodYear < currentYear) colour = 'missed'
    else if (i === pinIndex) colour = 'current'
    else colour = 'upcoming'
    return { ...a, colour, isPinned: i === pinIndex }
  })
}

export function computeStats(roadmap) {
  const relevant = roadmap.filter((a) => a.period !== 'Before graduating')
  const byCategory = {}
  relevant.forEach((a) => {
    byCategory[a.category] = byCategory[a.category] || { completed: 0, total: 0 }
    byCategory[a.category].total += 1
    if (a.status === 'Completed') byCategory[a.category].completed += 1
  })
  return {
    completed: relevant.filter((a) => a.status === 'Completed').length,
    inProgress: relevant.filter((a) => a.status === 'In progress').length,
    upcoming: relevant.filter((a) => a.colour === 'upcoming').length,
    overdue: relevant.filter((a) => a.colour === 'missed').length,
    byCategory,
  }
}
