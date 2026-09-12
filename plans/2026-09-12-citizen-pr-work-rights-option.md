# Citizen/PR option for Work rights + AI scope guardrail

- **Date:** 2026-09-12
- **Status:** Approved
- **Requirements confirmed by user:** yes — 2026-09-12 (via brainstorm-4d)

## 1. Summary

The Profile screen's Work rights field (`src/lib/profileOptions.js`'s
`WORK_RIGHTS`, wired into `src/pages/Profile.jsx` by
`plans/2026-09-12-work-rights-field.md`) currently offers only visa-holder-style
options, giving Australian citizens and permanent residents no accurate way to
describe their status. Separately, a tested profile produced an AI
career-readiness analysis where "Visa Subclass & Residency Status" appeared
under "Could not be assessed" (`Analysis.jsx`'s "Could not be assessed"
section, driven by `getCareerReadinessAnalysis`'s `insufficientInformation`
array in `src/lib/ai.js`) — which is itself out of scope per `CLAUDE.md` (no
visa/migration advice). This plan adds a new first option to `WORK_RIGHTS` for
citizens/permanent residents, and adds an explicit instruction to the
`getCareerReadinessAnalysis` prompt forbidding the model from treating visa
subclass, sponsorship, or migration eligibility as an assessable gap. Two
independent, additive tasks; no schema, screen, or plumbing changes beyond
these two files (plus their tests).

## 2. Requirements

### 2.1 Functional requirements

1. `WORK_RIGHTS` in `src/lib/profileOptions.js` shall have a new first entry
   `{ value: 'citizen-or-pr', label: 'Australian citizen or permanent
   resident' }`, followed by the existing 5 options unchanged, in their
   existing order and content:
   `{ value: 'no-restriction', label: 'No restriction on hours' }`,
   `{ value: 'limited-during-study', label: 'Limited hours during study periods' }`,
   `{ value: 'not-currently-able', label: 'Not currently able to work' }`,
   `{ value: 'not-sure', label: 'Not sure' }`,
   `{ value: 'prefer-not-to-say', label: 'Prefer not to say' }`.
2. Selecting `'citizen-or-pr'` on the Profile screen shall satisfy the
   required `workRights` field check (already implemented — no `Profile.jsx`
   change needed, since its `Field` renders generically from `WORK_RIGHTS`)
   and shall flow to `/analysis` as `profile.workRights === 'citizen-or-pr'`,
   exactly like any other `WORK_RIGHTS` value today.
3. The prompt constructed by `getCareerReadinessAnalysis` in `src/lib/ai.js`
   shall contain an explicit instruction that visa subclass, sponsorship
   pathways, or migration eligibility must not appear anywhere in the
   response, including in `insufficientInformation`.

### 2.2 Non-functional requirements

- No new production (`dependencies`) packages are added.
- No changes to `api/generate.js`, `src/pages/Analysis.jsx`,
  `src/pages/Profile.jsx`, `src/pages/Plan.jsx`, or any Supabase/schema code.
- The new option's label must read as a plain self-reported category, not as
  advice, a guarantee, or a verification claim, per `CLAUDE.md`'s
  out-of-scope list — this is why Task 1 carries a Human review gate.
- The prompt instruction added in Task 2 must itself avoid phrasing that
  could read as migration/visa advice (it should only tell the model what
  *not* to discuss, not offer any visa-related guidance) — this is why Task 2
  carries a Human review gate.
- Because live Gemini output cannot be asserted deterministically in a unit
  test, Task 2's automated verification covers only the prompt text we
  construct (i.e., that we instructed the model correctly), not the model's
  actual compliance.

### 2.3 Out of scope

- Renaming or otherwise changing the Work rights field's label/copy — the
  user confirmed during brainstorming to keep it as `"Work rights *"` with its
  existing disclaimer, unchanged by this plan.
- Any change to `generateCareerPlan` or `summariseMarketUpdate`'s prompts in
  `src/lib/ai.js` — only `getCareerReadinessAnalysis`'s prompt changes.
- Using `workRights` (including the new `'citizen-or-pr'` value) to filter,
  gate, or alter which career-plan activities are generated — unchanged from
  the original Work rights plan's scope.
- Persisting the profile to Supabase — still out of scope, as in the original
  Profile/Work rights plans.
- Any live verification of actual Gemini model output/compliance with the new
  instruction — not deterministically testable; see 2.2.

