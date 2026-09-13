import { useEffect, useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { getCareerReadinessAnalysis } from '../lib/ai'
import NotebookFrame from '../components/NotebookFrame'

const GOAL_COLOURS = { background: '#3b3163', text: '#f5f1e8' }
const MAX_PARSE_ATTEMPTS = 3

// Screen 3: Career-readiness analysis
export default function Analysis() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const profile = state?.profile
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!profile) {
      navigate('/profile')
      return
    }
    let cancelled = false

    async function run() {
      setLoading(true)
      setError(null)
      for (let attempt = 1; attempt <= MAX_PARSE_ATTEMPTS; attempt++) {
        let text
        try {
          text = await getCareerReadinessAnalysis(profile)
        } catch {
          if (!cancelled) setError('We could not generate your analysis. Please try again.')
          break
        }
        try {
          if (!cancelled) setAnalysis(JSON.parse(text))
          break
        } catch {
          if (attempt === MAX_PARSE_ATTEMPTS && !cancelled) {
            setError('We could not generate your analysis. Please try again.')
          }
        }
      }
      if (!cancelled) setLoading(false)
    }

    run()
    return () => { cancelled = true }
  }, [profile, navigate])

  if (loading) return <Centered>Analysing your profile…</Centered>
  if (error) return <Centered className="text-red-700">{error}</Centered>
  if (!analysis) return null

  const leftPage = (
    <>
      <div
        className="diary-note -rotate-1 rounded-2xl p-6 text-center"
        style={{ backgroundColor: GOAL_COLOURS.background, color: GOAL_COLOURS.text }}
      >
        <p className="font-diary-title text-2xl">🔍 Reality check</p>
        <p className="font-diary-title mt-1 text-3xl">Become a {profile?.targetOccupation}</p>
      </div>

      <p className="font-diary-body mt-6 text-sm text-slate-500 dark:text-slate-400">
        This is general career guidance based on common entry-level job postings, not a
        guarantee of employment or migration eligibility.
      </p>

      <Link
        to="/plan"
        state={{ profile }}
        className="font-diary-title mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-sky-300 px-4 py-3 text-lg text-slate-800 shadow-sm transition hover:bg-sky-400 dark:bg-sky-500 dark:text-slate-900 dark:hover:bg-sky-400"
      >
        Generate my plan
      </Link>
    </>
  )

  const rightPage = (
    <>
      <h1 className="font-diary-title text-4xl text-slate-800 dark:text-slate-100">Career readiness</h1>
      <p className="font-diary-body mt-1 text-slate-500 dark:text-slate-400">Where you stand right now.</p>

      <div className="mt-8 space-y-8">
        <Section title="Existing strengths" items={analysis.strengths} />
        <Section title="Skills to develop" items={analysis.skillGaps} />
        <Section title="Experience to gain" items={analysis.experienceGaps} />
        <Section title="Licences or registrations to investigate" items={analysis.licencesToInvestigate} />
        <Section title="Could not be assessed" items={analysis.insufficientInformation} />
      </div>
    </>
  )

  return <NotebookFrame leftPage={leftPage} rightPage={rightPage} stickyNotes={["You're closer than you think"]} />
}

function Section({ title, items }) {
  if (!items || items.length === 0) return null
  return (
    <section>
      <h2 className="font-diary-title text-2xl text-slate-800 dark:text-slate-100">{title}</h2>
      <div className="diary-note mt-3 rounded-lg border border-slate-200 p-4">
        <ul className="font-diary-body list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function Centered({ children, className = '' }) {
  return (
    <div className="diary-paper flex min-h-screen items-center justify-center px-4">
      <p className={`font-diary-title text-2xl text-slate-700 ${className}`}>{children}</p>
    </div>
  )
}
