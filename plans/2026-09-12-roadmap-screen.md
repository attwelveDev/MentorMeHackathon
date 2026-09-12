# Roadmap screen (Capability 2 / Phase 4)

- **Date:** 2026-09-12
- **Status:** Approved
- **Requirements confirmed by user:** yes — 2026-09-12

## 1. Summary

This is the centerpiece of the career-planner-and-diary capability (see
`specs/2026-09-12-career-planner-and-diary.md`): the open-book roadmap that
replaces both `src/pages/Plan.jsx` (Screen 4) and `src/pages/Dashboard.jsx`
(Screen 5). It generates/loads a student's Year-N (or real-calendar-year, for
graduates) plan, colour-codes each checkpoint by completed/missed/current/
upcoming, places a "you are here" pin, shows a stats strip, and lets guests
save locally while registered users get full Supabase persistence and
unlocked editing/accepting/status-tracking. It depends on Phase 1 (Profile's
`graduationYear`/`courseLengthYears`), Phase 2 (`useAuth`/`LockedAction`),
and Phase 3 (the `plans`/`activities` tables). Diary logging itself is Phase
5 — this phase only stubs the diary entry point as gated and shows an empty
"no diary entries yet" state in the stats strip.

## 2. Requirements

### 2.1 Functional requirements

1. Given a target role and known study stage (per the original acceptance
   criteria), when the plan is generated, activities are grouped into Year N
   periods (or real-calendar-year "after graduating" periods, or a single
   collapsed "Before graduating" stage, for recently-completed students),
   each with a category, priority, explanation, and initial status.
2. Each non-collapsed activity's checkpoint colour is derived as: `Completed`
   (green) if `status === 'Completed'`; else `Missed` (grey) if its period's
   real year is before the current calendar year; else `Current` (gold) if
   it's the first not-completed activity whose period year is the current
   year or later (chronologically); else `Upcoming` (blue). The "Before
   graduating" collapsed activity, if present, is always forced to
   `status: 'Completed'` and rendered green.
3. The "you are here" pin renders at the single `Current` (gold) checkpoint.
4. A goal card ("Become a {targetOccupation}") renders at the end of the
   roadmap, styled distinctly (goal colours), and is never part of the
   completed/missed/current/upcoming set.
5. A guest (no account) can Save the plan; it's written to this browser's
   localStorage with a visible notice that it's only saved on this device/
   browser (not "lost on tab close" — accurate: survives tab close, lost on
   clearing site data or switching browser/device).
6. A guest cannot Accept the plan, edit/add/remove an activity, or change an
   activity's status — each such control is rendered via `LockedAction`
   (Phase 2), locked and linking to `/signup`.
7. A registered user can Accept the plan, edit/add/remove activities, and
   change activity status, all persisted to Supabase (`plans`/`activities`
   tables from Phase 3) via `src/lib/db.js`.
8. A registered user's existing saved plan (if any) loads from Supabase
   instead of regenerating a new one; if none exists yet and a profile was
   passed via router state (freshly arrived from `/analysis`), a plan is
   generated and, once Saved, persisted to Supabase.
9. A stats strip shows counts of completed/in-progress/upcoming/overdue
   activities and a progress-by-category breakdown, derived from the same
   colour/status logic as the roadmap; "Recent diary entries" shows an empty
   state in this phase (Phase 5 wires real data in).