### 2.4 Assumptions

None — all decisions (option wording, position, field-label non-change,
prompt-guardrail approach) were settled explicitly during brainstorming.

## 3. Existing code context

**`src/lib/profileOptions.js`** (current content, 50 lines, confirmed by
reading the file this turn) — `WORK_RIGHTS` (lines 43–49) is:
```js
export const WORK_RIGHTS = [
  { value: 'no-restriction', label: 'No restriction on hours' },
  { value: 'limited-during-study', label: 'Limited hours during study periods' },
  { value: 'not-currently-able', label: 'Not currently able to work' },
  { value: 'not-sure', label: 'Not sure' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' },
]
```

**`src/lib/profileOptions.test.js`** (current content, 59 lines, confirmed by
reading the file this turn) — the `'exports 5 work rights options'` test
(lines 50–58) asserts `WORK_RIGHTS` via `toEqual` against the exact 5-item
array above, in order. This must become a 6-item assertion.

**`src/pages/Profile.jsx`** — `workRights` `Field` (added by
`plans/2026-09-12-work-rights-field.md`) reads `options={WORK_RIGHTS}` and
maps generically via `Field`'s `options.map((opt) => <option ...>)` (line
232–234 of `Profile.jsx` as last read). No signature or JSX change is needed
for a new array entry.

**`src/pages/Profile.test.jsx`** (confirmed by `grep` this turn) — the only
`WORK_RIGHTS`-dependent assertion is:
```jsx
WORK_RIGHTS.forEach((opt) => {
  expect(screen.getByRole('option', { name: opt.label })).toBeInTheDocument()
})
```
(line 233), which checks presence, not order or count — it will continue to
pass unmodified once `WORK_RIGHTS` has 6 entries. No other test in this file
asserts a fixed `WORK_RIGHTS` length or order. `fillRequiredExcept`'s `values`
map sets `workRights: 'no-restriction'` (line 119) — still a valid value,
unaffected by inserting a new option elsewhere in the array. **No changes to
`Profile.jsx` or `Profile.test.jsx` are needed for this plan.**

**`src/lib/ai.js`** (current content, 75 lines, confirmed by reading the file
this turn) — `getCareerReadinessAnalysis` (lines 21–35):
```js
export async function getCareerReadinessAnalysis(profile) {
  const prompt = `You are a career-guidance assistant for international students in Australia.
Given this student profile (JSON): ${JSON.stringify(profile)}

Return a JSON object with these fields only:
- strengths: string[]
- skillGaps: string[]
- experienceGaps: string[]
- licencesToInvestigate: string[]
- insufficientInformation: string[] (fields you could not assess and why)
Each array item should be a short string that includes a brief "why" explanation.
Do not include any text outside the JSON object.`
  const { text } = await callGenerate(prompt, 'readiness-analysis')
  return text
}
```
`callGenerate` (lines 4–17) does `fetch('/api/generate', { method: 'POST',
headers: {...}, body: JSON.stringify({ prompt, task }) })` and returns
`response.json()`.

**No test file exists yet for `src/lib/ai.js`** (confirmed: `src/lib/`
contains only `__tests__/sanity.test.js`, `ai.js`, `profileOptions.js`,
`profileOptions.test.js`, `supabaseClient.js`). Task 2 creates
`src/lib/ai.test.js`, the first test file for this module, mocking
`global.fetch` since `callGenerate` calls it directly with no injectable
client.

**Test setup:** Vitest 2.x + React Testing Library, `npm test` (`vitest
run`), globals mode enabled in `vite.config.js`.

## 4. Approach

Two independent, additive tasks, no shared dependency:

- **Task 1** inserts one new object at the front of the `WORK_RIGHTS` array
  and updates its one existing exact-array test. No other file changes.
- **Task 2** adds one instruction sentence to `getCareerReadinessAnalysis`'s
  prompt template and creates `src/lib/ai.test.js` (new file) to assert the
  constructed prompt contains that instruction, mocking `fetch` since
  `callGenerate` calls it directly.

