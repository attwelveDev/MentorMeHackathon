# Work rights field (Profile screen addition)

- **Date:** 2026-09-12
- **Status:** Approved
- **Requirements confirmed by user:** yes — 2026-09-12 (via brainstorm-4d)

## 1. Summary

International students have work-hour limits tied to their visa status that
affect what career-plan activities are realistic for them, but the Profile
screen (`src/pages/Profile.jsx`) currently has no way to capture this.
This plan adds a required "Work rights" dropdown to the existing Profile form,
backed by a new `WORK_RIGHTS` constant in `src/lib/profileOptions.js`, with an
inline disclaimer clarifying the field is self-reported and that
Planery neither verifies it nor gives visa/migration advice. The
value flows through the existing `navigate('/analysis', { state: { profile:
form } })` call unchanged — no changes to `src/pages/Analysis.jsx` or
`src/lib/ai.js` are needed, since the profile object is already
JSON.stringified wholesale into the AI prompt. This is one task, additive to
the already-committed Profile screen (see `plans/2026-09-12-student-profile.md`
for the original build).

## 2. Requirements

### 2.1 Functional requirements

1. The Profile screen shall render a required "Work rights" `<select>` field,
   positioned immediately after the "Australian state or territory" field and
   before "Current skills," populated from a new `WORK_RIGHTS` constant in
   `src/lib/profileOptions.js`.
2. `WORK_RIGHTS` shall contain exactly these 5 options, in this order:
   `{ value: 'no-restriction', label: 'No restriction on hours' }`,
   `{ value: 'limited-during-study', label: 'Limited hours during study periods' }`,
   `{ value: 'not-currently-able', label: 'Not currently able to work' }`,
   `{ value: 'not-sure', label: 'Not sure' }`,
   `{ value: 'prefer-not-to-say', label: 'Prefer not to say' }`.
3. `workRights` shall be added to `Profile.jsx`'s `REQUIRED_FIELDS` array. If
   left unselected (empty string) on submit, the form shall not navigate away
   and shall show both the per-field inline error and the top-level summary
   banner, exactly like the other required `<select>` fields
   (`educationSector`, `studyStage`).
4. Selecting any option — including `'prefer-not-to-say'` — shall satisfy the
   required-field check for `workRights` and, together with the other 6
   required fields, allow submission to proceed to `/analysis` with
   `workRights` included in `state.profile`.
5. An inline disclaimer paragraph shall render directly under the Work rights
   field: "Self-reported — Planery doesn't verify this or provide
   visa/migration advice." It shall be visually distinct from the field's own
   error message (not red/alert-styled) and shall not use `role="alert"`.

### 2.2 Non-functional requirements

- No new production (`dependencies`) packages are added.
- `src/pages/Analysis.jsx` and `src/lib/ai.js` must not be modified.
- The disclaimer text must not be phrased as advice, a guarantee, or a
  verification claim, per `CLAUDE.md`'s out-of-scope list (no migration/visa/
  legal advice, no eligibility guarantees) — this is the reason Task 1 below
  carries a Human review gate.

### 2.3 Out of scope

- Any visa-subclass-specific option, hours-per-fortnight numeric input, or
  free-text work-rights description (rejected during brainstorming in favor
  of a plain self-reported category dropdown).
