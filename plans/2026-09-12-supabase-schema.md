# Supabase schema for plans, activities, diary (Capability 2 / Phase 3)

- **Date:** 2026-09-12
- **Status:** Approved
- **Requirements confirmed by user:** yes — 2026-09-12

## 1. Summary

Phases 4–6 of the career-planner-and-diary capability (see
`specs/2026-09-12-career-planner-and-diary.md`) need somewhere to persist a
registered student's profile, plan, activities, and diary entries. This repo
has no Supabase tables and no migration files at all today. This plan adds
exactly four tables (`profiles`, `plans`, `activities`, `diary_entries`) with
row-level security scoped to `auth.uid()`, and establishes
`supabase/migrations/` as where schema changes live going forward. It does
not add any application code that reads/writes these tables — that's Phase
4 (`src/lib/db.js` for plans/activities) and Phase 5 (diary entries).

## 2. Requirements

### 2.1 Functional requirements

1. A `profiles` table shall exist, keyed by `user_id` (references
   `auth.users(id)`), with one column per `src/pages/Profile.jsx` field
   (`qualification`, `specialisation`, `education_sector`, `study_stage`,
   `graduation_year`, `course_length_years`, `target_occupation`, `state`,
   `work_rights`, `skills`, `certifications`, `experience`,
   `employment_arrangement`, `work_location_mode`, `other_preferences`,
   `licences`), plus `created_at`/`updated_at`.
2. A `plans` table shall exist: `id` (uuid pk), `user_id` (references
   `auth.users(id)`), `target_occupation` (not null), `accepted` (boolean,
   default `false`), `created_at`/`updated_at`.
