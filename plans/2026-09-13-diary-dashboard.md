# Main Diary Dashboard (Screen 4)

- **Date:** 2026-09-13
- **Status:** Approved
- **Requirements confirmed by user:** yes — 2026-09-13

## 1. Summary

Redesigns `src/pages/Diary.jsx` (route `/diary`, currently a bare
chronological list of diary entries) into the "Main Diary Dashboard": an
open-book home screen, built with the existing `NotebookFrame` chrome, that
groups the student's existing plan (`plans`/`activities`, shared with
`Roadmap.jsx`) into six timing-based sections, lets the student mark
progress, edit, remove, or add activities inline, and log a
category-prompted reflection per activity — without changing `Roadmap.jsx`'s
existing behaviour, tests, or its Year-N/calendar period system. Full design
rationale lives in `specs/2026-09-13-diary-dashboard.md`.

## 2. Requirements

### 2.1 Functional requirements

1. A signed-in student's activities are grouped into six fixed-order
   sections — `Now`, `This semester`, `Next semester`, `Next break`,
   `Before final year`, `Graduate application period` — via the deterministic
   bucketing rule in §4; only non-empty sections render; a plan with zero
   activities shows one empty-state message instead of six empty headers.
2. Each activity renders as a card showing: checkbox (mark Completed),
   title, category, priority, a progress bar derived from status
   (Not started=0%, In progress=50%, Completed=100%), and its due date if
   set, else its bucket/period label.
3. Each card has Edit (opens a form for title/category/priority/explanation/
   due date) and Remove (asks for confirmation, then deletes) controls.
4. "Add a new item" creates a custom activity with title, category,
   priority, section (direct pick), and optional explanation/due date.
5. Each card has an expandable Reflection section: past entries (newest
   first), a category-specific contextual prompt, an add-entry form, and a
   "Get AI feedback" button per entry (on request only) — identical
   behaviour to `Roadmap.jsx`'s existing diary flow.
6. The left page shows the student's goal ("Become at {targetOccupation}"),
   a static "Hi, how are you today?" prompt, and up to two notifications
   derived only from the student's own data: nearest upcoming/overdue
   activity, and a completed/total progress-streak card.
7. A "View roadmap →" button on the right page navigates to `/plan`
   (unchanged `Roadmap.jsx`).
8. A signed-out visitor sees the existing locked "Create an account to keep
   a diary" prompt linking to `/signup`, not the plan/notification content.

### 2.2 Non-functional requirements

None beyond project defaults (Vitest, existing Tailwind/React conventions,
Supabase free tier).

### 2.3 Out of scope

- A Jobs tab/screen, "job alert" or event/workshop notifications (no data
  source exists).
- Unread-News-update notification count (no "last seen" tracking exists).
- A manual/editable numeric progress percentage field.
- Editing or deleting a diary entry once submitted.
- Any change to `Roadmap.jsx`'s existing colour/pin logic, its route, or
  its behaviour.
- Migration/visa/legal/financial/licensing advice, employment/migration
  guarantees (per CLAUDE.md).

### 2.4 Assumptions

None outstanding — all open questions were resolved in
`specs/2026-09-13-diary-dashboard.md` §6.

## 3. Existing code context

- `src/pages/Diary.jsx` — current bare implementation: guest branch renders
  a locked message; signed-in branch calls `getDiaryEntries(user.id)` on
  mount and lists entries in `<article>` elements. This task replaces the
  file's content entirely but the guest-lock behaviour must be preserved.
- `src/pages/Roadmap.jsx` — **not modified**. Exports nothing; is the model
  this plan reuses patterns from (its `TABS` array, `COLOURS`, save/accept
  flow, `CheckpointPanel` usage, `handleAddEntry`/`handleRequestFeedback`
  wiring at lines 220–232).
- `src/components/CheckpointPanel.jsx` — currently defines a local
  `DiarySection` function (lines 11–79) and the exported default
  `CheckpointPanel({ activity, onClose, onStatusChange, onRemove,
  diaryEntries, onAddEntry, onRequestFeedback })` (line 81). Task 6 extracts
  `DiarySection` into its own file; `CheckpointPanel`'s own behaviour and
  props must not change.
- `src/lib/roadmap.js` — exports `getExpectedPeriodLabels(profile)`,
  `periodYearFor(periodLabel, profile)`, `pickCurrentPeriod(profile,
  currentYear)`, `computeRoadmap(activities, profile, currentYear)` (returns
  each activity plus `colour` ∈ `completed|missed|current|upcoming` and
  `isPinned`), `computeStats(roadmap)`. This plan adds new exports; none of
  the existing ones change signature or behaviour.
- `src/lib/db.js` — existing pattern: every function does
  `supabase.from(table)...; if (error) throw new Error(error.message);
  return data ?? []` (reads) or resolves `undefined` (writes). Existing
  diary helpers: `getDiaryEntriesForActivity(activityId)`,
  `getDiaryEntries(userId, { limit })`, `createDiaryEntry(activityId,
  userId, entryText)`, `setDiaryEntryFeedback(entryId, feedback)`. Existing
  activity helpers: `getPlanWithActivities(userId)`,
  `createPlanWithActivities(userId, targetOccupation, activities)`,
  `updateActivityStatus(activityId, status)`, `deleteActivity(activityId)`.
- `src/lib/auth.jsx` — `useAuth()` returns `{ session, user, loading,
  signUp, signIn, signOut }`; `user` is `null` when signed out.
- `src/components/NotebookFrame.jsx` — default export
  `NotebookFrame({ leftPage, rightPage, stickyNotes = [] })` renders the
  book cover/spine/vertical tab-nav chrome and two page slots. Used as-is;
  `stickyNotes` omitted (mockup shows no margin notes on this screen). Also
  exports `FloatingField`, `StickyNote`, `SquiggleIcon`, icon components —
  `StickyNote` is reused for the "Goals" note.
- `src/components/LockedAction.jsx` — default export
  `LockedAction({ children, onClick, className, ...rest })`; renders a
  locked link to `/signup` when `useAuth().user` is null, else a real
  `<button onClick>`. Reused for Edit/Remove.
- `supabase/migrations/0003_create_activities.sql` — `activities` table;
  `category` check-constrained to 9 exact values, `priority` to
  `High|Medium|Low`, `status` to `Not started|In progress|Completed`;
  `period_label text not null`, `period_year integer` (nullable). No
  `due_date` column yet — added by Task 1.
