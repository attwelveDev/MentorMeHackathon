# Personalised career planner and diary (Capability 2)

- **Date:** 2026-09-12
- **Status:** Draft
- **Approved by user:** yes — 2026-09-12

## 1. Define

**Problem statement:** International students struggle to know what to do,
when, and why on the path to their target occupation, because generic advice
isn't tied to their remaining degree timeline or tracked over time.
Planery helps by turning their profile into a year-by-year visual
roadmap of concrete activities they can review, accept, edit, and log
progress against, so they can start acting early and see at a glance what's
done, current, overdue, or upcoming.

**User stories:**

| # | Story | Acceptance criteria |
| --- | --- | --- |
| 1 | As an international student, I want a career preparation plan organised around my remaining degree timeline, so that I can start taking action early. | Given a target role and known study stage, when the plan is generated, activities are grouped into time periods, each with a category, priority, explanation, and initial status. |
| 2 | As a student who hasn't registered yet, I want to view and save my generated roadmap without creating an account, so I don't lose momentum before I've decided to commit. | Given a generated roadmap, when I click Save without an account, the plan is written to this browser's local storage and I see a notice that it's only saved on this device/browser (survives tab close; lost on clearing site data or switching browsers/devices) and that registering keeps it safe and unlocks editing, tracking, diary, and news. Given no account, when I try to Accept the plan, edit/add/remove an activity, change status, open a diary panel, or open News, each is visibly locked with a "Create an account to unlock" prompt instead of performing the action. |
| 3 | As a student registering after saving a plan as a guest, I want my saved plan carried into my new account, so I don't have to regenerate it. | Given a plan saved in local storage, when I complete sign-up, I'm asked whether to import it; on confirm, profile, plan, and activities are written to Supabase under my new account and local storage is cleared. |
| 4 | As a registered student, I want to log a diary entry against a specific activity and optionally request AI feedback, so I can reflect and get input when I want it. | Given I open a roadmap checkpoint's detail panel, when I submit a diary entry, it's saved and timestamped under that activity; when I click "Get AI feedback" on an entry, a Gemini-generated response appears attached to that entry (never automatically). |
| 5 | As a registered student, I want a stats strip summarising my progress, so I can monitor activities over time without reading the whole roadmap. | Given my plan's activities, the strip shows counts of completed / in-progress / upcoming / overdue activities, a progress-by-category breakdown, and my most recent diary entries. |

**Sourcing rule check:** no stats, job-market, or migration claims are
introduced — pure derived counts from the student's own data. No conflict
with CLAUDE.md's sourcing rule.

## 2. Design

**Alternatives considered:** guest-save via Supabase anonymous auth
(rejected — extra Supabase project config, more moving parts than a
hackathon needs) in favour of localStorage-until-registration. Inferring
years-remaining from the study-stage enum alone (rejected — too imprecise
to correctly grey out already-missed Year 1/2 checkpoints) in favour of an
explicit `courseLengthYears` field.

**Screens:**

| Screen | Purpose | Content | Primary action | Optional fields | Validations | Error states |
| --- | --- | --- | --- | --- | --- | --- |
| Roadmap (`src/pages/Roadmap.jsx`, route `/plan`, replaces `Plan.jsx` + `Dashboard.jsx`) | Show the generated year-by-year plan as an open book and let the student track it | Open-book roadmap (Year N periods paired with real calendar years; single collapsed "Before graduating" checkpoint for recently-completed students; goal card at the end); stats strip (completed/in-progress/upcoming/overdue counts, progress by category, recent diary entries) above/below the book; left-nav tabs Diary/News/Jobs/Profile (Jobs tab omitted/"coming soon" — no Jobs screen exists yet) | Save (always available); Accept plan, edit/add/remove activity, change status, open diary panel (registered users only) | — | Guest Save requires localStorage availability | AI generation failure reuses existing "We could not generate your plan..." banner; guest-save failure (localStorage full/unavailable) shows an inline error, not a silent no-op; locked actions show a "Create an account to unlock" prompt rather than failing silently |
| Profile (`src/pages/Profile.jsx`, changed) | Capture enough timeline info to place Year 1..N on a real calendar | Existing fields plus new required `courseLengthYears` (integer 1–6) | Submit → Analysis (unchanged) | `courseLengthYears` not required when `studyStage === 'recently-completed'` | `graduationYear` becomes required for all students; `courseLengthYears` required unless recently-completed | Existing inline + summary error pattern extends to the new required field |
| Sign up (`src/pages/SignUp.jsx`, new) | Create a Supabase Auth account | Email, password fields | Submit → create account, then offer to import any localStorage-saved plan | — | Standard email/password validation via Supabase Auth | Supabase Auth errors (duplicate email, weak password) shown inline |
| Log in (`src/pages/Login.jsx`, new) | Authenticate an existing user | Email, password fields | Submit → sign in, redirect back to where the lock was hit | — | — | Invalid credentials shown inline |

