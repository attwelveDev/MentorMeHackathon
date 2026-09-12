import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import NotebookFrame, {
  FloatingField,
  StickyNote,
  SquiggleIcon,
  MailIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  ArrowRightIcon,
  DeskIllustration,
} from '../components/NotebookFrame'

export default function Login() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState(null)

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError(null)
    const { data, error } = await signIn(email, password)
    if (error) {
      setFormError(error.message)
      return
    }
    if (data.session) {
      navigate('/')
    }
  }

  return (
    <NotebookFrame
      stickyNotes={['Same plans. Brighter days.', 'Good to see you! ⌣']}
      leftPage={
        <>
          <div className="relative">
            <h1 className="font-diary-title text-3xl text-slate-800 dark:text-slate-100">Welcome back!</h1>
            <SquiggleIcon className="absolute -right-1 -top-2 h-4 w-6 text-slate-400" />
          </div>
          <p className="font-diary-body mt-3 text-sm text-slate-500 dark:text-slate-400">
            Log in to pick up right where you left off with your plan and progress.
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
          <h2 className="font-diary-title text-3xl text-slate-800 dark:text-slate-100">Log in</h2>
          <p className="font-diary-body mt-1 text-sm text-slate-500 dark:text-slate-400">Good to see you again!</p>

          {formError && (
            <p role="alert" className="font-diary-body mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {formError}
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <FloatingField
              id="email"
              label="Email address"
              icon={<MailIcon className="h-4 w-4 shrink-0 text-slate-400" />}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              hint="e.g. hanna@gmail.com"
            />

            <FloatingField
              id="password"
              label="Password"
              icon={<LockIcon className="h-4 w-4 shrink-0 text-slate-400" />}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide characters' : 'Show characters'}
                  className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              }
            />

            <button
              type="submit"
              className="font-diary-title flex w-full items-center justify-center gap-2 rounded-full bg-sky-300 px-4 py-3 text-lg text-slate-800 shadow-sm transition hover:bg-sky-400 dark:bg-sky-500 dark:text-slate-900 dark:hover:bg-sky-400"
            >
              Log in
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          </form>

          <p className="font-diary-body mt-4 text-xs text-slate-400 dark:text-slate-500">
            New to CareerCompass AU?{' '}
            <Link to="/signup" className="text-slate-500 underline hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
              Create an account
            </Link>
            .
          </p>
        </>
      }
    />
  )
}
