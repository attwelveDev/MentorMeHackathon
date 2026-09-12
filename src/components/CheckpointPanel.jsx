import { useAuth } from '../lib/auth'
import LockedAction from './LockedAction'

const STATUS_OPTIONS = ['Not started', 'In progress', 'Completed']

export default function CheckpointPanel({ activity, onClose, onStatusChange, onRemove }) {
  const { user } = useAuth()

  return (
    <div role="dialog" aria-label={activity.title} className="rounded-md border border-slate-200 bg-white p-6 shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-slate-900">{activity.title}</p>
          <p className="text-xs text-slate-500">
            {activity.category} · Priority: {activity.priority}
          </p>
        </div>
        <button type="button" onClick={onClose} className="text-sm text-slate-500 hover:text-slate-800">
          Close
        </button>
      </div>
      <p className="mt-3 text-sm text-slate-600">{activity.explanation}</p>

      <div className="mt-4">
        <p className="text-xs font-medium text-slate-700">Status</p>
        {user ? (
          <select
            value={activity.status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="mt-1 rounded-md border border-slate-300 px-2 py-1 text-sm"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        ) : (
          <>
            <p className="mt-1 text-sm text-slate-800">{activity.status}</p>
            <LockedAction className="mt-1 inline-flex text-sm">Change status</LockedAction>
          </>
        )}
      </div>

      <div className="mt-4">
        <LockedAction
          onClick={onRemove}
          className="text-sm text-red-600 hover:underline"
        >
          Remove
        </LockedAction>
      </div>
    </div>
  )
}
