import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { generateCareerPlan } from '../lib/ai'

const PERIODS = ['Now', 'This semester', 'Next semester', 'Next break', 'Before final year', 'Graduate application period']

// Screen 4: Personalised career plan
export default function Plan() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const profile = state?.profile
  const [activities, setActivities] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!profile) {
      navigate('/profile')
      return
    }
    setLoading(true)
    generateCareerPlan(profile)
      .then((text) => {
        try {
          setActivities(JSON.parse(text))
        } catch {
          setError('The AI response could not be read. Please try again.')
        }
      })
      .catch(() => setError('We could not generate your plan. Please try again.'))
      .finally(() => setLoading(false))
  }, [profile, navigate])

  function updateActivity(index, changes) {
    setActivities((prev) => prev.map((a, i) => (i === index ? { ...a, ...changes } : a)))
  }

  function removeActivity(index) {
    setActivities((prev) => prev.filter((_, i) => i !== index))
  }

  function addOwnActivity() {
    setActivities((prev) => [
      ...prev,
      { title: 'New activity', category: 'Other', period: 'Now', priority: 'Medium', explanation: 'Added by student', status: 'Not started' },
    ])
  }

  if (loading) return <div className="mx-auto max-w-3xl px-4 py-16 text-center">Building your plan…</div>
  if (error) return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-red-700">{error}</div>
  if (!activities) return null

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900">Your career plan</h1>
      <div className="mt-6 space-y-8">
        {PERIODS.map((period) => {
          const items = activities
            .map((a, i) => ({ ...a, _index: i }))
            .filter((a) => a.period === period)
          if (items.length === 0) return null
          return (
            <section key={period}>
              <h2 className="font-semibold text-slate-800">{period}</h2>
              <div className="mt-3 space-y-3">
                {items.map((activity) => (
                  <ActivityCard
                    key={activity._index}
                    activity={activity}
                    onChange={(changes) => updateActivity(activity._index, changes)}
                    onRemove={() => removeActivity(activity._index)}
                  />
                ))}
              </div>
            </section>
          )
        })}
      </div>
      <button
        onClick={addOwnActivity}
        className="mt-8 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        + Add my own activity
      </button>
    </div>
  )
}

function ActivityCard({ activity, onChange, onRemove }) {
  return (
    <div className="rounded-md border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium text-slate-900">{activity.title}</p>
          <p className="text-xs text-slate-500">
            {activity.category} · Priority: {activity.priority}
          </p>
          <p className="mt-2 text-sm text-slate-600">{activity.explanation}</p>
        </div>
        <button onClick={onRemove} className="text-xs text-red-600 hover:underline">
          Remove
        </button>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <select
          value={activity.status}
          onChange={(e) => onChange({ status: e.target.value })}
          className="rounded-md border border-slate-300 px-2 py-1 text-sm"
        >
          <option>Not started</option>
          <option>In progress</option>
          <option>Completed</option>
        </select>
      </div>
    </div>
  )
}
