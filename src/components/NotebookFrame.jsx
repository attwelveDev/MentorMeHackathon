import { useState } from 'react'
import { Link } from 'react-router-dom'

const TABS = [
  { to: '/diary', label: 'Diary', bg: '#fef3c7' },
  { to: '/updates', label: 'News', bg: '#e0e7ff' },
  { to: null, label: 'Jobs', bg: '#dcfce7' },
  { to: '/profile', label: 'Profile', bg: '#dbeafe' },
]

// The open-notebook chrome shared by the Sign up and Log in screens: a book
// cover behind a tab-holder column and a two-page spread, with margin sticky
// notes. `leftPage` and `rightPage` are each page's own content.
export default function NotebookFrame({ leftPage, rightPage, stickyNotes = [] }) {
  return (
    <div className="diary-paper min-h-screen py-10">
      <div className="mx-auto flex max-w-5xl gap-0 px-4">
        <div className="relative flex min-w-0 flex-1">
          {/* Cover: sits behind the tabs and both pages, and peeks out past their edges. */}
          <div className="book-cover absolute -top-4 -bottom-4 left-0 -right-4 hidden rounded-2xl sm:block" />

          <nav aria-label="Book tabs" className="relative hidden w-32 shrink-0 pt-10 sm:block">
            {/* The tab-holder page: same plane as the Planery text, sitting behind the tabs. */}
            <div className="diary-note diary-note--no-tape absolute inset-0 rounded-l-2xl" />
            <p className="font-diary-title relative flex items-baseline gap-1 px-3 text-2xl text-slate-800 dark:text-slate-100">
              Planery <SquiggleIcon className="h-3 w-4 text-slate-400" />
            </p>
            <p className="font-diary-body relative mb-4 mt-1 px-3 text-[11px] leading-tight text-slate-500 dark:text-slate-400">
              Small steps<br />bigger<br />tomorrows
            </p>
            {TABS.map(({ to, label, bg }, i) =>
              to ? (
                <Link
                  key={label}
                  to={to}
                  style={{ backgroundColor: bg, marginLeft: `${i * 4}px` }}
                  className="diary-tab font-diary-title relative mb-3 block rounded-l-xl py-3 pl-4 pr-2 text-lg text-slate-700 hover:brightness-95"
                >
                  {label}
                </Link>
              ) : (
                <span
                  key={label}
                  title="Coming soon"
                  style={{ backgroundColor: bg, marginLeft: `${i * 4}px` }}
                  className="diary-tab font-diary-title relative mb-3 block cursor-default rounded-l-xl py-3 pl-4 pr-2 text-lg text-slate-700 opacity-60"
                >
                  {label}
                </span>
              ),
            )}
          </nav>

          <div className="relative flex min-w-0 flex-1 flex-col sm:flex-row">
            {/* Spine: the binding edge, aligned with the seam between the two pages, protruding above and below them. */}
            <div className="book-spine absolute -top-4 -bottom-4 left-0 hidden w-6 -translate-x-1/2 rounded-full sm:left-[40%] sm:block">
              <span className="book-spine__rivet absolute left-1/2 top-3 h-1.5 w-1.5 -translate-x-1/2 rounded-full" />
              <span className="book-spine__rivet absolute bottom-3 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full" />
            </div>
            <div className="diary-note diary-note--no-tape w-full shrink-0 rounded-t-2xl p-6 sm:w-2/5 sm:rounded-bl-2xl sm:rounded-tr-none sm:p-8">
              {leftPage}
            </div>
            <div className="diary-note diary-note--no-tape min-w-0 flex-1 rounded-b-2xl p-6 sm:rounded-b-none sm:rounded-r-2xl sm:p-8">
              {rightPage}
            </div>
          </div>
        </div>

        <div className="hidden w-28 shrink-0 flex-col items-center gap-10 pt-8 pl-4 lg:flex">
          {stickyNotes[0] && (
            <div className="-rotate-3">
              <StickyNote>{stickyNotes[0]}</StickyNote>
            </div>
          )}
          {stickyNotes[1] && (
            <div className="rotate-2">
              <StickyNote>{stickyNotes[1]}</StickyNote>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Field with a label that starts centred like a placeholder, then shrinks to
// the top-left corner on focus or once a value is entered (Google-style).
export function FloatingField({ id, label, icon, type, value, onChange, hint, trailing }) {
  const [focused, setFocused] = useState(false)
  const floated = focused || value.length > 0

  return (
    <div className="diary-field flex items-center gap-2 rounded-xl border border-slate-300 px-3 dark:border-slate-600">
      {icon}
      <div className="relative h-11 min-w-0 flex-1">
        <label
          htmlFor={id}
          className={`font-diary-body pointer-events-none absolute left-0 text-slate-500 transition-all duration-150 dark:text-slate-400 ${
            floated ? 'top-1 text-[10px]' : 'top-1/2 -translate-y-1/2 text-sm'
          }`}
        >
          {label}
        </label>
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={floated ? hint : ''}
          className="font-diary-body absolute inset-x-0 bottom-0 h-6 w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none dark:text-slate-100"
        />
      </div>
      {trailing}
    </div>
  )
}

export function StickyNote({ children, small }) {
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

export function SquiggleIcon({ className }) {
  return (
    <svg viewBox="0 0 24 12" fill="none" className={className} aria-hidden="true">
      <path d="M1 8c2-6 4-6 6 0s4 6 6 0 4-6 6 0 3 4 4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function UserIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <circle cx="10" cy="6.5" r="3.25" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3.5 17c1-3.5 4-5 6.5-5s5.5 1.5 6.5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export function MailIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <rect x="2.5" y="4.5" width="15" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3.5 5.5l6.5 5 6.5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function LockIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <rect x="4" y="9" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6.5 9V6.5a3.5 3.5 0 017 0V9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export function EyeIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M1.5 10S4.5 4.5 10 4.5 18.5 10 18.5 10 15.5 15.5 10 15.5 1.5 10 1.5 10z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx="10" cy="10" r="2.25" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

export function EyeOffIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M1.5 10S4.5 4.5 10 4.5 18.5 10 18.5 10 15.5 15.5 10 15.5 1.5 10 1.5 10z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx="10" cy="10" r="2.25" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3 3l14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export function ArrowRightIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M4 10h12M11 5.5L16 10l-5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Desk scene: potted plant, a cat asleep on a stack of two books, and a mug —
// a stand-in for the mockup's hand-drawn illustration.
export function DeskIllustration({ className }) {
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
