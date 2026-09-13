# Student profile (Capability 1 / User Story 1)

- **Date:** 2026-09-12
- **Status:** Approved
- **Requirements confirmed by user:** yes — 2026-09-12
- **Amendment (2026-09-12):** Task 7's Human review was rejected — the final
  required-field set left `qualification` as a plain required text field
  with no way for a student who has no qualification yet to satisfy it, and
  the free-text fields had no guidance on what to enter. Requirements 2.1.9,
  2.1.10 and 2.1.11 were added, confirmed by the user on 2026-09-12, and
  Task 7 was redefined below (old Task 7 body replaced) with two new tasks
  (8, 9) added. Tasks 1–6 are unaffected and already committed.

## 1. Summary

International students on Planery need a validated profile form that
captures their qualification, education sector, study stage, career goal,
skills and experience, then hands that data to the existing AI career-readiness
analysis. Today `src/pages/Profile.jsx` exists as a placeholder — it is
missing the required education sector field, has an ambiguous "preferred work
setting" field, and only validates 3 of the fields it should. `src/pages/Welcome.jsx`
also bundles the responsible-AI notice and privacy statement into a single
paragraph instead of two distinct ones. This plan brings both screens to spec:
Welcome gets distinct AI-notice/privacy copy, Profile gets a full field set
with dropdowns for structured data and inline + summary validation errors on
the 6 required fields, and — since the repo currently has no test runner at
all — the first task installs Vitest + React Testing Library so every
subsequent task can follow real TDD. No backend, auth, or Supabase changes are
in scope; the profile is still passed to `/analysis` purely via React Router
state, exactly as it is today.

## 2. Requirements

### 2.1 Functional requirements

1. The Welcome screen (`src/pages/Welcome.jsx`) shall render a responsible-AI
   notice and a privacy statement as two distinct paragraphs (not merged into
   one), each identifiable independently in the rendered output, in addition
   to the existing value proposition and CTA.
2. The Welcome screen's CTA shall remain a link/button that navigates to
   `/profile`.
3. The Profile screen (`src/pages/Profile.jsx`) shall render exactly these 14
   fields, in this order: course/qualification, major/specialisation, education
   sector (dropdown), study stage (dropdown), expected graduation year, target
   occupation, state/territory (dropdown), current skills, certifications,
   experience, preferred employment arrangement (dropdown), preferred work
   location mode (dropdown), other work preferences (free text), licences.
4. Education sector, study stage, state/territory, employment arrangement, and
   work location mode shall render as `<select>` dropdowns populated from
   `src/lib/profileOptions.js`, not free-text inputs.
5. On submit, the form shall treat exactly these 6 fields as required:
   qualification, education sector, study stage, target occupation, current
   skills, experience.
6. If any required field is empty (after trimming) on submit, the form shall:
   not navigate away, display an inline error message associated with each
   specific missing field, and display a top-level summary error banner.
7. If all 6 required fields are non-empty on submit, the form shall navigate
   to `/analysis`, passing the full form object as `state: { profile: form }`
   (optional fields may be empty strings) — matching the existing
   `navigate('/analysis', { state: { profile: form } })` call already present
   in `Profile.jsx`.
8. The Profile screen shall not call Supabase or any AI helper directly; the
   existing hand-off to `/analysis` (which itself calls
   `getCareerReadinessAnalysis` from `src/lib/ai.js`) is left untouched.
9. The qualification field shall offer a checkbox labelled "I don't have a
   qualification yet"; checking it disables the qualification text input and
   sets `form.qualification` to the fixed sentinel value
   `"No formal qualification yet"` (satisfying requirement 2.1.5's
   required-field check for `qualification` without free text); unchecking it
   clears `form.qualification` back to `''` and re-enables the input.
