# Auth foundation (Capability 2 / Phase 2)

- **Date:** 2026-09-12
- **Status:** Approved
- **Requirements confirmed by user:** yes — 2026-09-12

## 1. Summary

Later phases of the career-planner-and-diary capability (see
`specs/2026-09-12-career-planner-and-diary.md`) require every "Accept plan /
edit / track / diary / News" action to be locked behind a real account, while
Save stays open to guests. This repo has no authentication at all today —
no session state, no sign-up/login screens, no gating primitive. This plan
builds exactly that foundation: minimal Supabase email/password auth, a
`useAuth()` session context available app-wide, `SignUp`/`Login` screens, and
a reusable `LockedAction` component that later phases (Roadmap, Diary,
MarketUpdates gating) will wrap their gated buttons/links in. It does not
build the plan-import-on-signup flow (that's Phase 4/Roadmap's job, since it
needs the localStorage plan shape Phase 4 defines) and does not touch
Supabase tables (Phase 3).

## 2. Requirements

### 2.1 Functional requirements

1. The app shall expose a `useAuth()` hook (via a context provider wrapping
   the app) returning `{ user, session, loading, signUp, signIn, signOut }`,
   where `user` is `null` when signed out and the Supabase user object when
   signed in.
2. A new `/signup` screen shall render email + password fields; submitting
   calls `supabase.auth.signUp`. If the resulting session is immediately
   active (`data.session` present), the user is navigated to `/`. If no
   session is returned (email confirmation required — Supabase's default
   project behaviour), the screen shows a "Check your email to confirm your
   account" message instead of navigating.
3. A new `/login` screen shall render email + password fields; submitting
   calls `supabase.auth.signInWithPassword`. On success, navigates to `/`. On
   failure, shows the returned error message inline and does not navigate.
4. A reusable `LockedAction` component shall render its children as an
   active, clickable element when `user` is non-null, and as a visibly
   locked affordance (locked styling + "Create an account to unlock"
   messaging, linking to `/signup`) when `user` is `null` — for later phases
   to wrap any gated control in, without each phase re-implementing the gate
   check.
5. `App.jsx`'s nav shall show "Sign up" and "Log in" links when signed out,
   and a "Sign out" action when signed in.

### 2.2 Non-functional requirements

- Auth/permissions surface (Supabase Auth) — see gated tasks below.
- Assumes the Supabase project's default email/password auth is enabled; no
  dashboard-side Supabase configuration is performed by this plan (that's a
  manual prerequisite for whoever runs this against a real project, not
  something a code plan can do).

### 2.3 Out of scope

- Importing a localStorage-saved guest plan on signup (Phase 4/Roadmap).
- Supabase tables/RLS (Phase 3).
- Actually gating any specific existing screen's actions with
  `LockedAction` (Phases 4–6 apply it to Roadmap/Diary/MarketUpdates).
- Password reset / email-change flows beyond Supabase Auth defaults.
- Social/OAuth login providers.

### 2.4 Assumptions

