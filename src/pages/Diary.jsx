import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { getPlanWithActivities, updateActivityStatus } from '../lib/db'
import { computeRoadmap, bucketActivities, computeStats, SECTION_NAMES } from '../lib/roadmap'
import { getNearestActivityNotification, getStreakNotification } from '../lib/notifications'
import NotebookFrame, { StickyNote } from '../components/NotebookFrame'

const PROGRESS_BY_STATUS = { 'Not started': 0, 'In progress': 50, 'Completed': 100 }

function formatDueDate(dueDate) {
  return new Date(dueDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

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
    dueDate: row.due_date,
  }
}

export default function Diary() {
  const { user } = useAuth()
  const [plan, setPlan] = useState(null)
  const [profile, setProfile] = useState(null)
  const [activities, setActivities] = useState(null)

  useEffect(() => {
    let cancelled = false
    if (user) {
      getPlanWithActivities(user.id).then((existing) => {
        if (cancelled || !existing) return
        setPlan(existing.plan)
        setProfile({ targetOccupation: existing.plan.target_occupation })
        setActivities(existing.activities.map(mapDbActivity))
      })
    }
    return () => { cancelled = true }
  }, [user])

  if (!user) {
    return (
      <div className="diary-paper min-h-screen py-10">
        <div className="mx-auto max-w-3xl px-4">
          <p className="font-diary-body text-slate-600">
            Create an account to keep a diary of your career-planning progress.{' '}
            <Link to="/signup" className="text-indigo-700 hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    )
  }

  if (!activities) return null

  const roadmap = computeRoadmap(activities, profile ?? {}, new Date().getFullYear())
  const buckets = bucketActivities(roadmap, profile ?? {}, new Date())
  const stats = computeStats(roadmap)
  const nearestActivity = getNearestActivityNotification(roadmap)
  const streak = getStreakNotification(stats)

  async function handleToggleComplete(activity) {
    const newStatus = activity.status === 'Completed' ? 'Not started' : 'Completed'
    await updateActivityStatus(activity.id, newStatus)
    setActivities((prev) => prev.map((a) => (a.id === activity.id ? { ...a, status: newStatus } : a)))
  }

  const rightPage = (
    <>
      <h1 className="font-diary-title text-4xl text-slate-800">My Plan</h1>
      {activities.length === 0 ? (
        <p className="font-diary-body mt-6 text-slate-500">No activities yet.</p>
      ) : (
        <div className="mt-8 space-y-8">
          {SECTION_NAMES.filter((name) => buckets[name].length > 0).map((name) => (
            <section key={name}>
              <h2 className="font-diary-title text-2xl text-slate-800">{name}</h2>
              <div className="mt-3 space-y-3">
                {buckets[name].map((activity) => (
                  <div key={activity.id} className="diary-note rounded-lg border border-slate-200 p-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        aria-label={activity.title}
                        checked={activity.status === 'Completed'}
                        onChange={() => handleToggleComplete(activity)}
                        className="mt-1"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-diary-title text-lg font-semibold text-slate-900">{activity.title}</p>
                        <p className="font-diary-body text-xs text-slate-500">
                          {activity.category} · Priority: {activity.priority}
                        </p>
                        <div className="mt-2 h-2 w-full rounded-full bg-slate-200">
                          <div
                            className="h-2 rounded-full bg-indigo-600"
                            style={{ width: `${PROGRESS_BY_STATUS[activity.status]}%` }}
                          />
                        </div>
                        <p className="font-diary-body mt-1 text-xs text-slate-500">
                          {activity.dueDate ? formatDueDate(activity.dueDate) : name}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  )

  const leftPage = (
    <>
      <StickyNote>Become a {profile?.targetOccupation}</StickyNote>
      <p className="font-diary-title mt-6 text-2xl text-slate-800">Hi, how are you today?</p>
      <div className="mt-6 space-y-3">
        {nearestActivity && (
          <div className="diary-note rounded-lg border border-slate-200 p-3">
            <p className="font-diary-title text-sm font-semibold text-slate-800">{nearestActivity.title}</p>
            <p className="font-diary-body text-xs text-slate-500">
              {nearestActivity.dueDate
                ? new Date(nearestActivity.dueDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
                : nearestActivity.period}
            </p>
          </div>
        )}
        {streak && (
          <div className="diary-note rounded-lg border border-slate-200 p-3">
            <p className="font-diary-title text-sm font-semibold text-slate-800">{streak.percent}% complete</p>
            <p className="font-diary-body text-xs text-slate-500">{streak.completed}/{streak.total} activities</p>
          </div>
        )}
      </div>
    </>
  )

  return <NotebookFrame leftPage={leftPage} rightPage={rightPage} />
}
