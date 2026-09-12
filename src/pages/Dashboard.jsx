// Screen 5: Progress dashboard
export default function Dashboard() {
  // TODO: derive these from the plan activities stored in Supabase/session state.
  const stats = { completed: 0, inProgress: 0, upcoming: 0, overdue: 0 }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900">Progress dashboard</h1>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Completed" value={stats.completed} />
        <StatCard label="In progress" value={stats.inProgress} />
        <StatCard label="Upcoming" value={stats.upcoming} />
        <StatCard label="Overdue" value={stats.overdue} />
      </div>
      <p className="mt-8 text-sm text-slate-500">
        Recent diary entries and progress-by-category breakdown will appear here.
      </p>
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-md border border-slate-200 p-4 text-center">
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  )
}
