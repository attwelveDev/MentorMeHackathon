export function getNearestActivityNotification(roadmap) {
  const overdue = roadmap.find((a) => a.colour === 'missed')
  const current = roadmap.find((a) => a.colour === 'current')
  const activity = overdue ?? current
  if (!activity) return null
  return { title: activity.title, dueDate: activity.dueDate ?? null, period: activity.period }
}

export function getStreakNotification(stats) {
  const total = stats.completed + stats.inProgress + stats.upcoming + stats.overdue
  if (total === 0) return null
  return { percent: Math.round((stats.completed / total) * 100), completed: stats.completed, total }
}
