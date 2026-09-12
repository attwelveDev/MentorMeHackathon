import { useAuth } from '../lib/auth'
import LockedAction from './LockedAction'
import DiarySection from './DiarySection'

const STATUS_OPTIONS = ['Not started', 'In progress', 'Completed']

export default function CheckpointPanel({ activity, onClose, onStatusChange, onRemove, diaryEntries, onAddEntry, onRequestFeedback }) {
  const { user } = useAuth()

  return (
    <div
      role="dialog"
      aria-label={activity.title}
      className="diary-note diary-note--no-tape -rotate-1 max-h-[85vh] overflow-y-auto rounded-2xl border-2 border-amber-100 bg-white p-6"
    >
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
