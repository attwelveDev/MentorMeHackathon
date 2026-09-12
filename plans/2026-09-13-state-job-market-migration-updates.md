# State-by-state job market & migration trend updates (Capability 3, Screen 6)

- **Date:** 2026-09-13
- **Status:** Approved
- **Requirements confirmed by user:** yes — 2026-09-13

## 1. Summary

Replaces the placeholder `src/pages/MarketUpdates.jsx` (currently always
empty) with a real, personalised feed of sourced, date-stamped job-market and
migration-trend updates for a signed-in student's target occupation and
state, per `specs/2026-09-13-state-job-market-migration-updates.md`. Adds
topic/recency/search filtering, save/dismiss, "add to plan," and an
update-frequency preference, laid out as a two-page book spread inside the
existing side-tab notebook shell.

## 2. Requirements

### 2.1 Functional requirements

1. A signed-in student with a saved profile sees, at `/updates`, a feed of
   update cards drawn from `src/data/marketSources.js` items whose
   `occupation` matches `profile.target_occupation` (case-insensitive
   substring) and whose `state` equals `profile.state` or is `'National'`.
2. Each card shows headline, summary, source, publication date, retrieved
   date, a status label (Confirmed change / Proposal / Forecast / Research /
   Commentary), and — in its detail panel — a "why this matters for your
   career" explanation.
3. The student can filter the feed by topic (All, Economy, Policy,
   Regulation, Technology, Workforce demand, Employer activity) and by
   recency (All, This week, This month, Older), and search by keyword across
   headline/summary/topic/source.
4. The student can save or dismiss a card; both persist across reloads.
   Dismissed cards no longer appear in the feed.
5. The student can add a card as a new roadmap activity ("Add to plan");
   the new activity appears under the student's current/next plan period the
   next time they view `/plan`.
6. The student can set an update-frequency preference (Daily/Weekly/Off);
   it persists across reloads. No email/push digest is actually sent.
7. If the profile/occupation/state combination has no seeded items at all,
   an empty state explains nothing was found for their profile. If items
   exist but none match the current topic/recency/search filters, a
   distinct empty state explains that instead.
8. Any AI-classified item whose `topic` or `statusLabel` falls outside the
   fixed enum is excluded from the feed rather than shown.
9. The screen displays "general career information, not financial,
   investment, legal or migration advice" (exact wording).
10. A signed-out visitor to `/updates` still sees the existing locked prompt
    (unchanged behaviour from the prior gating work).

### 2.2 Non-functional requirements

None beyond project defaults (Vitest, existing Tailwind/React conventions,
Supabase free tier, one Gemini call per matched item via
`api/generate.js`).

### 2.3 Out of scope