10. The specialisation field shall offer an analogous checkbox labelled "I
    don't have a major, specialisation or trade yet"; checking it sets
    `form.specialisation` to the fixed sentinel value
    `"No specific major or specialisation"` and disables the input;
    unchecking it clears the field back to `''`. `specialisation` remains
    optional either way (2.1.6's required set is unaffected).
11. The 7 free-text fields — course/qualification, specialisation, current
    skills, certifications, employment/volunteer experience, other work
    preferences, and licences — shall each render a `placeholder` attribute
    with a concrete example value (exact strings in Task 9 below), to prompt
    students on what kind of answer is expected.

### 2.2 Non-functional requirements

- Each form field's error message must be programmatically associated with
  its input via `aria-describedby`, and rendered with `role="alert"` so
  assistive tech announces it.
- No new production (`dependencies`) packages are added; testing packages are
  added under `devDependencies` only.
- `src/pages/Analysis.jsx` and `src/lib/ai.js` must not be modified.

### 2.3 Out of scope

- Authentication / Supabase Auth (confirmed: anonymous for this story).
- Persisting the profile to Supabase (confirmed: in-memory/router-state only
  for this story; a `profiles` table and save call are a later story).
- Any change to `src/pages/Analysis.jsx`, `src/pages/Plan.jsx`,
  `src/pages/Dashboard.jsx`, `src/pages/MarketUpdates.jsx`, `src/lib/ai.js`,
  `api/generate.js`, or `src/data/marketSources.js`.
- Sourced job-market/migration content (not applicable to this screen).
- Visual design polish beyond reusing the existing Tailwind utility classes
  already used in `Profile.jsx`/`Welcome.jsx`.

### 2.4 Assumptions

- Vitest 2.x works with the project's existing Vite 5.4.8 + `@vitejs/plugin-react`
  setup with no additional plugin beyond `jsdom` as the test environment —
  this is Vitest's standard, documented configuration and needs no project-specific
  verification.

## 3. Existing code context

**`src/pages/Profile.jsx`** (full current content, 133 lines) — a function
component `Profile()` with:
- `const REQUIRED_FIELDS = ['qualification', 'studyStage', 'targetOccupation']`
- `useState` form object with keys: `qualification, specialisation, studyStage,
  graduationYear, targetOccupation, skills, certifications, experience,
  preferredSetting, licences, state` (all initialised to `''`).
- `const [error, setError] = useState(null)` — a single top-level error string.
- `updateField(field, value)` — sets `form[field] = value`.
- `handleSubmit(event)` — `event.preventDefault()`, computes
  `missing = REQUIRED_FIELDS.filter((field) => !form[field]?.trim())`; if
  non-empty, `setError('We could not create your plan. Please check the required information and try again.')` and returns; otherwise `setError(null)` and calls
  `navigate('/analysis', { state: { profile: form } })`.
- A local `Field({ label, value, onChange, textarea = false })` component:
  renders `<label>` wrapping either an `<input>` or `<textarea>`
  (`Component = textarea ? 'textarea' : 'input'`), with `maxLength={500}` and
  Tailwind classes `mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500`.
- Imports: `useState` from `'react'`, `useNavigate` from `'react-router-dom'`.
- No `Link` usage in this file (only `useNavigate`).

**`src/pages/Welcome.jsx`** (full current content, 25 lines) — function
component `Welcome()`:
- Imports `Link` from `'react-router-dom'`.
- Renders an `<h1>`, one value-prop `<p>`, a `<Link to="/profile">` styled as
  a button reading "Create my career plan", and one `<p className="mt-6 text-xs text-slate-400">`
  containing the merged AI-notice + guarantee-disclaimer text: *"Planery
  provides general career guidance, not employment guarantees, or
  migration, visa, legal, financial or licensing advice. AI-generated content
  may be incomplete or inaccurate — always verify with official sources."*
  There is currently no separate privacy statement anywhere on this screen.

**`src/lib/ai.js`** — exports `getCareerReadinessAnalysis(profile)` (async,
takes the profile object, returns `{ text }` via `callGenerate`). Not modified
by this plan; confirmed by reading the file that `Analysis.jsx` already
handles loading/error/success states around this call.

**`src/App.jsx`** — routes `/` → `Welcome`, `/profile` → `Profile`,
`/analysis` → `Analysis`. Confirmed unchanged by this plan.

**No `src/lib/profileOptions.js` exists yet** — confirmed via directory
listing of `src/lib/` (`ai.js`, `supabaseClient.js` only).

**Package/tooling state** (confirmed via `package.json`, `vite.config.js`,
`node -v` = v24.18.1, `npm -v` = 11.16.0):
- `package.json` `scripts`: `{ "dev": "vite", "build": "vite build", "lint": "eslint .", "preview": "vite preview" }` — **no `test` script exists.**
- No `vitest`, `jest`, `@testing-library/*`, or `jsdom` in `dependencies` or
  `devDependencies`.
- `vite.config.js` is currently just `defineConfig({ plugins: [react()] })` —
  no `test` block.
- `src/components/` and `src/hooks/` exist but are empty directories.
- React 18.3.1, react-router-dom 6.30.6 (installed, per `npm ls`), Vite
  5.4.8, `@vitejs/plugin-react` 4.3.2.

**Test setup for this plan:** none exists today. Task 1 below installs
Vitest + React Testing Library (`vitest`, `jsdom`, `@testing-library/react`,
`@testing-library/jest-dom`, `@testing-library/user-event`) and adds
`"test": "vitest run"` to `package.json` scripts. All subsequent tasks' tests
live next to the file under test as `*.test.jsx` and run via `npm test`.

## 4. Approach

Two presentational files change (`Welcome.jsx`, `Profile.jsx`) plus one new
shared constants module (`src/lib/profileOptions.js`), following the existing
convention that shared logic lives under `src/lib/`. No state-management
library or new abstraction is introduced — `Profile.jsx` keeps its existing
single `useState` form-object pattern, just with more keys, and its existing
`Field` component is extended in place to support a `select` variant and
per-field error rendering rather than introducing a new component file.

`useNavigate` is mocked in `Profile.jsx` tests (`vi.mock('react-router-dom', ...)`)
since `Profile.jsx` does not render a `Link` and only needs `useNavigate`
mocked to assert on navigation calls without a real router. `Welcome.jsx`
tests use a real `MemoryRouter` wrapper since it renders a `Link`.

Work proceeds bottom-up: test infra → shared constants → Welcome copy →
Profile validation/error mechanics (on the existing 3-field set, so the
change is isolated and testable on its own) → Profile new dropdown fields →
Profile work-setting field split → final required-field-set expansion. Each
task after Task 1 is independently testable via `npm test`.

## 5. Task breakdown

### Task 1: Add Vitest + React Testing Library test runner

- **Description:** Install a test framework so every later task can follow
  TDD. No feature behaviour changes.
- **Files touched:** `package.json` (edit), `vite.config.js` (edit), new
  `src/setupTests.js`, new `src/lib/__tests__/sanity.test.js`.
- **Tests first (red):** Create `src/lib/__tests__/sanity.test.js`:
  ```js
  import { describe, it, expect } from 'vitest'

  describe('test runner sanity check', () => {
    it('confirms vitest is wired up', () => {
      expect(1 + 1).toBe(2)
    })
  })
  ```
  Before installing anything, there is no `test` script and no `vitest`
  package, so `npm test` fails (`missing script: "test"` / module not found)
  — this is the red state for this task.
- **Implementation (green):**
  - `npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event`
  - In `vite.config.js`, add a `test` block to the `defineConfig` call:
    ```js
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/setupTests.js'],
    },
    ```
  - Create `src/setupTests.js`:
    ```js
    import '@testing-library/jest-dom'
    ```
  - In `package.json` `scripts`, add: `"test": "vitest run"`.
- **Refactor:** None expected. The sanity test remains as a lightweight
  harness check.
- **Acceptance criteria:**
  - `npm test` runs and exits 0.
  - The sanity test passes.
- **Depends on:** None.
- **Status:** Done. Note: installed `vitest@^2.1.0` explicitly (plain
  `npm install -D vitest` resolves to vitest 5.x, which requires Vite 6+ and
  conflicts with this project's Vite 5.4.8 — the plan's §2.4 assumption that
  no version pinning was needed did not hold). Also added `globals: true` to
  the `test` block in `vite.config.js`, since the installed
  `@testing-library/jest-dom@7.x` calls a global `expect` that only exists in
  Vitest's globals mode.

### Task 2: Add `src/lib/profileOptions.js` dropdown option constants

- **Description:** Shared arrays of `{ value, label }` options for every
  dropdown field used in Task 5 and Task 6, and available for reuse by future
  state-filtering work (Capability 3).
- **Files touched:** new `src/lib/profileOptions.js`, new
  `src/lib/profileOptions.test.js`.
- **Tests first (red):** In `src/lib/profileOptions.test.js`:
  ```js
  import { describe, it, expect } from 'vitest'
  import {
    EDUCATION_SECTORS,
    STUDY_STAGES,
    AU_STATES,
    EMPLOYMENT_ARRANGEMENTS,
    WORK_LOCATION_MODES,
  } from './profileOptions'

  describe('profileOptions', () => {
    it('exports 3 education sectors', () => {
      expect(EDUCATION_SECTORS).toEqual([
        { value: 'higher-education', label: 'Higher education (university)' },
        { value: 'vet', label: 'Vocational education and training (VET)' },
        { value: 'other', label: 'Other' },
      ])
    })
    it('exports 4 study stages', () => {
      expect(STUDY_STAGES).toEqual([
        { value: 'just-started', label: 'Just started' },
        { value: 'midway', label: 'Midway through' },
        { value: 'final-stage', label: 'Final year or stage' },
        { value: 'recently-completed', label: 'Recently completed' },
      ])
    })
    it('exports all 8 Australian states/territories', () => {
      expect(AU_STATES).toHaveLength(8)
      expect(AU_STATES.map((s) => s.value)).toEqual([
        'NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT',
      ])
    })
    it('exports 5 employment arrangements', () => {
      expect(EMPLOYMENT_ARRANGEMENTS).toEqual([
        { value: 'full-time', label: 'Full-time' },
        { value: 'part-time', label: 'Part-time' },
        { value: 'casual', label: 'Casual' },
        { value: 'apprenticeship-traineeship', label: 'Apprenticeship or traineeship' },
        { value: 'no-preference', label: 'No preference' },
      ])
    })
    it('exports 4 work location modes', () => {
      expect(WORK_LOCATION_MODES).toEqual([
        { value: 'onsite', label: 'Onsite' },
        { value: 'remote', label: 'Remote' },
        { value: 'hybrid', label: 'Hybrid' },
        { value: 'no-preference', label: 'No preference' },
      ])
    })
  })
  ```
- **Implementation (green):** `src/lib/profileOptions.js` exports the 5
  named `const` arrays above (each item `{ value: string, label: string }`),
  matching the test expectations exactly, e.g.:
  ```js
  export const EDUCATION_SECTORS = [
    { value: 'higher-education', label: 'Higher education (university)' },
    { value: 'vet', label: 'Vocational education and training (VET)' },
    { value: 'other', label: 'Other' },
  ]
  // ...and so on for STUDY_STAGES, AU_STATES, EMPLOYMENT_ARRANGEMENTS, WORK_LOCATION_MODES
  ```
  `AU_STATES` labels: `'New South Wales (NSW)'`, `'Victoria (VIC)'`,
  `'Queensland (QLD)'`, `'Western Australia (WA)'`, `'South Australia (SA)'`,
  `'Tasmania (TAS)'`, `'Australian Capital Territory (ACT)'`,
  `'Northern Territory (NT)'`, in that order.
- **Refactor:** None expected.
- **Acceptance criteria:** All 5 tests above pass; each constant's shape and
  length matches exactly what §2.1.4's fields need.
- **Depends on:** Task 1 (test runner).
- **Status:** Done.

### Task 3: Split Welcome.jsx's disclaimer into a responsible-AI notice and a privacy statement

- **Description:** Replace the single merged `<p>` in `src/pages/Welcome.jsx`
  with two distinct paragraphs.
- **Files touched:** `src/pages/Welcome.jsx` (edit), new
  `src/pages/Welcome.test.jsx`.
- **Tests first (red):** In `src/pages/Welcome.test.jsx`:
  ```jsx
  import { describe, it, expect } from 'vitest'
  import { render, screen } from '@testing-library/react'
  import { MemoryRouter } from 'react-router-dom'
  import Welcome from './Welcome'

  describe('Welcome', () => {
    it('renders a responsible-AI notice and a separate privacy statement', () => {
      render(<MemoryRouter><Welcome /></MemoryRouter>)
      const aiNotice = screen.getByTestId('ai-notice')
      const privacyStatement = screen.getByTestId('privacy-statement')
      expect(aiNotice).toBeInTheDocument()
      expect(privacyStatement).toBeInTheDocument()
      expect(aiNotice).not.toBe(privacyStatement)
      expect(privacyStatement.textContent).toMatch(/session/i)
      expect(privacyStatement.textContent).toMatch(/not saved to an account/i)
    })

    it('links the CTA to /profile', () => {
      render(<MemoryRouter><Welcome /></MemoryRouter>)
      expect(screen.getByRole('link', { name: /create my career plan/i })).toHaveAttribute('href', '/profile')
    })
  })
  ```
- **Implementation (green):** In `src/pages/Welcome.jsx`, replace the single
  disclaimer `<p>` with two:
  ```jsx
  <p data-testid="ai-notice" className="mt-6 text-xs text-slate-400">
    Planery provides general career guidance, not employment
    guarantees, or migration, visa, legal, financial or licensing advice.
    AI-generated content may be incomplete or inaccurate — always verify with
    official sources.
  </p>
  <p data-testid="privacy-statement" className="mt-2 text-xs text-slate-400">
    Your profile stays in this browser session for now — it isn't saved to an
    account. It's sent to Google's Gemini API solely to generate the guidance
    shown to you.
  </p>
  ```
- **Refactor:** None expected.
- **Acceptance criteria:**
  - Both tests pass.
  - The two paragraphs are separate DOM nodes with the specified `data-testid`s.
- **Human review:** Read the rendered copy of both paragraphs (via `npm run dev`
  or the test output) and confirm the wording reads clearly and accurately
  describes current data handling — this can't be fully judged by an
  automated string match alone.
- **Depends on:** Task 1.
- **Status:** Done. Human review accepted by user on 2026-09-12.

### Task 4: Add per-field inline errors + summary banner to Profile.jsx's existing validation

- **Description:** Refactor `Profile.jsx`'s error handling from one generic
  banner to per-field inline errors plus a summary banner, using the
  **existing** 3-field `REQUIRED_FIELDS` set (`qualification`, `studyStage`,
  `targetOccupation`) — the required-field set itself is expanded later in
  Task 7, kept separate so this task is testable in isolation.
- **Files touched:** `src/pages/Profile.jsx` (edit), new
  `src/pages/Profile.test.jsx`.
- **Tests first (red):** In `src/pages/Profile.test.jsx`:
  ```jsx
  import { describe, it, expect, vi, beforeEach } from 'vitest'
  import { render, screen, fireEvent } from '@testing-library/react'

  const mockNavigate = vi.fn()
  vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal()
    return { ...actual, useNavigate: () => mockNavigate }
  })

  import Profile from './Profile'

  beforeEach(() => {
    mockNavigate.mockClear()
  })

  describe('Profile validation', () => {
    it('shows a per-field error and a summary banner when a required field is empty, and does not navigate', () => {
      render(<Profile />)
      fireEvent.change(screen.getByLabelText(/current study stage/i), { target: { value: 'Midway' } })
      fireEvent.change(screen.getByLabelText(/target occupation/i), { target: { value: 'Carpenter' } })
      fireEvent.click(screen.getByRole('button', { name: /create my plan/i }))
      expect(screen.getByRole('alert', { name: '' })).toBeInTheDocument() // summary banner, see impl for exact query
      expect(screen.getByText(/this field is required/i)).toBeInTheDocument()
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('navigates to /analysis with the profile when all required fields are filled', () => {
      render(<Profile />)
      fireEvent.change(screen.getByLabelText(/course or qualification/i), { target: { value: 'Bachelor of IT' } })
      fireEvent.change(screen.getByLabelText(/current study stage/i), { target: { value: 'Midway' } })
      fireEvent.change(screen.getByLabelText(/target occupation/i), { target: { value: 'Software Developer' } })
      fireEvent.click(screen.getByRole('button', { name: /create my plan/i }))
      expect(mockNavigate).toHaveBeenCalledWith('/analysis', {
        state: { profile: expect.objectContaining({
          qualification: 'Bachelor of IT',
          studyStage: 'Midway',
          targetOccupation: 'Software Developer',
        }) },
      })
    })
  })
  ```
  (The exact summary-banner query is finalised against the implementation
  below — e.g. `screen.getByText(/check the required information/i)` — the
  important assertions are: a per-field message is present, a summary message
  is present, and `mockNavigate` is/isn't called.)
- **Implementation (green):** In `src/pages/Profile.jsx`:
  - Replace `const [error, setError] = useState(null)` with
    `const [fieldErrors, setFieldErrors] = useState({})` and
    `const [formError, setFormError] = useState(null)`.
  - In `handleSubmit`, on missing fields: build
    `const errors = Object.fromEntries(missing.map((f) => [f, 'This field is required.']))`,
    call `setFieldErrors(errors)`, call
    `setFormError('We could not create your plan. Please check the required information and try again.')`,
    and `return`. On success: `setFieldErrors({})`, `setFormError(null)`,
    then navigate as today.
  - Render `formError` in the existing top banner
    (`<p role="alert">{formError}</p>`, keep existing Tailwind classes).
  - Extend the local `Field` component's signature to
    `Field({ id, label, value, onChange, type = 'text', options = [], error })`
    (the `textarea` boolean prop is replaced by `type` — updated in Task 5/6
    call sites too, but for this task only `type` values `'text'`/`'textarea'`
    are used, matching today's call sites 1:1). Each `Field` renders:
    ```jsx
    <label htmlFor={id} className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <Component
        id={id}
        value={value}
        maxLength={500}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500'}`}
        {...(type === 'textarea' ? { rows: 3 } : {})}
      />
      {error && <p id={`${id}-error`} role="alert" className="mt-1 text-sm text-red-600">{error}</p>}
    </label>
    ```
  - Update each existing `<Field ... />` call site to pass `id="<fieldKey>"`
    and `error={fieldErrors.<fieldKey>}` (e.g.
    `<Field id="qualification" label="Course or qualification *" value={form.qualification} onChange={(v) => updateField('qualification', v)} error={fieldErrors.qualification} />`).
- **Refactor:** None expected beyond the above.
- **Acceptance criteria:**
  - Both tests pass.
  - Submitting with a required field empty leaves `mockNavigate` uncalled and
    shows both a per-field message and the summary banner.
  - Submitting with all (currently 3) required fields filled calls
    `mockNavigate('/analysis', { state: { profile: expect.objectContaining({...}) } })`.
- **Depends on:** Task 1.
- **Status:** Done. Note: the `Field` `Component` (input/textarea) must
  receive `children={null}`, not `false`, when not rendering `<option>`s —
  React's void-element check treats `false` as a non-null children value and
  throws; this only surfaced once the `select` variant's children were added
  in this same task's `Field` signature, ahead of Task 5/6's select fields.

### Task 5: Convert education sector, study stage, and state to dropdowns backed by `profileOptions.js`; add education sector field

- **Description:** Add the new `educationSector` field and switch
  `studyStage` and `state` from free-text `Field`s to `type="select"` `Field`s,
  using the constants from Task 2.
- **Files touched:** `src/pages/Profile.jsx` (edit), `src/pages/Profile.test.jsx` (edit — add tests).
- **Tests first (red):** Add to `src/pages/Profile.test.jsx`:
  ```jsx
  import { EDUCATION_SECTORS, STUDY_STAGES, AU_STATES } from '../lib/profileOptions'

  describe('Profile dropdown fields', () => {
    it('renders Education sector as a select with the configured options', () => {
      render(<Profile />)
      const select = screen.getByLabelText(/education sector/i)
      expect(select.tagName).toBe('SELECT')
      EDUCATION_SECTORS.forEach((opt) => {
        expect(screen.getByRole('option', { name: opt.label })).toBeInTheDocument()
      })
    })

    it('blocks submission and shows an error when Education sector is left unselected', () => {
      render(<Profile />)
      fireEvent.change(screen.getByLabelText(/course or qualification/i), { target: { value: 'Diploma of Early Childhood Education' } })
      fireEvent.change(screen.getByLabelText(/current study stage/i), { target: { value: STUDY_STAGES[0].value } })
      fireEvent.change(screen.getByLabelText(/target occupation/i), { target: { value: 'Early Childhood Educator' } })
      fireEvent.click(screen.getByRole('button', { name: /create my plan/i }))
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('renders Study stage and State/territory as selects with the configured options', () => {
      render(<Profile />)
      expect(screen.getByLabelText(/current study stage/i).tagName).toBe('SELECT')
      expect(screen.getByLabelText(/australian state or territory/i).tagName).toBe('SELECT')
      expect(STUDY_STAGES.length + AU_STATES.length).toBeGreaterThan(0) // sanity guard on imports used
    })
  })
  ```
- **Implementation (green):** In `src/pages/Profile.jsx`:
  - Import `{ EDUCATION_SECTORS, STUDY_STAGES, AU_STATES } from '../lib/profileOptions'`.
  - Add `educationSector: ''` to the initial form `useState` object, inserted
    after `specialisation`.
  - Extend `Field`'s rendering: when `type === 'select'`,
    `Component = 'select'` and render a leading
    `<option value="">Select…</option>` followed by
    `options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)`.
  - Add a new `<Field id="educationSector" label="Education sector *" type="select" options={EDUCATION_SECTORS} value={form.educationSector} onChange={(v) => updateField('educationSector', v)} error={fieldErrors.educationSector} />`
    positioned between the `specialisation` and `studyStage` fields.
  - Change the `studyStage` `Field` call to `type="select"` and
    `options={STUDY_STAGES}`.
  - Change the `state` `Field` call to `type="select"` and
    `options={AU_STATES}`.
  - Since this task's "blocks submission" test asserts that a missing
    `educationSector` blocks navigation, add `'educationSector'` to
    `REQUIRED_FIELDS` as part of this task. `REQUIRED_FIELDS` after this task:
    `['qualification', 'studyStage', 'targetOccupation', 'educationSector']`.
- **Refactor:** None expected.
- **Acceptance criteria:**
  - All three new tests pass, plus all Task 4 tests continue to pass.
  - `educationSector`, `studyStage`, and `state` render as `<select>`
    elements populated from `profileOptions.js`.
- **Depends on:** Task 2, Task 4.
- **Status:** Done. Note: Task 4's two original tests used the free-text
  value `'Midway'` for `studyStage`, which is not a valid `STUDY_STAGES`
  option value now that the field is a `<select>` — updated those two tests
  to use `STUDY_STAGES[0].value` and to also fill `educationSector` (now
  required), since `fireEvent.change` on a `<select>` with an unmatched
  value doesn't select any option. Also changed the first test's assertion
  from `getByText` to `getAllByText` for "This field is required." since two
  required fields (qualification, educationSector) are now missing
  simultaneously in that scenario.

### Task 6: Replace "preferred work setting" with employment arrangement, work location mode, and other preferences fields

- **Description:** Remove the single `preferredSetting` field and replace it
  with three fields: two dropdowns and one free-text field.
- **Files touched:** `src/pages/Profile.jsx` (edit), `src/pages/Profile.test.jsx` (edit — add tests).
- **Tests first (red):** Add to `src/pages/Profile.test.jsx`:
  ```jsx
  import { EMPLOYMENT_ARRANGEMENTS, WORK_LOCATION_MODES } from '../lib/profileOptions'

  describe('Profile work-preference fields', () => {
    it('renders employment arrangement and work location mode as selects, and other preferences as free text', () => {
      render(<Profile />)
      expect(screen.getByLabelText(/preferred employment arrangement/i).tagName).toBe('SELECT')
      expect(screen.getByLabelText(/preferred work location mode/i).tagName).toBe('SELECT')
      expect(screen.getByLabelText(/other work preferences/i).tagName).toBe('INPUT')
      EMPLOYMENT_ARRANGEMENTS.forEach((opt) => expect(screen.getByRole('option', { name: opt.label })).toBeInTheDocument())
    })

    it('does not render a "preferred work setting" field anymore', () => {
      render(<Profile />)
      expect(screen.queryByLabelText(/preferred work setting/i)).not.toBeInTheDocument()
    })

    it('allows submission with these three fields left blank as long as required fields are filled', () => {
      render(<Profile />)
      fireEvent.change(screen.getByLabelText(/course or qualification/i), { target: { value: 'Bachelor of Nursing' } })
      fireEvent.change(screen.getByLabelText(/education sector/i), { target: { value: EDUCATION_SECTORS[0].value } })
      fireEvent.change(screen.getByLabelText(/current study stage/i), { target: { value: STUDY_STAGES[0].value } })
      fireEvent.change(screen.getByLabelText(/target occupation/i), { target: { value: 'Registered Nurse' } })
      fireEvent.click(screen.getByRole('button', { name: /create my plan/i }))
      expect(mockNavigate).toHaveBeenCalled()
    })
  })
  ```
- **Implementation (green):** In `src/pages/Profile.jsx`:
  - Import `{ EMPLOYMENT_ARRANGEMENTS, WORK_LOCATION_MODES }` alongside the
    Task 5 imports.
  - Remove `preferredSetting: ''` from the initial form state; add
    `employmentArrangement: '', workLocationMode: '', otherPreferences: ''`.
  - Remove the existing `<Field label="Preferred work setting" .../>` call
    site; replace with three `Field`s positioned after the `experience`
    field and before `licences`:
    - `<Field id="employmentArrangement" label="Preferred employment arrangement" type="select" options={EMPLOYMENT_ARRANGEMENTS} value={form.employmentArrangement} onChange={(v) => updateField('employmentArrangement', v)} error={fieldErrors.employmentArrangement} />`
    - `<Field id="workLocationMode" label="Preferred work location mode" type="select" options={WORK_LOCATION_MODES} value={form.workLocationMode} onChange={(v) => updateField('workLocationMode', v)} error={fieldErrors.workLocationMode} />`
    - `<Field id="otherPreferences" label="Other work preferences (culture, sector type, etc.)" value={form.otherPreferences} onChange={(v) => updateField('otherPreferences', v)} error={fieldErrors.otherPreferences} />`
  - `REQUIRED_FIELDS` is unchanged by this task (these 3 fields are optional).
- **Refactor:** None expected.
- **Acceptance criteria:** All three new tests pass; all Task 4/5 tests
  continue to pass.
- **Depends on:** Task 2, Task 5.
- **Status:** Done. Note: `'No preference'` is a shared option label between
  `EMPLOYMENT_ARRANGEMENTS` and `WORK_LOCATION_MODES`, so the plan's test
  query `getByRole('option', { name: opt.label })` throws (multiple matches)
  for that one option — changed to `getAllByRole(...).length > 0` for that
  assertion; it still verifies every option label from both lists renders,
  just tolerates a label existing more than once.

### Task 7: Expand required fields to the final 6-field set, with a "no qualification yet" escape hatch

- **Redefined 2026-09-12** after the original Task 7's Human review was
  rejected — the code below (required-field expansion) was already correct
  and stays; this redefinition adds the qualification checkbox (2.1.9) that
  the rejection asked for, folded into the same task since a student with no
  qualification yet must be able to satisfy `qualification`'s required-field
  check before this task's Human review can be re-presented.
- **Description:** Enforce `skills` and `experience` as required, completing
  the required set specified in §2.1.5, and add the "I don't have a
  qualification yet" checkbox specified in §2.1.9 so a required
  `qualification` field remains satisfiable by a student with none.
- **Files touched:** `src/lib/profileOptions.js` (edit — add sentinel
  constant), `src/pages/Profile.jsx` (edit), `src/pages/Profile.test.jsx`
  (edit — add tests).
- **Tests first (red):** Add to `src/pages/Profile.test.jsx`:
  ```jsx
  function fillRequiredExcept(omit) {
    const values = {
      qualification: 'Certificate III in Carpentry',
      educationSector: EDUCATION_SECTORS[0].value,
      studyStage: STUDY_STAGES[0].value,
      targetOccupation: 'Carpenter',
      skills: 'Basic hand and power tool use',
      experience: 'Work placement, 2 weeks',
    }
    render(<Profile />)
    const labelFor = {
      qualification: /course or qualification/i,
      educationSector: /education sector/i,
      studyStage: /current study stage/i,
      targetOccupation: /target occupation/i,
      skills: /current skills/i,
      experience: /employment or volunteer experience/i,
    }
    Object.entries(values).forEach(([key, val]) => {
      if (key === omit) return
      fireEvent.change(screen.getByLabelText(labelFor[key]), { target: { value: val } })
    })
    fireEvent.click(screen.getByRole('button', { name: /create my plan/i }))
  }

  describe('Profile final required-field set', () => {
    it('blocks submission when Current skills is empty', () => {
      fillRequiredExcept('skills')
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('blocks submission when Experience is empty', () => {
      fillRequiredExcept('experience')
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('navigates when all 6 required fields are filled and every optional field is left blank', () => {
      fillRequiredExcept(null)
      expect(mockNavigate).toHaveBeenCalledWith('/analysis', {
        state: { profile: expect.objectContaining({
          qualification: 'Certificate III in Carpentry',
          educationSector: EDUCATION_SECTORS[0].value,
          studyStage: STUDY_STAGES[0].value,
          targetOccupation: 'Carpenter',
          skills: 'Basic hand and power tool use',
          experience: 'Work placement, 2 weeks',
          specialisation: '',
          graduationYear: '',
          state: '',
          certifications: '',
          employmentArrangement: '',
          workLocationMode: '',
          otherPreferences: '',
          licences: '',
        }) },
      })
    })
  })

  describe('Profile qualification "none yet" checkbox', () => {
    it('disables the qualification input and satisfies the required check when checked', () => {
      render(<Profile />)
      fireEvent.click(screen.getByLabelText(/i don't have a qualification yet/i))
      expect(screen.getByLabelText(/course or qualification/i)).toBeDisabled()
      expect(screen.getByLabelText(/course or qualification/i)).toHaveValue('No formal qualification yet')
    })

    it('re-enables and clears the qualification input when unchecked', () => {
      render(<Profile />)
      const checkbox = screen.getByLabelText(/i don't have a qualification yet/i)
      fireEvent.click(checkbox)
      fireEvent.click(checkbox)
      expect(screen.getByLabelText(/course or qualification/i)).not.toBeDisabled()
      expect(screen.getByLabelText(/course or qualification/i)).toHaveValue('')
    })

    it('allows submission using the "no qualification yet" sentinel in place of free text', () => {
      render(<Profile />)
      fireEvent.click(screen.getByLabelText(/i don't have a qualification yet/i))
      fireEvent.change(screen.getByLabelText(/education sector/i), { target: { value: EDUCATION_SECTORS[0].value } })
      fireEvent.change(screen.getByLabelText(/current study stage/i), { target: { value: STUDY_STAGES[0].value } })
      fireEvent.change(screen.getByLabelText(/target occupation/i), { target: { value: 'Carpenter' } })
      fireEvent.change(screen.getByLabelText(/current skills/i), { target: { value: 'Basic tool use' } })
      fireEvent.change(screen.getByLabelText(/employment or volunteer experience/i), { target: { value: 'None yet' } })
      fireEvent.click(screen.getByRole('button', { name: /create my plan/i }))
      expect(mockNavigate).toHaveBeenCalledWith('/analysis', {
        state: { profile: expect.objectContaining({ qualification: 'No formal qualification yet' }) },
      })
    })
  })
  ```
- **Implementation (green):**
  - In `src/lib/profileOptions.js`, add:
    ```js
    export const NO_QUALIFICATION_YET = 'No formal qualification yet'
    ```
  - In `src/pages/Profile.jsx`, update `REQUIRED_FIELDS` to:
    ```js
    const REQUIRED_FIELDS = ['qualification', 'educationSector', 'studyStage', 'targetOccupation', 'skills', 'experience']
    ```
  - Import `NO_QUALIFICATION_YET` alongside the existing `profileOptions`
    imports.
  - Extend `Field`'s signature to accept `disabled` (passed through to
    `Component`) and `placeholder` (passed through as the native
    `placeholder` attribute, ignored for `type="select"`) — both default to
    `undefined`/`false` so existing call sites are unaffected.
  - Pass `disabled={form.qualification === NO_QUALIFICATION_YET}` to the
    `qualification` `Field`.
  - Directly below the `qualification` `Field`, add:
    ```jsx
    <label className="mt-1 flex items-center gap-2 text-sm text-slate-600">
      <input
        type="checkbox"
        checked={form.qualification === NO_QUALIFICATION_YET}
        onChange={(e) => updateField('qualification', e.target.checked ? NO_QUALIFICATION_YET : '')}
      />
      I don't have a qualification yet
    </label>
    ```
- **Refactor:** Remove the now-redundant `*` markers or reconcile field
  `label` text with which fields are actually required (i.e. update the
  `label` strings for `skills` and `experience` to end in `*`, matching the
  convention already used for the other 4 required fields' labels).
- **Acceptance criteria:** All six new tests (three required-set tests, three
  checkbox tests) pass; the full Task 4–7 test suite (`npm test`) passes
  together with no regressions.
- **Human review:** Load `/profile` in the browser (`npm run dev`) and
  visually confirm the required-field asterisks match the 6 required fields,
  the per-field error styling (red border + message) reads clearly next to
  each field type (text, textarea, select), and the "I don't have a
  qualification yet" checkbox visibly disables the qualification input when
  checked — layout/visual clarity isn't fully provable by the DOM assertions
  above.
- **Depends on:** Task 4, Task 5, Task 6.
- **Status:** Done. Human review accepted by user on 2026-09-12 (after
  redefinition).

### Task 8: Add "no specialisation yet" checkbox for the specialisation field

- **Description:** Add a checkbox analogous to Task 7's qualification
  checkbox for the (optional) `specialisation` field, per §2.1.10, so the AI
  analysis can distinguish "this student has no specialisation to report"
  from "this student left the field blank."
- **Files touched:** `src/lib/profileOptions.js` (edit), `src/pages/Profile.jsx` (edit), `src/pages/Profile.test.jsx` (edit — add tests).
- **Tests first (red):** Add to `src/pages/Profile.test.jsx`:
  ```jsx
  describe('Profile specialisation "none yet" checkbox', () => {
    it('disables the specialisation input and sets the sentinel value when checked', () => {
      render(<Profile />)
      fireEvent.click(screen.getByLabelText(/i don't have a major, specialisation or trade yet/i))
      expect(screen.getByLabelText(/major, specialisation or trade/i)).toBeDisabled()
      expect(screen.getByLabelText(/major, specialisation or trade/i)).toHaveValue('No specific major or specialisation')
    })

    it('re-enables and clears the specialisation input when unchecked', () => {
      render(<Profile />)
      const checkbox = screen.getByLabelText(/i don't have a major, specialisation or trade yet/i)
      fireEvent.click(checkbox)
      fireEvent.click(checkbox)
      expect(screen.getByLabelText(/major, specialisation or trade/i)).not.toBeDisabled()
      expect(screen.getByLabelText(/major, specialisation or trade/i)).toHaveValue('')
    })

    it('still allows submission when specialisation is left blank (unaffected by this checkbox)', () => {
      fillRequiredExcept(null)
      expect(mockNavigate).toHaveBeenCalled()
    })
  })
  ```
- **Implementation (green):**
  - In `src/lib/profileOptions.js`, add:
    ```js
    export const NO_SPECIALISATION = 'No specific major or specialisation'
    ```
  - In `src/pages/Profile.jsx`, import `NO_SPECIALISATION` alongside
    `NO_QUALIFICATION_YET`.
  - Pass `disabled={form.specialisation === NO_SPECIALISATION}` to the
    `specialisation` `Field`.
  - Directly below the `specialisation` `Field`, add:
    ```jsx
    <label className="mt-1 flex items-center gap-2 text-sm text-slate-600">
      <input
        type="checkbox"
        checked={form.specialisation === NO_SPECIALISATION}
        onChange={(e) => updateField('specialisation', e.target.checked ? NO_SPECIALISATION : '')}
      />
      I don't have a major, specialisation or trade yet
    </label>
    ```
- **Refactor:** None expected.
- **Acceptance criteria:** All three new tests pass; the full Task 4–8 test
  suite (`npm test`) passes together with no regressions.
- **Review gate:** No gate — green tests + acceptance criteria are
  sufficient (additive UI on an existing optional field; no schema,
  sourcing, auth, cross-cutting, or irreversible-action concern).
- **Depends on:** Task 7.
- **Status:** Done. Note: the plan's own test query
  `getByLabelText(/major, specialisation or trade/i)` for the text field also
  matches the new checkbox's label ("I don't have a major, specialisation or
  trade yet") since both contain that substring — anchored the text-field
  query to `/^major, specialisation or trade$/i` to disambiguate.

### Task 9: Add example placeholder text to the 7 free-text fields

- **Description:** Add a `placeholder` attribute with a concrete example to
  each of the 7 free-text `Field`s, per §2.1.11, using `Field`'s `placeholder`
  prop added in Task 7.
- **Files touched:** `src/pages/Profile.jsx` (edit), `src/pages/Profile.test.jsx` (edit — add tests).
- **Tests first (red):** Add to `src/pages/Profile.test.jsx`:
  ```jsx
  describe('Profile free-text field placeholders', () => {
    it('renders the example placeholder text on each free-text field', () => {
      render(<Profile />)
      expect(screen.getByLabelText(/course or qualification/i)).toHaveAttribute(
        'placeholder', 'e.g. Bachelor of Nursing, Diploma of Early Childhood Education, Certificate III in Carpentry')
      expect(screen.getByLabelText(/major, specialisation or trade/i)).toHaveAttribute(
        'placeholder', 'e.g. Paediatric nursing, Cabinetmaking, Financial accounting')
      expect(screen.getByLabelText(/current skills/i)).toHaveAttribute(
        'placeholder', 'e.g. Basic bookkeeping, MS Excel, customer service, First Aid certificate')
      expect(screen.getByLabelText(/certifications/i)).toHaveAttribute(
        'placeholder', 'e.g. White Card, Responsible Service of Alcohol (RSA), First Aid Certificate')
      expect(screen.getByLabelText(/employment or volunteer experience/i)).toHaveAttribute(
        'placeholder', 'e.g. Part-time retail assistant (6 months), unpaid childcare placement (3 weeks)')
      expect(screen.getByLabelText(/other work preferences/i)).toHaveAttribute(
        'placeholder', 'e.g. prefer a supportive team culture, interested in the not-for-profit sector')
      expect(screen.getByLabelText(/existing licences/i)).toHaveAttribute(
        'placeholder', "e.g. Provisional driver's licence, Working with Children Check, White Card")
    })
  })
  ```
- **Implementation (green):** In `src/pages/Profile.jsx`, add a
  `placeholder="..."` prop (the exact strings above) to each of the 7
  `Field` call sites: `qualification`, `specialisation`, `skills`,
  `certifications`, `experience`, `otherPreferences`, `licences`.
- **Refactor:** None expected.
- **Acceptance criteria:** The new test passes; the full test suite
  (`npm test`) passes together with no regressions.
- **Review gate:** No gate — green tests + acceptance criteria are
  sufficient (copy-only change, no schema/sourcing/auth/cross-cutting/
  irreversible concern).
- **Depends on:** Task 7.
- **Status:** Done. Post-completion addendum (2026-09-12): the user noticed
  `targetOccupation` is also a free-text field but was missed from this
  task's list — added a placeholder
  ("e.g. Registered Nurse, Cabinetmaker, Financial Accountant, Early
  Childhood Educator") to it as well, with a test, following the same
  pattern.

## 6. Feature-level Definition of Done

- [x] Every task in §5 complete and its tests passing
- [x] `npm test` passes
- [ ] `npm run lint` passes (SKIPPED: `eslint.config.js` is absent from the
  repo pre-existing this plan, so `npm run lint` fails before any code
  change; user directed skipping this item per Phase 1 review)
- [x] Manually verified: loaded `/` and `/profile` via `npm run dev` in a
  desktop-width browser window; read the Welcome screen's AI-notice and
  privacy-statement paragraphs; on Profile, submitted with a required field
  empty and confirmed the per-field + summary errors appear and no navigation
  occurs; filled all 6 required fields (leaving every optional field blank)
  and confirmed navigation to `/analysis` with the profile in state; direct
  navigation to `/analysis` with no router state still redirects to
  `/profile` (pre-existing `Analysis.jsx` behaviour, unchanged); checked the
  "I don't have a qualification yet" and "I don't have a major,
  specialisation or trade yet" checkboxes and confirmed each disables its
  field and lets the form submit; confirmed placeholder example text is
  visible in each of the 7 free-text fields when empty.
- [x] Every requirement in §2 is covered — see §7
- [x] Every task with a `Human review:` line (Task 3, Task 7) has been shown
  to the user and explicitly accepted — not inferred, not just its acceptance
  criteria passing
- [x] No item remains in §8

## 7. Requirements coverage check

| Requirement | Covered by |
| --- | --- |
| 2.1.1 | Task 3 |
| 2.1.2 | Task 3 |
| 2.1.3 | Task 5, Task 6 |
| 2.1.4 | Task 5, Task 6 |
| 2.1.5 | Task 7 |
| 2.1.6 | Task 4, Task 5, Task 7 |
| 2.1.7 | Task 4, Task 7 |
| 2.1.8 | Task 4 (verified by not touching `Analysis.jsx`/`ai.js`; see §2.2) |
| 2.1.9 | Task 7 |
| 2.1.10 | Task 8 |
| 2.1.11 | Task 9 |
| 2.2 (aria-describedby / role=alert) | Task 4 |
| 2.2 (no new prod deps) | Task 1, Task 2 |
| 2.2 (Analysis.jsx/ai.js untouched) | All tasks (no task lists these files as touched) |

## 8. Risks / open questions

None.
