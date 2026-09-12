import { useState } from 'react'
import { useAuth } from '../lib/auth'
import LockedAction from './LockedAction'

const STATUS_OPTIONS = ['Not started', 'In progress', 'Completed']

function formatTimestamp(isoString) {
  return new Date(isoString).toLocaleString()
}

function DiarySection({ diaryEntries = [], onAddEntry, onRequestFeedback }) {
  const [text, setText] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim()) return
    onAddEntry(text)
    setText('')
  }

  return (
    <div className="mt-4">
      <p className="font-diary-title text-base font-medium text-slate-700">Diary</p>
      <ul className="font-diary-body mt-2 space-y-3">
        {diaryEntries.map((entry) => (
          <li key={entry.id} className="rounded-md border border-slate-200 p-3 text-sm">
            <p className="text-slate-800">{entry.entry_text}</p>
            <p className="mt-1 text-xs text-slate-500">{formatTimestamp(entry.created_at)}</p>
            {entry.ai_feedback ? (
              <p className="mt-2 rounded-md bg-indigo-50 p-2 text-sm text-indigo-800">{entry.ai_feedback}</p>
            ) : (
              <button
                type="button"
                onClick={() => onRequestFeedback(entry.id)}
                className="mt-2 text-sm text-indigo-700 hover:underline"
              >
                Get AI feedback
              </button>
            )}
          </li>
        ))}
      </ul>
      <form onSubmit={handleSubmit} className="mt-3">
        <label htmlFor="diary-entry-text" className="sr-only">Diary entry</label>
        <textarea
          id="diary-entry-text"
          aria-label="Diary entry"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full rounded-md border border-slate-300 p-2 text-sm"
          rows={3}
        />
        <button
          type="submit"
          className="font-diary-title mt-2 rounded-lg border-2 border-slate-300 bg-white px-4 py-1 text-sm text-slate-700 shadow-sm hover:bg-slate-50"
        >
          Add entry
        </button>
      </form>
    </div>
  )
}

export default function CheckpointPanel({ activity, onClose, onStatusChange, onRemove, diaryEntries, onAddEntry, onRequestFeedback }) {
  const { user } = useAuth()

  return (
    <div role="dialog" aria-label={activity.title} className="diary-note -rotate-1 rounded-2xl border-2 border-amber-100 bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-diary-title text-2xl font-semibold text-slate-900">{activity.title}</p>
          <p className="font-diary-body text-xs text-slate-500">
            {activity.category} · Priority: {activity.priority}
          </p>
        </div>
        <button type="button" onClick={onClose} className="font-diary-title text-lg text-slate-500 hover:text-slate-800">
          Close
        </button>
      </div>
      <p className="font-diary-body mt-3 text-sm text-slate-600">{activity.explanation}</p>

      <div className="mt-4">
        <p className="font-diary-title text-base font-medium text-slate-700">Status</p>
        {user ? (
          <select
            value={activity.status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="font-diary-body mt-1 rounded-md border border-slate-300 px-2 py-1 text-sm"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        ) : (
          <>
            <p className="font-diary-body mt-1 text-sm text-slate-800">{activity.status}</p>
            <LockedAction className="font-diary-body mt-1 inline-flex text-sm">Change status</LockedAction>
          </>
        )}
      </div>

      <div className="mt-4">
        <LockedAction
          onClick={onRemove}
          className="font-diary-body text-sm text-red-600 hover:underline"
        >
          Remove
        </LockedAction>
      </div>

      {user ? (
        <DiarySection diaryEntries={diaryEntries} onAddEntry={onAddEntry} onRequestFeedback={onRequestFeedback} />
      ) : (
        <div className="mt-4">
          <p className="font-diary-title text-base font-medium text-slate-700">Diary</p>
          <p className="font-diary-body mt-1 text-sm text-slate-500">Create an account to keep a diary</p>
        </div>
      )}
    </div>
  )
}