Both tasks touch the out-of-scope boundary from `CLAUDE.md` (residency/visa
framing in Task 1's option label; explicit visa/migration-scope instruction
in Task 2's prompt), so both carry a Human review gate per condition 2 of the
five review-gate conditions (sourcing/compliance surface — "anything brushing
the out-of-scope list"). This mirrors how the original Work rights field task
(`plans/2026-09-12-work-rights-field.md`, Task 1) was gated for the same
reason.

## 5. Task breakdown

### Task 1: Add "Australian citizen or permanent resident" option to WORK_RIGHTS [x]

- **Description:** Insert a new first entry into `WORK_RIGHTS` so citizens
  and permanent residents have an accurate self-reported option, and update
  the existing exact-array test to match.
- **Files touched:** `src/lib/profileOptions.js` (edit),
  `src/lib/profileOptions.test.js` (edit).
- **Tests first (red):** In `src/lib/profileOptions.test.js`, replace the
  `'exports 5 work rights options'` test with:
  ```js
  it('exports 6 work rights options, with citizen/PR listed first', () => {
    expect(WORK_RIGHTS).toEqual([
      { value: 'citizen-or-pr', label: 'Australian citizen or permanent resident' },
      { value: 'no-restriction', label: 'No restriction on hours' },
      { value: 'limited-during-study', label: 'Limited hours during study periods' },
      { value: 'not-currently-able', label: 'Not currently able to work' },
      { value: 'not-sure', label: 'Not sure' },
      { value: 'prefer-not-to-say', label: 'Prefer not to say' },
    ])
  })
  ```
  This fails immediately: the current `WORK_RIGHTS` array has only 5 entries
  and no `'citizen-or-pr'` value.
- **Implementation (green):** In `src/lib/profileOptions.js`, change
  `WORK_RIGHTS` to:
  ```js
  export const WORK_RIGHTS = [
    { value: 'citizen-or-pr', label: 'Australian citizen or permanent resident' },
    { value: 'no-restriction', label: 'No restriction on hours' },
    { value: 'limited-during-study', label: 'Limited hours during study periods' },
    { value: 'not-currently-able', label: 'Not currently able to work' },
    { value: 'not-sure', label: 'Not sure' },
    { value: 'prefer-not-to-say', label: 'Prefer not to say' },
  ]
  ```
- **Refactor:** None expected.
- **Acceptance criteria:**
  - The new `profileOptions.test.js` test passes.
  - `src/pages/Profile.test.jsx`'s existing `WORK_RIGHTS.forEach(...)` option
    presence test continues to pass unmodified (verifies no
    `Profile.jsx`/`Profile.test.jsx` change was needed).
  - `npm test` (full suite) passes with no regressions.
  - `WORK_RIGHTS[0]` is `{ value: 'citizen-or-pr', label: 'Australian citizen
    or permanent resident' }`; the other 5 entries are unchanged in content
    and relative order.
- **Human review:** Load `/profile` in the browser (`npm run dev`) and
  visually confirm: (1) "Australian citizen or permanent resident" appears as
  the first option in the Work rights dropdown, above "No restriction on
  hours"; (2) the label reads as a plain self-reported category, not as
  advice, a guarantee of status, or anything that could be mistaken for
  visa/migration/eligibility advice, per `CLAUDE.md`'s out-of-scope list. This
  is gated because the option names a residency/citizenship category, which
  brushes that same out-of-scope boundary the original Work rights field task
  was gated for.
- **Depends on:** None.

### Task 2: Instruct the AI analysis prompt not to address visa/migration specifics [x]

- **Description:** Add an explicit instruction to `getCareerReadinessAnalysis`'s
  prompt so the model does not treat visa subclass, sponsorship pathway, or
  migration eligibility as an assessable gap (or comment on it anywhere),
  keeping the analysis within `CLAUDE.md`'s declared scope. Add the first
  test file for `src/lib/ai.js` to verify the constructed prompt carries this
  instruction.
- **Files touched:** `src/lib/ai.js` (edit), `src/lib/ai.test.js` (new).
- **Tests first (red):** Create `src/lib/ai.test.js`:
  ```js
  import { describe, it, expect, vi, beforeEach } from 'vitest'
  import { getCareerReadinessAnalysis } from './ai'

  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        task: 'readiness-analysis',
        text: '{"strengths":[],"skillGaps":[],"experienceGaps":[],"licencesToInvestigate":[],"insufficientInformation":[]}',
      }),
    })
  })

  describe('getCareerReadinessAnalysis', () => {
    it('instructs the model not to address visa subclass, sponsorship, or migration eligibility', async () => {
      await getCareerReadinessAnalysis({ qualification: 'Bachelor of IT', workRights: 'citizen-or-pr' })
      expect(global.fetch).toHaveBeenCalledWith('/api/generate', expect.objectContaining({ method: 'POST' }))
      const [, options] = global.fetch.mock.calls[0]
      const body = JSON.parse(options.body)
      expect(body.prompt).toMatch(
        /do not comment on, assess, or list visa subclass, sponsorship pathways, or migration eligibility/i
      )
    })
  })
  ```
  This fails immediately: the current prompt template contains no such
  instruction, so the `toMatch` assertion fails.
- **Implementation (green):** In `src/lib/ai.js`, change
  `getCareerReadinessAnalysis`'s prompt template to insert one new
  instruction line after the profile-JSON line and before "Return a JSON
  object...":
  ```js
  export async function getCareerReadinessAnalysis(profile) {
    const prompt = `You are a career-guidance assistant for international students in Australia.
  Given this student profile (JSON): ${JSON.stringify(profile)}

  Do not comment on, assess, or list visa subclass, sponsorship pathways, or migration eligibility anywhere in your response, including insufficientInformation — CareerCompass AU does not provide migration or visa advice.

  Return a JSON object with these fields only:
  - strengths: string[]
  - skillGaps: string[]
  - experienceGaps: string[]
  - licencesToInvestigate: string[]
  - insufficientInformation: string[] (fields you could not assess and why)
  Each array item should be a short string that includes a brief "why" explanation.
  Do not include any text outside the JSON object.`
    const { text } = await callGenerate(prompt, 'readiness-analysis')
    return text
  }
  ```
- **Refactor:** None expected.
- **Acceptance criteria:**
  - The new `src/lib/ai.test.js` test passes.
  - `generateCareerPlan` and `summariseMarketUpdate` in `src/lib/ai.js` are
    byte-for-byte unchanged (only `getCareerReadinessAnalysis`'s prompt
    changes).
  - `npm test` (full suite) passes with no regressions.
- **Human review:** Read the new prompt sentence in
  `getCareerReadinessAnalysis` (`src/lib/ai.js`) and confirm: (1) it only
  tells the model what *not* to discuss (visa subclass/sponsorship/migration
  eligibility) and does not itself state, imply, or guarantee anything about
  visa/migration status or eligibility; (2) it does not change any other
  behavior of the prompt (all existing return-shape instructions are
  unchanged). This is gated because it directly changes how the AI handles
  the out-of-scope visa/migration boundary from `CLAUDE.md`.
- **Depends on:** None (independent of Task 1; can be built and reviewed in
  either order).

## 6. Feature-level Definition of Done

- [x] Task 1 complete and its tests passing
- [x] Task 2 complete and its tests passing
- [x] `npm test` passes (full suite)
- [ ] `npm run lint` — same pre-existing gap as
  `plans/2026-09-12-student-profile.md` and
  `plans/2026-09-12-work-rights-field.md` (no `eslint.config.js` in the
  repo); skip per that precedent unless the user says otherwise.
- [x] Manually verified: loaded `/profile` via `npm run dev`; confirmed
  "Australian citizen or permanent resident" is the first Work rights option;
  selected it plus the other 6 required fields and confirmed navigation to
  `/analysis` with `workRights: 'citizen-or-pr'` in the profile state.
- [x] Every requirement in §2 is covered — see §7
- [x] Task 1's `Human review:` has been shown to the user and explicitly
  accepted
- [x] Task 2's `Human review:` has been shown to the user and explicitly
  accepted
- [x] No item remains in §8

## 7. Requirements coverage check

| Requirement | Covered by |
| --- | --- |
| 2.1.1 | Task 1 |
| 2.1.2 | Task 1 |
| 2.1.3 | Task 2 |
| 2.2 (no new prod deps) | Task 1, Task 2 (neither adds a dependency) |
| 2.2 (api/generate.js, Analysis.jsx, Profile.jsx, Plan.jsx, Supabase untouched) | Task 1, Task 2 (no task lists these files as touched) |
| 2.2 (new option label not advice/guarantee) | Task 1 (Human review) |
| 2.2 (prompt instruction itself not advice) | Task 2 (Human review) |
| 2.2 (live-output non-determinism acknowledged) | Task 2 (test verifies constructed prompt only, not live output) |

## 8. Risks / open questions

None.