- Real email/push digest delivery (frequency is a stored preference only).
- Live news fetching/scraping (feed is pre-curated `marketSources.js` items).
- Exact occupation-string matching (best-effort substring match accepted).
- A Jobs screen/tab (doesn't exist in this codebase).
- Dark mode (not implemented anywhere else in this codebase; mockup shows it
  but no existing screen has a dark theme to be consistent with).
- Any migration/visa/legal/financial/licensing advice content (per
  CLAUDE.md).

### 2.4 Assumptions

None outstanding — all resolved in `brainstorm-4d`'s probe sweep (see that
spec's §6).

## 3. Existing code context

- `src/pages/MarketUpdates.jsx` (current, full contents already
  read) — gated behind `useAuth()`, always renders the "no sufficiently
  relevant recent updates" empty state (`const [updates] = useState([])`).
  Route `/updates` in `src/App.jsx`. Will be fully rewritten; the signed-out
  locked-prompt branch (exact copy: `Create an account to view job market &
  migration updates.` linking to `/signup`) must be preserved unchanged.
- `src/pages/MarketUpdates.test.jsx` (current) — two tests: signed-out locked
  prompt, and signed-in empty state via `getByText(/no sufficiently relevant
  recent updates/i)`. The second test's assertion will need updating since
  the signed-in path now loads profile/plan/saved-state first (see Task 8).
- `src/data/marketSources.js` (current) — empty array; comment says items
  are curated ahead of the demo with `{ sourceText, occupation, state,
  source, publishedDate, retrievedDate }`. This plan adds a required `id`
  field.
- `src/lib/ai.js`'s `summariseMarketUpdate({ sourceText, occupation, state })`
  (current, exact signature) — calls `callGenerate(prompt, 'market-update')`,
  destructures `{ text }` internally and **returns the raw `text` string**
  (a JSON string with `headline`, `summary`, `statusLabel`, `whyItMatters`),
  matching the same `return text` convention every other `ai.js` export uses
  (confirmed against `getDiaryFeedback`'s test, which asserts its resolved
  value is the plain string). **Correction from Phase 1 review:** this plan
  originally said it returns `{ text }` — it does not. Task 4 extends the
  prompt to also emit `topic`; Task 8's mocks/implementation (below) call
  `summariseMarketUpdate` and use its resolved value directly as the JSON
  string, with no `{ text }` destructuring.
- `src/lib/roadmap.js` — exports `getExpectedPeriodLabels(profile)`,
  `periodYearFor(periodLabel, profile)`, `computeRoadmap`, `computeStats`
  (exact current signatures read). Task 2 adds `pickCurrentPeriod`.
- `src/lib/db.js` (current, exact signatures read) — `getProfile(userId)`
  returns the raw `profiles` row or `null`; `getPlanWithActivities(userId)`
  returns `{ plan, activities }` or `null`. Task 5 adds four new functions
  following this file's established pattern: destructure `{ data, error }`
  from a `supabase.from(...)` chain, `throw new Error(error.message)` on
  error, otherwise return `data` (or resolve `undefined` for
  update-only calls).
- `src/lib/auth.jsx` — `useAuth()` returns `{ session, user, loading, signUp,
  signIn, signOut }`.
- `src/components/CheckpointPanel.jsx` (current, full contents read) — the
  modal-detail-panel pattern to mirror: `role="dialog"`, `diary-note
  diary-note--no-tape` classes, a `Close` button, `useAuth()` inside the
  panel itself for any locked sub-actions. Rendered by its parent
  (`Roadmap.jsx`) inside a `fixed inset-0 z-50` backdrop `div` with
  `onClick={() => setOpenKey(null)}` and an inner `onClick={(e) =>
  e.stopPropagation()}` wrapper — Task 8 reuses this exact backdrop pattern.
- `src/components/LockedAction.jsx` — not needed here; `/updates` is already
  fully gated at the top of the page (per `plans/2026-09-12-news-gating.md`),
  so individual actions inside must NOT be wrapped in a second
  `LockedAction` gate.
- `src/index.css` — `.font-diary-title` (Caveat), `.font-diary-body` (Kalam),
  `.diary-paper`, `.diary-note` (has a taped-note `::before`),
  `.diary-note--no-tape` (suppresses the tape, used for scrollable panels),
  `.diary-tab`. No dark-mode styles exist anywhere in this codebase.
- `src/pages/Roadmap.jsx`'s `TABS` array (`[{ to: '/diary', label: 'Diary' },
  { to: '/updates', label: 'News' }, { to: '/profile', label: 'Profile' }]`)
  and its side-tab `<nav>` markup — the outer shell this screen's inner
  two-page spread sits inside. `Roadmap.jsx` does NOT import
  `MarketUpdates.jsx`; the two pages are independent routes that both use the
  `diary-paper`/`diary-note`/tab markup independently (no shared layout
  component exists yet — confirmed via `src/components/` listing). This plan
  does not introduce one; `MarketUpdates.jsx` duplicates the tab nav markup
  itself, matching how `Diary.jsx` does NOT duplicate it (Diary has no tab
  nav at all) — **note:** `Diary.jsx` currently has no side-tab nav, so
  `Roadmap.jsx` is the only existing reference for the tab markup. This is
  reused verbatim in Task 8.
- Supabase migrations live in `supabase/migrations/000N_*.sql`, sequentially
  numbered, one table per file, each with `enable row level security` and
  four `for select|insert|update|delete using/with check (auth.uid() =
  user_id)` policies (exact pattern read from all four existing files).
- Test setup: Vitest, run via `npm test` (= `vitest run`); tests colocated
  next to source (`Foo.jsx` + `Foo.test.jsx`); `src/lib/db.test.js` mocks
  `./supabaseClient`'s `supabase.from` with a chainable `chain(result)`
  helper (exact helper read); component tests mock `../lib/auth`'s
  `useAuth` with `vi.fn()` and wrap render in `<MemoryRouter>`.
- `api/generate.js` — already generic (`{ prompt, task }` → `{ task, text }`
  passthrough to Gemini); no changes needed for the `topic` field addition,
  since it's just more JSON inside the same prompt/response contract.

## 4. Approach

Chosen per the approved spec: keep the AI call purely as a
per-item summariser/classifier over pre-curated, human-sourced text (never a
live-news fetch); do the topic/recency/search narrowing and enum-safety
filtering in a new pure module (`marketUpdates.js`) so it's unit-testable
without mocking React/Supabase/fetch; persist save/dismiss/frequency in
Supabase following the exact RLS pattern already established for every other
table. "Add to plan" reuses `roadmap.js`'s existing period-derivation
functions (via a new `pickCurrentPeriod` export) rather than inventing new
placement logic, per the brainstorm's explicit handoff note.

Alternative seriously considered: classifying `topic`/`statusLabel` once at
curation time and storing them statically in `marketSources.js` (avoiding a
Gemini call on every page view). Rejected — the existing `MarketUpdates.jsx`
comment and `ai.js` header comment already establish "calls the AI only to
summarise/label each one" as the intended architecture, and the curated set
is small (single digits), so a few parallel Gemini calls per visit is
acceptable for a hackathon demo; changing that architecture is out of scope
for this plan.

## 5. Task breakdown

### Task 1: `saved_market_updates` table + `profiles.update_frequency` column [x]

- **Description:** Add the Supabase schema this feature persists to.
- **Files touched:** new `supabase/migrations/0005_create_saved_market_updates.sql`, new `supabase/migrations/0006_add_profiles_update_frequency.sql`.
- **Tests first (red):** None (SQL migrations have no Vitest coverage in this repo, matching the existing `0001`–`0004` migrations, which are likewise untested by Vitest and verified manually per `plans/2026-09-12-supabase-schema.md`).
- **Implementation (green):**
  ```sql
  -- 0005_create_saved_market_updates.sql
  create table public.saved_market_updates (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    source_id text not null,
    status text not null check (status in ('saved', 'dismissed')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (user_id, source_id)
  );

  alter table public.saved_market_updates enable row level security;

  create policy "saved_market_updates_select_own" on public.saved_market_updates
    for select using (auth.uid() = user_id);
  create policy "saved_market_updates_insert_own" on public.saved_market_updates
    for insert with check (auth.uid() = user_id);
  create policy "saved_market_updates_update_own" on public.saved_market_updates
    for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  create policy "saved_market_updates_delete_own" on public.saved_market_updates
    for delete using (auth.uid() = user_id);
  ```
  ```sql
  -- 0006_add_profiles_update_frequency.sql
  alter table public.profiles
    add column update_frequency text not null default 'weekly'
      check (update_frequency in ('daily', 'weekly', 'off'));
  ```
- **Refactor:** None expected.
- **Acceptance criteria:**
  - Both migrations apply cleanly against the existing schema (run in the Supabase SQL editor or `supabase db push`, per this repo's established manual-verification approach for prior migrations).
  - `saved_market_updates` enforces one row per `(user_id, source_id)` and RLS matches the exact 4-policy pattern of every other table.
  - `profiles.update_frequency` defaults to `'weekly'` for existing rows and rejects any value outside the three allowed.
- **Review gate:** **Human review:** schema change (condition 1). Confirm both SQL files against the Supabase dashboard/CLI before accepting — check the unique constraint, RLS policies, and the check constraint values.
- **Depends on:** None.

### Task 2: `pickCurrentPeriod` in `src/lib/roadmap.js` [x]

- **Description:** Add a helper that picks which existing plan period a newly-added "add to plan" activity should land in — the first period whose derived year is ≥ the current year, falling back to the last defined period if the student is already past their course length. Never returns `'Before graduating'` (a historical, not future, period).
- **Files touched:** `src/lib/roadmap.js`, `src/lib/roadmap.test.js`.
- **Tests first (red):** in `src/lib/roadmap.test.js`, new `describe('pickCurrentPeriod', ...)`:
  ```js
  it('picks the first Year N period whose derived year is >= currentYear', () => {
    const profile = { studyStage: 'midway', graduationYear: '2028', courseLengthYears: '4' }
    // Year 1=2025, Year 2=2026, Year 3=2027, Year 4=2028
    expect(pickCurrentPeriod(profile, 2026)).toEqual({ periodLabel: 'Year 2', periodYear: 2026 })
  })

  it('falls back to the last defined period when currentYear is past every period', () => {
    const profile = { studyStage: 'midway', graduationYear: '2024', courseLengthYears: '2' }
    // Year 1=2023, Year 2=2024 (Phase 1 correction: the original fixture
    // wrongly expected periodYear 2023 for periodLabel 'Year 2')
    expect(pickCurrentPeriod(profile, 2026)).toEqual({ periodLabel: 'Year 2', periodYear: 2024 })
  })

  it('never returns "Before graduating" for a recently-completed profile', () => {
    const profile = { studyStage: 'recently-completed', graduationYear: '2025' }
    const result = pickCurrentPeriod(profile, 2026)
    expect(result.periodLabel).not.toBe('Before graduating')
    expect(result).toEqual({ periodLabel: 'Year 1 after graduating', periodYear: 2026 })
  })
  ```
  Run `npm test` and confirm all three fail (function doesn't exist yet).
- **Implementation (green):** in `src/lib/roadmap.js`, add and export:
  ```js
  export function pickCurrentPeriod(profile, currentYear = new Date().getFullYear()) {
    const withYears = getExpectedPeriodLabels(profile)
      .map((label) => ({ label, year: periodYearFor(label, profile) }))
      .filter((p) => p.year !== null)
    const chosen = withYears.find((p) => p.year >= currentYear) ?? withYears[withYears.length - 1]
    return { periodLabel: chosen.label, periodYear: chosen.year }
  }
  ```
- **Refactor:** None expected.
- **Acceptance criteria:** all three new tests pass; existing `roadmap.test.js` tests still pass.
- **Review gate:** No gate — green tests + acceptance criteria are sufficient.
- **Depends on:** None.

### Task 3: `src/lib/marketUpdates.js` — pure filtering/classification-safety logic [x]

- **Description:** New module holding the fixed topic/status enums and all pure narrowing logic: profile matching, recency bucketing, enum-safety validation of an AI-classified item, and combined filter+sort.
- **Files touched:** new `src/lib/marketUpdates.js`, new `src/lib/marketUpdates.test.js`.
- **Tests first (red):** in `src/lib/marketUpdates.test.js`:
  ```js
  import { describe, it, expect } from 'vitest'
  import { TOPICS, STATUS_LABELS, matchesProfile, recencyBucket, isValidClassifiedItem, filterAndSortUpdates } from './marketUpdates'

  describe('matchesProfile', () => {
    it('matches when occupation substring (case-insensitive) and state both match', () => {
      expect(matchesProfile({ occupation: 'Registered Nurse', state: 'NSW' }, { targetOccupation: 'registered nurse', state: 'NSW' })).toBe(true)
    })
    it('matches a National-scope item regardless of profile state', () => {
      expect(matchesProfile({ occupation: 'Carpenter', state: 'National' }, { targetOccupation: 'Carpenter', state: 'QLD' })).toBe(true)
    })
    it('does not match when occupation differs', () => {
      expect(matchesProfile({ occupation: 'Carpenter', state: 'National' }, { targetOccupation: 'Registered Nurse', state: 'QLD' })).toBe(false)
    })
    it('does not match when state differs and item is not National', () => {
      expect(matchesProfile({ occupation: 'Carpenter', state: 'VIC' }, { targetOccupation: 'Carpenter', state: 'QLD' })).toBe(false)
    })
  })

  describe('recencyBucket', () => {
    it('buckets a date within 7 days as this-week', () => {
      expect(recencyBucket('2026-09-10', new Date('2026-09-13'))).toBe('this-week')
    })
    it('buckets a date within 30 days (but not 7) as this-month', () => {
      expect(recencyBucket('2026-08-20', new Date('2026-09-13'))).toBe('this-month')
    })
    it('buckets anything older as older', () => {
      expect(recencyBucket('2026-01-01', new Date('2026-09-13'))).toBe('older')
    })
  })

  describe('isValidClassifiedItem', () => {
    it('accepts an item with an in-enum topic and statusLabel and non-empty text fields', () => {
      expect(isValidClassifiedItem({ headline: 'H', summary: 'S', whyItMatters: 'W', topic: 'Technology', statusLabel: 'Forecast' })).toBe(true)
    })
    it('rejects an out-of-enum topic', () => {
      expect(isValidClassifiedItem({ headline: 'H', summary: 'S', whyItMatters: 'W', topic: 'Sports', statusLabel: 'Forecast' })).toBe(false)
    })
    it('rejects an out-of-enum statusLabel', () => {
      expect(isValidClassifiedItem({ headline: 'H', summary: 'S', whyItMatters: 'W', topic: 'Technology', statusLabel: 'Rumour' })).toBe(false)
    })
    it('rejects a missing/empty required text field', () => {
      expect(isValidClassifiedItem({ headline: '', summary: 'S', whyItMatters: 'W', topic: 'Technology', statusLabel: 'Forecast' })).toBe(false)
    })
  })

  describe('filterAndSortUpdates', () => {
    const items = [
      // Phase 1 correction: originally publishedDate: '2026-09-01' (12 days
      // before the 'today' below), which recencyBucket buckets as
      // this-month, not this-week as the "filters by recency bucket" test
      // below requires — moved to 2026-09-10 (within 7 days).
      { id: 'a', topic: 'Technology', publishedDate: '2026-09-10', headline: 'AI shortage', summary: 'x', source: 'JSA' },
      { id: 'b', topic: 'Policy', publishedDate: '2026-08-01', headline: 'Visa change', summary: 'y', source: 'Home Affairs' },
    ]
    it('returns all items sorted newest-first when topic is All and recency is All and search is empty', () => {
      expect(filterAndSortUpdates(items, { topic: 'All', recency: 'All', search: '' }, new Date('2026-09-13')).map((i) => i.id)).toEqual(['a', 'b'])
    })
    it('filters by topic', () => {
      expect(filterAndSortUpdates(items, { topic: 'Policy', recency: 'All', search: '' }, new Date('2026-09-13')).map((i) => i.id)).toEqual(['b'])
    })
    it('filters by recency bucket', () => {
      expect(filterAndSortUpdates(items, { topic: 'All', recency: 'this-week', search: '' }, new Date('2026-09-13')).map((i) => i.id)).toEqual(['a'])
    })
    it('filters by case-insensitive search across headline/summary/topic/source', () => {
      expect(filterAndSortUpdates(items, { topic: 'All', recency: 'All', search: 'visa' }, new Date('2026-09-13')).map((i) => i.id)).toEqual(['b'])
    })
  })
  ```
  Run `npm test` and confirm all fail (module doesn't exist).
- **Implementation (green):** in `src/lib/marketUpdates.js`:
  ```js
  export const TOPICS = ['Economy', 'Policy', 'Regulation', 'Technology', 'Workforce demand', 'Employer activity']
  export const STATUS_LABELS = ['Confirmed change', 'Proposal', 'Forecast', 'Research', 'Commentary']

  export function matchesProfile(item, profile) {
    const occupationMatches = (item.occupation ?? '').toLowerCase().includes((profile.targetOccupation ?? '').toLowerCase())
    const stateMatches = item.state === 'National' || item.state === profile.state
    return occupationMatches && stateMatches
  }

  export function recencyBucket(publishedDate, today = new Date()) {
    const days = (today - new Date(publishedDate)) / (1000 * 60 * 60 * 24)
    if (days <= 7) return 'this-week'
    if (days <= 30) return 'this-month'
    return 'older'
  }

  export function isValidClassifiedItem(item) {
    return TOPICS.includes(item.topic)
      && STATUS_LABELS.includes(item.statusLabel)
      && Boolean(item.headline) && Boolean(item.summary) && Boolean(item.whyItMatters)
  }

  export function filterAndSortUpdates(items, { topic, recency, search }, today = new Date()) {
    const q = search.trim().toLowerCase()
    return items
      .filter((i) => topic === 'All' || i.topic === topic)
      .filter((i) => recency === 'All' || recencyBucket(i.publishedDate, today) === recency)
      .filter((i) => !q || [i.headline, i.summary, i.topic, i.source].some((f) => (f ?? '').toLowerCase().includes(q)))
      .sort((a, b) => new Date(b.publishedDate) - new Date(a.publishedDate))
  }
  ```
- **Refactor:** None expected.
- **Acceptance criteria:** all listed tests pass.
- **Review gate:** No gate — green tests + acceptance criteria are sufficient (pure derived logic; the enum values it enforces are reviewed as part of Task 4/Task 8's sourcing-surface gates, not here).
- **Depends on:** None.

### Task 4: `summariseMarketUpdate` — add `topic` classification [x]

- **Description:** Extend the existing prompt/return-shape so each summarised item also carries a `topic` from the fixed enum, alongside its existing `statusLabel`.
- **Files touched:** `src/lib/ai.js`, `src/lib/ai.test.js`.
- **Tests first (red):** in `src/lib/ai.test.js`, extend the file with:
  ```js
  import { summariseMarketUpdate } from './ai'
  import { TOPICS } from './marketUpdates'

  describe('summariseMarketUpdate', () => {
    it('asks the model to classify a topic from the fixed enum, alongside headline/summary/statusLabel/whyItMatters', async () => {
      global.fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ task: 'market-update', text: '{}' }) })
      await summariseMarketUpdate({ sourceText: 'Nurses in shortage', occupation: 'Registered Nurse', state: 'NSW' })
      const [, options] = global.fetch.mock.calls[0]
      const body = JSON.parse(options.body)
      TOPICS.forEach((topic) => expect(body.prompt).toContain(`"${topic}"`))
      expect(body.prompt).toContain('- topic:')
    })
  })
  ```
  Run `npm test` and confirm it fails (prompt doesn't mention topic yet).
- **Implementation (green):** in `src/lib/ai.js`, import `{ TOPICS }` from `./marketUpdates` and update the prompt/return-shape docs:
  ```js
  import { TOPICS } from './marketUpdates'
  // ...
  export async function summariseMarketUpdate({ sourceText, occupation, state }) {
    const prompt = `You are a career-guidance assistant. Summarise this sourced item for an
  international student targeting the occupation "${occupation}" in ${state}, Australia.

  Source text: ${sourceText}

  Return a JSON object with:
  - headline: string
  - summary: string (2-3 sentences, factual)
  - statusLabel: "Confirmed change" | "Proposal" | "Forecast" | "Research" | "Commentary"
  - topic: one of exactly these values: ${JSON.stringify(TOPICS)}
  - whyItMatters: string (relevance to this student's career goal)
  Do not include any text outside the JSON object.`
    const { text } = await callGenerate(prompt, 'market-update')
    return text
  }
  ```
- **Refactor:** None expected.
- **Acceptance criteria:** new test passes; existing `ai.test.js` tests unaffected.
- **Review gate:** **Human review:** sourcing/compliance surface (condition 2) — this is the prompt that produces the topic/status labels shown to students. Confirm the prompt wording in `src/lib/ai.js` names the exact same topic enum as `TOPICS` and doesn't invite the model to invent a value outside it.
- **Depends on:** Task 3 (imports `TOPICS`).

### Task 5: `db.js` persistence helpers

- **Description:** Add the four new Supabase-backed functions this feature needs, following this file's existing error-handling convention exactly.
- **Files touched:** `src/lib/db.js`, `src/lib/db.test.js`.
- **Tests first (red):** in `src/lib/db.test.js`, extend the imports and add:
  ```js
  import {
    // ...existing imports,
    getSavedMarketUpdates, setMarketUpdateStatus, addPlanActivityFromUpdate, setUpdateFrequency,
  } from './db'

  describe('market-update helpers', () => {
    it('getSavedMarketUpdates returns the rows for a user', async () => {
      mockFrom.mockReturnValueOnce(chain({ data: [{ source_id: 's1', status: 'saved' }], error: null }))
      expect(await getSavedMarketUpdates('u1')).toEqual([{ source_id: 's1', status: 'saved' }])
    })

    it('setMarketUpdateStatus upserts a (user_id, source_id) row with the given status', async () => {
      mockFrom.mockReturnValueOnce(chain({ error: null }))
      await expect(setMarketUpdateStatus('u1', 's1', 'saved')).resolves.toBeUndefined()
      expect(mockFrom).toHaveBeenCalledWith('saved_market_updates')
    })

    it('addPlanActivityFromUpdate inserts one activities row and returns it', async () => {
      mockFrom.mockReturnValueOnce(chain({ data: { id: 'a9' }, error: null }))
      const result = await addPlanActivityFromUpdate('p1', 'u1', {
        title: 'Investigate nurse shortage', category: 'Commercial and industry awareness',
        periodLabel: 'Year 2', periodYear: 2026, priority: 'Medium', explanation: 'why',
      })
      expect(result).toEqual({ id: 'a9' })
    })

    it('setUpdateFrequency updates the profiles row for the given user', async () => {
      mockFrom.mockReturnValueOnce(chain({ error: null }))
      await expect(setUpdateFrequency('u1', 'daily')).resolves.toBeUndefined()
      expect(mockFrom).toHaveBeenCalledWith('profiles')
    })

    it('setMarketUpdateStatus throws with the underlying error message on failure', async () => {
      mockFrom.mockReturnValueOnce(chain({ error: { message: 'boom' } }))
      await expect(setMarketUpdateStatus('u1', 's1', 'saved')).rejects.toThrow('boom')
    })
  })
  ```
  Run `npm test` and confirm all fail (functions don't exist).
- **Implementation (green):** in `src/lib/db.js`, add:
  ```js
  export async function getSavedMarketUpdates(userId) {
    const { data, error } = await supabase.from('saved_market_updates').select('*').eq('user_id', userId)
    if (error) throw new Error(error.message)
    return data ?? []
  }

  export async function setMarketUpdateStatus(userId, sourceId, status) {
    const { error } = await supabase.from('saved_market_updates')
      .upsert({ user_id: userId, source_id: sourceId, status, updated_at: new Date().toISOString() }, { onConflict: 'user_id,source_id' })
    if (error) throw new Error(error.message)
  }

  export async function addPlanActivityFromUpdate(planId, userId, activity) {
    const { data, error } = await supabase.from('activities').insert({
      plan_id: planId,
      user_id: userId,
      title: activity.title,
      category: activity.category,
      period_label: activity.periodLabel,
      period_year: activity.periodYear,
      priority: activity.priority,
      explanation: activity.explanation,
      status: 'Not started',
    }).select().single()
    if (error) throw new Error(error.message)
    return data
  }

  export async function setUpdateFrequency(userId, frequency) {
    const { error } = await supabase.from('profiles')
      .update({ update_frequency: frequency, updated_at: new Date().toISOString() }).eq('user_id', userId)
    if (error) throw new Error(error.message)
  }
  ```
- **Refactor:** None expected.
- **Acceptance criteria:** all new tests pass; existing `db.test.js` tests unaffected.
- **Review gate:** No gate — green tests + acceptance criteria are sufficient (CRUD only; the schema itself was already reviewed in Task 1).
- **Depends on:** Task 1 (tables/columns must exist for this to work against real Supabase, though the mocked tests don't require it).

### Task 6: Seed real, sourced items in `src/data/marketSources.js`

- **Description:** Populate the curated array with 6–9 real items across Registered Nurse (NSW), Carpenter (VIC), and Early Childhood Teacher (QLD), using the real government sources already located during brainstorming (jobsandskills.gov.au occupation-and-industry profiles; the ANMF 2026 Occupation Shortage List submission for a non-"Confirmed change" example). Each item's `sourceText`, `publishedDate`, and `retrievedDate` must be taken from the actual page content at the time of this task, via `WebFetch` on the real URL — not approximated from the earlier `WebSearch` summaries.
- **Files touched:** `src/data/marketSources.js`.
- **Tests first (red):** None (this is static curated data, not logic under test) — instead, the acceptance criteria below substitute for a red/green cycle.
- **Implementation (green):** `WebFetch` each of:
  - `https://www.jobsandskills.gov.au/data/occupation-and-industry-profiles/occupations-anzsco/2544-registered-nurses`
  - `https://www.jobsandskills.gov.au/data/occupation-and-industry-profiles/occupations-anzsco/331212-carpenters`
  - `https://www.jobsandskills.gov.au/data/occupation-and-industry-profiles/occupations/2411-early-childhood-pre-primary-school-teachers`
  - the ANMF 2026 Occupation Shortage List submission PDF found during brainstorming
  and any one further source per occupation for status-label variety (e.g. a forecast/commentary piece), extracting real quoted text, the page's own stated date (or "last updated" date) as `publishedDate`, and today's date as `retrievedDate`. Add each as:
  ```js
  {
    id: 'registered-nurse-nsw-jsa-2026',
    sourceText: '<verbatim/quoted excerpt from the real page>',
    occupation: 'Registered Nurse',
    state: 'NSW', // or 'National' if the source isn't state-specific
    source: 'Jobs and Skills Australia',
    publishedDate: '<real date from the page>',
    retrievedDate: '<today's date>',
  },
  ```
  If a source page's exact publication date cannot be determined, that item is not added (per CLAUDE.md: "If a claim cannot be backed by a real source, do not display it").
