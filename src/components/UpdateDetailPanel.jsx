export default function UpdateDetailPanel({ update, savedStatus, canAddToPlan, onClose, onSave, onDismiss, onAddToPlan }) {
  return (
    <div role="dialog" aria-label={update.headline} className="diary-note diary-note--no-tape max-h-[85vh] overflow-y-auto rounded-2xl border-2 border-amber-100 bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-diary-title text-2xl font-semibold text-slate-900">{update.headline}</p>
          <p className="font-diary-body text-xs text-slate-500">
            <span>{update.topic}</span> · <span>{update.statusLabel}</span>
          </p>
        </div>
        <button type="button" onClick={onClose} className="font-diary-title text-lg text-slate-500 hover:text-slate-800">Close</button>
      </div>
      <p className="font-diary-body mt-3 text-sm text-slate-600">{update.summary}</p>
      <p className="font-diary-body mt-3 text-sm italic text-slate-500">{update.whyItMatters}</p>
      <p className="font-diary-body mt-3 text-xs text-slate-500">
        Source: {update.source} · Published {update.publishedDate} · Retrieved {update.retrievedDate}
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" onClick={onSave} className="font-diary-title rounded-lg border-2 border-slate-300 bg-white px-4 py-1 text-sm text-slate-700">
          {savedStatus === 'saved' ? 'Saved' : 'Save'}
        </button>
        <button type="button" onClick={onDismiss} className="font-diary-title rounded-lg border-2 border-slate-300 bg-white px-4 py-1 text-sm text-slate-700">
          Dismiss
        </button>
        <button type="button" onClick={onAddToPlan} disabled={!canAddToPlan} className="font-diary-title rounded-lg bg-indigo-700 px-4 py-1 text-sm text-white disabled:opacity-50">
          Add to plan
        </button>
      </div>
      {!canAddToPlan && <p className="font-diary-body mt-2 text-xs text-slate-500">Create a plan first to add this as an activity.</p>}
    </div>
  )
}
