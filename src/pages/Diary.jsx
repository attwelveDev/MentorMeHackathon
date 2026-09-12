import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { getPlanWithActivities, updateActivityStatus, updateActivity, deleteActivity, createActivity } from '../lib/db'
import { computeRoadmap, bucketActivities, computeStats, SECTION_NAMES } from '../lib/roadmap'
import { getNearestActivityNotification, getStreakNotification } from '../lib/notifications'
import NotebookFrame, { StickyNote } from '../components/NotebookFrame'

const PROGRESS_BY_STATUS = { 'Not started': 0, 'In progress': 50, 'Completed': 100 }

const CATEGORIES = [
  'Technical skills', 'Certifications', 'Work experience', 'Networking',
  'Extracurricular activities', 'Application preparation',
  'Commercial and industry awareness',
  'Licensing/registration/compliance',
  'Practical competencies/placements/portfolio evidence',
]
const PRIORITIES = ['High', 'Medium', 'Low']

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

function ActivityCard({ activity, sectionName, onToggleComplete, onEdit, onRemove }) {
  const [editing, setEditing] = useState(false)
  const [confirmingRemove, setConfirmingRemove] = useState(false)
  const [title, setTitle] = useState(activity.title)
  const [category, setCategory] = useState(activity.category)
  const [priority, setPriority] = useState(activity.priority)
  const [explanation, setExplanation] = useState(activity.explanation ?? '')
  const [dueDate, setDueDate] = useState(activity.dueDate ?? '')

  function handleSubmit(e) {
    e.preventDefault()
    onEdit({ title, category, priority, explanation, dueDate: dueDate || null })
    setEditing(false)
  }

  return (
    <div className="diary-note rounded-lg border border-slate-200 p-4">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          aria-label={activity.title}
          checked={activity.status === 'Completed'}
          onChange={() => onToggleComplete(activity)}
          className="mt-1"
        />
        <div className="min-w-0 flex-1">
          {editing ? (
            <form onSubmit={handleSubmit} className="space-y-2">
              <label className="block text-xs text-slate-600">
                Title
                <input aria-label="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 block w-full rounded border border-slate-300 p-1 text-sm" />
              </label>
              <label className="block text-xs text-slate-600">
                Category
                <select aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 block w-full rounded border border-slate-300 p-1 text-sm">
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </label>
              <label className="block text-xs text-slate-600">
                Priority
                <select aria-label="Priority" value={priority} onChange={(e) => setPriority(e.target.value)} className="mt-1 block w-full rounded border border-slate-300 p-1 text-sm">
                  {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
                </select>
              </label>
              <label className="block text-xs text-slate-600">
                Explanation
                <textarea aria-label="Explanation" value={explanation} onChange={(e) => setExplanation(e.target.value)} className="mt-1 block w-full rounded border border-slate-300 p-1 text-sm" />
              </label>
              <label className="block text-xs text-slate-600">
                Due date
                <input aria-label="Due date" type="date" value={dueDate ?? ''} onChange={(e) => setDueDate(e.target.value)} className="mt-1 block w-full rounded border border-slate-300 p-1 text-sm" />
              </label>
              <div className="flex gap-2">
                <button type="submit" className="font-diary-title rounded-lg border-2 border-slate-300 bg-white px-4 py-1 text-sm text-slate-700 shadow-sm hover:bg-slate-50">Save</button>
                <button type="button" onClick={() => setEditing(false)} className="text-sm text-slate-500 hover:underline">Cancel</button>
              </div>
            </form>
          ) : (
            <>
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
                {activity.dueDate ? formatDueDate(activity.dueDate) : sectionName}
              </p>
              <div className="mt-2 flex items-center gap-3">
                <button type="button" onClick={() => setEditing(true)} className="text-sm text-indigo-700 hover:underline">Edit</button>
                {confirmingRemove ? (
                  <span className="font-diary-body text-sm text-slate-600">
                    Remove this item?{' '}
                    <button type="button" onClick={onRemove} className="text-red-600 hover:underline">Yes</button>{' '}
                    <button type="button" onClick={() => setConfirmingRemove(false)} className="text-slate-500 hover:underline">Cancel</button>
                  </span>
                ) : (
                  <button type="button" onClick={() => setConfirmingRemove(true)} className="text-sm text-red-600 hover:underline">Remove</button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function AddActivityForm({ onAdd, onCancel }) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [priority, setPriority] = useState(PRIORITIES[0])
  const [section, setSection] = useState(SECTION_NAMES[0])
  const [explanation, setExplanation] = useState('')
  const [dueDate, setDueDate] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    onAdd({ title, category, priority, period: section, explanation, dueDate: dueDate || null })
  }

  return (
    <form onSubmit={handleSubmit} className="diary-note mt-6 space-y-2 rounded-lg border border-slate-200 p-4">
      <label className="block text-xs text-slate-600">
        Title
        <input aria-label="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 block w-full rounded border border-slate-300 p-1 text-sm" />
      </label>
      <label className="block text-xs text-slate-600">
        Category
        <select aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 block w-full rounded border border-slate-300 p-1 text-sm">
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </label>
      <label className="block text-xs text-slate-600">
        Priority
        <select aria-label="Priority" value={priority} onChange={(e) => setPriority(e.target.value)} className="mt-1 block w-full rounded border border-slate-300 p-1 text-sm">
          {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
        </select>
      </label>
      <label className="block text-xs text-slate-600">
        Section
        <select aria-label="Section" value={section} onChange={(e) => setSection(e.target.value)} className="mt-1 block w-full rounded border border-slate-300 p-1 text-sm">
          {SECTION_NAMES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </label>
      <label className="block text-xs text-slate-600">
        Explanation (optional)
        <textarea aria-label="Explanation" value={explanation} onChange={(e) => setExplanation(e.target.value)} className="mt-1 block w-full rounded border border-slate-300 p-1 text-sm" />
      </label>
      <label className="block text-xs text-slate-600">
        Due date (optional)
        <input aria-label="Due date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-1 block w-full rounded border border-slate-300 p-1 text-sm" />
      </label>
      <div className="flex gap-2">
        <button type="submit" className="font-diary-title rounded-lg border-2 border-slate-300 bg-white px-4 py-1 text-sm text-slate-700 shadow-sm hover:bg-slate-50">Add</button>
        <button type="button" onClick={onCancel} className="text-sm text-slate-500 hover:underline">Cancel</button>
      </div>
    </form>
  )
}

export default function Diary() {
  const { user } = useAuth()
  const [plan, setPlan] = useState(null)
  const [profile, setProfile] = useState(null)
  const [activities, setActivities] = useState(null)
  const [adding, setAdding] = useState(false)

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

  async function handleEditActivity(activity, fields) {
    await updateActivity(activity.id, fields)
    setActivities((prev) => prev.map((a) => (a.id === activity.id ? { ...a, ...fields } : a)))
  }

  async function handleRemoveActivity(activity) {
    await deleteActivity(activity.id)
    setActivities((prev) => prev.filter((a) => a.id !== activity.id))
  }

  async function handleAddActivity(fields) {
    const created = await createActivity(plan.id, user.id, fields)
    setActivities((prev) => [...(prev ?? []), mapDbActivity(created)])
    setAdding(false)
  }

  const addSection = adding ? (
    <AddActivityForm onAdd={handleAddActivity} onCancel={() => setAdding(false)} />
  ) : (
    <button
      type="button"
      onClick={() => setAdding(true)}
      className="font-diary-title mt-6 rounded-lg border-2 border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-50"
    >
      Add a new item
    </button>
  )

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
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    sectionName={name}
                    onToggleComplete={handleToggleComplete}
                    onEdit={(fields) => handleEditActivity(activity, fields)}
                    onRemove={() => handleRemoveActivity(activity)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
      {addSection}
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
