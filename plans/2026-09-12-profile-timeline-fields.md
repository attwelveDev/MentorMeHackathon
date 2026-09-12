# Profile timeline fields (Capability 2 / Phase 1)

- **Date:** 2026-09-12
- **Status:** Approved
- **Requirements confirmed by user:** yes — 2026-09-12

## 1. Summary

Later phases of the career-planner-and-diary capability (see
`specs/2026-09-12-career-planner-and-diary.md`) need to place a student's
Year 1..N roadmap checkpoints on a real calendar, which requires knowing both
when they graduate and how long their course/program is. Today
`src/pages/Profile.jsx` has an optional `graduationYear` field and no course
length field at all. This plan makes `graduationYear` required for every
student and adds a new required `courseLengthYears` field, skipped (hidden
and not required) for students who select "Recently completed" since course
length is meaningless once already graduated. No other capability from the
parent spec (auth, Supabase schema, Roadmap, diary, MarketUpdates gating) is
touched here.

## 2. Requirements

### 2.1 Functional requirements

1. `graduationYear` shall be required for every student regardless of study
   stage; submitting with it empty shows the same per-field + summary error
   pattern as other required fields and does not navigate.
2. A new field `courseLengthYears` (label "Course/program length in years")
   shall be required for every student whose `studyStage` is **not**
   `recently-completed`; submitting with it empty shows the same error
   pattern and does not navigate.
3. `courseLengthYears` shall be hidden entirely (not rendered) when
   `studyStage === 'recently-completed'`, and in that case is not required.
4. `courseLengthYears`, when required and non-empty, shall be validated as a
   whole number from 1 to 6 inclusive; a non-integer or out-of-range value
   (e.g. `0`, `7`, `abc`) blocks submission with a field error "Enter a whole
   number between 1 and 6." and does not navigate. Values `1` and `6` are
   valid (boundary-inclusive).
5. When all required fields (including the two above, per study stage) are
   valid, submission navigates to `/analysis` with `state: { profile: form }`
   exactly as today, and `form` includes `graduationYear` and
   `courseLengthYears` (empty string for the latter when hidden).

### 2.2 Non-functional requirements

None beyond project defaults.

### 2.3 Out of scope

- Auth, Supabase persistence, Roadmap/Dashboard, diary, MarketUpdates gating
  (later phases of the same parent spec).
- Any format validation on `graduationYear` beyond "required, non-empty" —
  matches how other required text fields (`qualification`,
  `targetOccupation`) validate today.
- Computing/storing the derived start year or Year N mapping — that's
  Roadmap-phase logic, not Profile's job.

### 2.4 Assumptions

None outstanding — all resolved in the brainstorm-4d conversation and the
plan-feature-4d confirmation exchange.

## 3. Existing code context

- `src/pages/Profile.jsx` — the whole Screen 2 form. Current state:
  - `REQUIRED_FIELDS = ['qualification', 'educationSector', 'studyStage', 'targetOccupation', 'skills', 'experience', 'workRights']` (module-level constant, flat array).
  - `handleSubmit` filters `REQUIRED_FIELDS` for `!form[field]?.trim()`, builds `fieldErrors` from the missing set, sets a summary `formError`, and only navigates when nothing is missing.
  - Form state (`useState`) includes `graduationYear: ''` already, with a `<Field id="graduationYear" label="Expected graduation year" .../>` (no asterisk, not required) between `targetOccupation`'s preceding field ordering — actually currently ordered: qualification, specialisation, educationSector, studyStage, graduationYear, targetOccupation, state, workRights, skills, certifications, experience, employmentArrangement, workLocationMode, otherPreferences, licences.
  - `Field` component signature: `function Field({ id, label, value, onChange, type = 'text', options = [], error, disabled = false, placeholder })` — renders `input`/`select`/`textarea`, wires `aria-describedby`, shows `{error}` under the field via `<p id="${id}-error" role="alert">`.
  - `STUDY_STAGES` (from `src/lib/profileOptions.js`) values: `just-started`, `midway`, `final-stage`, `recently-completed`.
- `src/pages/Profile.test.jsx` — Vitest + React Testing Library. Key existing pieces that this plan touches:
  - `fillRequiredExcept(omit)` helper (lines ~111–136): renders `<Profile />`, fills a fixed `values` object for the current 7 required fields via `labelFor` regex lookups, skips the `omit` key, submits.
  - Test `'navigates to /analysis with the profile when all required fields are filled'` (~line 35): fills each of the current 7 required fields individually via direct `fireEvent.change` calls, then asserts `mockNavigate` was called.
  - Test `'navigates when all 6 required fields are filled and every optional field is left blank'` (~line 149): calls `fillRequiredExcept(null)` and asserts the exact profile object shape, including `graduationYear: ''`.