- Test setup: Vitest, `npm test` runs `vitest run`. Component tests use
  `@testing-library/react` + `MemoryRouter`; `src/lib/db.js` tests mock
  `./supabaseClient`'s `supabase.from` via a `chain(result)` builder (see
  `src/lib/db.test.js` lines 13–21) — this plan's new `db.js` tests reuse
  that exact helper. `src/lib/ai.js`/`src/lib/roadmap.js` tests are plain
  Vitest, no mocking needed for pure functions.

## 4. Approach

Bucketing is a pure function layered on top of `computeRoadmap`'s existing,
already-tested `colour` output — it never re-derives status/colour itself,
only groups. Semester/break windows are computed from real `Date` objects
anchored to calendar years (not fixed month-number comparisons alone), so
December/January correctly span a year boundary. The six section names are
also accepted verbatim as an activity's `period_label` (for student-added
custom activities filed directly into a section), checked before the
date-based derivation, so custom activities never need a fabricated
`period_year`.

`DiarySection` (entries list + add-entry form + AI-feedback button) is
extracted from `CheckpointPanel.jsx` into its own file so this screen can
render it inline (not inside a modal) while `Roadmap.jsx`'s modal keeps
using it unchanged — avoiding duplicating that logic in two places.

Alternatives considered are in `specs/2026-09-13-diary-dashboard.md` §2
("Alternatives considered") and are not repeated here.

## 5. Task breakdown

### Task 1: Add `due_date` column to `activities`

- **Description:** Nullable due-date column so activities can carry a real
  calendar date, set via Add/Edit (never fabricated by AI generation).
- **Files touched:** new `supabase/migrations/0007_add_activities_due_date.sql`.
- **Tests first (red):** None — SQL migrations in this repo have no
  automated test; verified by manual application (see acceptance criteria).
- **Implementation (green):**
  ```sql
  alter table public.activities
    add column due_date date;
  ```
- **Refactor:** None expected.
- **Acceptance criteria:**
  - Migration file follows the existing numbering/style of
    `supabase/migrations/0001`–`0006`.
  - Applying it to a real Supabase project (`supabase db push` or the SQL
    editor) succeeds with no error, and existing rows keep `due_date` null.
- **Review gate: Human review** — schema change (gate condition 1). Show the
  user the migration file and confirm it applies cleanly to the real
  Supabase project before any code in later tasks depends on the column.
- **Depends on:** None.

### Task 2: `createActivity` / `updateActivity` in `src/lib/db.js`

- **Description:** CRUD helpers for student-added and edited activities,
  following the existing `db.js` pattern exactly.