**Data (Supabase/Postgres, new tables, RLS-scoped to `auth.uid()`):**
- `profiles` (user_id pk, mirrors Profile.jsx fields incl. `graduation_year`, `course_length_years`)
- `plans` (id, user_id, target_occupation, accepted boolean default false, created_at, updated_at)
- `activities` (id, plan_id, user_id, title, category, period_label, period_year, priority, explanation, status, sort_order, created_at, updated_at)
- `diary_entries` (id, activity_id, user_id, entry_text, ai_feedback nullable, created_at)

**Logic — checkpoint status/colour derivation** (drives both colour and the
"you are here" pin; `current_year` = real-world current calendar year):
1. Any activity with `status = Completed` → **Completed/green**, regardless of period.
2. Else if `period_year < current_year` → **Missed/grey**.
3. Else if `period_year == current_year`: the first not-completed activity in chronological/sort order → **Current/gold** and receives the "you are here" pin; other not-completed current-year activities → **Upcoming/blue**.
4. Else (`period_year > current_year`) → **Upcoming/blue**.
5. Final goal checkpoint is always a distinct lavender+gold "Goal" card, last.

Colour values (light/dark) are exactly the hex table supplied by the user in
this conversation.

**AI (`src/lib/ai.js`):**
- `generateCareerPlan` prompt updated to emit `Year N` period labels (plus the graduate "Before graduating" collapse) instead of semester labels.
- New `getDiaryFeedback(activity, entryText)` helper, called only on explicit user action via a "Get AI feedback" button — never automatically — going through `api/generate.js` like existing calls.

## 3. Develop

Sequenced as separate `plan-feature-4d` passes, in order:
1. **Profile + timeline fields** — add `courseLengthYears`, make `graduationYear` required, unit tests.
2. **Auth foundation** — Supabase sign-up/login screens, session context, a reusable lock/gate primitive (e.g. `useAuthGate`/`<LockedAction>`) for reuse in later phases.
3. **Supabase schema** — `profiles`/`plans`/`activities`/`diary_entries` tables + RLS policies; this repo has no SQL migrations yet, so this phase also establishes where they live.
4. **Roadmap screen** — replaces `Plan.jsx`/`Dashboard.jsx`; open-book visual, colour/status derivation, stats strip, guest local-storage save + import-on-signup.
5. **Diary** — checkpoint detail panel, entry logging, on-request AI feedback, Diary tab.
6. **News gating** — wrap `MarketUpdates.jsx` with the phase-2 lock pattern.

Files touched: `src/pages/Profile.jsx`, new `src/pages/Roadmap.jsx` (retiring
`Plan.jsx`/`Dashboard.jsx`), new `src/pages/SignUp.jsx`/`Login.jsx`,
`src/lib/ai.js`, `src/lib/supabaseClient.js` usage, new `src/lib/auth.js`
context, new SQL migration files, `src/App.jsx` routing/nav,
`src/pages/MarketUpdates.jsx`.

