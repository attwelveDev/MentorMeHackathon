// Pastel tones matching the activity-card status palette used on the Roadmap page
// (green = completed, amber = current/in progress, blue = upcoming, slate = missed/overdue).
const STATUS_SLICE_COLOURS = {
  Completed: '#86efac',
  'In progress': '#fcd34d',
  Upcoming: '#93c5fd',
  Overdue: '#cbd5e1',
}

// Thresholds: <=25% red, <=50% orange, <=75% yellow, <100% yellow-green, 100% green.
function progressColor(pct) {
  if (pct >= 100) return '#0ca30c'
  if (pct > 75) return '#a3c93b'
  if (pct > 50) return '#fab219'
  if (pct > 25) return '#eb6834'
  return '#d03b3b'
}

function StatCard({ label, value, total, color }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="diary-note rounded-lg border border-slate-200 p-4 text-center">
      <p className="font-diary-title text-3xl text-slate-900">{value}</p>
      <p className="font-diary-body flex items-center justify-center gap-1.5 text-xs text-slate-500">
        <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: color }} />
        {label} ({pct}%)
      </p>
    </div>
  )
}

function CategoryProgressBar({ label, completed, total }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
  return (
    <div>
      <div className="font-diary-body flex justify-between text-xs text-slate-600">
        <span>{label}</span>
        <span>
          {pct}% ({completed}/{total})
        </span>
      </div>
      <div
        className="mt-1 h-3 w-full overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label} progress`}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: progressColor(pct) }}
        />
      </div>
    </div>
  )
}

function StatusPieChart({ stats }) {
  const segments = [
    { label: 'Completed', value: stats.completed },
    { label: 'In progress', value: stats.inProgress },
    { label: 'Upcoming', value: stats.upcoming },
    { label: 'Overdue', value: stats.overdue },
  ]
  const total = segments.reduce((sum, s) => sum + s.value, 0)

  if (total === 0) {
    return <p className="font-diary-body mt-4 text-sm text-slate-500">No progress to show yet</p>
  }

  let cumulative = 0
  const gradientStops = segments
    .filter((s) => s.value > 0)
    .map((s) => {
      const start = (cumulative / total) * 360
      cumulative += s.value
      const end = (cumulative / total) * 360
      return `${STATUS_SLICE_COLOURS[s.label]} ${start}deg ${end}deg`
    })
    .join(', ')

  return (
    <div className="mt-4 flex justify-center">
      <div
        className="h-32 w-32 shrink-0 rounded-full"
        style={{ background: `conic-gradient(${gradientStops})` }}
        role="img"
        aria-label={segments.map((s) => `${s.label}: ${s.value}`).join(', ')}
      />
    </div>
  )
}

// The "Your progress" sidebar section shared by the Roadmap and Diary pages:
// status pie chart, stat cards, per-category progress bars, and recent diary entries.
export default function ProgressSummary({ stats, recentDiaryEntries = [], user }) {
  const statusTotal = stats.completed + stats.inProgress + stats.upcoming + stats.overdue

  return (
    <section className="diary-note mt-8 rounded-2xl p-6">
      <h2 className="font-diary-title text-2xl text-slate-800">Your progress</h2>
      <StatusPieChart stats={stats} />
      <div className="mt-4 grid grid-cols-2 gap-4">
        <StatCard label="Completed" value={stats.completed} total={statusTotal} color={STATUS_SLICE_COLOURS.Completed} />
        <StatCard label="In progress" value={stats.inProgress} total={statusTotal} color={STATUS_SLICE_COLOURS['In progress']} />
        <StatCard label="Upcoming" value={stats.upcoming} total={statusTotal} color={STATUS_SLICE_COLOURS.Upcoming} />
        <StatCard label="Overdue" value={stats.overdue} total={statusTotal} color={STATUS_SLICE_COLOURS.Overdue} />
      </div>
      <div className="mt-6">
        <h3 className="font-diary-title text-lg text-slate-700">Progress by category</h3>
        <div className="mt-3 space-y-3">
          {Object.entries(stats.byCategory).map(([category, { completed, total }]) => (
            <CategoryProgressBar key={category} label={category} completed={completed} total={total} />
          ))}
        </div>
      </div>
      <div className="mt-6">
        <h3 className="font-diary-title text-lg text-slate-700">Recent diary entries</h3>
        {user && recentDiaryEntries.length > 0 ? (
          <ul className="font-diary-body mt-2 space-y-2 text-sm text-slate-600">
            {recentDiaryEntries.map((entry) => (
              <li key={entry.id}>
                <span className="font-medium text-slate-800">{entry.activity?.title}: </span>
                {entry.entry_text}
              </li>
            ))}
          </ul>
        ) : (
          <p className="font-diary-body mt-2 text-sm text-slate-500">No diary entries yet</p>
        )}
      </div>
    </section>
  )
}