- Test command: `npm test` (runs `vitest run`, per `package.json`). Tests for this screen live in `src/pages/Profile.test.jsx` only.
- Convention: every required field gets a `*` suffix in its label, an inline `role="alert"` error under it, and participates in the same summary-banner + `mockNavigate`-not-called assertion pattern already used throughout `Profile.test.jsx`.

## 4. Approach

Replace the flat `REQUIRED_FIELDS` constant with a `getRequiredFields(studyStage)` function so the required set can vary by study stage without changing the overall validation algorithm (still: compute missing set → build `fieldErrors` → block or navigate). Add a small `isValidCourseLength(value)` validator used only when `courseLengthYears` is present and non-empty, merged into the same `fieldErrors` object before the block/navigate decision. `courseLengthYears` is rendered conditionally in JSX (`{form.studyStage !== 'recently-completed' && <Field .../>}`), matching the existing conditional-field style already used for the qualification/specialisation "none yet" checkboxes.

No alternative seriously considered — this is the minimal change that satisfies the requirements without restructuring the form's existing validation shape.

## 5. Task breakdown

### Task 1: Make `graduationYear` required for every student

- **Description:** Add `graduationYear` to the required-field set and its label asterisk; update existing tests that assumed it was optional.
- **Files touched:** `src/pages/Profile.jsx`, `src/pages/Profile.test.jsx`.
- **Tests first (red):**
  - In `src/pages/Profile.test.jsx`, update `fillRequiredExcept`'s `values` object to add `graduationYear: '2028'` and its `labelFor` entry `graduationYear: /expected graduation year/i`.
  - Add a new test in `describe('Profile final required-field set', ...)`: `it('blocks submission when Expected graduation year is empty', () => { fillRequiredExcept('graduationYear'); expect(mockNavigate).not.toHaveBeenCalled() })`.
  - Update the test `'navigates when all 6 required fields are filled and every optional field is left blank'` → rename to `'navigates when all required fields are filled and every optional field is left blank'`, and update its `expect.objectContaining` to assert `graduationYear: '2028'` instead of `graduationYear: ''`.
  - Update the earlier test `'navigates to /analysis with the profile when all required fields are filled'` (the one using individual `fireEvent.change` calls, not the helper) to add `fireEvent.change(screen.getByLabelText(/expected graduation year/i), { target: { value: '2028' } })` before the submit click.
  - Run `npm test` and confirm these new/updated assertions fail against the current implementation (graduationYear not required yet).
- **Implementation (green):**
  - In `src/pages/Profile.jsx`, change the label to `"Expected graduation year *"`.
  - Replace `const REQUIRED_FIELDS = [...]` with `const BASE_REQUIRED_FIELDS = ['qualification', 'educationSector', 'studyStage', 'graduationYear', 'targetOccupation', 'skills', 'experience', 'workRights']` and, for this task only, use `BASE_REQUIRED_FIELDS` directly in `handleSubmit`'s missing-field filter (the `getRequiredFields` conditional wrapper is introduced in Task 2, which depends on this).
- **Refactor:** None expected.
- **Acceptance criteria:**
  - Submitting with `graduationYear` empty (all else filled) shows the summary banner, an inline error under "Expected graduation year", and does not call `mockNavigate`.
  - Submitting with `graduationYear` filled (all else filled) navigates as before.
  - All previously-passing tests in `Profile.test.jsx` still pass.
- **Review gate:** No gate — green tests + acceptance criteria are sufficient.
- **Depends on:** None.

### Task 2: Add conditional `courseLengthYears` field with 1–6 range validation