10. The screen renders a left-side vertical tab nav with four entries: Diary,
    News, Jobs, Profile — matching the mockup's book-tab layout. In this
    phase: "Profile" links to the existing `/profile` route; "Diary" and
    "News" render as plain `<Link>`s to `/diary` and `/updates` respectively
    (Phase 5 builds `/diary`'s content; Phase 6 gates `/updates`); "Jobs"
    renders as a disabled, non-clickable "Coming soon" label, since no Jobs
    screen exists anywhere in this codebase yet and inventing a dead route
    would be worse than an honest placeholder.

### 2.2 Non-functional requirements

- **Cross-cutting flow change — gate condition 4.** This phase retires two
  existing screens and changes app routing; see per-task gates below.
- Reuses the existing error-banner pattern ("We could not generate your
  plan...") for AI-generation failures, per repo convention.

### 2.3 Out of scope

- Diary entry logging, the diary detail panel's entry form, and "Get AI
  feedback" (Phase 5) — this phase only renders the diary entry point as
  `LockedAction`-gated and the stats strip's diary section as empty.
- MarketUpdates/News gating (Phase 6).
- Importing a localStorage guest plan into a newly-created account — that
  flow lives in `SignUp.jsx` (Phase 2 built the screen; this phase does not
  modify it) and is genuinely deferred: **this plan does not implement
  guest→account plan migration.** It is called out explicitly as a risk
  removed from scope below.

### 2.4 Assumptions

None outstanding.

## 3. Existing code context

- `src/pages/Plan.jsx` (to be deleted) — current Screen 4: fetches
  `generateCareerPlan(profile)` from router `state.profile`, renders
  activities grouped by a fixed `PERIODS` array, lets the user edit
  title/status/remove/add via local `useState` only (no persistence).
- `src/pages/Dashboard.jsx` (to be deleted) — current Screen 5 stub: static
  zeroed `StatCard`s, no real data.
- `src/lib/ai.js`'s `generateCareerPlan(profile)` (lines ~40–57) — current
  prompt uses a fixed semester-relative `PERIODS` array
  (`Now`/`This semester`/etc.); this phase rewrites it to the Year-N/graduate
  scheme.
- `src/lib/ai.js`'s `callGenerate(prompt, task)` (lines ~4–17) — unchanged;
  posts to `/api/generate`, returns `{ task, text }`, throws on non-OK
  response. All new AI calls in this plan go through it, matching
  `src/lib/ai.test.js`'s `global.fetch` mocking convention.
- `src/lib/auth.jsx`'s `useAuth()` (Phase 2) — provides `{ user, session,
  loading, signUp, signIn, signOut }`.
- `src/components/LockedAction.jsx` (Phase 2) — renders active button
  (signed in) or locked `Link to="/signup"` (signed out); props:
  `{ children, onClick, className, ...rest }`.
- `src/lib/supabaseClient.js` — exports `supabase`.
- Phase 3's tables: `plans (id, user_id, target_occupation, accepted,
  created_at, updated_at)`, `activities (id, plan_id, user_id, title,
  category, period_label, period_year, priority, explanation, status,
  sort_order, created_at, updated_at)`.
- `src/pages/Analysis.jsx` navigates to `/plan` with
  `state: { profile }` — unchanged by this phase; Roadmap reads
  `useLocation().state?.profile` exactly as `Plan.jsx` does today.
- `src/App.jsx` currently routes `/plan` → `Plan`, `/dashboard` → `Dashboard`,
  with nav `<Link>`s for both.
- Test command: `npm test` (Vitest + RTL, `jsdom` environment).

## 4. Approach

Split the year/colour/pin math into a pure, dependency-free module
(`src/lib/roadmap.js`) so it's unit-testable with fixed fixture dates rather
than depending on `Date.now()` inside component tests. Split persistence into
two small modules — `src/lib/localPlan.js` (guest, localStorage) and
`src/lib/db.js` (registered, Supabase) — so `Roadmap.jsx` itself only
branches on `user` from `useAuth()` and calls whichever module applies,
rather than embedding storage logic inline. The goal card's copy is
deliberately plain ("Become a {targetOccupation}", no flavour text) rather
than the mockup's poetic subtitle, to avoid any wording that could read as an
employment-outcome promise (CLAUDE.md's out-of-scope list: "Guarantees of
employment").

Alternative considered: computing period years entirely inside the AI prompt
(asking Gemini to do the arithmetic). Rejected — LLM arithmetic on
graduation-year math is exactly the kind of thing that silently drifts wrong;
keeping only a small fixed label vocabulary in the AI's output and doing all
year arithmetic in tested, deterministic client code avoids that failure
mode entirely.

## 5. Task breakdown

### Amendment (2026-09-12, during Task 5 review): `computeRoadmap` prefers a stored `periodYear`

Discovered while implementing Task 5: `computeRoadmap` as originally written
always recomputes `periodYear` via `periodYearFor(a.period, profile)`,
discarding any `periodYear` already present on the activity. That's fine
when generating fresh from a full profile, but breaks the "registered user
loads an existing plan with no router-state profile" path (2.1.8) — nothing
in this plan persists `studyStage`/`graduationYear`/`courseLengthYears`
anywhere `Roadmap.jsx` could re-fetch them from (`Profile.jsx` still has a
`// TODO: persist profile to Supabase`; `plans` only stores
`target_occupation`). Resolved with the user's approval (option 1 of three
discussed): `computeRoadmap` now uses `a.periodYear` when already present
(falling back to `periodYearFor` only when absent), and `Roadmap.jsx` (Task
5) derives period-grouping order directly from the chronologically-sorted
`computeRoadmap` output rather than calling `getExpectedPeriodLabels(profile)`
for the loaded-from-Supabase path. `src/lib/roadmap.js` and
`src/lib/roadmap.test.js` updated accordingly; no schema change, no other
task's scope affected.

### Task 1: `src/lib/roadmap.js` — timeline, colour, and pin derivation

- **Description:** Pure functions computing each activity's real period year,
  chronological order, colour, and pin, plus stats aggregation.
- **Files touched:** `src/lib/roadmap.js` (new), `src/lib/roadmap.test.js`
  (new).
