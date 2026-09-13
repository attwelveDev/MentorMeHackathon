# Main Diary Dashboard (Screen 4)

- **Date:** 2026-09-13
- **Status:** Draft
- **Approved by user:** yes — 2026-09-13

## 1. Define

**Problem statement:** Registered students struggle to turn a one-time
generated career roadmap into ongoing daily action because nothing prompts
them to check in, act on the next small step, or reflect on what they're
learning. Planery helps by giving them a "Main Diary Dashboard" — an
open-book home screen that groups their existing plan into Now-through-
graduation buckets, tracks per-item progress inline, and prompts a
category-relevant reflection — so they can act on their plan a little at a
time and build a record of their own growth.

**User stories:**

| # | Story | Acceptance criteria |
| --- | --- | --- |
| 1 | As a registered student, I want my plan grouped into Now / This semester / Next semester / Next break / Before final year / Graduate application period, so I know what to focus on without reading the whole roadmap. | Given my activities (the existing shared `activities` table), each is bucketed by the deterministic rule in §2; sections with no items are hidden; a brand-new plan with zero activities shows one empty-state message instead of six empty headers. |
| 2 | As a registered student, I want to see progress, due date, category, priority and status on each plan item, and edit, remove, or mark it complete inline, so I don't have to open a separate screen for routine updates. | Given a plan item, its card shows a progress bar (derived from status: Not started 0% / In progress 50% / Completed 100%), a due date if set (else its bucket/period label), category, and priority; Edit opens a form (title/category/priority/explanation/due date); Remove asks for confirmation then deletes it; a checkbox marks it Completed — all instantly reflected in the card and its bucket. |
| 3 | As a registered student, I want to add my own custom activity into any section, so I can track things the AI didn't generate. | Given the "Add a new item" action, submitting title + category + priority + section (+ optional explanation/due date) creates a new activity filed directly under the chosen section, alongside AI-generated ones. |
| 4 | As a registered student, I want to log a reflection under any activity with a prompt relevant to its category, so journaling feels guided rather than a blank box. | Given an activity's Reflection control, expanding it shows past entries (newest first) and a form pre-labelled with a category-specific prompt (e.g. Work experience → "What did you experience? What did you learn?"); submitting saves via the existing `createDiaryEntry`, matching Roadmap's diary behaviour exactly (including on-request-only AI feedback via the existing `getDiaryFeedback`). |
| 5 | As a registered student, I want a left-hand overview of my goal and real notifications, so I get a quick, honest check-in without noise. | Given my data, the left page shows my goal ("Become a {targetOccupation}"), a static "Hi, how are you today?" prompt, and notification bars built only from real data: nearest upcoming/overdue activity, and a progress-streak card — no fabricated job/event content, no unread-News count (not derivable without new read-tracking, which is out of scope — see §5.2). |
| 6 | As a guest (no account), I want to see this screen is locked, so I know to sign up. | Given no session, the screen shows the existing "Create an account to keep a diary" locked prompt (as today's `Diary.jsx`), not the plan/notification content. |

**Sourcing rule check:** Reflection prompts and the "Goals" sticky note are
UI copy the app authors, not claims about the world — no conflict.
Notification bars are constrained to derive only from the student's own
stored activity data — nothing fabricated, per the user's explicit choice in
this conversation.

## 2. Design

**Alternatives considered:** replacing the app-wide Year-N/calendar period
taxonomy with the six semester-shaped bucket names throughout (rejected —
would require re-deriving the already-tested `computeRoadmap` colour/pin
logic and the AI-generation prompt, breaking shipped, tested code, for a
purely cosmetic grouping need); a separate, independent activity list for
this screen (rejected — duplicates data entry and breaks the "one shared
plan" design already settled in `specs/2026-09-12-career-planner-and-diary.md`);
a manual `progress_percent` field (rejected — mockup values don't need to be
literal; deriving from the existing 3-state status needs no schema change);
an unread-News-update count notification (rejected — no "last seen"
tracking exists yet; would require new schema/state beyond this pass's
scope).

**Route:** Redesigns `src/pages/Diary.jsx` in place (route `/diary`,
unchanged) into the "Main Diary Dashboard." `src/pages/Roadmap.jsx` (`/plan`)
is untouched; reached via a new "View roadmap →" button, top-right of the
right page.

**Screens:**

| Screen | Purpose | Content | Primary action | Optional fields | Validations | Error states |
| --- | --- | --- | --- | --- | --- | --- |
| Diary dashboard (`src/pages/Diary.jsx`, route `/diary`, redesigned) | Home screen: today's plan grouped by timing, plus a quick check-in | `NotebookFrame`-style open book. Left page: "Goals" sticky note (`Become a {targetOccupation}`), static "Hi, how are you today?" prompt, up to 2 notification bars (nearest due/overdue activity; progress-streak card from `computeStats`). Right page: "My Plan" header, "View roadmap →" button, the 6 sections in fixed order (only non-empty ones shown), each item as a card (checkbox, title, category, priority, progress bar, due date or bucket label, Edit/Remove, expandable Reflection), "Add a new item" button. | Mark item complete (checkbox); expand Reflection → add entry / request AI feedback | Edit activity; Remove activity (with confirmation); Add my own activity | Guest sees the existing locked "Create an account to keep a diary" prompt instead of all of the above | Empty plan (0 activities) → one empty-state message + "Add a new item", not six empty sections; activity load/save failures reuse the existing inline error-banner pattern from `Roadmap.jsx` |

**Bucketing logic** (pure function in `src/lib/roadmap.js`, reuses the
existing, already-tested `computeRoadmap` colour derivation unchanged):

1. `Now` = activity's `colour` (from `computeRoadmap`) is `current` or
   `missed`.
2. Else, if `period_label` is already exactly one of the 6 section names
   (a student-added custom activity filed directly into a section) → use it
   as that section.
3. Else (an AI-generated Year-N/"Before graduating" activity), evaluate in
   order:
   - If `due_date` is set: falls within today's semester window → `This
     semester`; within the next semester window → `Next semester`; within
     the break between those two windows → `Next break`; else if
     `due_date`'s year is before the profile's graduation year → `Before
     final year`; else → `Graduate application period`.
   - If `due_date` is blank: `period_year === currentYear` → `This
     semester`; `period_year === currentYear + 1` → `Next semester`;
     `period_year` set and `< graduationYear` → `Before final year`; else
     (`period_year >= graduationYear`, or `period_year` is null i.e.
     "Before graduating") → `Graduate application period`.

   Australian academic calendar used for semester windows: Semester 1 =
   Feb–Jun, Semester 2 = Jul–Nov, break = Dec–Jan.

**Data (Supabase, one new migration):**
- `activities`: add nullable `due_date date`.
- No other schema change — reuses `plans` / `activities` / `diary_entries`
  as-is.

**New/changed `src/lib/db.js` helpers:**
- `createActivity(planId, userId, activity)` — for "Add my own activity";
  `status` defaults to `'Not started'`.
- `updateActivity(activityId, fields)` — for "Edit activity"
  (title/category/priority/explanation/due_date).

**Contextual reflection prompts** (new lookup keyed by the 9 existing
`category` enum values in `0003_create_activities.sql`):
- Work experience → "What did you experience? What did you learn?"
- Networking → "Who did you meet? What insights did you gain?"
- Technical skills, Certifications → "What did you learn? How will you apply
  it?"
- All other categories (Extracurricular activities, Application
  preparation, Commercial and industry awareness,
  Licensing/registration/compliance, Practical
  competencies/placements/portfolio evidence) → "How did it go? What's your
  next step?" (fallback)

**Notification derivation** (`src/lib/notifications.js`, new, pure
functions over already-loaded data — no new queries):
- Nearest upcoming/overdue activity: title + due date (or bucket label if
  undated), picked from the student's own `activities`.
- Progress-streak card: `stats.completed / total` from the existing
  `computeStats`.

## 3. Develop

**Files touched:**
- `src/pages/Diary.jsx` — full redesign (this is the primary deliverable).
- New `supabase/migrations/000X_add_activities_due_date.sql`.
- `src/lib/db.js` — add `createActivity`, `updateActivity`.
- `src/lib/roadmap.js` — add the bucketing function + unit tests, alongside
  the existing `computeRoadmap`/`computeStats`.
- New `src/lib/notifications.js` (+ tests) for the two notification
  derivations.
- `src/components/NotebookFrame.jsx` — add an optional top-right action slot
  so "View roadmap →" can sit in the existing book chrome without
  duplicating it.
- `src/components/CheckpointPanel.jsx` — its `DiarySection` is likely
  extracted into a shared, reusable component so the same reflection UI (incl.
  contextual prompts) renders both inline on this screen and inside
  Roadmap's modal, rather than being duplicated.
- `src/pages/Diary.test.jsx` — full rewrite for the new screen.

**Sequencing:**
1. Schema (`due_date` migration) + `db.js` helpers, with tests.
2. Bucketing logic in `roadmap.js`, thoroughly unit-tested (mirrors the
   importance of `computeRoadmap`'s existing tests).
3. Notification derivation module + tests.
4. Screen layout: left page (goals/prompt/notifications) + right page shell
   (sections, "View roadmap" button, empty state).
5. Plan-item cards: progress bar, due date, Edit/Remove/mark-complete, Add
   new item.
6. Inline reflection: extract/reuse `DiarySection` with contextual prompts.

**Risks:** the bucketing function is the crux of this screen (same category
of risk as `computeRoadmap`'s colour/pin logic) and needs thorough unit
tests across undated, dated, custom-section, and cross-boundary cases;
extracting `DiarySection` for dual use (inline here, modal in Roadmap) must
not change Roadmap's existing, already-shipped behaviour or its passing
tests.

## 4. Demonstrate

**Golden path:** log in with an existing plan → land on `/diary` → see
goal, real notifications, and items grouped into non-empty sections → check
off an item (progress bar/status update) → edit an item's due date (it
moves sections if the date crosses a semester/break boundary) → add a
custom activity into "Next break" → expand Reflection on an item, see the
category-specific prompt, submit an entry, request AI feedback → click
"View roadmap →" → land on the unchanged `/plan` Roadmap screen.

**Edge cases:** guest sees the locked prompt, not the dashboard; a
brand-new account with zero activities shows one empty-state message, not
six empty sections; an activity with no due date still buckets correctly by
year via the fallback rule; removing the only item in a section hides that
section; an item whose `due_date` sits exactly on a semester/break boundary
follows the documented window rule, not an ambiguous one.

## 5. Requirements

### 5.1 Non-functional requirements

None beyond project defaults (Vitest, existing Tailwind/React conventions,
Supabase free tier, Vercel serverless for AI calls).

### 5.2 Out of scope

- Migration/visa/legal/financial/licensing advice (per CLAUDE.md).
- Guarantees of employment, sponsorship, or migration eligibility.
- A Jobs tab/screen (still doesn't exist).
- "Job alert" and event/workshop notification content (no real data source
  exists for either).
- Unread-News-update notification count (no "last seen" tracking exists;
  would need new schema/state, deferred to a future pass).
- Manual/editable numeric progress percentage (status-derived only, for
  now).
- Editing or deleting a diary entry once submitted (unchanged from the
  existing Diary phase's scope).

## 6. Probes raised and resolved

| # | Type | What was raised | Resolution |
| --- | --- | --- | --- |
| 1 | Contradiction | Spec's Now/This-semester/.../Graduate-application-period sections vs. the already-shipped, tested Year-N/calendar period taxonomy used by `Roadmap.jsx`/`computeRoadmap`. | Keep Year-N/calendar as the only source of truth; the 6 sections are a display-only bucketing function derived from it (plus explicit section names for student-added custom activities). |
| 2 | Gap | Mockup shows numeric progress bars (70%/30%/10%) but no percentage field exists. | Derive from the existing 3-state status (0/50/100%) — no schema change, no new editable field. |
| 3 | Gap | Mockup shows exact due dates; schema only has year-granularity `period_year`. | Add a nullable `due_date` column, optional, editable via Add/Edit activity; AI-generated activities leave it blank rather than have the AI fabricate a specific date. |
| 4 | Sourcing-rule conflict | Mockup's "job alert" and "Interview preparation workshop" notification cards have no backing data source (no Jobs screen, no events system) and CLAUDE.md forbids fabricated content. | Notifications derive only from the student's own real activity data (nearest due/overdue item, progress streak); fabricated cards dropped. |
| 5 | Gap (surfaced during final probe sweep) | An "unread News count" notification was proposed but no "last seen" read-tracking exists anywhere in the app. | Dropped from this pass's notification set; left as a candidate for a future pass rather than adding new tracking infrastructure now. |
| 6 | Gap | Custom (student-added) activities have no natural "Year N" position to derive a bucket from. | Let the student pick a section directly when adding; store the section name as `period_label` and let the bucketing function recognise and pass through an already-section-named `period_label` before falling back to the Year-N derivation. |

## 7. Handoff notes for planning

- The bucketing algorithm in §2 is settled and must not be re-derived
  differently during planning — build it exactly as specified, with unit
  tests covering: overdue/current (`Now`), dated items in each semester/
  break window, undated items via the year-fallback rule, and a
  student-added item whose `period_label` is already a section name.
- Do not modify `Roadmap.jsx`'s existing colour/pin logic, its tests, or
  its route/behaviour — this pass only adds a bucketing function that reads
  the same `colour` output, and adds a shared reflection component it can
  optionally also consume without changing its current behaviour.
- Reuse the existing error-banner and locked-prompt patterns
  (`LockedAction`, the guest message already in `Diary.jsx`) rather than
  inventing new ones.
- `DiarySection`/reflection extraction must preserve Roadmap's existing
  passing tests in `Roadmap.test.jsx` and `CheckpointPanel.test.jsx`
  unchanged.
