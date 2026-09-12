import { Link } from 'react-router-dom'

// Screen 1: Welcome and onboarding
export default function Welcome() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="text-3xl font-bold text-slate-900">CareerCompass AU</h1>
      <p className="mt-4 text-slate-600">
        Turn your qualification and career goal into a personalised, stage-by-stage
        career plan, informed by common entry-level job requirements in your state.
      </p>
      <Link
        to="/profile"
        className="mt-8 inline-block rounded-md bg-indigo-600 px-6 py-3 font-medium text-white hover:bg-indigo-700"
      >
        Create my career plan
      </Link>
      <p className="mt-6 text-xs text-slate-400">
        CareerCompass AU provides general career guidance, not employment guarantees,
        or migration, visa, legal, financial or licensing advice. AI-generated content
        may be incomplete or inaccurate — always verify with official sources.
      </p>
    </div>
  )
}
