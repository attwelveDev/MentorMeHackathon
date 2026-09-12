# News (MarketUpdates) gating (Capability 2 / Phase 6)

- **Date:** 2026-09-12
- **Status:** Approved
- **Requirements confirmed by user:** yes — 2026-09-12

## 1. Summary

The last phase of the career-planner-and-diary capability (see
`specs/2026-09-12-career-planner-and-diary.md`): gate the existing
`src/pages/MarketUpdates.jsx` (Screen 6, "News") behind an account, matching
how Phases 4–5 already gate Roadmap editing/accepting/tracking and Diary. A
signed-out visitor sees a locked prompt instead of the screen's content; a
signed-in user sees it exactly as it renders today. No Jobs screen exists
anywhere in this codebase (confirmed in Phase 4's investigation), so there is
nothing to gate there — the parent spec already calls this out as out of
scope.

## 2. Requirements

### 2.1 Functional requirements

1. A signed-out visitor to `/updates` (or clicking the Roadmap's "News" tab)
   sees a locked "Create an account to view job market & migration updates"
   prompt linking to `/signup`, instead of the screen's existing content.
2. A signed-in user sees `MarketUpdates.jsx`'s existing content unchanged —
   this phase adds no new market-data behaviour, only the gate.

### 2.2 Non-functional requirements

- **Auth/permissions surface — gate condition 3** applies: this extends the
  account-gating model (established in Phase 2, applied to Roadmap/Diary in
  Phases 4–5) to a new screen.

### 2.3 Out of scope

- Any change to `MarketUpdates.jsx`'s actual content, data source, or
  sourcing/labelling logic (CLAUDE.md's sourcing rule) — untouched.
- A Jobs screen/gate — doesn't exist in this codebase.

### 2.4 Assumptions

None outstanding.

## 3. Existing code context

- `src/pages/MarketUpdates.jsx` — Screen 6. Currently: `const [updates] =
  useState([])`, always renders the "No sufficiently relevant recent updates
  were found for your profile yet" empty state (population logic is a
  separate, already-out-of-scope concern — see `src/data/marketSources.js`'s
  own comment). This phase wraps the existing return value in a gate check,
  without altering the empty/populated rendering logic itself.
- `src/lib/auth.jsx`'s `useAuth()` (Phase 2) — `{ user, ... }`.
- `src/pages/Roadmap.jsx`'s left-nav tab list (Phase 4 Task 5) already links
  "News" to `/updates` — no change needed there.
- Test command: `npm test`. No `MarketUpdates.test.jsx` exists yet.

## 4. Approach

A simple early-return guard at the top of `MarketUpdates`'s render, mirroring
the locked-prompt copy/pattern already used in `Diary.jsx` (Phase 5 Task 4)
for consistency across the app's gated screens, rather than introducing a
third distinct "locked screen" visual style.

No alternative seriously considered — this is the minimal change achieving
the requirement.

## 5. Task breakdown

### Task 1: Gate `MarketUpdates` behind an account [x]

- **Description:** Add the signed-out locked prompt; leave signed-in
  rendering untouched.
- **Files touched:** `src/pages/MarketUpdates.jsx`,
  `src/pages/MarketUpdates.test.jsx` (new).
- **Tests first (red):** In `src/pages/MarketUpdates.test.jsx` (mocking
  `useAuth` as in `Diary.test.jsx`):
  ```js
  describe('MarketUpdates gating', () => {
    it('shows a locked prompt linking to /signup for a signed-out guest, and not the empty-state copy', () => {
      mockUseAuth.mockReturnValue({ user: null })
      render(<MemoryRouter><MarketUpdates /></MemoryRouter>)
      expect(screen.getByText(/create an account to view job market/i)).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute('href', '/signup')
      expect(screen.queryByText(/no sufficiently relevant recent updates/i)).not.toBeInTheDocument()
    })

    it('renders the existing empty-state content unchanged for a signed-in user', () => {
      mockUseAuth.mockReturnValue({ user: { id: 'u1' } })
      render(<MemoryRouter><MarketUpdates /></MemoryRouter>)
      expect(screen.getByText(/no sufficiently relevant recent updates/i)).toBeInTheDocument()
    })
  })
  ```
  Run `npm test` and confirm the first case fails (no gate exists yet).
- **Implementation (green):** In `src/pages/MarketUpdates.jsx`, import
  `useAuth` from `../lib/auth` and `Link` from `react-router-dom`; at the top
  of the component:
  ```jsx
  const { user } = useAuth()
  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <p className="text-slate-600">Create an account to view job market &amp; migration updates.</p>
        <Link to="/signup" className="mt-4 inline-block rounded-md bg-indigo-600 px-6 py-3 font-medium text-white hover:bg-indigo-700">Sign up</Link>
      </div>
    )
  }
  ```
  leaving the existing `updates`/`UpdateCard` rendering below it unchanged.
- **Refactor:** None expected.
- **Acceptance criteria:** both tests pass; existing content/behaviour for
  signed-in users is byte-for-byte unchanged.
- **Review gate:** **Human review:** auth/permissions surface (gate
  condition 3) — this extends the account-gating model to a new screen.
  Confirm the locked-prompt copy and `/signup` link in
  `src/pages/MarketUpdates.jsx` before accepting.
- **Depends on:** Phase 2 (`useAuth`).

## 6. Feature-level Definition of Done

- [x] Task 1 complete and its tests passing
- [x] `npm test` passes for the full suite
- [ ] `npm run lint` passes — blocked: repo has no `eslint.config.js`
      (pre-existing, unrelated to this change; not run as part of this task)
- [ ] Manually verified (`vercel dev`): visiting `/updates` while signed out
      shows the locked prompt; signing in and revisiting shows the existing
      empty-state content unchanged. — not run (requires a running dev server
      with Supabase env configured); covered instead by the automated tests.
- [x] Every requirement in §2 is covered — see §7
- [x] Task 1 (gated) has been shown to the user and explicitly accepted
- [x] No item remains in §8

## 7. Requirements coverage check

| Requirement | Covered by |
| --- | --- |
| 2.1.1 | Task 1 |
| 2.1.2 | Task 1 |

## 8. Risks / open questions

None.
