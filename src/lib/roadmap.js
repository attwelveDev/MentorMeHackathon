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

export function pickCurrentPeriod(profile, currentYear = new Date().getFullYear()) {
  const withYears = getExpectedPeriodLabels(profile)
    .map((label) => ({ label, year: periodYearFor(label, profile) }))
    .filter((p) => p.year !== null)
  const chosen = withYears.find((p) => p.year >= currentYear) ?? withYears[withYears.length - 1]
  return { periodLabel: chosen.label, periodYear: chosen.year }
}

export function computeRoadmap(activities, profile, currentYear = new Date().getFullYear()) {
  const withYear = activities.map((a) => ({
    ...a,
    status: a.period === 'Before graduating' ? 'Completed' : a.status,
    periodYear: a.period === 'Before graduating'
      ? null
      : (a.periodYear ?? periodYearFor(a.period, profile)),
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

export const SECTION_NAMES = [
  'Now', 'This semester', 'Next semester', 'Next break',
  'Before final year', 'Graduate application period',
]

function semesterWindowFor(date) {
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  if (m >= 2 && m <= 6) return { key: 'sem1', year: y, start: new Date(y, 1, 1), end: new Date(y, 5, 30) }
  if (m >= 7 && m <= 11) return { key: 'sem2', year: y, start: new Date(y, 6, 1), end: new Date(y, 10, 30) }
  const breakYear = m === 1 ? y - 1 : y
  return { key: 'break', year: breakYear, start: new Date(breakYear, 11, 1), end: new Date(breakYear + 1, 0, 31) }
}

function nextSemesterWindow(w) {
  if (w.key === 'sem1') return { key: 'sem2', year: w.year, start: new Date(w.year, 6, 1), end: new Date(w.year, 10, 30) }
  if (w.key === 'sem2') return { key: 'break', year: w.year, start: new Date(w.year, 11, 1), end: new Date(w.year + 1, 0, 31) }
  return { key: 'sem1', year: w.year + 1, start: new Date(w.year + 1, 1, 1), end: new Date(w.year + 1, 5, 30) }
}

function upcomingWindows(today) {
  let w = semesterWindowFor(today)
  if (w.key === 'break') w = nextSemesterWindow(w)
  const second = nextSemesterWindow(w)
  return second.key === 'break'
    ? { thisSemester: w, nextSemester: nextSemesterWindow(second), nextBreak: second }
    : { thisSemester: w, nextSemester: second, nextBreak: nextSemesterWindow(second) }
}

function bucketByDate(dueDate, today) {
  const { thisSemester, nextSemester, nextBreak } = upcomingWindows(today)
  const d = new Date(dueDate)
  if (d >= thisSemester.start && d <= thisSemester.end) return 'This semester'
  if (d >= nextSemester.start && d <= nextSemester.end) return 'Next semester'
  if (d >= nextBreak.start && d <= nextBreak.end) return 'Next break'
  return null // caller falls back to the undated rule using dueDate's year
}

export function bucketActivities(roadmap, profile, today = new Date()) {
  const currentYear = today.getFullYear()
  const graduationYear = Number(profile.graduationYear)
  const buckets = Object.fromEntries(SECTION_NAMES.map((name) => [name, []]))

  roadmap.forEach((activity) => {
    if (activity.period === 'Before graduating') return
    if (activity.colour === 'current' || activity.colour === 'missed') {
      buckets.Now.push(activity)
      return
    }
    if (SECTION_NAMES.includes(activity.period)) {
      buckets[activity.period].push(activity)
      return
    }
    if (activity.dueDate) {
      const byDate = bucketByDate(activity.dueDate, today)
      if (byDate) {
        buckets[byDate].push(activity)
        return
      }
      const dueYear = new Date(activity.dueDate).getFullYear()
      buckets[dueYear < graduationYear ? 'Before final year' : 'Graduate application period'].push(activity)
      return
    }
    const y = activity.periodYear
    if (y === currentYear) buckets['This semester'].push(activity)
    else if (y === currentYear + 1) buckets['Next semester'].push(activity)
    else if (y !== null && y < graduationYear) buckets['Before final year'].push(activity)
    else buckets['Graduate application period'].push(activity)
  })

  return buckets
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
