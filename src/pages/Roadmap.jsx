import { useEffect, useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { generateCareerPlan } from '../lib/ai'
import { getPlanWithActivities, createPlanWithActivities, updateActivityStatus, setPlanAccepted, deleteActivity } from '../lib/db'
import { saveGuestPlan } from '../lib/localPlan'
import { computeRoadmap, computeStats } from '../lib/roadmap'
import LockedAction from '../components/LockedAction'
import CheckpointPanel from '../components/CheckpointPanel'

const SAVE_NOTICE = "Saved to this browser. This plan is only saved on this device/browser — it survives closing this tab, but is lost if you clear this browser's site data or switch device/browser."

function keyOf(activity) {
  return activity.id ?? activity.title
}

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
  const [openKey, setOpenKey] = useState(null)
  const [saveNotice, setSaveNotice] = useState(null)
  const [saveError, setSaveError] = useState(null)
  const [accepted, setAccepted] = useState(false)

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
  const openActivity = openKey == null ? null : roadmap.find((a) => keyOf(a) === openKey) ?? null

  async function handleStatusChange(activity, newStatus) {
    if (activity.id) {
      await updateActivityStatus(activity.id, newStatus)
    }
    setActivities((prev) => prev.map((a) => (keyOf(a) === keyOf(activity) ? { ...a, status: newStatus } : a)))
  }

  async function handleRemove(activity) {
    if (activity.id) {
      await deleteActivity(activity.id)
    }
    setActivities((prev) => prev.filter((a) => keyOf(a) !== keyOf(activity)))
    setOpenKey(null)
  }

  async function handleSave() {
    setSaveError(null)
    setSaveNotice(null)
    if (user) {
      try {
        const created = await createPlanWithActivities(user.id, profile?.targetOccupation, activities)
        setPlan(created.plan)
        setActivities(created.activities.map(mapDbActivity))
        setSaveNotice('Saved to your account.')
      } catch {
        setSaveError('We could not save your plan. Please try again.')
      }
      return
    }
    const result = saveGuestPlan(profile, activities)
    if (result.ok) {
      setSaveNotice(SAVE_NOTICE)
    } else {
      setSaveError(result.error)
    }
  }

  async function handleAccept() {
    if (!plan) return
    await setPlanAccepted(plan.id, true)
    setAccepted(true)
  }

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
                      key={keyOf(activity)}
                      data-testid={`checkpoint-${activity.title}`}
                      style={{ borderColor: COLOURS[activity.colour] }}
                      className="cursor-pointer rounded-md border-2 p-4"
                      onClick={() => setOpenKey(keyOf(activity))}
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

        {openActivity && (
          <div className="mt-6">
            <CheckpointPanel
              activity={openActivity}
              onClose={() => setOpenKey(null)}
              onStatusChange={(newStatus) => handleStatusChange(openActivity, newStatus)}
              onRemove={() => handleRemove(openActivity)}
            />
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-4">
          {(!user || !plan) && (
            <button
              type="button"
              onClick={handleSave}
              className="rounded-md border border-slate-300 px-6 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Save
            </button>
          )}
          <LockedAction
            onClick={handleAccept}
            className="rounded-md bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            {accepted || plan?.accepted ? 'Accepted' : 'Accept'}
          </LockedAction>
        </div>
        {saveNotice && <p className="mt-2 text-sm text-slate-500">{saveNotice}</p>}
        {saveError && <p role="alert" className="mt-2 text-sm text-red-700">{saveError}</p>}

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
