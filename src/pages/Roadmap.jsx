import { useEffect, useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { generateCareerPlan } from '../lib/ai'
import { getPlanWithActivities } from '../lib/db'
import { computeRoadmap, computeStats } from '../lib/roadmap'

const COLOURS = {
  completed: '#16a34a',
  missed: '#94a3b8',
  current: '#ca8a04',
  upcoming: '#2563eb',
}

const GOAL_COLOURS = { background: '#312e81', text: '#eef2ff' }

function mapDbActivity(row) {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    period: row.period_label,
    periodYear: row.period_year,
    priority: row.priority,
    explanation: row.explanation,
    status: row.status,
  }
}

// Screen 4+5: open-book career roadmap and progress stats
export default function Roadmap() {
  const { user } = useAuth()
  const { state } = useLocation()
  const navigate = useNavigate()
  const [plan, setPlan] = useState(null)
  const [profile, setProfile] = useState(state?.profile ?? null)
  const [activities, setActivities] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function loadOrGenerate() {
      setLoading(true)
      setError(null)

      if (user) {
        try {
          const existing = await getPlanWithActivities(user.id)
          if (cancelled) return
          if (existing) {
            setPlan(existing.plan)
            setProfile((p) => p ?? { targetOccupation: existing.plan.target_occupation })
            setActivities(existing.activities.map(mapDbActivity))
            setLoading(false)
            return
          }
        } catch {
          if (!cancelled) {
            setError('We could not load your plan. Please try again.')
            setLoading(false)
          }
          return
        }
      }

      if (!state?.profile) {
        navigate('/profile')
        return
      }

      try {
        const text = await generateCareerPlan(state.profile)
        if (cancelled) return
        try {
          setActivities(JSON.parse(text))
        } catch {
          setError('The AI response could not be read. Please try again.')
        }
      } catch {
        if (!cancelled) setError('We could not generate your plan. Please try again.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadOrGenerate()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  if (loading) return <Centered>Building your plan…</Centered>
  if (error) return <Centered className="text-red-700">{error}</Centered>
  if (!activities) return null

  const roadmap = computeRoadmap(activities, profile ?? {}, new Date().getFullYear())
  const stats = computeStats(roadmap)
  const periodOrder = []
  roadmap.forEach((a) => {
    if (!periodOrder.includes(a.period)) periodOrder.push(a.period)
  })

  return (
    <div className="mx-auto flex max-w-5xl gap-6 px-4 py-12">
      <nav aria-label="Book tabs" className="flex w-32 shrink-0 flex-col gap-3 text-sm">
        <Link to="/diary" className="text-slate-600 hover:text-slate-900">Diary</Link>
        <Link to="/updates" className="text-slate-600 hover:text-slate-900">News</Link>
        <span aria-disabled="true" className="text-slate-400">Jobs (coming soon)</span>
        <Link to="/profile" className="text-slate-600 hover:text-slate-900">Profile</Link>
      </nav>
      <div className="flex-1">
        <h1 className="text-2xl font-bold text-slate-900">Your career roadmap</h1>
        <div className="mt-6 space-y-8">
          {periodOrder.map((period) => (
            <section key={period}>
              <h2 className="font-semibold text-slate-800">{period}</h2>
              <div className="mt-3 space-y-3">
                {roadmap
                  .filter((a) => a.period === period)
                  .map((activity) => (
                    <div
                      key={activity.id ?? activity.title}
                      data-testid={`checkpoint-${activity.title}`}
                      style={{ borderColor: COLOURS[activity.colour] }}
                      className="rounded-md border-2 p-4"
                    >
                      {activity.isPinned && (
                        <p className="text-xs font-semibold" style={{ color: COLOURS.current }}>
                          📍 You are here
                        </p>
                      )}
                      <p className="font-medium text-slate-900">{activity.title}</p>
                      <p className="text-xs text-slate-500">
                        {activity.category} · Priority: {activity.priority}
                      </p>
                      <p className="mt-2 text-sm text-slate-600">{activity.explanation}</p>
                    </div>
                  ))}
              </div>
            </section>
          ))}
        </div>
        <div
          className="mt-8 rounded-md p-6 text-center font-semibold"
          style={{ backgroundColor: GOAL_COLOURS.background, color: GOAL_COLOURS.text }}
        >
          Become a {profile?.targetOccupation}
        </div>

        <section className="mt-10 rounded-md border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800">Your progress</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Completed" value={stats.completed} />
            <StatCard label="In progress" value={stats.inProgress} />
            <StatCard label="Upcoming" value={stats.upcoming} />
            <StatCard label="Overdue" value={stats.overdue} />
          </div>
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-700">Progress by category</h3>
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              {Object.entries(stats.byCategory).map(([category, { completed, total }]) => (
                <li key={category}>
                  {category}: {completed}/{total}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-700">Recent diary entries</h3>
            <p className="mt-2 text-sm text-slate-500">No diary entries yet</p>
          </div>
        </section>
      </div>
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

function Centered({ children, className = '' }) {
  return <div className={`mx-auto max-w-2xl px-4 py-16 text-center ${className}`}>{children}</div>
}
