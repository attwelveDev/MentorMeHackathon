import { useState } from 'react'

function formatTimestamp(isoString) {
  return new Date(isoString).toLocaleString()
}

export default function DiarySection({ diaryEntries = [], onAddEntry, onRequestFeedback, prompt }) {
  const [text, setText] = useState('')
  const [pendingFeedbackIds, setPendingFeedbackIds] = useState(() => new Set())

  function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim()) return
    onAddEntry(text)
    setText('')
  }

  function handleRequestFeedback(entryId) {
    setPendingFeedbackIds((prev) => new Set(prev).add(entryId))
    Promise.resolve(onRequestFeedback(entryId)).finally(() => {
      setPendingFeedbackIds((prev) => {
        const next = new Set(prev)
        next.delete(entryId)
        return next
      })
    })
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
              <div className="mt-2 rounded-md bg-indigo-50 p-2 text-sm text-indigo-800">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">Feedback</p>
                <p className="mt-1">{entry.ai_feedback}</p>
              </div>
            ) : pendingFeedbackIds.has(entry.id) ? (
              <p className="mt-2 text-sm text-slate-500">Getting feedback…</p>
            ) : (
              <button
                type="button"
                onClick={() => handleRequestFeedback(entry.id)}
                className="mt-2 text-sm text-indigo-700 hover:underline"
              >
                Get AI feedback
              </button>
            )}
          </li>
        ))}
      </ul>
      <form onSubmit={handleSubmit} className="mt-3">
        <label htmlFor="diary-entry-text" className={prompt ? 'font-diary-body text-sm text-slate-600' : 'sr-only'}>
          {prompt ?? 'Diary entry'}
        </label>
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
