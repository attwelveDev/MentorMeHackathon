import { useEffect, useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { generateCareerPlan } from '../lib/ai'
import { getPlanWithActivities, createPlanWithActivities, updateActivityStatus, setPlanAccepted, deleteActivity } from '../lib/db'
import { saveGuestPlan, loadGuestPlan } from '../lib/localPlan'
import { computeRoadmap, computeStats } from '../lib/roadmap'
import LockedAction from '../components/LockedAction'
import CheckpointPanel from '../components/CheckpointPanel'

const SAVE_NOTICE = "Saved to this browser. This plan is only saved on this device/browser — it survives closing this tab, but is lost if you clear this browser's site data or switch device/browser."

function keyOf(activity) {
  return activity.id ?? activity.title
}

const COLOURS = {
  completed: { border: '#16a34a', bg: '#eefdf3', text: '#166534' },
  missed: { border: '#94a3b8', bg: '#f4f2ec', text: '#57534e' },
  current: { border: '#ca8a04', bg: '#fef9e7', text: '#854d0e' },
  upcoming: { border: '#2563eb', bg: '#eef4ff', text: '#1e3a8a' },
}

const GOAL_COLOURS = { background: '#3b3163', text: '#f5f1e8' }

const TABS = [
  { to: '/diary', label: 'Diary', bg: '#fef3c7' },
  { to: '/updates', label: 'News', bg: '#e0e7ff' },
  { to: '/profile', label: 'Profile', bg: '#dbeafe' },
]

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
        if (!user) {
          const guest = loadGuestPlan()
          if (guest) {
            setProfile(guest.profile)
            setActivities(guest.activities)
            setLoading(false)
            return
          }
        }
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

  // Keeps a guest's plan in this browser continuously, not just when they
  // remember to click Save - so navigating away (including to /signup)
  // never silently loses it.
  useEffect(() => {
    if (!user && profile && activities) {
      saveGuestPlan(profile, activities)
    }
  }, [user, profile, activities])

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
    <div className="diary-paper min-h-screen py-10">
      <div className="mx-auto flex max-w-5xl gap-0 px-4">
        <nav aria-label="Book tabs" className="relative w-28 shrink-0 pt-10">
          {TABS.map(({ to, label, bg }, i) => (
            <Link
              key={to}
              to={to}
              style={{ backgroundColor: bg, marginLeft: `${i * 6}px` }}
              className="diary-tab font-diary-title mb-3 block rounded-r-xl py-3 pl-4 pr-2 text-lg text-slate-700 hover:brightness-95"
            >
              {label}
            </Link>
          ))}
          <span
            aria-disabled="true"
            style={{ backgroundColor: '#e7e5e4', marginLeft: `${TABS.length * 6}px` }}
            className="diary-tab font-diary-title mb-3 block rounded-r-xl py-3 pl-4 pr-2 text-lg text-slate-400"
          >
            Jobs (coming soon)
          </span>
        </nav>

        <div className="diary-note min-w-0 flex-1 rounded-2xl p-6 sm:p-10">
          <h1 className="font-diary-title text-4xl text-slate-800">Career Roadmap</h1>
          <p className="font-diary-body mt-1 text-slate-500">A plan for the future me.</p>

          <div className="mt-8 space-y-8">
            {periodOrder.map((period) => (
              <section key={period}>
                <h2 className="font-diary-title text-2xl text-slate-800">{period}</h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {roadmap
                    .filter((a) => a.period === period)
                    .map((activity, i) => {
                      const palette = COLOURS[activity.colour]
                      return (
                        <div
                          key={keyOf(activity)}
                          data-testid={`checkpoint-${activity.title}`}
                          style={{
                            borderColor: palette.border,
                            backgroundColor: palette.bg,
                            transform: `rotate(${i % 2 === 0 ? -1 : 1}deg)`,
                          }}
                          className="diary-note relative cursor-pointer rounded-lg border-2 p-4 pt-5 transition hover:-translate-y-0.5 hover:shadow-md"
                          onClick={() => setOpenKey(keyOf(activity))}
                        >
                          {activity.isPinned && (
                            <p className="font-diary-title absolute -top-3 left-2 rounded bg-white px-1 text-sm font-semibold text-red-600 shadow-sm">
                              📍 You are here
                            </p>
                          )}
                          <p className="font-diary-title text-lg font-semibold text-slate-900">{activity.title}</p>
                          <p className="font-diary-body text-xs text-slate-500">
                            {activity.category} · Priority: {activity.priority}
                          </p>
                          <p className="font-diary-body mt-2 text-sm" style={{ color: palette.text }}>
                            {activity.explanation}
                          </p>
                        </div>
                      )
                    })}
                </div>
              </section>
            ))}
          </div>

          <div
            className="diary-note mt-10 -rotate-1 rounded-2xl p-6 text-center"
            style={{ backgroundColor: GOAL_COLOURS.background, color: GOAL_COLOURS.text }}
          >
            <p className="font-diary-title text-2xl">🚩 Goal</p>
            <p className="font-diary-title mt-1 text-3xl">Become a {profile?.targetOccupation}</p>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            {(!user || !plan) && (
              <button
                type="button"
                onClick={handleSave}
                className="font-diary-title rounded-lg border-2 border-slate-300 bg-white px-6 py-2 text-lg text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Save
              </button>
            )}
            <LockedAction
              onClick={handleAccept}
              className="font-diary-title rounded-lg bg-indigo-700 px-6 py-2 text-lg text-white shadow-sm hover:bg-indigo-800"
            >
              {accepted || plan?.accepted ? 'Accepted' : 'Accept'}
            </LockedAction>
          </div>
          {saveNotice && <p className="font-diary-body mt-2 text-sm text-slate-500">{saveNotice}</p>}
          {saveError && <p role="alert" className="font-diary-body mt-2 text-sm text-red-700">{saveError}</p>}

          <section className="diary-note mt-10 rounded-2xl p-6">
            <h2 className="font-diary-title text-2xl text-slate-800">Your progress</h2>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard label="Completed" value={stats.completed} />
              <StatCard label="In progress" value={stats.inProgress} />
              <StatCard label="Upcoming" value={stats.upcoming} />
              <StatCard label="Overdue" value={stats.overdue} />
            </div>
            <div className="mt-6">
              <h3 className="font-diary-title text-lg text-slate-700">Progress by category</h3>
              <ul className="font-diary-body mt-2 space-y-1 text-sm text-slate-600">
                {Object.entries(stats.byCategory).map(([category, { completed, total }]) => (
                  <li key={category}>
                    {category}: {completed}/{total}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-6">
              <h3 className="font-diary-title text-lg text-slate-700">Recent diary entries</h3>
              <p className="font-diary-body mt-2 text-sm text-slate-500">No diary entries yet</p>
            </div>
          </section>
        </div>
      </div>

      {openActivity && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpenKey(null)}
        >
          <div className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <CheckpointPanel
              activity={openActivity}
              onClose={() => setOpenKey(null)}
              onStatusChange={(newStatus) => handleStatusChange(openActivity, newStatus)}
              onRemove={() => handleRemove(openActivity)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="diary-note rounded-lg border border-slate-200 p-4 text-center">
      <p className="font-diary-title text-3xl text-slate-900">{value}</p>
      <p className="font-diary-body text-xs text-slate-500">{label}</p>
    </div>
  )
}

function Centered({ children, className = '' }) {
  return (
    <div className="diary-paper flex min-h-screen items-center justify-center px-4">
      <p className={`font-diary-title text-2xl text-slate-700 ${className}`}>{children}</p>
    </div>
  )
}
