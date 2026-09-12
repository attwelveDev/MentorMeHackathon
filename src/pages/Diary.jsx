import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { getPlanWithActivities } from '../lib/db'
import { computeRoadmap, bucketActivities, SECTION_NAMES } from '../lib/roadmap'
import NotebookFrame from '../components/NotebookFrame'

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
                  <p key={activity.id} className="font-diary-body text-slate-800">{activity.title}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  )

  const leftPage = null

  return <NotebookFrame leftPage={leftPage} rightPage={rightPage} />
}
