import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

const TABS = [
  { to: '/diary', label: 'Diary', bg: '#fef3c7' },
  { to: '/updates', label: 'News', bg: '#e0e7ff' },
  { to: null, label: 'Jobs', bg: '#dcfce7' },
  { to: '/profile', label: 'Profile', bg: '#dbeafe' },
]

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
      navigate('/')
      return
    }
    setConfirmationPending(true)
  }

  return (
    <div className="diary-paper min-h-screen py-10">
      <div className="mx-auto flex max-w-5xl gap-0 px-4">
        <div className="relative hidden shrink-0 sm:flex">
          <div className="book-spine relative w-3 rounded-l-lg">
            <span className="book-spine__rivet absolute left-1/2 top-6 h-1.5 w-1.5 -translate-x-1/2 rounded-full" />
            <span className="book-spine__rivet absolute bottom-6 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full" />
          </div>
          <nav aria-label="Book tabs" className="w-32 pt-10">
            <div className="diary-note mb-4 rounded-r-xl px-3 py-3">
              <p className="font-diary-title flex items-baseline gap-1 text-2xl text-slate-800 dark:text-slate-100">
                Planery <SquiggleIcon className="h-3 w-4 text-slate-400" />
              </p>
              <p className="font-diary-body mt-1 text-[11px] leading-tight text-slate-500 dark:text-slate-400">
                Small steps<br />bigger<br />tomorrows
              </p>
            </div>
            {TABS.map(({ to, label, bg }, i) =>
              to ? (
                <Link
                  key={label}
                  to={to}
                  style={{ backgroundColor: bg, marginLeft: `${i * 4}px` }}
                  className="diary-tab font-diary-title mb-3 block rounded-l-xl py-3 pl-4 pr-2 text-lg text-slate-700 hover:brightness-95"
                >
                  {label}
                </Link>
              ) : (
                <span
                  key={label}
                  title="Coming soon"
                  style={{ backgroundColor: bg, marginLeft: `${i * 4}px` }}
                  className="diary-tab font-diary-title mb-3 block cursor-default rounded-l-xl py-3 pl-4 pr-2 text-lg text-slate-700 opacity-60"
                >
                  {label}
                </span>
              ),
            )}
          </nav>
        </div>

        <div className="flex min-w-0 flex-1 flex-col sm:flex-row">
          <div className="diary-note w-full shrink-0 rounded-t-2xl p-6 sm:w-2/5 sm:rounded-l-none sm:rounded-tr-none sm:p-8">
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
          </div>

          <div className="diary-note min-w-0 flex-1 rounded-b-2xl p-6 sm:rounded-b-none sm:rounded-r-2xl sm:p-8">
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
              <label htmlFor="name" className="diary-field flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2.5 dark:border-slate-600">
                <UserIcon className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="font-diary-body shrink-0 text-sm text-slate-600 dark:text-slate-300">Your name</span>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Hanna Truong"
                  className="font-diary-body min-w-0 flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none dark:text-slate-100"
                />
              </label>

              <label htmlFor="email" className="diary-field flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2.5 dark:border-slate-600">
                <MailIcon className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="font-diary-body shrink-0 text-sm text-slate-600 dark:text-slate-300">Email address</span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. hanna@gmail.com"
                  className="font-diary-body min-w-0 flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none dark:text-slate-100"
                />
              </label>

              <div className="diary-field flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2.5 dark:border-slate-600">
                <label htmlFor="password" className="flex min-w-0 flex-1 items-center gap-2">
                  <LockIcon className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="font-diary-body shrink-0 text-sm text-slate-600 dark:text-slate-300">Create a password</span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="font-diary-body min-w-0 flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none dark:text-slate-100"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide characters' : 'Show characters'}
                  className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>

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
              <a href="#terms" className="text-slate-500 underline hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#privacy" className="text-slate-500 underline hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>

        <div className="hidden w-28 shrink-0 flex-col items-center gap-10 pt-8 pl-4 lg:flex">
          <div className="-rotate-3">
            <StickyNote>Same plans. Brighter days.</StickyNote>
          </div>
          <div className="rotate-2">
            <StickyNote>Glad you&rsquo;re here! ⌣</StickyNote>
          </div>
        </div>
      </div>
    </div>
  )
}

function StickyNote({ children, small }) {
  return (
    <div
      className={`sticky-note font-diary-title rounded-sm text-center leading-tight text-slate-700 ${
        small ? 'px-2 py-1 text-xs' : 'px-3 py-3 text-sm'
      }`}
    >
      {children}
    </div>
  )
}