- Supabase project has email/password sign-up enabled (Supabase's default).
  Whether email confirmation is required or not is handled by requirement
  2.1.2's branching, so the plan works either way without needing to know in
  advance which mode the project is in.

## 3. Existing code context

- `src/lib/supabaseClient.js` — exports `supabase`, a configured
  `createClient(supabaseUrl, supabaseAnonKey)` client from
  `@supabase/supabase-js`. This is the only Supabase touchpoint in the repo
  today; nothing currently calls `supabase.auth.*`.
- `src/App.jsx` — renders a `<nav>` with static `<Link>`s (`/`, `/profile`,
  `/plan`, `/dashboard`, `/updates`) above `<Routes>`. No context providers
  wrap the tree today.
- No `src/lib/auth.jsx`, `src/pages/SignUp.jsx`, `src/pages/Login.jsx`, or
  `src/components/` directory exist yet.
- Test setup: Vitest + `@testing-library/react`, config in `vite.config.js`
  (`environment: 'jsdom'`, `setupFiles: ['./src/setupTests.js']`). Command:
  `npm test`. Existing pattern for mocking `react-router-dom`'s
  `useNavigate` (see `src/pages/Profile.test.jsx` lines 12–16):
  ```js
  const mockNavigate = vi.fn()
  vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal()
    return { ...actual, useNavigate: () => mockNavigate }
  })
  ```
  This plan follows the same pattern for `useNavigate`, and introduces the
  equivalent for mocking `../lib/supabaseClient`'s `supabase.auth` methods.
- `src/lib/ai.test.js` shows the repo's convention for mocking `global.fetch`
  per-test with `beforeEach`; this plan's tests instead mock
  `supabase.auth.*` methods directly with `vi.fn()`, since there's no fetch
  involved at this layer (the Supabase JS client handles that internally).

## 4. Approach

A single React context (`AuthContext`) backed by `supabase.auth.getSession()`
on mount plus `supabase.auth.onAuthStateChange` for live updates, exposed via
`useAuth()`. `LockedAction` reads `useAuth()` directly rather than requiring
callers to pass `user` down, so later phases can wrap any button/link with
zero extra plumbing. `SignUp`/`Login` are plain forms following the existing
`Profile.jsx` error-banner + inline-error visual pattern rather than
introducing a new one.

No alternative seriously considered — this is the standard Supabase Auth
React context pattern, matching the project's existing use of React Router's
own context-free hooks.

## 5. Task breakdown

### Task 1: `AuthProvider` / `useAuth()` session context

- **Description:** Add the context provider and hook that all later auth
  code depends on.
- **Files touched:** `src/lib/auth.jsx` (new), `src/lib/auth.test.jsx` (new).
- **Tests first (red):** In `src/lib/auth.test.jsx`:
  ```js
  import { describe, it, expect, vi, beforeEach } from 'vitest'
  import { render, screen, waitFor, act } from '@testing-library/react'
  import { AuthProvider, useAuth } from './auth'

  const mockAuth = {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
  }
  vi.mock('./supabaseClient', () => ({ supabase: { auth: mockAuth } }))

  function Probe() {
    const { user, loading } = useAuth()
    return <div>{loading ? 'loading' : user ? `signed-in:${user.id}` : 'signed-out'}</div>
  }

  beforeEach(() => { vi.clearAllMocks() })

  describe('AuthProvider/useAuth', () => {
    it('starts loading, then reflects a null session as signed-out', async () => {
      mockAuth.getSession.mockResolvedValue({ data: { session: null } })
      render(<AuthProvider><Probe /></AuthProvider>)
      expect(screen.getByText('loading')).toBeInTheDocument()
      await waitFor(() => expect(screen.getByText('signed-out')).toBeInTheDocument())
    })

    it('reflects an existing session as signed-in with the session user', async () => {
      mockAuth.getSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } })
      render(<AuthProvider><Probe /></AuthProvider>)
      await waitFor(() => expect(screen.getByText('signed-in:u1')).toBeInTheDocument())
    })

    it('updates when onAuthStateChange fires', async () => {
      mockAuth.getSession.mockResolvedValue({ data: { session: null } })
      let callback
      mockAuth.onAuthStateChange.mockImplementation((cb) => {
        callback = cb
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      })
      render(<AuthProvider><Probe /></AuthProvider>)
      await waitFor(() => expect(screen.getByText('signed-out')).toBeInTheDocument())
      act(() => callback('SIGNED_IN', { user: { id: 'u2' } }))
      expect(screen.getByText('signed-in:u2')).toBeInTheDocument()
    })

    it('throws when useAuth is called outside an AuthProvider', () => {
      const Bare = () => { useAuth(); return null }
      expect(() => render(<Bare />)).toThrow(/useAuth must be used within an AuthProvider/)
    })
  })
  ```
- **Implementation (green):** `src/lib/auth.jsx`:
  ```jsx
  import { createContext, useContext, useEffect, useState } from 'react'
  import { supabase } from './supabaseClient'

  const AuthContext = createContext(undefined)

  export function AuthProvider({ children }) {
    const [session, setSession] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
      supabase.auth.getSession().then(({ data }) => {
        setSession(data.session)
        setLoading(false)
      })
      const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
        setSession(newSession)
      })
      return () => listener.subscription.unsubscribe()
    }, [])

    const value = {
      session,
      user: session?.user ?? null,
      loading,
      signUp: (email, password) => supabase.auth.signUp({ email, password }),
      signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
      signOut: () => supabase.auth.signOut(),
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  }

  export function useAuth() {
    const ctx = useContext(AuthContext)
    if (ctx === undefined) throw new Error('useAuth must be used within an AuthProvider')
    return ctx
  }
  ```
- **Refactor:** None expected.
- **Acceptance criteria:**
  - `useAuth()` outside a provider throws the stated error.
  - `user` is `null` until `getSession` resolves and stays `null` for a null
    session; reflects `session.user` for a non-null session.
  - `onAuthStateChange` callbacks update `user`/`session` live.
- **Review gate:** **Human review:** this task establishes the Supabase Auth
  session model the whole app will rely on (gate condition 3: auth surface).
  Look at `src/lib/auth.jsx` and confirm the `useAuth()` shape
  (`user`/`session`/`loading`/`signUp`/`signIn`/`signOut`) is what later
  phases should build against before anything else consumes it.
- **Depends on:** None.

### Task 2: `SignUp` screen

- **Description:** Add the `/signup` route and form, handling both the
  immediate-session and email-confirmation-required Supabase outcomes.
- **Files touched:** `src/pages/SignUp.jsx` (new), `src/pages/SignUp.test.jsx`
  (new), `src/App.jsx` (add route + nav link).
- **Tests first (red):** In `src/pages/SignUp.test.jsx`, following the
  `useNavigate` mock pattern from `Profile.test.jsx`, plus mocking
  `useAuth` from `../lib/auth`:
  ```js
  const mockNavigate = vi.fn()
  vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal()
    return { ...actual, useNavigate: () => mockNavigate }
  })
  const mockSignUp = vi.fn()
  vi.mock('../lib/auth', () => ({ useAuth: () => ({ signUp: mockSignUp }) }))
  import SignUp from './SignUp'

  describe('SignUp', () => {
    it('navigates to / when signUp returns an active session', async () => {
      mockSignUp.mockResolvedValue({ data: { session: { user: { id: 'u1' } } }, error: null })
      render(<SignUp />)
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } })
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'secret123' } })
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }))
      await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'))
    })

    it('shows a confirm-your-email message and does not navigate when no session is returned', async () => {
      mockSignUp.mockResolvedValue({ data: { session: null }, error: null })
      render(<SignUp />)
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } })
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'secret123' } })
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }))
      await waitFor(() => expect(screen.getByText(/check your email/i)).toBeInTheDocument())
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('shows the error message and does not navigate when signUp fails', async () => {
      mockSignUp.mockResolvedValue({ data: { session: null }, error: { message: 'User already registered' } })
      render(<SignUp />)
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } })
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'secret123' } })
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }))
      await waitFor(() => expect(screen.getByText(/user already registered/i)).toBeInTheDocument())
      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })
  ```
- **Implementation (green):** `src/pages/SignUp.jsx` — email/password
  `Field`-style inputs (reuse the visual pattern, not the `Profile.jsx`
  `Field` component itself, to avoid coupling an unrelated screen to it),
  `handleSubmit` calling `await signUp(email, password)`, branching on
  `error` → inline error, `data.session` → `navigate('/')`, else → "Check
  your email to confirm your account" message. Add `<Route path="/signup" element={<SignUp />} />`
  to `src/App.jsx` and a "Sign up" `<Link to="/signup">` in the nav (rendered
  only when signed out — see Task 5).
- **Refactor:** None expected.
- **Acceptance criteria:** the three test cases above pass; no navigation on
  error or pending-confirmation outcomes.
- **Review gate:** **Human review:** auth surface (gate condition 3). Look at
  the three outcomes in `src/pages/SignUp.jsx` (active session / pending
  confirmation / error) and confirm the copy and branching match what should
  happen against the real Supabase project once phases 4–6 depend on it.
- **Depends on:** Task 1.

### Task 3: `Login` screen

- **Description:** Add the `/login` route and form.
- **Files touched:** `src/pages/Login.jsx` (new), `src/pages/Login.test.jsx`
  (new), `src/App.jsx` (add route + nav link).
- **Tests first (red):** In `src/pages/Login.test.jsx`, same mocking pattern
  as Task 2 but for `signIn`:
  ```js
  describe('Login', () => {
    it('navigates to / on successful sign-in', async () => {
      mockSignIn.mockResolvedValue({ data: { session: { user: { id: 'u1' } } }, error: null })
      render(<Login />)
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } })
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'secret123' } })
      fireEvent.click(screen.getByRole('button', { name: /log in/i }))
      await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'))
    })

    it('shows the error and does not navigate on failed sign-in', async () => {
      mockSignIn.mockResolvedValue({ data: { session: null }, error: { message: 'Invalid login credentials' } })
      render(<Login />)
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } })
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrong' } })
      fireEvent.click(screen.getByRole('button', { name: /log in/i }))
      await waitFor(() => expect(screen.getByText(/invalid login credentials/i)).toBeInTheDocument())
      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })
  ```
- **Implementation (green):** `src/pages/Login.jsx`, mirroring `SignUp.jsx`'s
  structure but calling `signIn(email, password)` and only branching on
  success/error (no pending-confirmation case for login). Add
  `<Route path="/login" element={<Login />} />` and a "Log in" nav link
  (signed-out only).
- **Refactor:** None expected.
- **Acceptance criteria:** the two test cases above pass.
- **Review gate:** **Human review:** auth surface (gate condition 3). Look at
  `src/pages/Login.jsx`'s error handling and confirm it's what should be
  shown against the real Supabase project.
- **Depends on:** Task 1.

### Task 4: `LockedAction` reusable gate component

- **Description:** The primitive later phases (Roadmap accept/edit/status,
  Diary panel, MarketUpdates) will wrap gated controls in.
- **Files touched:** `src/components/LockedAction.jsx` (new),
  `src/components/LockedAction.test.jsx` (new).
- **Tests first (red):**
  ```js
  const mockUseAuth = vi.fn()
  vi.mock('../lib/auth', () => ({ useAuth: () => mockUseAuth() }))
  import { MemoryRouter } from 'react-router-dom'
  import LockedAction from './LockedAction'

  describe('LockedAction', () => {
    it('renders an active, clickable button when signed in', () => {
      mockUseAuth.mockReturnValue({ user: { id: 'u1' } })
      const onClick = vi.fn()
      render(<MemoryRouter><LockedAction onClick={onClick}>Accept plan</LockedAction></MemoryRouter>)
      const btn = screen.getByRole('button', { name: /accept plan/i })
      expect(btn).not.toBeDisabled()
      fireEvent.click(btn)
      expect(onClick).toHaveBeenCalled()
    })

    it('renders a locked affordance linking to /signup when signed out, and never calls onClick', () => {
      mockUseAuth.mockReturnValue({ user: null })
      const onClick = vi.fn()
      render(<MemoryRouter><LockedAction onClick={onClick}>Accept plan</LockedAction></MemoryRouter>)
      expect(screen.getByText(/create an account to unlock/i)).toBeInTheDocument()
      const link = screen.getByRole('link', { name: /accept plan/i })
      expect(link).toHaveAttribute('href', '/signup')
      fireEvent.click(link)
      expect(onClick).not.toHaveBeenCalled()
    })
  })
  ```
- **Implementation (green):** `src/components/LockedAction.jsx`:
  ```jsx
  import { Link } from 'react-router-dom'
  import { useAuth } from '../lib/auth'

  export default function LockedAction({ children, onClick, className = '', ...rest }) {
    const { user } = useAuth()
    if (!user) {
      return (
        <span className="inline-flex items-center gap-2">
          <Link
            to="/signup"
            className={`${className} opacity-60 cursor-not-allowed`}
            aria-disabled="true"
            {...rest}
          >
            🔒 {children}
          </Link>
          <span className="text-xs text-slate-500">Create an account to unlock</span>
        </span>
      )
    }
    return (
      <button type="button" onClick={onClick} className={className} {...rest}>
        {children}
      </button>
    )
  }
  ```
- **Refactor:** None expected.
- **Acceptance criteria:** signed-in renders a real `<button>` that fires
  `onClick`; signed-out renders a `<Link to="/signup">` plus visible
  "Create an account to unlock" text, and never fires `onClick`.
- **Review gate:** **Human review:** this defines the permission-gating UX
  every later phase reuses verbatim (gate condition 3: auth/permissions
  surface). Confirm the locked-state visual/copy in
  `src/components/LockedAction.jsx` is acceptable before Phases 4–6 wrap
  their buttons in it — changing it later means touching every call site.
- **Depends on:** Task 1.

### Task 5: Wire `AuthProvider` into `App.jsx` and finish nav

- **Description:** Mount the provider around the routed app, add the
  signed-in/signed-out nav switch (Sign up/Log in vs Sign out).
- **Files touched:** `src/App.jsx`.
- **Tests first (red):** No dedicated `App.test.jsx` exists and this task is
  pure composition of already-tested pieces (Tasks 1–3); add one smoke test,
  `src/App.test.jsx`:
  ```js
  const mockUseAuth = vi.fn()
  vi.mock('./lib/auth', async (importOriginal) => {
    const actual = await importOriginal()
    return { ...actual, useAuth: () => mockUseAuth() }
  })
  import { MemoryRouter } from 'react-router-dom'
  import App from './App'

  describe('App nav auth switch', () => {
    it('shows Sign up and Log in links when signed out', () => {
      mockUseAuth.mockReturnValue({ user: null, signOut: vi.fn() })
      render(<MemoryRouter><App /></MemoryRouter>)
      expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /log in/i })).toBeInTheDocument()
    })

    it('shows a Sign out action when signed in', () => {
      mockUseAuth.mockReturnValue({ user: { id: 'u1' }, signOut: vi.fn() })
      render(<MemoryRouter><App /></MemoryRouter>)
      expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
    })
  })
  ```
  Note: `AuthProvider` itself is mocked out here via the `useAuth` override;
  `App.jsx` still wraps children in the real `<AuthProvider>` at runtime, but
  this test only needs to exercise `useAuth()`'s consumer side.
- **Implementation (green):** In `src/App.jsx`, wrap the existing `<nav>` +
  `<Routes>` tree in `<AuthProvider>`, add `/signup` and `/login` routes
  (finalizing Tasks 2–3's route additions if not already present), and add:
  ```jsx
  function AuthNav() {
    const { user, signOut } = useAuth()
    return user ? (
      <button onClick={signOut} className="text-slate-500 hover:text-slate-900">Sign out</button>
    ) : (
      <>
        <Link to="/signup" className="text-slate-500 hover:text-slate-900">Sign up</Link>
        <Link to="/login" className="text-slate-500 hover:text-slate-900">Log in</Link>
      </>
    )
  }
  ```
  rendered inside the existing nav bar.
- **Refactor:** None expected.
- **Acceptance criteria:** the two smoke-test cases above pass; existing nav
  links (Profile/Plan/Dashboard/Updates) are unaffected.
- **Review gate:** No gate — this task only composes already-reviewed pieces
  from Tasks 1–4; no new auth behaviour is introduced here.
- **Depends on:** Tasks 1, 2, 3, 4.

## 6. Feature-level Definition of Done

- [x] All five tasks in §5 complete and their tests passing
- [x] `npm test` passes for the full suite
- [ ] `npm run lint` passes — **not run**: `eslint.config.js` does not exist
      anywhere in this repo, so `npm run lint` fails immediately
      (`ESLint couldn't find an eslint.config.(js|mjs|cjs) file`) on master,
      independent of this plan. Pre-existing gap, out of scope for this plan
      per user decision during execution.
- [ ] Manually verified (against a real Supabase project, `vercel dev`): sign
      up with a new email, confirm the branch taken (immediate session vs.
      "check your email") matches the project's actual confirmation setting;
      log in with valid and invalid credentials; sign out; confirm nav
      switches correctly in each state. — **not run**: requires a live
      Supabase project and manual browser interaction, not available in this
      execution session.
- [x] Every requirement in §2 is covered — see §7
- [x] Every gated task (Tasks 1–4) has been shown to the user and explicitly
      accepted
- [x] No item remains in §8

## 7. Requirements coverage check

| Requirement | Covered by |
| --- | --- |
| 2.1.1 | Task 1 |
| 2.1.2 | Task 2 |
| 2.1.3 | Task 3 |
| 2.1.4 | Task 4 |
| 2.1.5 | Task 5 |

## 8. Risks / open questions

None.
