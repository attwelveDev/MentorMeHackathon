import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { getDiaryEntries } from '../lib/db'

export default function Diary() {
  const { user } = useAuth()
  const [entries, setEntries] = useState([])

  useEffect(() => {
    if (user) {
      getDiaryEntries(user.id).then(setEntries)
    }
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

  return (
    <div className="diary-paper min-h-screen py-10">
      <div className="mx-auto max-w-3xl px-4">
        <h1 className="font-diary-title text-4xl text-slate-800">Diary</h1>
        <div className="mt-6 space-y-4">
          {entries.map((entry) => (
            <article key={entry.id} className="diary-note rounded-2xl p-6">
              <p className="font-diary-title text-lg font-semibold text-slate-900">{entry.activity?.title}</p>
              <p className="font-diary-body mt-2 text-sm text-slate-800">{entry.entry_text}</p>
              <p className="font-diary-body mt-2 text-xs text-slate-500">{new Date(entry.created_at).toLocaleString()}</p>
              {entry.ai_feedback && (
                <p className="mt-2 rounded-md bg-indigo-50 p-2 text-sm text-indigo-800">{entry.ai_feedback}</p>
              )}
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