- **Files touched:** `src/lib/db.js`, `src/lib/db.test.js`.
- **Tests first (red):** add to `src/lib/db.test.js` (reusing the existing
  `chain()` helper):
  ```js
  describe('createActivity / updateActivity', () => {
    it('createActivity inserts a Not-started activity row and returns it', async () => {
      mockFrom.mockReturnValueOnce(chain({ data: { id: 'a1', title: 'Talk to a mentor' }, error: null }))
      const result = await createActivity('p1', 'u1', {
        title: 'Talk to a mentor', category: 'Networking', priority: 'Medium',
        period: 'Next break', explanation: '', dueDate: null,
      })
      expect(result).toEqual({ id: 'a1', title: 'Talk to a mentor' })
    })

    it('createActivity throws with the underlying message on failure', async () => {
      mockFrom.mockReturnValueOnce(chain({ data: null, error: { message: 'boom' } }))
      await expect(createActivity('p1', 'u1', { title: 'x', category: 'Networking', priority: 'Low', period: 'Now' }))
        .rejects.toThrow('boom')
    })

    it('updateActivity resolves without throwing on success', async () => {
      mockFrom.mockReturnValueOnce(chain({ error: null }))
      await expect(updateActivity('a1', { title: 'New title', dueDate: '2026-10-01' })).resolves.toBeUndefined()
    })

    it('updateActivity throws with the underlying message on failure', async () => {
      mockFrom.mockReturnValueOnce(chain({ error: { message: 'boom' } }))
      await expect(updateActivity('a1', { title: 'x' })).rejects.toThrow('boom')
    })
  })
  ```
  Run `npm test` and confirm all fail (functions don't exist).
- **Implementation (green):** append to `src/lib/db.js`:
  ```js
  export async function createActivity(planId, userId, activity) {
    const { data, error } = await supabase.from('activities').insert({
      plan_id: planId,
      user_id: userId,
      title: activity.title,
      category: activity.category,
      period_label: activity.period,
      period_year: activity.periodYear ?? null,
      priority: activity.priority,
      explanation: activity.explanation ?? '',
      due_date: activity.dueDate ?? null,
      status: 'Not started',
    }).select().single()
    if (error) throw new Error(error.message)
    return data
  }

  export async function updateActivity(activityId, fields) {
    const row = { updated_at: new Date().toISOString() }
    if (fields.title !== undefined) row.title = fields.title
    if (fields.category !== undefined) row.category = fields.category
    if (fields.priority !== undefined) row.priority = fields.priority
    if (fields.explanation !== undefined) row.explanation = fields.explanation
    if (fields.dueDate !== undefined) row.due_date = fields.dueDate
    const { error } = await supabase.from('activities').update(row).eq('id', activityId)
    if (error) throw new Error(error.message)
  }
  ```
- **Refactor:** None expected.
- **Acceptance criteria:** all four new tests pass; existing `db.test.js`
  suite stays green.
- **Review gate:** No gate — reads/writes the existing, already-RLS-protected
  `activities` table via the existing authenticated client; no new
  permission rule.
- **Depends on:** Task 1 (the `due_date` column must exist for
  `updateActivity`'s `dueDate` write to succeed against a real project,
  though the mocked unit tests don't require it).

### Task 3: Section constants + `bucketActivities` in `src/lib/roadmap.js`

- **Description:** The deterministic bucketing function from
  `specs/2026-09-13-diary-dashboard.md` §2, plus the `SECTION_NAMES`
  constant used both by this function and by the Add/Edit-activity section
  picker.
- **Files touched:** `src/lib/roadmap.js`, `src/lib/roadmap.test.js`.
- **Tests first (red):** add to `src/lib/roadmap.test.js`:
  ```js
  import { SECTION_NAMES, bucketActivities } from './roadmap'

  describe('bucketActivities', () => {
    const profile = { studyStage: 'midway', graduationYear: '2027', courseLengthYears: '4' }

    it('returns an object with all six SECTION_NAMES keys, each an array', () => {
      const result = bucketActivities([], profile, new Date('2026-03-15'))
      expect(Object.keys(result)).toEqual(SECTION_NAMES)
      SECTION_NAMES.forEach((name) => expect(Array.isArray(result[name])).toBe(true))
    })

    it('buckets a current/overdue-colour activity into "Now"', () => {
      const roadmap = [
        { title: 'Overdue thing', colour: 'missed', period: 'Year 2', periodYear: 2025, dueDate: null },
        { title: 'Pinned thing', colour: 'current', period: 'Year 3', periodYear: 2026, dueDate: null },
      ]
      const result = bucketActivities(roadmap, profile, new Date('2026-03-15'))
      expect(result.Now.map((a) => a.title)).toEqual(['Overdue thing', 'Pinned thing'])
    })

    it('passes a student-added activity straight through when period already matches a section name', () => {
      const roadmap = [{ title: 'My own task', colour: 'upcoming', period: 'Next break', periodYear: null, dueDate: null }]
      const result = bucketActivities(roadmap, profile, new Date('2026-03-15'))
      expect(result['Next break'].map((a) => a.title)).toEqual(['My own task'])
    })

    it('buckets an undated upcoming activity by periodYear relative to currentYear', () => {
      const roadmap = [
        { title: 'This year', colour: 'upcoming', period: 'Year 3', periodYear: 2026, dueDate: null },
        { title: 'Next year', colour: 'upcoming', period: 'Year 4', periodYear: 2027, dueDate: null },
        { title: 'Before final year', colour: 'upcoming', period: 'Year 2', periodYear: 2025, dueDate: null },
      ]
      const result = bucketActivities(roadmap, profile, new Date('2026-03-15'))
      expect(result['This semester'].map((a) => a.title)).toContain('This year')
      expect(result['Next semester'].map((a) => a.title)).toContain('Next year')
    })

    it('buckets an undated upcoming activity at or after graduationYear into "Graduate application period"', () => {
      const roadmap = [{ title: 'Grad task', colour: 'upcoming', period: 'Year 4', periodYear: 2029, dueDate: null }]
      const result = bucketActivities(roadmap, profile, new Date('2026-03-15'))
      expect(result['Graduate application period'].map((a) => a.title)).toContain('Grad task')
    })

    it('buckets a dated activity by which semester/break window its due date falls in (today in Sem1)', () => {
      const roadmap = [
        { title: 'Due this semester', colour: 'upcoming', period: 'Year 3', periodYear: 2026, dueDate: '2026-05-10' },
        { title: 'Due next semester', colour: 'upcoming', period: 'Year 3', periodYear: 2026, dueDate: '2026-09-01' },
        { title: 'Due next break', colour: 'upcoming', period: 'Year 3', periodYear: 2026, dueDate: '2026-12-20' },
      ]
      const result = bucketActivities(roadmap, profile, new Date('2026-03-15'))
      expect(result['This semester'].map((a) => a.title)).toContain('Due this semester')
      expect(result['Next semester'].map((a) => a.title)).toContain('Due next semester')
      expect(result['Next break'].map((a) => a.title)).toContain('Due next break')
    })

    it('when today falls inside a break window, treats the upcoming semester as "This semester"', () => {
      const roadmap = [{ title: 'Due in Feb', colour: 'upcoming', period: 'Year 3', periodYear: 2027, dueDate: '2027-02-10' }]
      const result = bucketActivities(roadmap, profile, new Date('2026-12-15'))
      expect(result['This semester'].map((a) => a.title)).toContain('Due in Feb')
    })

    it('excludes a "Before graduating" summary activity from every section', () => {
      const roadmap = [{ title: 'Everything before graduating', colour: 'completed', period: 'Before graduating', periodYear: null, dueDate: null }]
      const result = bucketActivities(roadmap, profile, new Date('2026-03-15'))
      SECTION_NAMES.forEach((name) => expect(result[name].map((a) => a.title)).not.toContain('Everything before graduating'))
    })
  })
  ```
  Run `npm test` and confirm all fail.
- **Implementation (green):** append to `src/lib/roadmap.js`:
  ```js
  export const SECTION_NAMES = [
    'Now', 'This semester', 'Next semester', 'Next break',
    'Before final year', 'Graduate application period',
  ]

  function semesterWindowFor(date) {
    const y = date.getFullYear()
    const m = date.getMonth() + 1
    if (m >= 2 && m <= 6) return { key: 'sem1', year: y, start: new Date(y, 1, 1), end: new Date(y, 5, 30) }
    if (m >= 7 && m <= 11) return { key: 'sem2', year: y, start: new Date(y, 6, 1), end: new Date(y, 10, 30) }
    const breakYear = m === 1 ? y - 1 : y
    return { key: 'break', year: breakYear, start: new Date(breakYear, 11, 1), end: new Date(breakYear + 1, 0, 31) }
  }

  function nextSemesterWindow(w) {
    if (w.key === 'sem1') return { key: 'sem2', year: w.year, start: new Date(w.year, 6, 1), end: new Date(w.year, 10, 30) }
    if (w.key === 'sem2') return { key: 'break', year: w.year, start: new Date(w.year, 11, 1), end: new Date(w.year + 1, 0, 31) }
    return { key: 'sem1', year: w.year + 1, start: new Date(w.year + 1, 1, 1), end: new Date(w.year + 1, 5, 30) }
  }

  function upcomingWindows(today) {
    let w = semesterWindowFor(today)
    if (w.key === 'break') w = nextSemesterWindow(w)
    const thisSemester = w
    const second = nextSemesterWindow(w)
    return second.key === 'break'
      ? { thisSemester, nextSemester: nextSemesterWindow(second), nextBreak: second }
      : { thisSemester: w, nextSemester: second, nextBreak: nextSemesterWindow(second) }
  }

  function bucketByDate(dueDate, today) {
    const { thisSemester, nextSemester, nextBreak } = upcomingWindows(today)
    const d = new Date(dueDate)
    if (d >= thisSemester.start && d <= thisSemester.end) return 'This semester'
    if (d >= nextSemester.start && d <= nextSemester.end) return 'Next semester'
    if (d >= nextBreak.start && d <= nextBreak.end) return 'Next break'
    return null // caller falls back to the undated rule using dueDate's year
  }

  export function bucketActivities(roadmap, profile, today = new Date()) {
    const currentYear = today.getFullYear()
    const graduationYear = Number(profile.graduationYear)
    const buckets = Object.fromEntries(SECTION_NAMES.map((name) => [name, []]))

    roadmap.forEach((activity) => {
      if (activity.period === 'Before graduating') return
      if (activity.colour === 'current' || activity.colour === 'missed') {
        buckets.Now.push(activity)
        return
      }
      if (SECTION_NAMES.includes(activity.period)) {
        buckets[activity.period].push(activity)
        return
      }
      if (activity.dueDate) {
        const byDate = bucketByDate(activity.dueDate, today)
        if (byDate) {
          buckets[byDate].push(activity)
          return
        }
        const dueYear = new Date(activity.dueDate).getFullYear()
        buckets[dueYear < graduationYear ? 'Before final year' : 'Graduate application period'].push(activity)
        return
      }
      const y = activity.periodYear
      if (y === currentYear) buckets['This semester'].push(activity)
      else if (y === currentYear + 1) buckets['Next semester'].push(activity)
      else if (y !== null && y < graduationYear) buckets['Before final year'].push(activity)
      else buckets['Graduate application period'].push(activity)
    })

    return buckets
  }
  ```
- **Refactor:** None expected.
- **Acceptance criteria:** all new tests pass; existing `roadmap.test.js`
  suite (unchanged) stays green.
- **Review gate:** No gate — additive pure function, no schema/auth change,
  doesn't alter `computeRoadmap`/`computeStats`.
- **Depends on:** None.

### Task 4: `src/lib/notifications.js`

- **Description:** Two pure functions deriving the left-page notifications
  from already-loaded data — no new queries.
- **Files touched:** new `src/lib/notifications.js`, new
  `src/lib/notifications.test.js`.
- **Tests first (red):**
  ```js
  import { describe, it, expect } from 'vitest'
  import { getNearestActivityNotification, getStreakNotification } from './notifications'

  describe('getNearestActivityNotification', () => {
    it('returns null when there are no upcoming/overdue/current activities', () => {
      expect(getNearestActivityNotification([])).toBeNull()
    })
    it('prefers an overdue ("missed") activity over an upcoming one', () => {
      const roadmap = [
        { title: 'Upcoming task', colour: 'upcoming', dueDate: null, period: 'Year 3' },
        { title: 'Overdue task', colour: 'missed', dueDate: null, period: 'Year 2' },
      ]
      expect(getNearestActivityNotification(roadmap).title).toBe('Overdue task')
    })
    it('falls back to the pinned "current" activity when nothing is overdue', () => {
      const roadmap = [{ title: 'Pinned task', colour: 'current', dueDate: '2026-05-01', period: 'Year 3' }]
      expect(getNearestActivityNotification(roadmap)).toEqual({ title: 'Pinned task', dueDate: '2026-05-01', period: 'Year 3' })
    })
  })

  describe('getStreakNotification', () => {
    it('returns null when there are zero total activities', () => {
      expect(getStreakNotification({ completed: 0, inProgress: 0, upcoming: 0, overdue: 0, byCategory: {} })).toBeNull()
    })
    it('returns the completed/total percentage rounded to the nearest integer', () => {
      const stats = { completed: 2, inProgress: 1, upcoming: 3, overdue: 1, byCategory: {} }
      // total = completed(2) + inProgress(1) + upcoming(3) + overdue(1) = 7; 2/7 = 28.57%
      expect(getStreakNotification(stats)).toEqual({ percent: 29, completed: 2, total: 7 })
    })
  })
  ```
  Run `npm test` and confirm all fail.
- **Implementation (green):**
  ```js
  export function getNearestActivityNotification(roadmap) {
    const overdue = roadmap.find((a) => a.colour === 'missed')
    const current = roadmap.find((a) => a.colour === 'current')
    const activity = overdue ?? current
    if (!activity) return null
    return { title: activity.title, dueDate: activity.dueDate ?? null, period: activity.period }
  }

  export function getStreakNotification(stats) {
    const total = stats.completed + stats.inProgress + stats.upcoming + stats.overdue
    if (total === 0) return null
    return { percent: Math.round((stats.completed / total) * 100), completed: stats.completed, total }
  }
  ```
- **Refactor:** None expected.
- **Acceptance criteria:** all tests pass.
- **Review gate:** No gate — pure functions over already-loaded data, no new
  data source, no sourcing-rule surface (no job-market/migration claim).
- **Depends on:** None (consumes `computeRoadmap`/`computeStats` output,
  already stable).

### Task 5: `src/lib/reflectionPrompts.js`

- **Description:** Category → contextual reflection prompt lookup.
- **Files touched:** new `src/lib/reflectionPrompts.js`, new
  `src/lib/reflectionPrompts.test.js`.
- **Tests first (red):**
  ```js
  import { describe, it, expect } from 'vitest'
  import { getReflectionPrompt } from './reflectionPrompts'

  describe('getReflectionPrompt', () => {
    it('returns the Work-experience-specific prompt', () => {
      expect(getReflectionPrompt('Work experience')).toBe('What did you experience? What did you learn?')
    })
    it('returns the Networking-specific prompt', () => {
      expect(getReflectionPrompt('Networking')).toBe('Who did you meet? What insights did you gain?')
    })
    it('returns the shared skills-learning prompt for Technical skills and Certifications', () => {
      expect(getReflectionPrompt('Technical skills')).toBe('What did you learn? How will you apply it?')
      expect(getReflectionPrompt('Certifications')).toBe('What did you learn? How will you apply it?')
    })
    it('returns the generic fallback prompt for any other category', () => {
      expect(getReflectionPrompt('Networking-adjacent-typo')).toBe("How did it go? What's your next step?")
      expect(getReflectionPrompt('Application preparation')).toBe("How did it go? What's your next step?")
    })
  })
  ```
  Run `npm test` and confirm all fail.
- **Implementation (green):**
  ```js
  const PROMPTS = {
    'Work experience': 'What did you experience? What did you learn?',
    'Networking': 'Who did you meet? What insights did you gain?',
    'Technical skills': 'What did you learn? How will you apply it?',
    'Certifications': 'What did you learn? How will you apply it?',
  }
  const FALLBACK_PROMPT = "How did it go? What's your next step?"

  export function getReflectionPrompt(category) {
    return PROMPTS[category] ?? FALLBACK_PROMPT
  }
  ```
- **Refactor:** None expected.
- **Acceptance criteria:** all tests pass.
- **Review gate:** No gate — static UI copy, not a sourced claim.
- **Depends on:** None.

### Task 6: Extract `DiarySection` into `src/components/DiarySection.jsx`

- **Description:** Move the existing `DiarySection` function out of
  `CheckpointPanel.jsx` into its own reusable component (adding an optional
  `prompt` prop for the contextual question), so both the Roadmap modal and
  the new inline dashboard can render it without duplicating the logic.
- **Files touched:** new `src/components/DiarySection.jsx`, new
  `src/components/DiarySection.test.jsx`, `src/components/CheckpointPanel.jsx`
  (delete the local `DiarySection` function, lines 11–79, and import the new
  one instead).
- **Tests first (red):** new `src/components/DiarySection.test.jsx` —
  move the diary-specific cases out of `CheckpointPanel.test.jsx` verbatim
  (the "renders the passed-in diaryEntries...", "submitting the diary entry
  form...", "clicking Get AI feedback...", "renders existing ai_feedback...",
  "renders a Feedback heading...", "shows a loading indicator..." cases,
  lines 91–158 of the current `CheckpointPanel.test.jsx`), rendering
  `<DiarySection diaryEntries={...} onAddEntry={...} onRequestFeedback={...} />`
  directly (no `useAuth` mock needed — this component doesn't call
  `useAuth`, `CheckpointPanel` already gates it). Add one new case:
  ```js
  it('renders the given prompt text as the textarea label when provided', () => {
    render(<DiarySection diaryEntries={[]} onAddEntry={vi.fn()} onRequestFeedback={vi.fn()} prompt="What did you experience? What did you learn?" />)
    expect(screen.getByText('What did you experience? What did you learn?')).toBeInTheDocument()
  })
  ```
  Run `npm test` and confirm the new file's tests fail (component doesn't
  exist yet); leave `CheckpointPanel.test.jsx`'s corresponding cases in place
  for now (they'll still pass against the old local definition) — no red
  state needed there since this is an extraction, not new behaviour.
- **Implementation (green):** create `src/components/DiarySection.jsx`
  exporting the existing `DiarySection` function as the default export,
  unchanged except: add a `prompt` prop rendered above the textarea (falls
  back to the current unlabelled behaviour when `prompt` is omitted, so
  `CheckpointPanel`'s usage is visually unchanged). Update
  `CheckpointPanel.jsx`: delete its local `DiarySection` definition, add
  `import DiarySection from './DiarySection'`, keep its existing
  `<DiarySection diaryEntries={diaryEntries} onAddEntry={onAddEntry}
  onRequestFeedback={onRequestFeedback} />` call unchanged (no `prompt`
  passed, preserving current behaviour exactly).
- **Refactor:** Delete the now-redundant diary-specific cases from
  `CheckpointPanel.test.jsx` (lines 91–158) since they're moved to
  `DiarySection.test.jsx`; keep `CheckpointPanel.test.jsx`'s
  activity-header/status/remove/close cases as-is.
- **Acceptance criteria:**
  - `DiarySection.test.jsx` passes in full.
  - `CheckpointPanel.test.jsx` passes in full, unchanged behaviour.
  - `Roadmap.test.jsx` passes unchanged (verifies no regression in the
    modal's diary flow).
- **Review gate:** No gate — pure extraction with no behaviour change,
  verified by the existing `CheckpointPanel.test.jsx`/`Roadmap.test.jsx`
  suites passing unchanged; not a cross-cutting *behaviour* change.
- **Depends on:** None.

### Task 7: `Diary.jsx` — data loading, guest lock, section shell, empty state

- **Description:** Replace `Diary.jsx`'s content with the `NotebookFrame`
  scaffold: load the signed-in student's plan/activities/profile, compute
  `roadmap`/`stats`/`buckets`, render only non-empty sections in
  `SECTION_NAMES` order inside `rightPage`, and the zero-activities
  empty state. Left-page content and per-card interactivity are later tasks
  (Tasks 8–11) — this task renders section headers and each activity's
  title only, as the structural foundation.
- **Files touched:** `src/pages/Diary.jsx` (full rewrite), new
  `src/pages/Diary.test.jsx` (full rewrite, replacing the current file).
- **Tests first (red):** in the new `src/pages/Diary.test.jsx` (mock
  `useAuth`, and `../lib/db`'s `getPlanWithActivities`):
  ```js
  it('shows the locked "Create an account to keep a diary" prompt linking to /signup for a signed-out guest', () => {
    mockUseAuth.mockReturnValue({ user: null })
    render(<MemoryRouter><Diary /></MemoryRouter>)
    expect(screen.getByText(/create an account to keep a diary/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute('href', '/signup')
  })

  it('shows one empty-state message instead of six empty sections when the plan has zero activities', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } })
    mockGetPlanWithActivities.mockResolvedValue({ plan: { id: 'p1', target_occupation: 'Data Analyst' }, activities: [] })
    render(<MemoryRouter><Diary /></MemoryRouter>)
    await waitFor(() => expect(screen.getByText(/no activities yet/i)).toBeInTheDocument())
    expect(screen.queryByText('Now')).not.toBeInTheDocument()
  })

  it('renders only non-empty sections, in SECTION_NAMES order', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } })
    mockGetPlanWithActivities.mockResolvedValue({
      plan: { id: 'p1', target_occupation: 'Data Analyst' },
      activities: [
        { id: 'a1', title: 'Overdue item', category: 'Networking', period_label: 'Year 1', period_year: 2020, priority: 'High', explanation: 'x', status: 'Not started', due_date: null },
        { id: 'a3', title: 'Current item', category: 'Networking', period_label: 'Year 2', period_year: 2026, priority: 'Medium', explanation: 'x', status: 'Not started', due_date: null },
        { id: 'a2', title: 'Grad item', category: 'Application preparation', period_label: 'Year 4', period_year: 2030, priority: 'Medium', explanation: 'x', status: 'Not started', due_date: null },
      ],
    })
    render(<MemoryRouter><Diary /></MemoryRouter>)
    await waitFor(() => expect(screen.getAllByText('Overdue item').length).toBeGreaterThan(0))
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(headings).toEqual(['Now', 'Graduate application period'])
  })
  ```
  (Fixture note from plan review: `computeRoadmap` always pins exactly one
  non-completed, non-past activity as `current`; with only an overdue and a
  distant-future activity, the distant one would itself become the sole
  `current` candidate and land in "Now" instead of "Graduate application
  period". The added `Current item` (periodYear === currentYear) absorbs the
  pin so "Grad item" is genuinely `upcoming`.)
  Run `npm test` and confirm all fail.
- **Implementation (green):** `Diary.jsx` mirrors `Roadmap.jsx`'s loading
  pattern: on mount (if `user`), call `getPlanWithActivities(user.id)`, and
  derive `profile` the same way `Roadmap.jsx` does — `{ targetOccupation:
  existing.plan.target_occupation }` (no `getProfile` call: its snake_case
  columns don't match the camelCase fields `bucketActivities` and the goal
  note expect, and adding a mapper is out of scope for this pass — see the
  ruling in this plan's execution review). Map DB rows the same way
  `Roadmap.jsx`'s `mapDbActivity` does (extended with `dueDate: row.due_date`), then
  `computeRoadmap(activities, profile, currentYear)` →
  `bucketActivities(roadmap, profile, new Date())`. Render via
  `<NotebookFrame leftPage={...} rightPage={...} />`; `rightPage` maps
  `SECTION_NAMES.filter((name) => buckets[name].length > 0)` to `<section>`
  blocks with an `<h2>{name}</h2>` and each activity's title (card detail
  comes in Task 9). If `activities.length === 0`, render the empty-state
  message + "Add a new item" button (button wired in Task 10) instead of
  the section loop. Guest branch (`!user`) keeps the existing locked message
  unchanged.
- **Refactor:** None expected.
- **Acceptance criteria:** all three new tests pass.
- **Review gate:** No gate — new screen content, additive, no schema/auth
  change (reuses Task 1–3's already-covered pieces).
- **Depends on:** Task 3 (`bucketActivities`).

### Task 8: `Diary.jsx` — left page (goal, prompt, notifications)

- **Description:** Fill in `leftPage` with the "Goals" sticky note, the
  static greeting, and up to two notification bars from Task 4's functions.
- **Files touched:** `src/pages/Diary.jsx`, `src/pages/Diary.test.jsx`.
- **Tests first (red):** add to `Diary.test.jsx`:
  ```js
  it("shows the student's goal and the static greeting on the left page", async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } })
    mockGetPlanWithActivities.mockResolvedValue({ plan: { id: 'p1', target_occupation: 'Data Analyst' }, activities: [] })
    render(<MemoryRouter><Diary /></MemoryRouter>)
    await waitFor(() => expect(screen.getByText(/become a data analyst/i)).toBeInTheDocument())
    expect(screen.getByText('Hi, how are you today?')).toBeInTheDocument()
  })

  it('shows a nearest-activity notification when one exists', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } })
    mockGetPlanWithActivities.mockResolvedValue({
      plan: { id: 'p1', target_occupation: 'Data Analyst' },
      activities: [{ id: 'a1', title: 'Overdue item', category: 'Networking', period_label: 'Year 1', period_year: 2020, priority: 'High', explanation: 'x', status: 'Not started', due_date: null }],
    })
    render(<MemoryRouter><Diary /></MemoryRouter>)
    await waitFor(() => expect(screen.getAllByText('Overdue item').length).toBeGreaterThan(0))
  })
  ```
  (Both this and Task 7's "renders only non-empty sections" test switched
  from `getByText` to `getAllByText`/length-check during execution: once
  this task's notification bar ships, an activity's title can legitimately
  appear twice — once in its notification, once in its section card.)
  Run `npm test` and confirm both fail.
- **Implementation (green):** `leftPage` renders a `<StickyNote>` (from
  `NotebookFrame`) with `Become a {profile.targetOccupation}`, an `<h2>Hi,
  how are you today?</h2>` static prompt, and — using
  `getNearestActivityNotification(roadmap)` / `getStreakNotification(stats)`
  — up to two notification bars, each rendered only if its function returns
  non-null.
- **Refactor:** None expected.
- **Acceptance criteria:** both tests pass.
- **Review gate:** No gate — additive, read-only, reuses Task 4's already
  gate-checked functions.
- **Depends on:** Task 4, Task 7.

### Task 9: `Diary.jsx` — activity card (progress bar, due date, checkbox)

- **Description:** Expand each section's plain title into the full card:
  checkbox (calls `updateActivityStatus`), progress bar, category/priority,
  and due date (or bucket/period label fallback).
- **Files touched:** `src/pages/Diary.jsx`, `src/pages/Diary.test.jsx`.
- **Tests first (red):** add to `Diary.test.jsx` (mock `../lib/db`'s
  `updateActivityStatus`):
  ```js
  it('checking an item\'s checkbox calls updateActivityStatus(activity.id, "Completed")', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } })
    mockGetPlanWithActivities.mockResolvedValue({
      plan: { id: 'p1', target_occupation: 'Data Analyst' },
      activities: [{ id: 'a1', title: 'Overdue item', category: 'Networking', period_label: 'Year 1', period_year: 2020, priority: 'High', explanation: 'x', status: 'Not started', due_date: null }],
    })
    render(<MemoryRouter><Diary /></MemoryRouter>)
    await waitFor(() => screen.getByText('Overdue item'))
    fireEvent.click(screen.getByRole('checkbox', { name: /overdue item/i }))
    expect(mockUpdateActivityStatus).toHaveBeenCalledWith('a1', 'Completed')
  })

  it("shows an item's due date when set, else its section label", async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } })
    mockGetPlanWithActivities.mockResolvedValue({
      plan: { id: 'p1', target_occupation: 'Data Analyst' },
      activities: [
        { id: 'a1', title: 'Dated item', category: 'Networking', period_label: 'Year 3', period_year: 2026, priority: 'High', explanation: 'x', status: 'Not started', due_date: '2026-05-10' },
        { id: 'a2', title: 'Undated item', category: 'Networking', period_label: 'Year 1', period_year: 2020, priority: 'High', explanation: 'x', status: 'Not started', due_date: null },
      ],
    })
    render(<MemoryRouter><Diary /></MemoryRouter>)
    await waitFor(() => screen.getByText('Dated item'))
    expect(screen.getByText(/10 may 2026|may 10, 2026/i)).toBeInTheDocument()
    expect(screen.getByText('Now')).toBeInTheDocument() // Undated item's section label, since it's overdue
  })
  ```
  Run `npm test` and confirm both fail.
- **Implementation (green):** each card renders `<input type="checkbox"
  aria-label={activity.title} checked={activity.status === 'Completed'}
  onChange={() => handleToggleComplete(activity)} />` where
  `handleToggleComplete` calls `updateActivityStatus(activity.id,
  activity.status === 'Completed' ? 'Not started' : 'Completed')` then
  updates local state; a progress bar `<div>` whose width is
  `{'Not started': 0, 'In progress': 50, 'Completed': 100}[activity.status]`;
  category/priority text; due date formatted via
  `new Date(activity.dueDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })`
  when set, else the section name it's grouped under.
- **Refactor:** None expected.
- **Acceptance criteria:** both tests pass.
- **Review gate:** No gate — additive UI + reuse of the existing, already
  gate-checked `updateActivityStatus`.
- **Depends on:** Task 7.

### Task 10: `Diary.jsx` — Edit, Remove, Add my own activity

- **Description:** Wire the three remaining primary actions using Task 2's
  `createActivity`/`updateActivity` and the existing `deleteActivity`.
- **Files touched:** `src/pages/Diary.jsx`, `src/pages/Diary.test.jsx`.
- **Tests first (red):** add to `Diary.test.jsx` (mock `../lib/db`'s
  `createActivity`, `updateActivity`, `deleteActivity`):
  ```js
  it('submitting the Edit form calls updateActivity(activity.id, fields) and the card reflects the change', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } })
    mockGetPlanWithActivities.mockResolvedValue({
      plan: { id: 'p1', target_occupation: 'Data Analyst' },
      activities: [{ id: 'a1', title: 'Overdue item', category: 'Networking', period_label: 'Year 1', period_year: 2020, priority: 'High', explanation: 'x', status: 'Not started', due_date: null }],
    })
    render(<MemoryRouter><Diary /></MemoryRouter>)
    await waitFor(() => screen.getAllByText('Overdue item'))
    fireEvent.click(screen.getByRole('button', { name: /^edit$/i }))
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'New title' } })
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }))
    expect(mockUpdateActivity).toHaveBeenCalledWith('a1', expect.objectContaining({ title: 'New title' }))
    // Uses getAllByText/length-check, not getByText: same legitimate
    // duplication as Task 8 — the updated title shows in both the
    // notification bar and its section card.
    await waitFor(() => expect(screen.getAllByText('New title').length).toBeGreaterThan(0))
  })

  it('clicking Remove then confirming calls deleteActivity(activity.id) and the card disappears', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } })
    mockGetPlanWithActivities.mockResolvedValue({
      plan: { id: 'p1', target_occupation: 'Data Analyst' },
      activities: [{ id: 'a1', title: 'Overdue item', category: 'Networking', period_label: 'Year 1', period_year: 2020, priority: 'High', explanation: 'x', status: 'Not started', due_date: null }],
    })
    render(<MemoryRouter><Diary /></MemoryRouter>)
    await waitFor(() => screen.getAllByText('Overdue item'))
    fireEvent.click(screen.getByRole('button', { name: /^remove$/i }))
    fireEvent.click(screen.getByRole('button', { name: /^yes$/i }))
    await waitFor(() => expect(mockDeleteActivity).toHaveBeenCalledWith('a1'))
    expect(screen.queryByText('Overdue item')).not.toBeInTheDocument()
  })

  it('clicking Remove without confirming does not call deleteActivity', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } })
    mockGetPlanWithActivities.mockResolvedValue({
      plan: { id: 'p1', target_occupation: 'Data Analyst' },
      activities: [{ id: 'a1', title: 'Overdue item', category: 'Networking', period_label: 'Year 1', period_year: 2020, priority: 'High', explanation: 'x', status: 'Not started', due_date: null }],
    })
    render(<MemoryRouter><Diary /></MemoryRouter>)
    await waitFor(() => screen.getAllByText('Overdue item'))
    fireEvent.click(screen.getByRole('button', { name: /^remove$/i }))
    expect(mockDeleteActivity).not.toHaveBeenCalled()
    expect(screen.getAllByText('Overdue item').length).toBeGreaterThan(0)
  })

  it('submitting "Add a new item" calls createActivity(plan.id, user.id, fields) with the chosen section as period, and the new item appears under that section', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } })
    mockGetPlanWithActivities.mockResolvedValue({ plan: { id: 'p1', target_occupation: 'Data Analyst' }, activities: [] })
    mockCreateActivity.mockResolvedValue({
      id: 'a9', title: 'Talk to a mentor', category: 'Networking', period_label: 'Next break',
      period_year: null, priority: 'Medium', explanation: '', status: 'Not started', due_date: null,
    })
    render(<MemoryRouter><Diary /></MemoryRouter>)
    await waitFor(() => expect(screen.getByText(/no activities yet/i)).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /add a new item/i }))
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Talk to a mentor' } })
    fireEvent.change(screen.getByLabelText(/category/i), { target: { value: 'Networking' } })
    fireEvent.change(screen.getByLabelText(/priority/i), { target: { value: 'Medium' } })
    fireEvent.change(screen.getByLabelText(/section/i), { target: { value: 'Next break' } })
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }))
    expect(mockCreateActivity).toHaveBeenCalledWith('p1', 'u1', expect.objectContaining({ title: 'Talk to a mentor', period: 'Next break' }))
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Next break' })).toBeInTheDocument())
    expect(screen.getByText('Talk to a mentor')).toBeInTheDocument()
  })
  ```
  Run `npm test` and confirm all fail.
- **Implementation (green):** extracted a local `ActivityCard` component
  (own `editing`/`confirmingRemove` state, since a `useState` per card can't
  live in the `.map()` callback directly) and a local `AddActivityForm`
  component, both defined in `Diary.jsx`.
  - Edit: a per-card "Edit" `<button>` toggles a form (`<input
    aria-label="Title">`, category `<select aria-label="Category">`,
    priority `<select aria-label="Priority">`, `<textarea
    aria-label="Explanation">`, `<input type="date" aria-label="Due date">`)
    pre-filled from the activity; "Save" submits, calling
    `updateActivity(activity.id, { title, category, priority, explanation,
    dueDate })` then merging those same submitted fields into local state
    (`updateActivity` itself resolves `undefined`, so there's no server
    value to merge back — the submitted fields are the new local truth,
    same pattern `Roadmap.jsx`'s `handleStatusChange` already uses for
    `updateActivityStatus`); "Cancel" discards the edit.
  - Remove: a per-card "Remove" `<button>` shows an inline "Remove this
    item? Yes/Cancel" confirmation; "Yes" calls `deleteActivity(activity.id)`
    then removes it from local state; "Cancel" dismisses the confirmation
    without calling `deleteActivity`.
  - Add: a bottom "Add a new item" `<button>` (rendered in both the
    populated and empty-state right-page branches) toggles `AddActivityForm`
    (`<input aria-label="Title">`, category `<select aria-label="Category">`
    from the 9 known category values, priority `<select
    aria-label="Priority">`, section `<select aria-label="Section">` from
    `SECTION_NAMES`, optional `<textarea aria-label="Explanation">`/`<input
    type="date" aria-label="Due date">`); "Add" submits, calling
    `createActivity(plan.id, user.id, { title, category, priority, period:
    section, explanation, dueDate })` then appending the returned row
    (mapped via the same `mapDbActivity` used for loaded activities) to
    local state.
- **Refactor:** None expected.
- **Acceptance criteria:** all four tests pass.
- **Review gate:** No gate — additive UI using Task 2's already
  gate-checked helpers and the existing `deleteActivity`; Remove's delete is
  irreversible per row but is the same already-shipped, ungated
  `deleteActivity` behaviour `Roadmap.jsx`'s existing Remove control already
  uses today (gate condition 5 was already accepted for this exact action
  when `Roadmap.jsx` shipped it) — not re-gating a decision already made.
- **Depends on:** Task 2, Task 7, Task 9.

### Task 11: `Diary.jsx` — inline Reflection + "View roadmap" button

- **Description:** Wire Task 6's extracted `DiarySection` inline per card
  (with Task 5's contextual prompt), and the top-right "View roadmap →"
  link to `/plan`.
- **Files touched:** `src/pages/Diary.jsx`, `src/pages/Diary.test.jsx`.
- **Tests first (red):** add to `Diary.test.jsx` (mock `../lib/db`'s
  `getDiaryEntriesForActivity`, `createDiaryEntry`, `setDiaryEntryFeedback`,
  and `../lib/ai`'s `getDiaryFeedback`):
  ```js
  it("expanding an item's Reflection section shows its category-specific prompt and loads its diary entries", async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } })
    mockGetPlanWithActivities.mockResolvedValue({
      plan: { id: 'p1', target_occupation: 'Data Analyst' },
      activities: [{ id: 'a1', title: 'Overdue item', category: 'Networking', period_label: 'Year 1', period_year: 2020, priority: 'High', explanation: 'x', status: 'Not started', due_date: null }],
    })
    render(<MemoryRouter><Diary /></MemoryRouter>)
    await waitFor(() => screen.getAllByText('Overdue item'))
    fireEvent.click(screen.getByRole('button', { name: /reflection/i }))
    await waitFor(() => expect(mockGetDiaryEntriesForActivity).toHaveBeenCalledWith('a1'))
    expect(screen.getByText('Who did you meet? What insights did you gain?')).toBeInTheDocument()
  })

  it('submitting a reflection entry calls createDiaryEntry(activity.id, user.id, text) and the entry appears', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } })
    mockGetPlanWithActivities.mockResolvedValue({
      plan: { id: 'p1', target_occupation: 'Data Analyst' },
      activities: [{ id: 'a1', title: 'Overdue item', category: 'Networking', period_label: 'Year 1', period_year: 2020, priority: 'High', explanation: 'x', status: 'Not started', due_date: null }],
    })
    mockCreateDiaryEntry.mockResolvedValue({ id: 'd1', entry_text: 'Met a mentor today.', created_at: '2026-09-01T00:00:00Z' })
    render(<MemoryRouter><Diary /></MemoryRouter>)
    await waitFor(() => screen.getAllByText('Overdue item'))
    fireEvent.click(screen.getByRole('button', { name: /reflection/i }))
    await waitFor(() => expect(mockGetDiaryEntriesForActivity).toHaveBeenCalledWith('a1'))
    fireEvent.change(screen.getByRole('textbox', { name: /diary entry/i }), { target: { value: 'Met a mentor today.' } })
    fireEvent.click(screen.getByRole('button', { name: /add entry/i }))
    expect(mockCreateDiaryEntry).toHaveBeenCalledWith('a1', 'u1', 'Met a mentor today.')
    await waitFor(() => expect(screen.getByText('Met a mentor today.')).toBeInTheDocument())
  })

  it('a "View roadmap" link navigates to /plan', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } })
    mockGetPlanWithActivities.mockResolvedValue({ plan: { id: 'p1', target_occupation: 'Data Analyst' }, activities: [] })
    render(<MemoryRouter><Diary /></MemoryRouter>)
    // Async, not sync as originally drafted: Diary's plan load is
    // asynchronous, so the link doesn't exist until it resolves.
    await waitFor(() => expect(screen.getByRole('link', { name: /view roadmap/i })).toHaveAttribute('href', '/plan'))
  })
  ```
  Run `npm test` and confirm all fail.
- **Implementation (green):** `ActivityCard` (from Task 10) gets a
  "Reflection" toggle button that, on first expand, calls
  `getDiaryEntriesForActivity(activity.id)` and stores the result in its own
  local state (`diaryEntries`, `null` until loaded), then renders
  `<DiarySection diaryEntries={...} onAddEntry={handleAddEntry}
  onRequestFeedback={handleRequestFeedback}
  prompt={getReflectionPrompt(activity.category)} />`. `ActivityCard`'s own
  `handleAddEntry`/`handleRequestFeedback` mirror `Roadmap.jsx`'s existing
  `handleAddEntry`/`handleRequestFeedback` (lines 220–232) exactly, using a
  new `userId` prop threaded down from `Diary`'s `user.id` (rather than
  `ActivityCard` calling `useAuth()` itself, since `Diary` already gates on
  `user` before rendering any cards). The right page header renders `<Link
  to="/plan" className="...">View roadmap →</Link>` positioned top-right,
  next to the "My Plan" heading.
- **Refactor:** None expected.
- **Acceptance criteria:** all three tests pass.
- **Review gate:** No gate — reuses Task 5/6's already gate-checked pieces
  and the existing, already-shipped diary read/write helpers; the AI-prompt
  content itself (`getDiaryFeedback`) is unchanged from its own prior gate
  review in `plans/2026-09-12-diary.md` Task 1 — not re-reviewing settled
  content.
- **Depends on:** Task 5, Task 6, Task 9.

## 6. Feature-level Definition of Done

- [x] Task 1 complete: migration applied to real Supabase project, user-confirmed 2026-09-13
- [x] Every task in §5 complete and its tests passing
- [x] `npm test` passes for the full suite (222 tests, 2026-09-13)
- [x] `npm run lint` confirmed pre-existing-broken (no `eslint.config.js`
      exists anywhere in the repo history, at HEAD before this feature's
      changes either) — unrelated to this feature, same precedent as
      `plans/2026-09-12-diary.md` §6
- [ ] Manually verified (`vercel dev`, real Supabase project with Task 1's
      migration applied): log in with an existing plan → land on `/diary` →
      see goal/notifications and non-empty sections only → check off an
      item → edit an item's due date and see it move sections when the date
      crosses a boundary → add a custom activity into "Next break" → expand
      Reflection, see the category-specific prompt, submit an entry, request
      AI feedback → click "View roadmap →" → land on unchanged `/plan`; also
      verify a signed-out visitor sees only the locked prompt, and a
      brand-new account with zero activities sees the single empty-state
      message.
- [x] Every requirement in §2 is covered — see §7
- [x] Task 1 (the only gated task) has been shown to the user and explicitly
      accepted (2026-09-13)
- [x] No item remains in §8

## 7. Requirements coverage check

| Requirement | Covered by |
| --- | --- |
| 2.1.1 | Task 3, Task 7 |
| 2.1.2 | Task 9 |
| 2.1.3 | Task 10 |
| 2.1.4 | Task 10 |
| 2.1.5 | Task 5, Task 6, Task 11 |
| 2.1.6 | Task 4, Task 8 |
| 2.1.7 | Task 11 |
| 2.1.8 | Task 7 |

## 8. Risks / open questions

None.
