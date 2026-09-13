import { Link } from 'react-router-dom'
import NotebookFrame, {
  StickyNote,
  SquiggleIcon,
  ArrowRightIcon,
  DeskIllustration,
} from '../components/NotebookFrame'

// Screen 1: Welcome and onboarding
export default function Welcome() {
  return (
    <NotebookFrame
      stickyNotes={['Small steps, bigger tomorrows', 'Start your story ⌣']}
      leftPage={
        <>
          <div className="relative">
            <h1 className="font-diary-title text-3xl text-slate-800 dark:text-slate-100">CareerCompass AU</h1>
            <SquiggleIcon className="absolute -right-1 -top-2 h-4 w-6 text-slate-400" />
          </div>
          <p className="font-diary-body mt-3 text-sm text-slate-500 dark:text-slate-400">
            Turn your qualification and career goal into a personalised, stage-by-stage
            career plan, informed by common entry-level job requirements in your state.
          </p>

          <div className="relative mt-8">
            <div className="absolute -top-4 right-2 rotate-3">
              <StickyNote small>A career I love</StickyNote>
            </div>
            <DeskIllustration className="mx-auto h-auto w-full max-w-[260px]" />
          </div>

          <p className="font-diary-body mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
            Same girl…{' '}
            <span className="font-diary-title text-base text-teal-700 dark:text-teal-300">A brighter future ♥</span>
          </p>
        </>
      }
      rightPage={
        <>
          <h2 className="font-diary-title text-3xl text-slate-800 dark:text-slate-100">Let's get started</h2>
          <p className="font-diary-body mt-1 text-sm text-slate-500 dark:text-slate-400">
            Tell us about your studies and goals, and we'll sketch out a plan built around
            what employers in your state actually ask for.
          </p>

          <Link
            to="/profile"
            className="font-diary-title mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-sky-300 px-4 py-3 text-lg text-slate-800 shadow-sm transition hover:bg-sky-400 dark:bg-sky-500 dark:text-slate-900 dark:hover:bg-sky-400"
          >
            Create my career plan
            <ArrowRightIcon className="h-4 w-4" />
          </Link>

          <p className="font-diary-body mt-4 text-xs text-slate-400 dark:text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-slate-500 underline hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
              Log in
            </Link>
            .
          </p>

          <p data-testid="ai-notice" className="font-diary-body mt-6 text-xs text-slate-400 dark:text-slate-500">
            CareerCompass AU provides general career guidance, not employment guarantees,
            or migration, visa, legal, financial or licensing advice. AI-generated content
            may be incomplete or inaccurate — always verify with official sources.
          </p>
          <p data-testid="privacy-statement" className="font-diary-body mt-2 text-xs text-slate-400 dark:text-slate-500">
            Your profile stays in this browser session for now — it is not saved to an
            account. It's sent to Google's Gemini API solely to generate the guidance
            shown to you.
          </p>
        </>
      }
    />
  )
}