- **Tests first (red):** In `src/lib/roadmap.test.js`:
  ```js
  import { describe, it, expect } from 'vitest'
  import { getExpectedPeriodLabels, periodYearFor, computeRoadmap, computeStats } from './roadmap'

  const studentProfile = { studyStage: 'midway', graduationYear: '2027', courseLengthYears: '4', targetOccupation: 'Data Analyst' }
  const gradProfile = { studyStage: 'recently-completed', graduationYear: '2023', targetOccupation: 'Data Analyst' }

  describe('getExpectedPeriodLabels', () => {
    it('returns Year 1..N for a studying profile', () => {
      expect(getExpectedPeriodLabels(studentProfile)).toEqual(['Year 1', 'Year 2', 'Year 3', 'Year 4'])
    })
    it('returns the graduate label set for a recently-completed profile', () => {
      expect(getExpectedPeriodLabels(gradProfile)).toEqual(['Before graduating', 'Year 1 after graduating', 'Year 2 after graduating', 'Year 3 after graduating'])
    })
  })

  describe('periodYearFor', () => {
    it('maps Year N to graduationYear - courseLengthYears + 1 + (N-1)', () => {
      expect(periodYearFor('Year 1', studentProfile)).toBe(2024)
      expect(periodYearFor('Year 3', studentProfile)).toBe(2026)
    })
    it('maps "Before graduating" to null', () => {
      expect(periodYearFor('Before graduating', gradProfile)).toBeNull()
    })
    it('maps "Year N after graduating" to graduationYear + N', () => {
      expect(periodYearFor('Year 2 after graduating', gradProfile)).toBe(2025)
    })
    it('returns null for an unrecognised label', () => {
      expect(periodYearFor('Some other label', studentProfile)).toBeNull()
    })
  })

  describe('computeRoadmap', () => {
    it('colours and pins checkpoints matching the mockup scenario (currentYear=2026, Year3 pinned)', () => {
      const activities = [
        { title: 'Choose a relevant degree/course', period: 'Year 1', status: 'Completed', category: 'Application preparation', priority: 'High', explanation: '' },
        { title: 'Join a club or student society', period: 'Year 1', status: 'Completed', category: 'Networking', priority: 'Medium', explanation: '' },
        { title: 'Build basic skills', period: 'Year 1', status: 'Completed', category: 'Technical skills', priority: 'High', explanation: '' },
        { title: 'Take relevant subjects', period: 'Year 2', status: 'Completed', category: 'Technical skills', priority: 'High', explanation: '' },
        { title: 'Work on personal projects', period: 'Year 2', status: 'Completed', category: 'Practical competencies/placements/portfolio evidence', priority: 'Medium', explanation: '' },
        { title: 'Apply for a part-time role', period: 'Year 2', status: 'Not started', category: 'Work experience', priority: 'Medium', explanation: '' },
        { title: 'Apply for internships', period: 'Year 3', status: 'Not started', category: 'Work experience', priority: 'High', explanation: '' },
        { title: 'Obtain a relevant certification', period: 'Year 3', status: 'Not started', category: 'Certifications', priority: 'Medium', explanation: '' },
        { title: 'Build a portfolio', period: 'Year 3', status: 'Not started', category: 'Practical competencies/placements/portfolio evidence', priority: 'Medium', explanation: '' },
        { title: 'Polish my resume and LinkedIn', period: 'Year 4', status: 'Not started', category: 'Application preparation', priority: 'Medium', explanation: '' },
        { title: 'Apply for graduate programs', period: 'Year 4', status: 'Not started', category: 'Application preparation', priority: 'High', explanation: '' },
      ]
      const result = computeRoadmap(activities, studentProfile, 2026)
      const byTitle = Object.fromEntries(result.map((a) => [a.title, a]))
      expect(byTitle['Choose a relevant degree/course'].colour).toBe('completed')
      expect(byTitle['Apply for a part-time role'].colour).toBe('missed')
      expect(byTitle['Apply for internships'].colour).toBe('current')
      expect(byTitle['Apply for internships'].isPinned).toBe(true)
      expect(byTitle['Obtain a relevant certification'].colour).toBe('upcoming')
      expect(byTitle['Polish my resume and LinkedIn'].colour).toBe('upcoming')
      expect(result.filter((a) => a.isPinned)).toHaveLength(1)
    })

    it('forces the "Before graduating" activity to Completed/green regardless of its input status', () => {
      const result = computeRoadmap([
        { title: 'Everything before graduating', period: 'Before graduating', status: 'Not started', category: 'Application preparation', priority: 'Low', explanation: '' },
      ], gradProfile, 2026)
      expect(result[0].status).toBe('Completed')
      expect(result[0].colour).toBe('completed')
    })
  })

  describe('computeStats', () => {
    it('counts completed/inProgress/upcoming/overdue and groups by category, excluding "Before graduating"', () => {
      const roadmap = [
        { period: 'Before graduating', status: 'Completed', colour: 'completed', category: 'Application preparation' },
        { period: 'Year 1', status: 'Completed', colour: 'completed', category: 'Technical skills' },
        { period: 'Year 2', status: 'In progress', colour: 'upcoming', category: 'Technical skills' },
        { period: 'Year 2', status: 'Not started', colour: 'missed', category: 'Work experience' },
        { period: 'Year 3', status: 'Not started', colour: 'current', category: 'Work experience' },
      ]
      const stats = computeStats(roadmap)
      expect(stats).toEqual({
        completed: 1,
        inProgress: 1,
        upcoming: 1,
        overdue: 1,
        byCategory: {
          'Technical skills': { completed: 1, total: 2 },
          'Work experience': { completed: 0, total: 2 },
        },
      })
    })
  })
  ```
  Run `npm test` and confirm these fail (module doesn't exist yet).
- **Implementation (green):** `src/lib/roadmap.js`:
  ```js
  export function getExpectedPeriodLabels(profile) {
    if (profile.studyStage === 'recently-completed') {
      return ['Before graduating', 'Year 1 after graduating', 'Year 2 after graduating', 'Year 3 after graduating']
    }
    const n = Number(profile.courseLengthYears)
    return Array.from({ length: n }, (_, i) => `Year ${i + 1}`)
  }

  export function periodYearFor(periodLabel, profile) {
    const graduationYear = Number(profile.graduationYear)
    if (periodLabel === 'Before graduating') return null
    const afterMatch = /^Year (\d+) after graduating$/.exec(periodLabel)
    if (afterMatch) return graduationYear + Number(afterMatch[1])
    const yearMatch = /^Year (\d+)$/.exec(periodLabel)
    if (yearMatch) {
      const courseLengthYears = Number(profile.courseLengthYears)
      const startYear = graduationYear - courseLengthYears + 1
      return startYear + Number(yearMatch[1]) - 1
    }
    return null
  }

  export function computeRoadmap(activities, profile, currentYear = new Date().getFullYear()) {
    const withYear = activities.map((a) => ({
      ...a,
      status: a.period === 'Before graduating' ? 'Completed' : a.status,
      periodYear: periodYearFor(a.period, profile),
    }))
    const ordered = [...withYear].sort((a, b) => {
      if (a.periodYear === b.periodYear) return 0
      if (a.periodYear === null) return -1
      if (b.periodYear === null) return 1
      return a.periodYear - b.periodYear
    })
    const pinIndex = ordered.findIndex(
      (a) => a.status !== 'Completed' && a.periodYear !== null && a.periodYear >= currentYear
    )
    return ordered.map((a, i) => {
      let colour
      if (a.status === 'Completed') colour = 'completed'
      else if (a.periodYear !== null && a.periodYear < currentYear) colour = 'missed'
      else if (i === pinIndex) colour = 'current'
      else colour = 'upcoming'
      return { ...a, colour, isPinned: i === pinIndex }
    })
  }

  export function computeStats(roadmap) {
    const relevant = roadmap.filter((a) => a.period !== 'Before graduating')
    const byCategory = {}
    relevant.forEach((a) => {
      byCategory[a.category] = byCategory[a.category] || { completed: 0, total: 0 }
      byCategory[a.category].total += 1
      if (a.status === 'Completed') byCategory[a.category].completed += 1
    })
    return {
      completed: relevant.filter((a) => a.status === 'Completed').length,
      inProgress: relevant.filter((a) => a.status === 'In progress').length,
      upcoming: relevant.filter((a) => a.colour === 'upcoming').length,
      overdue: relevant.filter((a) => a.colour === 'missed').length,
      byCategory,
    }
  }
  ```
- **Refactor:** None expected.
- **Acceptance criteria:** all test cases above pass; `computeRoadmap` never
  produces more than one `isPinned: true` entry; "Before graduating" is
  always `status: 'Completed'`/`colour: 'completed'` regardless of input.
- **Review gate:** No gate — pure logic, no schema/auth/sourcing/cross-
  cutting/irreversible surface.
- **Depends on:** None.

### Task 2: Update `generateCareerPlan`'s prompt for Year-N/graduate periods

- **Description:** Replace the semester-relative `PERIODS` prompt with one
  constrained to `getExpectedPeriodLabels(profile)`'s exact label set.
- **Files touched:** `src/lib/ai.js`, `src/lib/ai.test.js`.
- **Tests first (red):** Add to `src/lib/ai.test.js`:
  ```js
  describe('generateCareerPlan', () => {
    it('constrains the prompt to the exact expected period labels for the given profile', async () => {
      const profile = { studyStage: 'midway', graduationYear: '2027', courseLengthYears: '4', targetOccupation: 'Data Analyst' }
      await generateCareerPlan(profile)
      const [, options] = global.fetch.mock.calls[0]
      const body = JSON.parse(options.body)
      expect(body.prompt).toContain('"Year 1"')
      expect(body.prompt).toContain('"Year 4"')
      expect(body.prompt).not.toContain('"Now"')
    })

    it('uses the graduate label set and instructs a single completed "Before graduating" summary activity for recently-completed students', async () => {
      const profile = { studyStage: 'recently-completed', graduationYear: '2023', targetOccupation: 'Data Analyst' }
      await generateCareerPlan(profile)
      const [, options] = global.fetch.mock.calls[0]
      const body = JSON.parse(options.body)
      expect(body.prompt).toContain('Before graduating')
      expect(body.prompt).toContain('Year 1 after graduating')
      expect(body.prompt).toMatch(/already graduated/i)
    })
  })
  ```
  (Import `generateCareerPlan` alongside the existing
  `getCareerReadinessAnalysis` import at the top of the file; the existing
  `beforeEach` fetch mock already covers this.) Run `npm test` and confirm
  these fail against the current fixed-`PERIODS` prompt.
- **Implementation (green):** In `src/lib/ai.js`, import
  `getExpectedPeriodLabels` from `./roadmap` and rewrite
  `generateCareerPlan`:
  ```js
  import { getExpectedPeriodLabels } from './roadmap'

  export async function generateCareerPlan(profile) {
    const periodLabels = getExpectedPeriodLabels(profile)
    const prompt = `You are a career-guidance assistant for international students in Australia.
  Given this student profile (JSON): ${JSON.stringify(profile)}

  Generate a stage-by-stage career preparation plan grouped into these exact period labels, in this order, and using ONLY these labels: ${JSON.stringify(periodLabels)}.
  ${profile.studyStage === 'recently-completed'
    ? 'This student has already graduated. Use "Before graduating" for exactly one summary activity representing what they already completed during their studies, with status "Completed". Use the "Year N after graduating" labels for future activities.'
    : 'This student is still studying. Distribute activities across the Year labels according to when they would realistically be done during a course of this length.'}

  Return a JSON array of activities, each with:
  - title: string
  - category: string (one of: Technical skills, Certifications, Work experience, Networking, Extracurricular activities, Application preparation, Commercial and industry awareness, Licensing/registration/compliance, Practical competencies/placements/portfolio evidence)
  - period: string (one of the exact period labels above)
  - priority: "High" | "Medium" | "Low"
  - explanation: string (why this activity was recommended)
  - status: "Not started" (or "Completed", only for the single "Before graduating" activity if used)
  Do not include any text outside the JSON array.`
    const { text } = await callGenerate(prompt, 'career-plan')
    return text
  }
  ```
- **Refactor:** None expected.
- **Acceptance criteria:** both new tests pass; existing `ai.test.js` tests
  (readiness analysis) remain green.
- **Review gate:** No gate — this changes plan-generation guidance copy, not
  job-market/migration data display, and doesn't brush the out-of-scope list.
- **Depends on:** Task 1 (imports `getExpectedPeriodLabels`).

### Task 3: `src/lib/localPlan.js` — guest plan persistence

- **Description:** localStorage save/load/clear for a guest's plan.
- **Files touched:** `src/lib/localPlan.js` (new),
  `src/lib/localPlan.test.js` (new).
- **Tests first (red):**
  ```js
  import { describe, it, expect, beforeEach } from 'vitest'
  import { saveGuestPlan, loadGuestPlan, clearGuestPlan } from './localPlan'

  beforeEach(() => localStorage.clear())

  describe('localPlan', () => {
    it('round-trips a saved plan through loadGuestPlan', () => {
      const profile = { targetOccupation: 'Data Analyst' }
      const activities = [{ title: 'x' }]
      expect(saveGuestPlan(profile, activities)).toEqual({ ok: true })
      const loaded = loadGuestPlan()
      expect(loaded.profile).toEqual(profile)
      expect(loaded.activities).toEqual(activities)
      expect(typeof loaded.savedAt).toBe('string')
    })

    it('returns null from loadGuestPlan when nothing is saved', () => {
      expect(loadGuestPlan()).toBeNull()
    })

    it('removes the saved plan via clearGuestPlan', () => {
      saveGuestPlan({}, [])
      clearGuestPlan()
      expect(loadGuestPlan()).toBeNull()
    })

    it('returns { ok: false, error } instead of throwing when localStorage.setItem throws', () => {
      const original = Storage.prototype.setItem
      Storage.prototype.setItem = () => { throw new Error('QuotaExceededError') }
      const result = saveGuestPlan({}, [])
      expect(result.ok).toBe(false)
      expect(typeof result.error).toBe('string')
      Storage.prototype.setItem = original
    })
  })
  ```
- **Implementation (green):** `src/lib/localPlan.js`:
  ```js
  const STORAGE_KEY = 'careercompass:guestPlan'

  export function saveGuestPlan(profile, activities) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ profile, activities, savedAt: new Date().toISOString() }))
      return { ok: true }
    } catch {
      return { ok: false, error: 'Could not save to this browser. Storage may be full or disabled.' }
    }
  }

  export function loadGuestPlan() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  export function clearGuestPlan() {
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
  }
  ```
- **Refactor:** None expected.
- **Acceptance criteria:** all four tests pass.
- **Review gate:** No gate.
- **Depends on:** None.

### Task 4: `src/lib/db.js` — Supabase plan/activity persistence

- **Description:** Read/write helpers against Phase 3's `plans`/`activities`
  tables for registered users.
- **Files touched:** `src/lib/db.js` (new), `src/lib/db.test.js` (new).
- **Tests first (red):**
  ```js
  import { describe, it, expect, vi, beforeEach } from 'vitest'

  const mockFrom = vi.fn()
  vi.mock('./supabaseClient', () => ({ supabase: { from: (...args) => mockFrom(...args) } }))
  import { getPlanWithActivities, createPlanWithActivities, updateActivityStatus, setPlanAccepted } from './db'

  beforeEach(() => { mockFrom.mockReset() })

  function chain(result) {
    const builder = {
      select: () => builder, eq: () => builder, order: () => builder,
      limit: () => builder, single: () => Promise.resolve(result), maybeSingle: () => Promise.resolve(result),
      insert: () => builder, update: () => builder,
    }
    return builder
  }

  describe('getPlanWithActivities', () => {
    it('returns null when the user has no plan', async () => {
      mockFrom.mockReturnValueOnce(chain({ data: null, error: null }))
      expect(await getPlanWithActivities('u1')).toBeNull()
    })

    it('returns the most recent plan with its activities ordered by sort_order', async () => {
      mockFrom
        .mockReturnValueOnce(chain({ data: { id: 'p1', user_id: 'u1' }, error: null }))
        .mockReturnValueOnce({ ...chain({}), then: (fn) => fn({ data: [{ id: 'a1', sort_order: 0 }], error: null }) })
      const result = await getPlanWithActivities('u1')
      expect(result.plan).toEqual({ id: 'p1', user_id: 'u1' })
      expect(result.activities).toEqual([{ id: 'a1', sort_order: 0 }])
    })
  })

  describe('createPlanWithActivities', () => {
    it('inserts a plans row then an activities row per activity, mapping period->period_label and periodYear->period_year', async () => {
      mockFrom
        .mockReturnValueOnce({ ...chain({}), then: (fn) => fn({ data: { id: 'p1' }, error: null }) })
        .mockReturnValueOnce({ ...chain({}), then: (fn) => fn({ data: [{ id: 'a1' }], error: null }) })
      const activities = [{ title: 'x', category: 'Technical skills', period: 'Year 1', periodYear: 2024, priority: 'High', explanation: 'why', status: 'Not started' }]
      const result = await createPlanWithActivities('u1', 'Data Analyst', activities)
      expect(result.plan).toEqual({ id: 'p1' })
      expect(result.activities).toEqual([{ id: 'a1' }])
    })

    it('throws when the plans insert errors', async () => {
      mockFrom.mockReturnValueOnce({ ...chain({}), then: (fn) => fn({ data: null, error: { message: 'boom' } }) })
      await expect(createPlanWithActivities('u1', 'Data Analyst', [])).rejects.toThrow('boom')
    })
  })

  describe('updateActivityStatus / setPlanAccepted', () => {
    it('updateActivityStatus resolves without throwing on success', async () => {
      mockFrom.mockReturnValueOnce({ ...chain({}), then: (fn) => fn({ error: null }) })
      await expect(updateActivityStatus('a1', 'Completed')).resolves.toBeUndefined()
    })
    it('setPlanAccepted resolves without throwing on success', async () => {
      mockFrom.mockReturnValueOnce({ ...chain({}), then: (fn) => fn({ error: null }) })
      await expect(setPlanAccepted('p1', true)).resolves.toBeUndefined()
    })
  })
  ```
  Note: exact chain-mocking shape above is illustrative — implement
  whatever thenable/builder mock is simplest to make Supabase's fluent API
  (`.from().select().eq()...`) resolve the given `{ data, error }`; keep the
  four described behaviours (returns null / returns plan+activities / throws
  on insert error / resolves on update) as the actual assertions that must
  hold. Run `npm test` and confirm failures against the not-yet-created
  module.
- **Implementation (green):** `src/lib/db.js`:
  ```js
  import { supabase } from './supabaseClient'

  export async function getPlanWithActivities(userId) {
    const { data: plan } = await supabase
      .from('plans').select('*').eq('user_id', userId)
      .order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (!plan) return null
    const { data: activities } = await supabase
      .from('activities').select('*').eq('plan_id', plan.id)
      .order('sort_order', { ascending: true })
    return { plan, activities: activities ?? [] }
  }

  export async function createPlanWithActivities(userId, targetOccupation, activities) {
    const { data: plan, error: planError } = await supabase
      .from('plans').insert({ user_id: userId, target_occupation: targetOccupation }).select().single()
    if (planError) throw new Error(planError.message)
    const rows = activities.map((a, i) => ({
      plan_id: plan.id,
      user_id: userId,
      title: a.title,
      category: a.category,
      period_label: a.period,
      period_year: a.periodYear,
      priority: a.priority,
      explanation: a.explanation,
      status: a.status,
      sort_order: i,
    }))
    const { data: inserted, error: activitiesError } = await supabase.from('activities').insert(rows).select()
    if (activitiesError) throw new Error(activitiesError.message)
    return { plan, activities: inserted }
  }

  export async function updateActivityStatus(activityId, status) {
    const { error } = await supabase.from('activities')
      .update({ status, updated_at: new Date().toISOString() }).eq('id', activityId)
    if (error) throw new Error(error.message)
  }

  export async function setPlanAccepted(planId, accepted) {
    const { error } = await supabase.from('plans')
      .update({ accepted, updated_at: new Date().toISOString() }).eq('id', planId)
    if (error) throw new Error(error.message)
  }
  ```
- **Refactor:** None expected.
- **Acceptance criteria:** the described behaviours (null when no plan,
  correct plan+activities shape, throws with the underlying error message on
  insert failure, resolves cleanly on update) all hold under test.
- **Review gate:** No gate — this queries Phase 3's already-RLS-protected
  tables through the existing authenticated `supabase` client; it introduces
  no new schema or permission rule.
- **Depends on:** None (Phase 3 must be applied to the real project before
  this code can work end-to-end, but the code itself doesn't depend on
  Phase 3's files).

### Task 5: `src/pages/Roadmap.jsx` — screen shell, generation/loading, open-book rendering

**Status: Done — human review accepted by user, 2026-09-12** (visually
verified via `vercel dev` against a real Gemini-generated plan: correct
Year-N grouping, grey/gold/blue colour-coding, single pin, goal card, stats
strip).

- **Description:** The new Screen 4+5 component: loads an existing
  registered-user plan or generates a new one (guest or registered), renders
  the open-book roadmap using Task 1's derived colours/pin plus the goal
  card, and the stats strip (diary section shows an empty state).
- **Files touched:** `src/pages/Roadmap.jsx` (new), `src/pages/Roadmap.test.jsx`
  (new).
- **Tests first (red):** Mock `useAuth` (signed-out and signed-in cases),
  `generateCareerPlan`, `getPlanWithActivities`, and `useLocation`'s
  `state.profile`, following the existing `Analysis.jsx`/`Plan.jsx` testing
  style (none of which currently have test files, so this establishes the
  pattern others can follow). Key cases in `src/pages/Roadmap.test.jsx`:
  - `'shows the loading state, then renders roadmap periods grouped by Year label, for a signed-out guest with a router-state profile'`
  - `'shows the existing error-banner copy and does not render a roadmap when generation fails'`
  - `'renders exactly one "you are here" pin, at the checkpoint computeRoadmap marks isPinned'`
  - `'renders the goal card with the text "Become a {targetOccupation}" at the end'`
  - `'renders the stats strip with counts matching computeStats for the loaded activities'`
  - `'shows "No diary entries yet" in the stats strip (diary is not wired up in this phase)'`
  - `'for a signed-in user with an existing Supabase plan, loads it via getPlanWithActivities instead of calling generateCareerPlan'`
  - `'for a signed-in user with no existing plan and a router-state profile, calls generateCareerPlan and does not call getPlanWithActivities a second time'`
  - `'renders a left-nav tab list with Diary, News, Jobs, and Profile entries'`
  - `'renders Diary as a link to /diary and News as a link to /updates'`
  - `'renders Profile as a link to /profile'`
  - `'renders Jobs as a non-interactive "Coming soon" label, not a link'`
  Each test asserts on rendered text/roles, not implementation details,
  following the existing `Plan.jsx`/`Analysis.jsx` component shape (loading
  → error → content). Run `npm test` and confirm these fail (component
  doesn't exist).
- **Implementation (green):** `Roadmap.jsx` structure:
  - On mount: if `useAuth().user` exists, call `getPlanWithActivities(user.id)`;
    if it returns a plan, use its `activities` (mapped from DB column names
    back to the `{ title, category, period: period_label, periodYear:
    period_year, priority, explanation, status }` shape `computeRoadmap`
    expects) — skip AI generation entirely. Otherwise (guest, or registered
    user with no saved plan), require `state?.profile` from `useLocation()`
    (redirect to `/profile` if absent, matching `Plan.jsx`'s existing
    pattern) and call `generateCareerPlan(profile)`, `JSON.parse` the result
    the same way `Plan.jsx` does today (try/catch → the existing "AI response
    could not be read" error copy).
  - Once activities are available: `const roadmap = computeRoadmap(activities, profile, new Date().getFullYear())`, `const stats = computeStats(roadmap)`.
  - Render: group `roadmap` by `period` in the order returned by
    `getExpectedPeriodLabels(profile)`; each checkpoint shows its colour
    (mapped to the light-mode hex values from the parent spec via a small
    `COLOURS` constant object keyed by `colour`), the pin icon on the single
    `isPinned` entry, and a goal card after the last period reading `Become
    a ${profile.targetOccupation}`.
  - Stats strip: completed/inProgress/upcoming/overdue counts, a
    per-category bar/list from `stats.byCategory`, and a "No diary entries
    yet" placeholder paragraph (Phase 5 replaces this).
  - Left-nav tab list: `<Link to="/diary">Diary</Link>`,
    `<Link to="/updates">News</Link>`, a plain `<span aria-disabled="true">Jobs
    (coming soon)</span>` (not a `Link`/`button`, so it's not reachable via
    keyboard tab order as an actionable control), and
    `<Link to="/profile">Profile</Link>`.
- **Refactor:** None expected.
- **Acceptance criteria:** all listed test cases pass.
- **Review gate:** **Human review:** cross-cutting flow change (gate
  condition 4) — this screen replaces two existing screens and is the
  primary surface students see after Analysis. Look at the rendered
  `Roadmap.jsx` (via `npm run dev`/`vercel dev`, or the test output) and
  confirm the open-book layout, colour-coding, and pin placement read as
  intended before Task 6 adds the interactive/gated controls on top of it.
- **Depends on:** Tasks 1, 2, 4 (and Phase 2's `useAuth`).

### Amendment (2026-09-12, after Task 6 review): Save persists a freshly-generated registered-user plan to Supabase

Discovered while presenting Task 6 for review: requirement 2.1.8 says "a
plan is generated and, once Saved, persisted to Supabase" for a registered
user with no existing plan — but Task 6 as written only wires Save for
guests (`localPlan.js`) and Accept for registered users (`setPlanAccepted`).
`createPlanWithActivities` (built in Task 4) was never called from anywhere,
so that half of 2.1.8 was actually unmet despite the coverage table listing
it under Tasks 4/5. Patched with the user's approval: `Roadmap.jsx`'s Save
button is now also shown to a signed-in user who has no persisted `plan`
yet (i.e. `user && !plan`), and calls `createPlanWithActivities(user.id,
profile.targetOccupation, activities)` instead of `saveGuestPlan`, storing
the returned `plan` and re-mapping the returned (now id-bearing) activities
into state so subsequent status-change/remove calls have real activity ids.
Save is hidden once a plan is already persisted (registered user with an
existing `plan`), since edits after that point persist immediately via
`updateActivityStatus`/`deleteActivity`. No schema change; `db.js` and
`localPlan.js` unchanged.

### Task 6: Checkpoint detail panel, Save, Accept, edit, and status-change

**Status: Done — human review accepted by user, 2026-09-12** (including the
Save-persists-a-fresh-registered-plan amendment above; visually verified the
guest path via `vercel dev`: locked status/Remove/Accept controls, real
localStorage save with correct on-device notice text; registered-user paths
covered by 10 passing tests since creating a real Supabase account isn't
something this assistant does).

- **Description:** Clicking any roadmap checkpoint opens a `CheckpointPanel`
  showing that activity's detail (title, category, priority, explanation,
  status). The panel itself is viewable by anyone (guests can look, per §2.1
  of the parent spec — only *editing/accepting/tracking* is gated), but the
  status-change control and a Remove action inside it are gated via
  `LockedAction`, active only for signed-in users. `CheckpointPanel` is built
  as its own component, deliberately, because Phase 5 extends this exact
  panel with the diary entry form and "Get AI feedback" button rather than
  introducing a second, competing panel. This task also wires the
  screen-level Save (guest → `localPlan.js`, with the accurate on-device
  notice) and Accept (registered-only, via `db.js`) actions.
- **Files touched:** `src/components/CheckpointPanel.jsx` (new),
  `src/components/CheckpointPanel.test.jsx` (new), `src/pages/Roadmap.jsx`,
  `src/pages/Roadmap.test.jsx`.
- **Tests first (red):** In `src/components/CheckpointPanel.test.jsx`
  (mocking `useAuth` as in Phase 2's `LockedAction.test.jsx`):
  - `'renders the activity's title, category, priority, and explanation'`
  - `'renders status as read-only text, plus a locked status control and a locked Remove control, for a signed-out guest'`
  - `'renders an interactive status <select> for a signed-in user, calling onStatusChange(newStatus) when changed'`
  - `'renders an active Remove button for a signed-in user, calling onRemove() when clicked'`
  - `'calls onClose when the panel's close control is clicked'`
  Additional cases in `src/pages/Roadmap.test.jsx`:
  - `'clicking a checkpoint opens CheckpointPanel showing that activity's title'`
  - `'closing the panel via its close control hides it'`
  - `'clicking Save as a guest calls saveGuestPlan and shows the on-device-only notice text (not "lost if you close the tab")'`
  - `'shows an inline error, not a silent no-op, when saveGuestPlan returns { ok: false, error }'`
  - `'renders Accept as a locked LockedAction, linking to /signup, for a signed-out guest'`
  - `'renders Accept as an active button for a signed-in user, calling setPlanAccepted(plan.id, true) when clicked'`
  - `'changing an activity's status inside the open panel, as a signed-in user, calls updateActivityStatus(activity.id, newStatus) and the checkpoint's rendered colour updates'`
  - `'removing an activity inside the open panel, as a signed-in user, removes it from the rendered roadmap'`
  Run `npm test` and confirm all fail (neither `CheckpointPanel` nor these
  behaviours exist yet).
- **Implementation (green):** `src/components/CheckpointPanel.jsx` renders
  the activity's fixed fields unconditionally, then:
  ```jsx
  <LockedAction onClick={null /* status change happens via the <select>'s onChange, not a click */}>
    {/* signed-in branch renders the real <select>; LockedAction's signed-out branch already renders a locked, non-functional stand-in */}
  </LockedAction>
  ```
  — in practice this means `CheckpointPanel` calls `useAuth()` directly
  (same as `LockedAction` does) to decide whether to render a live
  `<select value={activity.status} onChange={(e) => onStatusChange(e.target.value)}>`
  and a live `<button onClick={onRemove}>Remove</button>`, or `LockedAction`-
  wrapped locked equivalents for those two controls specifically — reusing
  `LockedAction` for the Remove button (its `children`/`onClick` shape fits
  directly) and a small locked-`<select>`-style stand-in (styled the same as
  `LockedAction`'s locked state) for the status control, since `LockedAction`
  itself is written for buttons/links, not `<select>`s. In `Roadmap.jsx`:
  track `const [openActivityId, setOpenActivityId] = useState(null)`, render
  `<CheckpointPanel activity={...} onClose={() => setOpenActivityId(null)} onStatusChange={...} onRemove={...} />`
  when `openActivityId` is set; wire `onStatusChange` to
  `updateActivityStatus(activity.id, newStatus)` + local state update,
  `onRemove` to a `db.js` delete (add `export async function
  deleteActivity(activityId) { const { error } = await
  supabase.from('activities').delete().eq('id', activityId); if (error) throw
  new Error(error.message) }` to `src/lib/db.js` as part of this task) plus
  removing it from local state. Add the screen-level `Save` button (as
  originally scoped) and wrap `Accept` in `LockedAction`, calling
  `setPlanAccepted(plan.id, true)` when unlocked.
- **Refactor:** None expected.
- **Acceptance criteria:** all listed cases pass; the guest save notice's
  copy never claims the plan is lost on tab close; the panel is viewable by
  guests but its status/remove controls are inert for them.
- **Review gate:** **Human review:** cross-cutting flow change touching the
  permission surface (gate condition 4, overlapping condition 3) — this is
  where "guests can view/save but not edit/accept/track" actually gets
  enforced end-to-end, and it's the panel Phase 5 builds diary logging into.
  Confirm every gated control is genuinely wrapped in `LockedAction` (or its
  locked-`<select>` equivalent), not just visually styled to look locked,
  before accepting.
- **Depends on:** Task 5, Phase 2's `LockedAction`, Task 3, Task 4.

### Task 7: Route Roadmap in, retire `Plan.jsx`/`Dashboard.jsx`

- **Description:** Point `/plan` at the new `Roadmap`, remove the
  `/dashboard` route and its nav link, delete the retired files.
- **Files touched:** `src/App.jsx`, delete `src/pages/Plan.jsx`, delete
  `src/pages/Dashboard.jsx`.
- **Tests first (red):** No dedicated test beyond confirming the full suite
  stays green after deletion (neither retired file has its own test file
  today, per §3 investigation — confirmed no `Plan.test.jsx`/
  `Dashboard.test.jsx` exist). Add one assertion to `src/App.test.jsx`
  (created in Phase 2 Task 5): `it('no longer renders a Dashboard nav link', () => { render(<MemoryRouter><App /></MemoryRouter>); expect(screen.queryByRole('link', { name: /^dashboard$/i })).not.toBeInTheDocument() })`.
- **Implementation (green):** In `src/App.jsx`, change
  `<Route path="/plan" element={<Plan />} />` to
  `<Route path="/plan" element={<Roadmap />} />`, remove the `/dashboard`
  route and its `<Link to="/dashboard">` nav entry, update the `import Plan`
  line to `import Roadmap from './pages/Roadmap'`, remove the `import
  Dashboard` line. Delete `src/pages/Plan.jsx` and `src/pages/Dashboard.jsx`.
- **Refactor:** None expected.
- **Acceptance criteria:** `/plan` renders `Roadmap`; no `/dashboard` route
  or nav link remains; `npm test` and `npm run lint` pass with the two files
  removed.
- **Review gate:** **Human review:** cross-cutting flow change (gate
  condition 4) — this is the point of no return for retiring the two old
  screens. Confirm Task 5/6's `Roadmap.jsx` is accepted first.
- **Depends on:** Tasks 5, 6.

## 6. Feature-level Definition of Done

- [ ] All seven tasks in §5 complete and their tests passing
- [ ] `npm test` passes for the full suite
- [ ] `npm run lint` passes
- [ ] Manually verified (`vercel dev`): guest golden path (Profile → Analysis
      → Roadmap generates, Year-N grouping, correct pin, Save shows the
      accurate on-device notice, Accept/edit/status all visibly locked);
      registered golden path (sign up, plan generation + Save persists to
      Supabase, Accept/edit/status all functional and reflected on reload);
      recently-completed student sees the collapsed "Before graduating"
      green card and real-calendar-year periods after it.
- [ ] Every requirement in §2 is covered — see §7
- [ ] Every gated task (5, 6, 7) has been shown to the user and explicitly
      accepted
- [ ] No item remains in §8

## 7. Requirements coverage check

| Requirement | Covered by |
| --- | --- |
| 2.1.1 | Tasks 1, 2, 5 |
| 2.1.2 | Task 1, 5 |
| 2.1.3 | Task 1, 5 |
| 2.1.4 | Task 5 |
| 2.1.5 | Task 6 |
| 2.1.6 | Task 6 |
| 2.1.7 | Tasks 4, 6 |
| 2.1.8 | Tasks 4, 5 |
| 2.1.9 | Tasks 1, 5 |
| 2.1.10 | Task 5 |

## 8. Risks / open questions

None. (Guest→account plan migration is explicitly out of scope for this
phase, per §2.3, not an open question — it's deferred, not unresolved.)
