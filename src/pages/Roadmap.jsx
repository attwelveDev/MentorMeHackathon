import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { generateCareerPlan, getDiaryFeedback } from '../lib/ai'
import {
  getPlanWithActivities, createPlanWithActivities, updateActivityStatus, setPlanAccepted, deleteActivity,
  getDiaryEntriesForActivity, getDiaryEntries, createDiaryEntry, setDiaryEntryFeedback,
} from '../lib/db'
import { saveGuestPlan, loadGuestPlan } from '../lib/localPlan'
import { computeRoadmap, computeStats } from '../lib/roadmap'
import LockedAction from '../components/LockedAction'
import CheckpointPanel from '../components/CheckpointPanel'
import NotebookFrame from '../components/NotebookFrame'

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
  const [diaryEntries, setDiaryEntries] = useState([])
  const [diaryEntriesLoading, setDiaryEntriesLoading] = useState(false)
  const [recentDiaryEntries, setRecentDiaryEntries] = useState([])
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

  useEffect(() => {
    let cancelled = false
    if (user && openKey != null) {
      const activity = (activities ?? []).find((a) => keyOf(a) === openKey)
      if (activity?.id) {
        setDiaryEntriesLoading(true)
        getDiaryEntriesForActivity(activity.id).then((entries) => {
          if (!cancelled) {
            setDiaryEntries(entries)
            setDiaryEntriesLoading(false)
          }
        })
      } else {
        setDiaryEntries([])
        setDiaryEntriesLoading(false)
      }
    } else {
      setDiaryEntries([])
      setDiaryEntriesLoading(false)
    }
    return () => { cancelled = true }
  }, [user, openKey, activities])

  useEffect(() => {
    let cancelled = false
    if (user) {
      getDiaryEntries(user.id, { limit: 3 }).then((entries) => {
        if (!cancelled) setRecentDiaryEntries(entries)
      })
    } else {
      setRecentDiaryEntries([])
    }
    return () => { cancelled = true }
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

  async function handleAddEntry(text) {
    if (!openActivity?.id) return
    const entry = await createDiaryEntry(openActivity.id, user.id, text)
    setDiaryEntries((prev) => [entry, ...prev])
  }

  async function handleRequestFeedback(entryId) {
    const entry = diaryEntries.find((e) => e.id === entryId)
    if (!entry || !openActivity) return
    const feedback = await getDiaryFeedback(openActivity, entry.entry_text)
    await setDiaryEntryFeedback(entryId, feedback)
    setDiaryEntries((prev) => prev.map((e) => (e.id === entryId ? { ...e, ai_feedback: feedback } : e)))
  }

  async function handleAccept() {
    if (!plan) return
    await setPlanAccepted(plan.id, true)
    setAccepted(true)
  }

  const leftPage = (
    <>
      <div
        className="diary-note -rotate-1 rounded-2xl p-6 text-center"
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

      <section className="diary-note mt-8 rounded-2xl p-6">
        <h2 className="font-diary-title text-2xl text-slate-800">Your progress</h2>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <StatCard label="Completed" value={stats.completed} />
          <StatCard label="In progress" value={stats.inProgress} />
          <StatCard label="Upcoming" value={stats.upcoming} />
          <StatCard label="Overdue" value={stats.overdue} />
        </div>
        <StatusPieChart stats={stats} />
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
    </>
  )

  const rightPage = (
    <>
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
                      className="diary-note relative cursor-pointer rounded-lg border-2 p-4 py-5 pr-6 transition hover:-translate-y-0.5 hover:shadow-md"
                      onClick={() => setOpenKey(keyOf(activity))}
                    >
                      {activity.isPinned && (
                        <p className="font-diary-title absolute -top-3 left-2 rounded bg-white px-1 text-sm font-semibold text-red-600 shadow-sm">
                          📍 You are here
                        </p>
                      )}
                      <p className="font-diary-title break-words text-lg font-semibold text-slate-900">{activity.title}</p>
                      <p className="font-diary-body break-words text-xs text-slate-500">
                        {activity.category} · Priority: {activity.priority}
                      </p>
                      <p className="font-diary-body mt-2 break-words text-sm" style={{ color: palette.text }}>
                        {activity.explanation}
                      </p>
                    </div>
                  )
                })}
            </div>
          </section>
        ))}
      </div>
    </>
  )

  return (
    <>
      <NotebookFrame leftPage={leftPage} rightPage={rightPage} />

      {openActivity && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpenKey(null)}
        >
          <div className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            {user && diaryEntriesLoading ? (
              <div className="diary-note diary-note--no-tape rounded-2xl border-2 border-amber-100 bg-white p-6 text-center">
                <p className="font-diary-title text-lg text-slate-600">Loading…</p>
              </div>
            ) : (
              <CheckpointPanel
                activity={openActivity}
                onClose={() => setOpenKey(null)}
                onStatusChange={(newStatus) => handleStatusChange(openActivity, newStatus)}
                onRemove={() => handleRemove(openActivity)}
                diaryEntries={diaryEntries}
                onAddEntry={handleAddEntry}
                onRequestFeedback={handleRequestFeedback}
              />
            )}
          </div>
        </div>
      )}
    </>
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

// Thresholds: <=25% red, <=50% orange, <=75% yellow, <100% yellow-green, 100% green.
function progressColor(pct) {
  if (pct >= 100) return '#0ca30c'
  if (pct > 75) return '#a3c93b'
  if (pct > 50) return '#fab219'
  if (pct > 25) return '#eb6834'
  return '#d03b3b'
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

const STATUS_SLICE_COLOURS = {
  Completed: '#0ca30c',
  'In progress': '#fab219',
  Upcoming: '#2a78d6',
  Overdue: '#d03b3b',
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
    return <p className="font-diary-body mt-4 text-sm text-slate-500">No activities yet</p>
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
    <div className="mt-4 flex flex-wrap items-center gap-6">
      <div
        className="h-32 w-32 shrink-0 rounded-full"
        style={{ background: `conic-gradient(${gradientStops})` }}
        role="img"
        aria-label={segments.map((s) => `${s.label}: ${s.value}`).join(', ')}
      />
      <ul className="font-diary-body space-y-1 text-sm text-slate-600">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 shrink-0 rounded-sm"
              style={{ backgroundColor: STATUS_SLICE_COLOURS[s.label] }}
            />
            <span>
              {s.label}: {s.value} ({Math.round((s.value / total) * 100)}%)
            </span>
          </li>
        ))}
      </ul>
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