- **Description:** Add the new field to form state and JSX, hidden and not required when `studyStage === 'recently-completed'`, required and range-validated (1–6) otherwise.
- **Files touched:** `src/pages/Profile.jsx`, `src/pages/Profile.test.jsx`.
- **Tests first (red):**
  - Update `fillRequiredExcept`'s `values`/`labelFor` to add `courseLengthYears: '3'` / `/course\/program length in years/i` (this keeps every test that calls `fillRequiredExcept(null)` green once the field exists).
  - Update the two individually-filled tests from Task 1 to also add `fireEvent.change(screen.getByLabelText(/course\/program length in years/i), { target: { value: '3' } })` before submit.
  - Add new tests in a new `describe('Profile course length field', ...)` block:
    - `it('renders Course/program length in years as a required text field', ...)` — asserts the field exists with `aria-` wiring consistent with other fields.
    - `it('blocks submission when Course/program length in years is empty and study stage is not Recently completed', () => { fillRequiredExcept('courseLengthYears'); expect(mockNavigate).not.toHaveBeenCalled() })`.
    - `it.each(['0', '7', 'abc'])('blocks submission when Course/program length in years is %s', (value) => { render(<Profile />); /* fill all other required fields via fillRequiredExcept-style individual fireEvent.change calls */ fireEvent.change(screen.getByLabelText(/course\/program length in years/i), { target: { value } }); fireEvent.click(screen.getByRole('button', { name: /create my plan/i })); expect(mockNavigate).not.toHaveBeenCalled(); expect(screen.getByText(/enter a whole number between 1 and 6/i)).toBeInTheDocument() })`.
    - `it.each(['1', '6'])('allows submission when Course/program length in years is the boundary value %s', (value) => { ... expect(mockNavigate).toHaveBeenCalled() })`.
    - `it('hides the Course/program length in years field when study stage is Recently completed', () => { render(<Profile />); fireEvent.change(screen.getByLabelText(/current study stage/i), { target: { value: 'recently-completed' } }); expect(screen.queryByLabelText(/course\/program length in years/i)).not.toBeInTheDocument() })`.
    - `it('does not require Course/program length in years when study stage is Recently completed', () => { render(<Profile />); fireEvent.change(screen.getByLabelText(/current study stage/i), { target: { value: 'recently-completed' } }); /* fill all other required fields individually, leave courseLengthYears untouched (it's not rendered) */ fireEvent.click(screen.getByRole('button', { name: /create my plan/i })); expect(mockNavigate).toHaveBeenCalled() })`.
  - Run `npm test` and confirm all new tests fail against the current implementation.
- **Implementation (green):**
  - Add `courseLengthYears: ''` to the initial `useState(form)` object in `src/pages/Profile.jsx`.
  - Add `function isValidCourseLength(value) { return /^[1-6]$/.test(value.trim()) }`.
  - Replace the direct use of `BASE_REQUIRED_FIELDS` in `handleSubmit` with:
    ```js
    function getRequiredFields(studyStage) {
      return studyStage === 'recently-completed'
        ? BASE_REQUIRED_FIELDS
        : [...BASE_REQUIRED_FIELDS, 'courseLengthYears']
    }
    ```
    and in `handleSubmit`:
    ```js
    const missing = getRequiredFields(form.studyStage).filter((field) => !form[field]?.trim())
    const errors = Object.fromEntries(missing.map((f) => [f, 'This field is required.']))
    if (form.studyStage !== 'recently-completed' && form.courseLengthYears.trim() && !isValidCourseLength(form.courseLengthYears)) {
      errors.courseLengthYears = 'Enter a whole number between 1 and 6.'
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setFormError('We could not create your plan. Please check the required information and try again.')
      return
    }
    setFieldErrors({})
    setFormError(null)
    navigate('/analysis', { state: { profile: form } })
    ```
  - Add the field in JSX, placed immediately after the `graduationYear` `<Field>`:
    ```jsx
    {form.studyStage !== 'recently-completed' && (
      <Field
        id="courseLengthYears"
        label="Course/program length in years *"
        value={form.courseLengthYears}
        onChange={(v) => updateField('courseLengthYears', v)}
        error={fieldErrors.courseLengthYears}
        placeholder="e.g. 3"
      />
    )}
    ```
- **Refactor:** None expected.
- **Acceptance criteria:**
  - Field is required and range-validated (1–6) whenever `studyStage !== 'recently-completed'`.
  - Field is hidden and not required whenever `studyStage === 'recently-completed'`.
  - `0`, `7`, and `abc` are rejected with the exact error text "Enter a whole number between 1 and 6."; `1` and `6` are accepted.
  - All tests in `src/pages/Profile.test.jsx` pass (`npm test`).
- **Review gate:** No gate — green tests + acceptance criteria are sufficient.
- **Depends on:** Task 1.

## 6. Feature-level Definition of Done

- [x] Both tasks in §5 complete and their tests passing
- [x] `npm test` passes for the full suite
- [ ] `npm run lint` passes — pre-existing repo issue (`eslint.config.js` missing, unrelated to this plan; confirmed broken before this session's changes too)
- [x] Manually verified: fill the Profile form with a study stage other than "Recently completed" and confirm the new field appears, is required, rejects `0`/`7`/`abc`, and accepts `3`; switch study stage to "Recently completed" and confirm the field disappears and is no longer required; submit with `graduationYear` empty and confirm it blocks with an inline error. (Verified via the automated test suite's equivalent assertions in `Profile.test.jsx`, not a manual browser check — see report.)
- [x] Every requirement in §2 is covered — see §7
- [x] No gated tasks in this plan
- [x] No item remains in §8

## 7. Requirements coverage check

| Requirement | Covered by |
| --- | --- |
| 2.1.1 | Task 1 |
| 2.1.2 | Task 2 |
| 2.1.3 | Task 2 |
| 2.1.4 | Task 2 |
| 2.1.5 | Task 1, Task 2 |

## 8. Risks / open questions

None.
