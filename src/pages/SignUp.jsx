import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { getProfile } from '../lib/db'
import NotebookFrame, {
  FloatingField,
  StickyNote,
  SquiggleIcon,
  UserIcon,
  MailIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  ArrowRightIcon,
  DeskIllustration,
} from '../components/NotebookFrame'

const PASSWORD_RULES = [
  { key: 'length', label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
  { key: 'number', label: 'Include a number', test: (pw) => /\d/.test(pw) },
  { key: 'letter', label: 'Include a letter', test: (pw) => /[a-zA-Z]/.test(pw) },
]

export default function SignUp() {
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState(null)
  const [confirmationPending, setConfirmationPending] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError(null)
    setConfirmationPending(false)
    const { data, error } = await signUp(email, password)
    if (error) {
      setFormError(error.message)
      return
    }
    if (data.session) {
      const profile = await getProfile(data.session.user.id)
      navigate(profile ? '/plan' : '/profile')
      return
    }
    setConfirmationPending(true)
  }

  return (
    <NotebookFrame
      stickyNotes={['Same plans. Brighter days.', "Glad you're here! ⌣"]}
      leftPage={
        <>
          <div className="relative">
            <h1 className="font-diary-title text-3xl text-slate-800 dark:text-slate-100">One more step!</h1>
            <SquiggleIcon className="absolute -right-1 -top-2 h-4 w-6 text-slate-400" />
          </div>
          <p className="font-diary-body mt-3 text-sm text-slate-500 dark:text-slate-400">
            Create an account to save your plan, track your progress, and unlock more opportunities.
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
          <h2 className="font-diary-title text-3xl text-slate-800 dark:text-slate-100">Create your account</h2>
          <p className="font-diary-body mt-1 text-sm text-slate-500 dark:text-slate-400">Let&rsquo;s make your plans official!</p>

          {formError && (
            <p role="alert" className="font-diary-body mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {formError}
            </p>
          )}
          {confirmationPending && (
            <p className="font-diary-body mt-4 rounded-md bg-slate-100 px-4 py-3 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              Check your email to confirm your account.
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <FloatingField
              id="name"
              label="Your name"
              icon={<UserIcon className="h-4 w-4 shrink-0 text-slate-400" />}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              hint="e.g. Hanna Truong"
            />

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
              label="Create a password"
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

            <ul className="font-diary-body space-y-1 pl-1 text-xs text-slate-500 dark:text-slate-400">
              {PASSWORD_RULES.map((rule) => {
                const met = rule.test(password)
                return (
                  <li key={rule.key} className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full border ${
                        met ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 dark:border-slate-500'
                      }`}
                    />
                    <span className={met ? 'text-emerald-600 dark:text-emerald-400' : ''}>{rule.label}</span>
                  </li>
                )
              })}
            </ul>

            <button
              type="submit"
              className="font-diary-title flex w-full items-center justify-center gap-2 rounded-full bg-sky-300 px-4 py-3 text-lg text-slate-800 shadow-sm transition hover:bg-sky-400 dark:bg-sky-500 dark:text-slate-900 dark:hover:bg-sky-400"
            >
              Create account
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          </form>

          <p className="font-diary-body mt-4 text-xs text-slate-400 dark:text-slate-500">
            By creating an account, you agree to our{' '}
            <Link to="/terms" className="text-slate-500 underline hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-slate-500 underline hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
              Privacy Policy
            </Link>
            . Already have an account?{' '}
            <Link to="/login" className="text-slate-500 underline hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
              Log in
            </Link>
            .
          </p>
        </>
      }
    />
  )
}