- Persisting the profile to Supabase (unchanged from the original Profile
  plan's scope — still out of scope).
- Any change to `src/pages/Analysis.jsx`, `src/lib/ai.js`,
  `src/pages/Plan.jsx`, `src/pages/Dashboard.jsx`, `src/pages/MarketUpdates.jsx`,
  `api/generate.js`, or `src/data/marketSources.js`.
- Using `workRights` to filter, gate, or alter which career-plan activities
  are generated — that's future AI-prompt work, not part of this plan; today
  the field only needs to reach `state.profile` unchanged.

### 2.4 Assumptions

None — all decisions (option wording, required/optional, disclaimer wording,
field position) were settled explicitly during brainstorming.

## 3. Existing code context

**`src/pages/Profile.jsx`** (current content, 242 lines, confirmed by reading
the file this turn) — function component `Profile()`:
- `const REQUIRED_FIELDS = ['qualification', 'educationSector', 'studyStage', 'targetOccupation', 'skills', 'experience']` (line 14).
- `useState` form object (lines 18–33) with keys: `qualification,
  specialisation, educationSector, studyStage, graduationYear,
  targetOccupation, skills, certifications, experience, employmentArrangement,
  workLocationMode, otherPreferences, licences, state` (all `''`). No
  `workRights` key exists yet.
- `const [fieldErrors, setFieldErrors] = useState({})` and
  `const [formError, setFormError] = useState(null)` (lines 34–35).
- `handleSubmit` (lines 41–54): computes `missing =
  REQUIRED_FIELDS.filter((field) => !form[field]?.trim())`; if non-empty,
  sets per-field errors + summary `formError` and returns; otherwise clears
  both and calls `navigate('/analysis', { state: { profile: form } })`.
- The `state` `Field` call site (lines 133–141):
  ```jsx
  <Field
    id="state"
    label="Australian state or territory"
    value={form.state}
    onChange={(v) => updateField('state', v)}
    type="select"
    options={AU_STATES}
    error={fieldErrors.state}
  />
  ```
  immediately followed by the `skills` `Field` (line 142).
- Local `Field` component (lines 213–241):
  `Field({ id, label, value, onChange, type = 'text', options = [], error, disabled = false, placeholder })`
  — already supports everything this plan needs (`type="select"`,
  `options`, `error`); no signature change required.
- Imports (lines 3–11): `EDUCATION_SECTORS, STUDY_STAGES, AU_STATES,
  EMPLOYMENT_ARRANGEMENTS, WORK_LOCATION_MODES, NO_QUALIFICATION_YET,
  NO_SPECIALISATION` from `'../lib/profileOptions'`.

**`src/lib/profileOptions.js`** (current content, 42 lines, confirmed by
reading the file this turn) — exports `NO_QUALIFICATION_YET,
NO_SPECIALISATION, EDUCATION_SECTORS, STUDY_STAGES, AU_STATES,
EMPLOYMENT_ARRANGEMENTS, WORK_LOCATION_MODES`, each `{value, label}` array
matching the pattern this plan's `WORK_RIGHTS` constant will follow. No
`WORK_RIGHTS` export exists yet.

**`src/pages/Profile.test.jsx`** (current content, 243 lines, confirmed by
reading the file this turn):
- Imports `{ EDUCATION_SECTORS, STUDY_STAGES, AU_STATES,
  EMPLOYMENT_ARRANGEMENTS, WORK_LOCATION_MODES }` from `'../lib/profileOptions'`
  (no `WORK_RIGHTS` import yet).
- `mockNavigate` + `vi.mock('react-router-dom', ...)` pattern (lines 11–15),
  already established — reused, not changed.
- `fillRequiredExcept(omit)` helper (lines 108–131): fills a `values` map
  (currently 6 keys: qualification, educationSector, studyStage,
  targetOccupation, skills, experience) via `labelFor` regex lookups, skips
  the `omit` key, then submits. **This helper does not currently know about
  `workRights`** — once `workRights` becomes required, calling
  `fillRequiredExcept(null)` (used by 2 existing passing tests: "navigates
  when all 6 required fields are filled..." at line 144, and "still allows
  submission when specialisation is left blank..." at line 216) would leave
  `workRights` empty and break both, since submission would then be blocked.
  This plan's task explicitly updates the helper (see Task 1 below).
- 3 other existing tests manually `fireEvent.change` each required field
  without using the helper, and will independently need a `workRights`
  selection added once it's required: "navigates to /analysis with the
  profile when all required fields are filled" (line 34), "allows submission
  with these three fields left blank..." (line 95), and "allows submission
  using the 'no qualification yet' sentinel..." (line 184).
- `getByLabelText` queries match `Field`'s `<label htmlFor={id}>` wrapping
  pattern; a plain informational disclaimer `<p>` (no `role="alert"`) is
  queried via `screen.getByText(...)`, consistent with how the "Fields marked
  with * are required." helper text (line 59 of `Profile.jsx`) is not
  currently asserted on directly, but matches how other non-error copy in
  this codebase would be tested (e.g. `Welcome.test.jsx`'s
  `getByTestId`/text-match pattern).

**Test setup:** Vitest 2.x + React Testing Library, `npm test` (`vitest run`),
globals mode enabled in `vite.config.js`. Tests for this screen live at
`src/pages/Profile.test.jsx`, run via `npm test` or `npm test -- Profile`.

## 4. Approach

Single task. Add `WORK_RIGHTS` to `profileOptions.js` (test-first, mirroring
`EDUCATION_SECTORS`'s existing test). Add `workRights` to `Profile.jsx`'s form
state, `REQUIRED_FIELDS`, and a new `Field` call site + disclaimer `<p>`
positioned right after the `state` `Field`. Update `Profile.test.jsx`'s
`fillRequiredExcept` helper and the 3 other submission tests that fill every
required field manually, so they continue to reflect "all required fields are
now 7, not 6." No new component, no `Field` signature change, no new test
infrastructure — this is a straight extension of the pattern already used for
`educationSector`, `studyStage`, and `state`.

## 5. Task breakdown

### Task 1: Add required "Work rights" field with disclaimer to Profile.jsx [x]

- **Description:** Add the `WORK_RIGHTS` options constant, wire up the new
  required `workRights` field on the Profile form with its disclaimer, and
  update existing tests that fill all required fields so they account for
  the new 7th required field.
- **Files touched:** `src/lib/profileOptions.js` (edit),
  `src/lib/profileOptions.test.js` (edit — add a test), `src/pages/Profile.jsx`
  (edit), `src/pages/Profile.test.jsx` (edit — add tests, update 3 existing
  submission tests + the `fillRequiredExcept` helper).
- **Tests first (red):**
  1. In `src/lib/profileOptions.test.js`, add:
     ```js
     import { WORK_RIGHTS } from './profileOptions'
     // ...inside describe('profileOptions', ...):
     it('exports 5 work rights options', () => {
       expect(WORK_RIGHTS).toEqual([
         { value: 'no-restriction', label: 'No restriction on hours' },
         { value: 'limited-during-study', label: 'Limited hours during study periods' },
         { value: 'not-currently-able', label: 'Not currently able to work' },
         { value: 'not-sure', label: 'Not sure' },
         { value: 'prefer-not-to-say', label: 'Prefer not to say' },
       ])
     })
     ```
     This fails immediately (`WORK_RIGHTS` doesn't exist — import error).
  2. In `src/pages/Profile.test.jsx`, add `WORK_RIGHTS` to the
     `profileOptions` import, then add:
     ```jsx
     describe('Profile work rights field', () => {
       it('renders Work rights as a select with the configured options', () => {
         render(<Profile />)
         const select = screen.getByLabelText(/work rights/i)
         expect(select.tagName).toBe('SELECT')
         WORK_RIGHTS.forEach((opt) => {
           expect(screen.getByRole('option', { name: opt.label })).toBeInTheDocument()
         })
       })

       it('renders the self-reported disclaimer near the field', () => {
         render(<Profile />)
         expect(screen.getByText(/self-reported.*doesn't verify this or provide visa\/migration advice/i)).toBeInTheDocument()
       })

       it('blocks submission and shows an error when Work rights is left unselected', () => {
         render(<Profile />)
         fireEvent.change(screen.getByLabelText(/course or qualification/i), { target: { value: 'Certificate III in Carpentry' } })
         fireEvent.change(screen.getByLabelText(/education sector/i), { target: { value: EDUCATION_SECTORS[0].value } })
         fireEvent.change(screen.getByLabelText(/current study stage/i), { target: { value: STUDY_STAGES[0].value } })
         fireEvent.change(screen.getByLabelText(/target occupation/i), { target: { value: 'Carpenter' } })
         fireEvent.change(screen.getByLabelText(/current skills/i), { target: { value: 'Basic tool use' } })
         fireEvent.change(screen.getByLabelText(/employment or volunteer experience/i), { target: { value: 'Work placement' } })
         fireEvent.click(screen.getByRole('button', { name: /create my plan/i }))
         expect(mockNavigate).not.toHaveBeenCalled()
       })

       it('allows submission when "Prefer not to say" is selected, alongside the other required fields', () => {
         render(<Profile />)
         fireEvent.change(screen.getByLabelText(/course or qualification/i), { target: { value: 'Certificate III in Carpentry' } })
         fireEvent.change(screen.getByLabelText(/education sector/i), { target: { value: EDUCATION_SECTORS[0].value } })
         fireEvent.change(screen.getByLabelText(/current study stage/i), { target: { value: STUDY_STAGES[0].value } })
         fireEvent.change(screen.getByLabelText(/target occupation/i), { target: { value: 'Carpenter' } })
         fireEvent.change(screen.getByLabelText(/current skills/i), { target: { value: 'Basic tool use' } })
         fireEvent.change(screen.getByLabelText(/employment or volunteer experience/i), { target: { value: 'Work placement' } })
         fireEvent.change(screen.getByLabelText(/work rights/i), { target: { value: 'prefer-not-to-say' } })
         fireEvent.click(screen.getByRole('button', { name: /create my plan/i }))
         expect(mockNavigate).toHaveBeenCalledWith('/analysis', {
           state: { profile: expect.objectContaining({ workRights: 'prefer-not-to-say' }) },
         })
       })
     })
     ```
     All 4 fail: `WORK_RIGHTS` import fails, and even once that's stubbed,
     `getByLabelText(/work rights/i)` finds nothing since the field doesn't
     exist yet.
  3. Update the 3 existing tests that fill every required field manually, and
     the `fillRequiredExcept` helper, to also set Work rights — otherwise
     they'll start failing once `workRights` is required (this is corrective
     maintenance of pre-existing tests, not new red/green coverage, but it's
     necessary for this task's own acceptance criteria: "full suite passes
     together"):
     - Line 34 test ("navigates to /analysis with the profile when all
       required fields are filled"): add
       `fireEvent.change(screen.getByLabelText(/work rights/i), { target: { value: 'no-restriction' } })`
       before the submit click.
     - Line 95 test ("allows submission with these three fields left
       blank..."): add the same line before the submit click.
     - Line 184 test ("allows submission using the 'no qualification yet'
       sentinel..."): add the same line before the submit click.
     - `fillRequiredExcept`'s `values` map: add
       `workRights: 'no-restriction'`; its `labelFor` map: add
       `workRights: /work rights/i`.
- **Implementation (green):**
  - In `src/lib/profileOptions.js`, add:
    ```js
    export const WORK_RIGHTS = [
      { value: 'no-restriction', label: 'No restriction on hours' },
      { value: 'limited-during-study', label: 'Limited hours during study periods' },
      { value: 'not-currently-able', label: 'Not currently able to work' },
      { value: 'not-sure', label: 'Not sure' },
      { value: 'prefer-not-to-say', label: 'Prefer not to say' },
    ]
    ```
  - In `src/pages/Profile.jsx`:
    - Add `WORK_RIGHTS` to the `profileOptions` import.
    - Add `workRights: ''` to the initial form `useState` object (position:
      anywhere in the object is functionally fine; place it after `state` to
      mirror the field's visual position).
    - Update `REQUIRED_FIELDS` to:
      ```js
      const REQUIRED_FIELDS = ['qualification', 'educationSector', 'studyStage', 'targetOccupation', 'skills', 'experience', 'workRights']
      ```
    - Immediately after the `state` `Field` call site (before the `skills`
      `Field`), add:
      ```jsx
      <Field
        id="workRights"
        label="Work rights *"
        value={form.workRights}
        onChange={(v) => updateField('workRights', v)}
        type="select"
        options={WORK_RIGHTS}
        error={fieldErrors.workRights}
      />
      <p className="mt-1 text-xs text-slate-500">
        Self-reported — Planery doesn't verify this or provide
        visa/migration advice.
      </p>
      ```
- **Refactor:** None expected.
- **Acceptance criteria:**
  - All 5 new tests (1 in `profileOptions.test.js`, 4 in `Profile.test.jsx`)
    pass.
  - The 3 corrected existing tests + `fillRequiredExcept`-dependent tests
    continue to pass.
  - `npm test` (full suite) passes with no regressions.
  - `workRights` renders as a `<select>` populated from `WORK_RIGHTS`,
    positioned between "Australian state or territory" and "Current skills."
  - The disclaimer paragraph is present, is not styled as an error, and does
    not carry `role="alert"`.
- **Human review:** Load `/profile` in the browser (`npm run dev` or
  `vercel dev`) and visually confirm: (1) the Work rights field sits directly
  after "Australian state or territory" and before "Current skills"; (2) the
  disclaimer text reads clearly as self-reported/non-advisory, not as a
  guarantee or verification claim; (3) none of the 5 option labels or the
  disclaimer wording could be mistaken for visa/migration advice or an
  eligibility guarantee, per `CLAUDE.md`'s out-of-scope list. This is gated
  because the field and its copy brush that out-of-scope boundary and can't
  be fully judged by automated string matching alone.
- **Depends on:** None (all prerequisite work — `profileOptions.js`
  conventions, `Field` component, `REQUIRED_FIELDS`/`fieldErrors` pattern —
  is already built and committed).

## 6. Feature-level Definition of Done

- [x] Task 1 complete and its tests passing
- [x] `npm test` passes
- [ ] `npm run lint` — same pre-existing gap as `plans/2026-09-12-student-profile.md`
  (no `eslint.config.js` in the repo); skip per that plan's precedent unless
  the user says otherwise.
- [x] Manually verified: loaded `/profile` via `npm run dev` (or `vercel dev`);
  confirmed Work rights renders in the correct position with all 5 options
  and the disclaimer; submitted with Work rights unselected and confirmed the
  per-field + summary errors appear with no navigation; selected "Prefer not
  to say" plus the other 6 required fields and confirmed navigation to
  `/analysis` with `workRights: 'prefer-not-to-say'` in the profile state.
- [x] Every requirement in §2 is covered — see §7
- [x] Task 1's `Human review:` has been shown to the user and explicitly
  accepted — not inferred, not just its acceptance criteria passing
- [x] No item remains in §8

## 7. Requirements coverage check

| Requirement | Covered by |
| --- | --- |
| 2.1.1 | Task 1 |
| 2.1.2 | Task 1 |
| 2.1.3 | Task 1 |
| 2.1.4 | Task 1 |
| 2.1.5 | Task 1 |
| 2.2 (no new prod deps) | Task 1 (adds no dependency) |
| 2.2 (Analysis.jsx/ai.js untouched) | Task 1 (no task lists these files as touched) |
| 2.2 (disclaimer not advice/guarantee) | Task 1 (Human review) |

## 8. Risks / open questions

None.