**Risks:** the year/date derivation logic is the crux of "missed vs current
vs upcoming" behaviour and needs thorough unit tests across study
stages/dates; guest→account data migration is a one-time write that must not
silently drop data on failure; this capability is materially larger than
anything built so far in this repo, hence the 6-phase split.

## 4. Demonstrate

**Golden path:** fill Profile (incl. course length) → Analysis → Roadmap
generates with Year N periods → Save as guest (see local-only notice) → try
Accept (locked) → Sign up → prompted to import saved plan → Accept works →
click a Year-1 checkpoint → log diary entry → request AI feedback →
status/colour updates reflected in stats strip and checkpoint colour.

**Edge cases:** student who is "Recently completed" (collapsed "Before
graduating" stage, no course length asked); student just starting in what
would already be "Year 3" on the calendar (grey/missed earlier-year items
appear immediately, with no prior app usage); guest closes and reopens the
tab (plan persists) vs. clears site data (plan gone, notice was accurate); AI
generation failure at any stage shows the existing error banner, never a
fabricated fallback plan.

## 5. Requirements

### 5.1 Non-functional requirements

None beyond project defaults (Vitest for tests, existing Tailwind/React
conventions, Supabase free tier, Vercel serverless for AI calls).

### 5.2 Out of scope

- Migration/visa/legal/financial/licensing advice (per CLAUDE.md).
- Guarantees of employment, sponsorship, or migration eligibility.
- A Jobs screen/tab (doesn't exist yet in this codebase).
- Password reset / email confirmation UX beyond Supabase Auth defaults.
- Automatic (non-requested) AI feedback on diary entries.
- Supabase anonymous auth for guests (localStorage chosen instead).

## 6. Probes raised and resolved

| # | Type | What was raised | Resolution |
| --- | --- | --- | --- |
| 1 | Ambiguity | Does the open-book roadmap replace `Plan.jsx`, or sit alongside it as a separate post-acceptance view? | Replaces both `Plan.jsx` and `Dashboard.jsx` entirely; one merged route/component. |
| 2 | Gap | Mockup uses Year 1–4 periods but Profile had no way to place them on a real calendar. | Added required `courseLengthYears` field; start year computed from `graduationYear - courseLengthYears + 1`. |
| 3 | Contradiction | "Editing requires an account" vs. "user can save the plan" — no auth exists yet. | Saving is always allowed (localStorage for guests); every other action (accept/edit/track/diary/news) requires an account. |
| 4 | Assumption | How "save without an account" persists technically. | localStorage only, with an accurate on-device/browser notice (not "lost on tab close," which is false for localStorage) and an import-on-signup flow. |
| 5 | Gap | Graduates ("Recently completed") don't have future degree years to plan against. | Their pre-graduation history collapses into a single "Before graduating" checkpoint; everything after uses real calendar years. |
| 6 | Ambiguity | Screen 5's spec lists numeric stats not shown in the mockup image. | Stats strip sits above/below the open book on the same screen. |
| 7 | Gap | How diary logging is triggered from the roadmap. | Clicking a checkpoint opens a detail panel with status control + diary log form + on-request AI feedback button; the Diary tab lists all entries. |
| 8 | Ambiguity | Whether account-gating in this pass extends to the existing News screen. | Yes — `MarketUpdates.jsx` gets the same lock pattern in phase 6; Jobs has no screen yet so nothing to gate. |

## 7. Handoff notes for planning

- Build in the 6-phase order above; each phase is its own `plan-feature-4d` /
  `execute-plan-4d` cycle — don't try to plan or build this as one giant
  plan.
- The colour/status derivation algorithm in section 2 is settled and must
  not be re-derived differently during planning — it was worked out
  specifically to match the user-supplied mockup's Year 1–3 example.
- Guest-save copy must say "saved only on this browser/device," never
  "lost if you close the tab" (localStorage survives tab close).
- Reuse the existing error-banner and inline-field-error patterns already
  established in `Profile.jsx`/`Analysis.jsx`/`Plan.jsx` rather than
  inventing new ones.
