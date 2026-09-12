import { useState } from 'react'

// Screen 6: State-by-state job market and migration trend updates.
// This page renders curated, pre-sourced items (see src/data/marketSources.js)
// and calls the AI only to summarise/label each one — it does not fetch
// live news itself.
export default function MarketUpdates() {
  const [updates] = useState([])

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900">Job market &amp; migration updates</h1>
      <p className="mt-2 text-xs text-slate-400">
        General career information only, not financial, legal or migration advice.
      </p>
      {updates.length === 0 ? (
        <p className="mt-8 text-sm text-slate-500">
          No sufficiently relevant recent updates were found for your profile yet.
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {updates.map((update, i) => (
            <UpdateCard key={i} update={update} />
          ))}
        </div>
      )}
    </div>
  )
}

function UpdateCard({ update }) {
  return (
    <article className="rounded-md border border-slate-200 p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">{update.headline}</h2>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
          {update.statusLabel}
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-600">{update.summary}</p>
      <p className="mt-2 text-xs text-slate-500">
        Source: {update.source} · Published {update.publishedDate} · Retrieved {update.retrievedDate}
      </p>
      <p className="mt-2 text-sm italic text-slate-500">{update.whyItMatters}</p>
    </article>
  )
}