- **Refactor:** None expected.
- **Acceptance criteria:**
  - Every item has a unique `id`, and `source`/`publishedDate`/`retrievedDate` traceable to a real, still-reachable URL.
  - At least one item per occupation (Registered Nurse/NSW, Carpenter/VIC, Early Childhood Teacher/QLD), and at least one item is `state: 'National'`.
  - No item's `sourceText` is invented or paraphrased beyond a direct quote/close paraphrase of the real source.
- **Review gate:** **Human review:** sourcing/compliance surface (condition 2) — this is real user-facing job-market/migration content. Confirm each item's `source`/`publishedDate`/`retrievedDate` against the actual URL before accepting.
- **Depends on:** None.

### Task 7: `src/components/UpdateDetailPanel.jsx`

- **Description:** New modal detail panel (mirrors `CheckpointPanel.jsx`'s structure) shown when a card is clicked — full "why this matters," source/date/status-label detail, and Save/Dismiss/Add-to-plan actions.
- **Files touched:** new `src/components/UpdateDetailPanel.jsx`, new `src/components/UpdateDetailPanel.test.jsx`.
- **Tests first (red):** in `src/components/UpdateDetailPanel.test.jsx`:
  ```js
  import { describe, it, expect, vi } from 'vitest'
  import { render, screen, fireEvent } from '@testing-library/react'

  import UpdateDetailPanel from './UpdateDetailPanel'

  const update = {
    id: 'u1', headline: 'Nurse shortage continues', summary: 'Summary text.',
    whyItMatters: 'This affects your target occupation.', statusLabel: 'Research',
    topic: 'Workforce demand', source: 'Jobs and Skills Australia',
    publishedDate: '2026-08-01', retrievedDate: '2026-09-13',
  }

  function renderPanel(props = {}) {
    return render(
      <UpdateDetailPanel
        update={update} savedStatus={null} canAddToPlan={true}
        onClose={vi.fn()} onSave={vi.fn()} onDismiss={vi.fn()} onAddToPlan={vi.fn()}
        {...props}
      />
    )
  }

  it('shows headline, summary, why-it-matters, status label, source, and both dates', () => {
    renderPanel()
    expect(screen.getByText('Nurse shortage continues')).toBeInTheDocument()
    expect(screen.getByText('Summary text.')).toBeInTheDocument()
    expect(screen.getByText('This affects your target occupation.')).toBeInTheDocument()
    expect(screen.getByText('Research')).toBeInTheDocument()
    expect(screen.getByText(/Jobs and Skills Australia/)).toBeInTheDocument()
    expect(screen.getByText(/2026-08-01/)).toBeInTheDocument()
    expect(screen.getByText(/2026-09-13/)).toBeInTheDocument()
  })

  it('calls onSave when the Save button is clicked, and reflects an already-saved status', () => {
    const onSave = vi.fn()
    renderPanel({ onSave, savedStatus: 'saved' })
    expect(screen.getByRole('button', { name: /saved/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /saved/i }))
    expect(onSave).toHaveBeenCalled()
  })

  it('calls onDismiss when Dismiss is clicked', () => {
    const onDismiss = vi.fn()
    renderPanel({ onDismiss })
    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }))
    expect(onDismiss).toHaveBeenCalled()
  })

  it('calls onAddToPlan when Add to plan is clicked, and disables it when canAddToPlan is false', () => {
    const onAddToPlan = vi.fn()
    renderPanel({ onAddToPlan })
    fireEvent.click(screen.getByRole('button', { name: /add to plan/i }))
    expect(onAddToPlan).toHaveBeenCalled()
  })

  it('disables Add to plan when canAddToPlan is false, with an explanatory note', () => {
    renderPanel({ canAddToPlan: false })
    expect(screen.getByRole('button', { name: /add to plan/i })).toBeDisabled()
    expect(screen.getByText(/create a plan first/i)).toBeInTheDocument()
  })
  ```
  Run `npm test` and confirm all fail (component doesn't exist).
- **Implementation (green):** new `src/components/UpdateDetailPanel.jsx`:
  ```jsx
  export default function UpdateDetailPanel({ update, savedStatus, canAddToPlan, onClose, onSave, onDismiss, onAddToPlan }) {
    return (
      <div role="dialog" aria-label={update.headline} className="diary-note diary-note--no-tape max-h-[85vh] overflow-y-auto rounded-2xl border-2 border-amber-100 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-diary-title text-2xl font-semibold text-slate-900">{update.headline}</p>
            <p className="font-diary-body text-xs text-slate-500">{update.topic} · {update.statusLabel}</p>
          </div>
          <button type="button" onClick={onClose} className="font-diary-title text-lg text-slate-500 hover:text-slate-800">Close</button>
        </div>
        <p className="font-diary-body mt-3 text-sm text-slate-600">{update.summary}</p>
        <p className="font-diary-body mt-3 text-sm italic text-slate-500">{update.whyItMatters}</p>
        <p className="font-diary-body mt-3 text-xs text-slate-500">
          Source: {update.source} · Published {update.publishedDate} · Retrieved {update.retrievedDate}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" onClick={onSave} className="font-diary-title rounded-lg border-2 border-slate-300 bg-white px-4 py-1 text-sm text-slate-700">
            {savedStatus === 'saved' ? 'Saved' : 'Save'}
          </button>
          <button type="button" onClick={onDismiss} className="font-diary-title rounded-lg border-2 border-slate-300 bg-white px-4 py-1 text-sm text-slate-700">
            Dismiss
          </button>
          <button type="button" onClick={onAddToPlan} disabled={!canAddToPlan} className="font-diary-title rounded-lg bg-indigo-700 px-4 py-1 text-sm text-white disabled:opacity-50">
            Add to plan
          </button>
        </div>
        {!canAddToPlan && <p className="font-diary-body mt-2 text-xs text-slate-500">Create a plan first to add this as an activity.</p>}
      </div>
    )
  }
  ```
- **Refactor:** None expected.
- **Acceptance criteria:** all listed tests pass.
- **Review gate:** **Human review:** sourcing/compliance surface (condition 2) — this panel is where source/date/status-label are displayed together with the career-relevance explanation. Confirm the labels render unambiguously (status label and topic visually distinct, dates clearly attributed to "Published"/"Retrieved").
- **Depends on:** None.

### Task 8: Rewrite `src/pages/MarketUpdates.jsx`

- **Description:** Replace the placeholder with the full two-page-spread feed: load profile/plan/saved-state, fetch+classify matching curated items, apply filters, render cards, wire Save/Dismiss/Add-to-plan/frequency, both empty states, and the disclaimer footer. Preserve the existing signed-out locked prompt unchanged.
- **Files touched:** `src/pages/MarketUpdates.jsx`, `src/pages/MarketUpdates.test.jsx`.
- **Tests first (red):** rewrite `src/pages/MarketUpdates.test.jsx` (mocking `../lib/auth`, `../lib/db`, `../lib/ai`, and `../data/marketSources` as in `Roadmap.test.jsx`'s established style):
  ```js
  const mockUseAuth = vi.fn()
  vi.mock('../lib/auth', () => ({ useAuth: () => mockUseAuth() }))
  vi.mock('../lib/db', () => ({
    getProfile: vi.fn(), getPlanWithActivities: vi.fn(), getSavedMarketUpdates: vi.fn(),
    setMarketUpdateStatus: vi.fn(), addPlanActivityFromUpdate: vi.fn(), setUpdateFrequency: vi.fn(),
  }))
  vi.mock('../lib/ai', () => ({ summariseMarketUpdate: vi.fn() }))
  vi.mock('../data/marketSources', () => ({ marketSources: [
    { id: 's1', occupation: 'Registered Nurse', state: 'NSW', source: 'JSA', sourceText: 'x', publishedDate: '2026-09-01', retrievedDate: '2026-09-13' },
  ] }))
  import * as db from '../lib/db'
  import * as ai from '../lib/ai'

  describe('MarketUpdates gating', () => {
    it('still shows the locked prompt for a signed-out guest', () => { /* unchanged from existing test */ })
  })

  describe('MarketUpdates feed', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ user: { id: 'u1' } })
      db.getProfile.mockResolvedValue({ target_occupation: 'Registered Nurse', state: 'NSW', update_frequency: 'weekly' })
      db.getPlanWithActivities.mockResolvedValue({ plan: { id: 'p1' }, activities: [] })
      db.getSavedMarketUpdates.mockResolvedValue([])
      ai.summariseMarketUpdate.mockResolvedValue(JSON.stringify({
        headline: 'Nurse shortage continues', summary: 'Summary.', statusLabel: 'Research',
        topic: 'Workforce demand', whyItMatters: 'Relevant to you.',
      }))
    })

    it('shows a matching card with headline, status label, and dates once loaded', async () => {
      render(<MemoryRouter><MarketUpdates /></MemoryRouter>)
      expect(await screen.findByText('Nurse shortage continues')).toBeInTheDocument()
      expect(screen.getByText('Research')).toBeInTheDocument()
    })

    it('shows the "nothing seeded" empty state when no source item matches the profile', async () => {
      db.getProfile.mockResolvedValue({ target_occupation: 'Carpenter', state: 'VIC', update_frequency: 'weekly' })
      render(<MemoryRouter><MarketUpdates /></MemoryRouter>)
      expect(await screen.findByText(/nothing has been curated for your profile yet/i)).toBeInTheDocument()
    })

    it('shows the "no filter matches" empty state distinctly from the "nothing seeded" one', async () => {
      render(<MemoryRouter><MarketUpdates /></MemoryRouter>)
      await screen.findByText('Nurse shortage continues')
      fireEvent.click(screen.getByRole('button', { name: 'Regulation' }))
      expect(await screen.findByText(/no updates match your current filters/i)).toBeInTheDocument()
    })

    it('excludes an item whose classified topic is outside the fixed enum', async () => {
      ai.summariseMarketUpdate.mockResolvedValue(JSON.stringify({
        headline: 'Bad item', summary: 'x', statusLabel: 'Research', topic: 'Sports', whyItMatters: 'x',
      }))
      render(<MemoryRouter><MarketUpdates /></MemoryRouter>)
      expect(await screen.findByText(/nothing has been curated for your profile yet/i)).toBeInTheDocument()
      expect(screen.queryByText('Bad item')).not.toBeInTheDocument()
    })

    it('displays the general-career-information disclaimer', async () => {
      render(<MemoryRouter><MarketUpdates /></MemoryRouter>)
      await screen.findByText('Nurse shortage continues')
      expect(screen.getByText(/general career information, not financial, investment, legal or migration advice/i)).toBeInTheDocument()
    })

    it('toggles save on a card via the detail panel and calls setMarketUpdateStatus', async () => {
      render(<MemoryRouter><MarketUpdates /></MemoryRouter>)
      fireEvent.click(await screen.findByText('Nurse shortage continues'))
      fireEvent.click(screen.getByRole('button', { name: /^save$/i }))
      expect(db.setMarketUpdateStatus).toHaveBeenCalledWith('u1', 's1', 'saved')
    })

    it('dismisses a card via the detail panel and removes it from the feed', async () => {
      render(<MemoryRouter><MarketUpdates /></MemoryRouter>)
      fireEvent.click(await screen.findByText('Nurse shortage continues'))
      fireEvent.click(screen.getByRole('button', { name: /dismiss/i }))
      expect(db.setMarketUpdateStatus).toHaveBeenCalledWith('u1', 's1', 'dismissed')
      expect(screen.queryByText('Nurse shortage continues')).not.toBeInTheDocument()
    })

    it('adds a card to the plan via addPlanActivityFromUpdate', async () => {
      render(<MemoryRouter><MarketUpdates /></MemoryRouter>)
      fireEvent.click(await screen.findByText('Nurse shortage continues'))
      fireEvent.click(screen.getByRole('button', { name: /add to plan/i }))
      expect(db.addPlanActivityFromUpdate).toHaveBeenCalledWith('p1', 'u1', expect.objectContaining({ title: 'Nurse shortage continues' }))
    })

    it('changes and persists the update-frequency preference', async () => {
      render(<MemoryRouter><MarketUpdates /></MemoryRouter>)
      await screen.findByText('Nurse shortage continues')
      fireEvent.change(screen.getByLabelText(/update frequency/i), { target: { value: 'daily' } })
      expect(db.setUpdateFrequency).toHaveBeenCalledWith('u1', 'daily')
    })
  })
  ```
  Run `npm test` and confirm all new cases fail (current placeholder has none of this behaviour).
- **Implementation (green):** Rewrite `src/pages/MarketUpdates.jsx`:
  - Keep the existing signed-out branch verbatim.
  - On mount (signed-in): `getProfile(user.id)` → normalise to `{ targetOccupation: profile.target_occupation, state: profile.state }`; `getPlanWithActivities(user.id)` → `plan` (nullable); `getSavedMarketUpdates(user.id)` → map to `{ [source_id]: status }`.
  - Compute `matched = marketSources.filter((item) => matchesProfile(item, normalisedProfile))`.
  - `Promise.all(matched.map(async (item) => { const text = await summariseMarketUpdate(item); const parsed = JSON.parse(text); return isValidClassifiedItem(parsed) ? { ...item, ...parsed } : null }))`, filter out `null`s and any whose `source_id` status is `'dismissed'`. (`summariseMarketUpdate` resolves the raw JSON string directly — no `{ text }` destructuring — per the corrected §3 note above.)
  - Loading state: `Loading updates…` (mirrors Roadmap's `Centered` "Building your plan…" pattern) until the above resolves.
  - Local state: `topic` (default `'All'`), `recency` (default `'All'`), `search` (default `''`), `openId` (for the detail panel).
  - Render: outer side-tab nav (same `TABS`/markup as `Roadmap.jsx`) wrapping a two-`diary-note` flex layout — left page (static cover copy + a single highlighted, non-interactive "For you" label) and right page (date header, search input, topic-chip buttons — `All` + `TOPICS` from `marketUpdates.js` — recency select, frequency `<select>` labelled "Update frequency", card list from `filterAndSortUpdates(classified, { topic, recency, search })`).
  - Card: topic icon (simple emoji/text badge per topic, no photos), headline, summary, status-label pill, `Source: {source} · Published {publishedDate} · Retrieved {retrievedDate}`, bookmark toggle reflecting `savedMap[item.id]`. `onClick` opens `UpdateDetailPanel` in the same `fixed inset-0 z-50` backdrop pattern as `Roadmap.jsx`'s `CheckpointPanel`.
  - Empty states: if `matched.length === 0` → "Nothing has been curated for your profile yet." else if filtered list is empty → "No updates match your current filters."
  - Disclaimer footer: "This is general career information, not financial, investment, legal or migration advice."
  - Handlers: `handleSave`/`handleDismiss` call `setMarketUpdateStatus(user.id, item.id, status)` and update local `savedMap`/remove from list; `handleAddToPlan` computes `pickCurrentPeriod(normalisedProfile)` from `roadmap.js`, then calls `addPlanActivityFromUpdate(plan.id, user.id, { title: item.headline, category: 'Commercial and industry awareness', priority: 'Medium', explanation: item.whyItMatters, ...period })`; `handleFrequencyChange` calls `setUpdateFrequency(user.id, value)`.
- **Refactor:** None expected.
- **Acceptance criteria:** all listed tests pass (existing signed-out test unchanged); `npm test` passes for the full suite.
- **Review gate:** **Human review:** sourcing/compliance surface (condition 2) — this is the primary screen displaying job-market/migration information to students. Confirm in the running app (`vercel dev`) that status labels are visually distinct, both empty states read correctly, the disclaimer is visible, and no card ever renders without a source/published/retrieved date.
- **Depends on:** Tasks 1–7.

## 6. Feature-level Definition of Done

- [ ] Every task in §5 complete and its tests passing
- [ ] `npm test` passes
- [ ] `npm run lint` — best-effort (repo currently has no `eslint.config.js`; skip if still absent, matching the precedent in `plans/2026-09-12-news-gating.md`)
- [ ] Manually verified (`vercel dev`): sign in with a profile matching one seeded occupation/state → feed loads → filter by topic → filter by recency → search → open a card → Save (persists on reload) → Add to plan (appears on `/plan`) → Dismiss (disappears) → change frequency (persists on reload) → sign out → locked prompt still shows.
- [ ] Every requirement in §2 is covered — see §7
- [ ] Every gated task (Tasks 1, 4, 6, 7, 8) has been shown to the user and explicitly accepted
- [ ] No item remains in §8

## 7. Requirements coverage check

| Requirement | Covered by |
| --- | --- |
| 2.1.1 | Task 8 |
| 2.1.2 | Task 4, Task 7, Task 8 |
| 2.1.3 | Task 3, Task 8 |
| 2.1.4 | Task 1, Task 5, Task 7, Task 8 |
| 2.1.5 | Task 1, Task 2, Task 5, Task 7, Task 8 |
| 2.1.6 | Task 1, Task 5, Task 8 |
| 2.1.7 | Task 8 |
| 2.1.8 | Task 3, Task 4, Task 8 |
| 2.1.9 | Task 8 |
| 2.1.10 | Task 8 (preserved unchanged) |

## 8. Risks / open questions

None.
