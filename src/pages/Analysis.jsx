import { useEffect, useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { getCareerReadinessAnalysis } from '../lib/ai'

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
    setLoading(true)
    getCareerReadinessAnalysis(profile)
      .then((text) => {
        try {
          setAnalysis(JSON.parse(text))
        } catch {
          setError('The AI response could not be read. Please try again.')
        }
      })
      .catch(() => setError('We could not generate your analysis. Please try again.'))
      .finally(() => setLoading(false))
  }, [profile, navigate])

  if (loading) return <Centered>Analysing your profile…</Centered>
  if (error) return <Centered className="text-red-700">{error}</Centered>
  if (!analysis) return null

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Career readiness</h1>
      <p className="text-xs text-slate-400">
        This is general career guidance based on common entry-level job postings, not a
        guarantee of employment or migration eligibility.
      </p>
      <Section title="Existing strengths" items={analysis.strengths} />
      <Section title="Skills to develop" items={analysis.skillGaps} />
      <Section title="Experience to gain" items={analysis.experienceGaps} />
      <Section title="Licences or registrations to investigate" items={analysis.licencesToInvestigate} />
      <Section title="Could not be assessed" items={analysis.insufficientInformation} />
      <Link
        to="/plan"
        state={{ profile }}
        className="inline-block rounded-md bg-indigo-600 px-6 py-3 font-medium text-white hover:bg-indigo-700"
      >
        Generate my plan
      </Link>
    </div>
  )
}

function Section({ title, items }) {
  if (!items || items.length === 0) return null
  return (
    <section>
      <h2 className="font-semibold text-slate-800">{title}</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </section>
  )
}

function Centered({ children, className = '' }) {
  return <div className={`mx-auto max-w-2xl px-4 py-16 text-center ${className}`}>{children}</div>
}