3. An `activities` table shall exist: `id` (uuid pk), `plan_id` (references
   `plans(id)`, cascade delete), `user_id` (references `auth.users(id)`),
   `title` (not null), `category` (not null, constrained to the 9 categories
   already used in `src/lib/ai.js`'s `generateCareerPlan` prompt),
   `period_label` (not null, free text — e.g. `"Year 2"`, `"Before
   graduating"`, a real calendar year), `period_year` (integer, nullable),
   `priority` (not null, constrained to `High`/`Medium`/`Low`), `explanation`
   (not null), `status` (not null, constrained to `Not started`/`In
   progress`/`Completed`, default `Not started`), `sort_order` (integer,
   default `0`), `created_at`/`updated_at`.
4. A `diary_entries` table shall exist: `id` (uuid pk), `activity_id`
   (references `activities(id)`, cascade delete), `user_id` (references
   `auth.users(id)`), `entry_text` (not null), `ai_feedback` (nullable text),
   `created_at`.
5. Row-level security shall be enabled on all four tables, with select/
   insert/update/delete policies restricting every row to
   `user_id = auth.uid()`.
6. Deleting a `plans` row shall cascade-delete its `activities`; deleting an
   `activities` row shall cascade-delete its `diary_entries`.

### 2.2 Non-functional requirements

- **Schema/data model change — gate condition 1.** Every task in this plan
  is gated; see per-task Human review lines.
- No automated test harness for Supabase schema exists in this repo (no
  Supabase CLI/local Postgres/pgTAP setup) — verification is manual, via the
  SQL query script given in each task's acceptance criteria, run by whoever
  applies the migration.

### 2.3 Out of scope

- Any application code reading/writing these tables (`src/lib/db.js` and
  call sites are Phase 4/5).
- Populating `profiles`/`plans`/`activities` from the existing
  `Profile.jsx`/`Plan.jsx` flow — that flow still uses React Router `state`
  only until Phase 4 wires persistence in.
- Supabase CLI installation/local dev database — migrations here are plain
  `.sql` files intended to be pasted into the Supabase SQL editor (or run via
  `supabase db push` if the project later adopts the CLI); no CLI config is
  added by this plan.

### 2.4 Assumptions

- `pgcrypto` (for `gen_random_uuid()`) is available on the target Supabase
  project — true for all current Supabase-managed Postgres instances; the
  migration defensively runs `create extension if not exists pgcrypto;`
  first.

## 3. Existing code context

- No `supabase/` directory, no `.sql` files anywhere in this repo (confirmed
  via repo-wide search).
- `src/lib/supabaseClient.js` — the only existing Supabase touchpoint; its
  `supabase` client is what Phase 4/5's application code will use to query
  the tables this plan creates (out of scope here).
- `src/lib/ai.js`'s `generateCareerPlan` prompt (lines ~40–57) is the
  authoritative source for the 9 category values and 3 priority values used
  in this plan's `check` constraints:
  - Categories: `Technical skills`, `Certifications`, `Work experience`,
    `Networking`, `Extracurricular activities`, `Application preparation`,
    `Commercial and industry awareness`, `Licensing/registration/compliance`,
    `Practical competencies/placements/portfolio evidence`.
  - Priorities: `High`, `Medium`, `Low`.
  - Statuses (from the same file and `src/pages/Plan.jsx`'s `<select>`):
    `Not started`, `In progress`, `Completed`.
- `src/pages/Profile.jsx`'s form fields (post Phase 1) are the authoritative
  source for the `profiles` table's column list (§2.1.1 above).

## 4. Approach

Plain SQL migration files under `supabase/migrations/`, numbered
sequentially, applied manually via the Supabase SQL editor (this repo has no
Supabase CLI wiring, and adding one is out of scope — CLAUDE.md specifies
Supabase's free tier with no mention of local CLI dev). Each table gets
`enable row level security` plus four policies (`select`/`insert`/`update`/
`delete`) rather than one combined policy, so each operation's rule is
independently readable and auditable — matching how Supabase's own docs and
dashboard UI present RLS policies.

Alternative considered: a single combined `for all` policy per table
(rejected — harder to reason about which operations are actually allowed
when reviewing, for a marginal line-count saving).

## 5. Task breakdown

### Task 1: `profiles` table + RLS

- **Description:** Create the `profiles` table and its RLS policies.
- **Files touched:** `supabase/migrations/0001_create_profiles.sql` (new).
- **Tests first (red):** N/A (no test harness for schema — see §2.2); the
  verification query below is written first as the acceptance check.
- **Implementation (green):**
  ```sql
  create extension if not exists pgcrypto;

  create table public.profiles (
    user_id uuid primary key references auth.users(id) on delete cascade,
    qualification text,
    specialisation text,
    education_sector text,
    study_stage text,
    graduation_year text,
    course_length_years integer,
    target_occupation text,
    state text,
    work_rights text,
    skills text,
    certifications text,
    experience text,
    employment_arrangement text,
    work_location_mode text,
    other_preferences text,
    licences text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  alter table public.profiles enable row level security;

  create policy "profiles_select_own" on public.profiles
    for select using (auth.uid() = user_id);
  create policy "profiles_insert_own" on public.profiles
    for insert with check (auth.uid() = user_id);
  create policy "profiles_update_own" on public.profiles
    for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  create policy "profiles_delete_own" on public.profiles
    for delete using (auth.uid() = user_id);
  ```
- **Refactor:** None expected.
- **Acceptance criteria:**
  - After applying, `select * from public.profiles;` run as an authenticated
    Supabase client only ever returns rows where `user_id = auth.uid()`
    (verify by inserting rows for two different test users via the SQL
    editor as `service_role`, then querying as each user via
    `supabase.auth.signInWithPassword` + `supabase.from('profiles').select()`
    in a throwaway script or the Supabase table editor's "RLS" test tool).
  - `insert`/`update`/`delete` fail (are filtered/rejected) when attempted
    with a `user_id` other than the authenticated user's.
- **Review gate:** **Human review:** schema/data model change (gate
  condition 1). Look at `supabase/migrations/0001_create_profiles.sql` after
  applying it to the project's Supabase SQL editor, and confirm the table
  and RLS policies exist exactly as specified before Task 2 proceeds.
- **Depends on:** None.

### Task 2: `plans` table + RLS

- **Description:** Create the `plans` table and its RLS policies.
- **Files touched:** `supabase/migrations/0002_create_plans.sql` (new).
- **Tests first (red):** N/A — see Task 1.
- **Implementation (green):**
  ```sql
  create table public.plans (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    target_occupation text not null,
    accepted boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  alter table public.plans enable row level security;

  create policy "plans_select_own" on public.plans
    for select using (auth.uid() = user_id);
  create policy "plans_insert_own" on public.plans
    for insert with check (auth.uid() = user_id);
  create policy "plans_update_own" on public.plans
    for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  create policy "plans_delete_own" on public.plans
    for delete using (auth.uid() = user_id);
  ```
- **Refactor:** None expected.
- **Acceptance criteria:** same RLS verification approach as Task 1, applied
  to `public.plans`.
- **Review gate:** **Human review:** schema/data model change (gate
  condition 1). Same verification as Task 1, against
  `supabase/migrations/0002_create_plans.sql`.
- **Depends on:** None (independent of Task 1, but both must land before
  Task 3).

### Task 3: `activities` table + RLS + enum checks

- **Description:** Create the `activities` table, its RLS policies, and
  `check` constraints for `category`, `priority`, and `status`.
- **Files touched:** `supabase/migrations/0003_create_activities.sql` (new).
- **Tests first (red):** N/A — see Task 1.
- **Implementation (green):**
  ```sql
  create table public.activities (
    id uuid primary key default gen_random_uuid(),
    plan_id uuid not null references public.plans(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    title text not null,
    category text not null check (category in (
      'Technical skills', 'Certifications', 'Work experience', 'Networking',
      'Extracurricular activities', 'Application preparation',
      'Commercial and industry awareness',
      'Licensing/registration/compliance',
      'Practical competencies/placements/portfolio evidence'
    )),
    period_label text not null,
    period_year integer,
    priority text not null check (priority in ('High', 'Medium', 'Low')),
    explanation text not null,
    status text not null default 'Not started'
      check (status in ('Not started', 'In progress', 'Completed')),
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  alter table public.activities enable row level security;

  create policy "activities_select_own" on public.activities
    for select using (auth.uid() = user_id);
  create policy "activities_insert_own" on public.activities
    for insert with check (auth.uid() = user_id);
  create policy "activities_update_own" on public.activities
    for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  create policy "activities_delete_own" on public.activities
    for delete using (auth.uid() = user_id);
  ```
- **Refactor:** None expected.
- **Acceptance criteria:**
  - Same RLS verification as Task 1, against `public.activities`.
  - Inserting a row with an out-of-list `category`, `priority`, or `status`
    value fails with a check-constraint violation.
  - Deleting the parent `plans` row cascade-deletes its `activities` rows.
- **Review gate:** **Human review:** schema/data model change (gate
  condition 1). Confirm the check constraints and cascade behaviour against
  `supabase/migrations/0003_create_activities.sql`.
- **Depends on:** Task 2 (`plans` must exist for the foreign key).

### Task 4: `diary_entries` table + RLS

- **Description:** Create the `diary_entries` table and its RLS policies.
- **Files touched:** `supabase/migrations/0004_create_diary_entries.sql`
  (new).
- **Tests first (red):** N/A — see Task 1.
- **Implementation (green):**
  ```sql
  create table public.diary_entries (
    id uuid primary key default gen_random_uuid(),
    activity_id uuid not null references public.activities(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    entry_text text not null,
    ai_feedback text,
    created_at timestamptz not null default now()
  );

  alter table public.diary_entries enable row level security;

  create policy "diary_entries_select_own" on public.diary_entries
    for select using (auth.uid() = user_id);
  create policy "diary_entries_insert_own" on public.diary_entries
    for insert with check (auth.uid() = user_id);
  create policy "diary_entries_update_own" on public.diary_entries
    for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  create policy "diary_entries_delete_own" on public.diary_entries
    for delete using (auth.uid() = user_id);
  ```
- **Refactor:** None expected.
- **Acceptance criteria:**
  - Same RLS verification as Task 1, against `public.diary_entries`.
  - Deleting the parent `activities` row cascade-deletes its
    `diary_entries` rows.
- **Review gate:** **Human review:** schema/data model change (gate
  condition 1). Confirm against
  `supabase/migrations/0004_create_diary_entries.sql`.
- **Depends on:** Task 3 (`activities` must exist for the foreign key).

### Task 5: Migration README

- **Description:** Document how these `.sql` files are applied, since this
  repo has no Supabase CLI wiring.
- **Files touched:** `supabase/migrations/README.md` (new).
- **Tests first (red):** N/A — documentation only.
- **Implementation (green):** A short README stating: apply each numbered
  file in order via the Supabase project's SQL editor (Dashboard → SQL
  Editor → paste → Run); files are numbered and must be applied in order
  since later ones reference earlier tables' foreign keys; if the project
  later adopts the Supabase CLI, these same files can be dropped into a
  `supabase db push`-compatible layout unchanged.
- **Refactor:** None expected.
- **Acceptance criteria:** README exists and accurately describes the
  four files' apply order and dependency chain.
- **Review gate:** No gate — documentation only, no schema/auth/sourcing/
  cross-cutting/irreversible surface.
- **Depends on:** Tasks 1–4.

## 6. Feature-level Definition of Done

- [x] All five tasks in §5 complete
- [x] All four migration files applied to the project's actual Supabase
      instance and each verified per its acceptance criteria
- [x] `npm test` passes (55/55). `npm run lint` fails, but pre-existing and
      unrelated to this plan: ESLint 9.39.5 can't find `eslint.config.js` in
      this repo (v9 no longer reads the old `.eslintrc.*` format). This plan
      touches no application code and did not cause this.
- [x] Every requirement in §2 is covered — see §7
- [x] Every gated task (1–4) has been shown to the user and explicitly
      accepted
- [x] No item remains in §8

## 7. Requirements coverage check

| Requirement | Covered by |
| --- | --- |
| 2.1.1 | Task 1 |
| 2.1.2 | Task 2 |
| 2.1.3 | Task 3 |
| 2.1.4 | Task 4 |
| 2.1.5 | Tasks 1–4 |
| 2.1.6 | Tasks 3, 4 |

## 8. Risks / open questions

None.
