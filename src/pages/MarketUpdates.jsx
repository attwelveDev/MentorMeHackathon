import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { summariseMarketUpdate } from '../lib/ai'
import {
  getProfile, getPlanWithActivities, getSavedMarketUpdates,
  setMarketUpdateStatus, addPlanActivityFromUpdate, setUpdateFrequency,
} from '../lib/db'
import { marketSources } from '../data/marketSources'
import { TOPICS, matchesProfile, isValidClassifiedItem, filterAndSortUpdates } from '../lib/marketUpdates'
import { pickCurrentPeriod } from '../lib/roadmap'
import UpdateDetailPanel from '../components/UpdateDetailPanel'

const TABS = [
  { to: '/diary', label: 'Diary', bg: '#fef3c7' },
  { to: '/updates', label: 'News', bg: '#e0e7ff' },
  { to: '/profile', label: 'Profile', bg: '#dbeafe' },
]

const DISCLAIMER = 'This is general career information, not financial, investment, legal or migration advice.'

// Screen 6: state-by-state job market and migration trend updates. Renders
// curated, pre-sourced items (see src/data/marketSources.js) and calls the
// AI only to summarise/label each one — it does not fetch live news itself.
export default function MarketUpdates() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [plan, setPlan] = useState(null)
  const [savedMap, setSavedMap] = useState({})
  const [classified, setClassified] = useState(null) // null = still loading
  const [frequency, setFrequency] = useState('weekly')
  const [topic, setTopic] = useState('All')
  const [recency, setRecency] = useState('All')
  const [search, setSearch] = useState('')
  const [openId, setOpenId] = useState(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false

    async function load() {
      const [profileRow, planData, savedRows] = await Promise.all([
        getProfile(user.id), getPlanWithActivities(user.id), getSavedMarketUpdates(user.id),
      ])
      if (cancelled) return

      const normalisedProfile = {
        targetOccupation: profileRow?.target_occupation ?? '',
        state: profileRow?.state ?? '',
        studyStage: profileRow?.study_stage ?? '',
        graduationYear: profileRow?.graduation_year ?? '',
        courseLengthYears: profileRow?.course_length_years ?? '',
      }
      const savedStatusMap = Object.fromEntries(savedRows.map((row) => [row.source_id, row.status]))

      setProfile(normalisedProfile)
      setPlan(planData?.plan ?? null)
      setFrequency(profileRow?.update_frequency ?? 'weekly')
      setSavedMap(savedStatusMap)

      const matched = marketSources.filter((item) => matchesProfile(item, normalisedProfile))
      const results = await Promise.all(matched.map(async (item) => {
        try {
          const text = await summariseMarketUpdate(item)
          // Gemini sometimes wraps its JSON response in a markdown code fence
          // (```json ... ```) despite being asked not to — strip it before parsing.
          const jsonText = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '')
          const parsed = JSON.parse(jsonText)
          return isValidClassifiedItem(parsed) ? { ...item, ...parsed } : null
        } catch {
          // An unparseable or malformed AI response is excluded rather than
          // crashing the whole feed for every other item.
          return null
        }
      }))
      if (cancelled) return

      const valid = results.filter(Boolean).filter((item) => savedStatusMap[item.id] !== 'dismissed')
      setClassified(valid)
    }

    load()
    return () => { cancelled = true }
  }, [user])

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <p className="text-slate-600">Create an account to view job market &amp; migration updates.</p>
        <Link to="/signup" className="mt-4 inline-block rounded-md bg-indigo-600 px-6 py-3 font-medium text-white hover:bg-indigo-700">Sign up</Link>
      </div>
    )
  }

  if (classified === null) {
    return <Centered>Loading updates…</Centered>
  }

  const filtered = filterAndSortUpdates(classified, { topic, recency, search })
  const openUpdate = openId == null ? null : classified.find((u) => u.id === openId) ?? null

  function handleSave(update) {
    setMarketUpdateStatus(user.id, update.id, 'saved')
    setSavedMap((prev) => ({ ...prev, [update.id]: 'saved' }))
  }

  function handleDismiss(update) {
    setMarketUpdateStatus(user.id, update.id, 'dismissed')
    setSavedMap((prev) => ({ ...prev, [update.id]: 'dismissed' }))
    setClassified((prev) => prev.filter((u) => u.id !== update.id))
    setOpenId(null)
  }

  async function handleAddToPlan(update) {
    if (!plan) return
    const period = pickCurrentPeriod(profile)
    await addPlanActivityFromUpdate(plan.id, user.id, {
      title: update.headline,
      category: 'Commercial and industry awareness',
      priority: 'Medium',
      explanation: update.whyItMatters,
      periodLabel: period.periodLabel,
      periodYear: period.periodYear,
    })
  }

  async function handleFrequencyChange(value) {
    setFrequency(value)
    await setUpdateFrequency(user.id, value)
  }

  return (
    <div className="diary-paper min-h-screen py-10">
      <div className="mx-auto flex max-w-5xl gap-0 px-4">
        <nav aria-label="Book tabs" className="relative w-28 shrink-0 pt-10">
          {TABS.map(({ to, label, bg }, i) => (
            <Link
              key={to}
              to={to}
              style={{ backgroundColor: bg, marginLeft: `${i * 6}px` }}
              className="diary-tab font-diary-title mb-3 block rounded-l-xl py-3 pl-4 pr-2 text-lg text-slate-700 hover:brightness-95"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex min-w-0 flex-1 flex-col gap-0 sm:flex-row">
          <div className="diary-note w-full shrink-0 rounded-t-2xl p-6 sm:w-1/3 sm:rounded-l-2xl sm:rounded-tr-none">
            <h1 className="font-diary-title text-3xl text-slate-800">Job market &amp; migration updates</h1>
            <p className="font-diary-body mt-2 text-sm text-slate-500">For you, based on your profile.</p>
          </div>

          <div className="diary-note min-w-0 flex-1 rounded-b-2xl p-6 sm:rounded-l-none sm:rounded-r-2xl sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search updates…"
                className="font-diary-body rounded-md border border-slate-300 px-3 py-1 text-sm"
              />
              <label className="font-diary-body flex items-center gap-2 text-sm text-slate-600">
                Update frequency
                <select
                  value={frequency}
                  onChange={(e) => handleFrequencyChange(e.target.value)}
                  className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="off">Off</option>
                </select>
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {['All', ...TOPICS].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTopic(t)}
                  className={`font-diary-body rounded-full border px-3 py-1 text-xs ${
                    topic === t ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-300 text-slate-600'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="mt-3">
              <select
                value={recency}
                onChange={(e) => setRecency(e.target.value)}
                className="font-diary-body rounded-md border border-slate-300 px-2 py-1 text-sm"
              >
                <option value="All">All time</option>
                <option value="this-week">This week</option>
                <option value="this-month">This month</option>
                <option value="older">Older</option>
              </select>
            </div>

            <div className="mt-6 space-y-4">
              {classified.length === 0 ? (
                <p className="font-diary-body text-sm text-slate-500">Nothing has been curated for your profile yet.</p>
              ) : filtered.length === 0 ? (
                <p className="font-diary-body text-sm text-slate-500">No updates match your current filters.</p>
              ) : (
                filtered.map((update) => (
                  <article
                    key={update.id}
                    onClick={() => setOpenId(update.id)}
                    className="cursor-pointer rounded-lg border border-slate-200 p-4 transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-diary-title text-lg font-semibold text-slate-900">{update.headline}</p>
                      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{update.statusLabel}</span>
                    </div>
                    <p className="font-diary-body mt-1 text-xs text-slate-500">{update.topic}</p>
                    <p className="font-diary-body mt-2 text-sm text-slate-600">{update.summary}</p>
                    <p className="font-diary-body mt-2 text-xs text-slate-500">
                      Source: {update.source} · Published {update.publishedDate} · Retrieved {update.retrievedDate}
                    </p>
                  </article>
                ))
              )}
            </div>

            <p className="font-diary-body mt-8 text-xs text-slate-400">{DISCLAIMER}</p>
          </div>
        </div>
      </div>

      {openUpdate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setOpenId(null)}>
          <div className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <UpdateDetailPanel
              update={openUpdate}
              savedStatus={savedMap[openUpdate.id] ?? null}
              canAddToPlan={Boolean(plan)}
              onClose={() => setOpenId(null)}
              onSave={() => handleSave(openUpdate)}
              onDismiss={() => handleDismiss(openUpdate)}
              onAddToPlan={() => handleAddToPlan(openUpdate)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function Centered({ children }) {
  return (
    <div className="diary-paper flex min-h-screen items-center justify-center px-4">
      <p className="font-diary-title text-2xl text-slate-700">{children}</p>
    </div>
  )
}