function SquiggleIcon({ className }) {
  return (
    <svg viewBox="0 0 24 12" fill="none" className={className} aria-hidden="true">
      <path d="M1 8c2-6 4-6 6 0s4 6 6 0 4-6 6 0 3 4 4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function UserIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <circle cx="10" cy="6.5" r="3.25" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3.5 17c1-3.5 4-5 6.5-5s5.5 1.5 6.5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function MailIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <rect x="2.5" y="4.5" width="15" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3.5 5.5l6.5 5 6.5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function LockIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <rect x="4" y="9" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6.5 9V6.5a3.5 3.5 0 017 0V9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function EyeIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M1.5 10S4.5 4.5 10 4.5 18.5 10 18.5 10 15.5 15.5 10 15.5 1.5 10 1.5 10z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx="10" cy="10" r="2.25" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

function EyeOffIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M1.5 10S4.5 4.5 10 4.5 18.5 10 18.5 10 15.5 15.5 10 15.5 1.5 10 1.5 10z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx="10" cy="10" r="2.25" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3 3l14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function ArrowRightIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M4 10h12M11 5.5L16 10l-5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Desk scene: potted plant, a cat asleep on a stack of two books, and a mug —
// a stand-in for the mockup's hand-drawn illustration.
function DeskIllustration({ className }) {
  return (
    <svg viewBox="0 0 300 170" fill="none" className={className} aria-hidden="true">
      {/* plant */}
      <path d="M45 130c-10-14-6-30 5-38 4 12 2 24-5 38z" fill="#6b9b6f" />
      <path d="M50 128c2-16 14-26 26-26-2 13-10 22-26 26z" fill="#5c8a63" />
      <path d="M52 128c-4-15-16-22-27-20 4 12 13 19 27 20z" fill="#7fae7c" />
      <path d="M35 128h26l-3 20a10 10 0 01-20 0z" fill="#c98a5b" />
      <path d="M33 128h30v6H33z" fill="#b5744a" />

      {/* books stack */}
      <g transform="rotate(-3 150 130)">
        <rect x="95" y="118" width="130" height="22" rx="3" fill="#6b7fb0" />
        <text x="160" y="133" textAnchor="middle" fontFamily="Kalam, cursive" fontSize="11" fill="#eef1fb">Better Plan</text>
      </g>
      <g transform="rotate(2 150 110)">
        <rect x="100" y="98" width="118" height="22" rx="3" fill="#d98fa0" />
        <text x="112" y="113" textAnchor="start" fontFamily="Kalam, cursive" fontSize="11" fill="#fff5f7">Brighter Me</text>
      </g>

      {/* sleeping cat on top of books */}
      <g transform="translate(142 60) scale(0.85)">
        <path d="M4 40c-6-16 2-34 22-38 22-4 40 8 44 24 3 12-2 20-14 22-18 3-46 6-52-8z" fill="#f6efe1" stroke="#d8cdb4" strokeWidth="1.2" />
        <path d="M14 4c-4-7 2-11 7-8 3 3 2 9-1 12z" fill="#f6efe1" stroke="#d8cdb4" strokeWidth="1.2" />
        <path d="M34 1c1-7 8-9 11-5 0 5-4 9-7 11z" fill="#f6efe1" stroke="#d8cdb4" strokeWidth="1.2" />
        <path d="M16 8c-2-4 1-7 4-5 2 2 1 6-1 8z" fill="#ecc9d2" />
        <path d="M36 5c1-4 5-6 8-3 0 3-3 6-5 7z" fill="#ecc9d2" />
        <path d="M20 20c2-2 5-2 6 0M32 19c2-2 5-2 6 0" stroke="#8a7f68" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M25 26c1.5 1.5 4 1.5 5.5 0" stroke="#8a7f68" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M60 34c8 2 14-2 16-9" stroke="#f6efe1" strokeWidth="7" strokeLinecap="round" />
      </g>

      {/* mug */}
      <g transform="translate(232 96)">
        <path d="M0 6c8-4 24-4 32 0-2 20-6 30-16 30S2 26 0 6z" fill="#fdfdfd" stroke="#d9d5cc" strokeWidth="1.3" />
        <path d="M31 12c8-2 14 2 13 9-1 6-8 9-14 7" stroke="#d9d5cc" strokeWidth="2" fill="none" />
        <path d="M8-6c2 4-3 6-1 10M18-8c2 4-3 6-1 10M13-4c2 4-3 6-1 10" stroke="#c9c2b3" strokeWidth="1.4" strokeLinecap="round" />
      </g>
    </svg>
  )
}
