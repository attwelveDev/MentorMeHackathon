# State-by-state job market & migration trend updates (Capability 3, Screen 6)

- **Date:** 2026-09-13
- **Status:** Draft
- **Approved by user:** yes — 2026-09-13

## 1. Define

**Problem statement:** International students lose track of how their target
occupation's job market and migration settings are actually shifting once
they're mid-course, because generic news isn't filtered to their occupation,
state, or career stage. Planery helps by surfacing a personalised,
sourced, date-stamped feed of occupation-relevant updates — clearly labelled
by confidence — so students can build industry/commercial awareness and turn
a development into a concrete plan action.

**User stories:**

| # | Story | Acceptance criteria |
| --- | --- | --- |
| 6 | As an international student, I want regularly refreshed news and market updates related to my target occupation in my current state, so that I can understand changing industry conditions and build commercial/industry awareness. | Given a target occupation/industry and Australian state on my profile, when relevant curated updates exist, I see a feed of cards, each with headline, summary, source, publication date, retrieved date, a status label (Confirmed change / Proposal / Forecast / Research / Commentary), and a "why this matters for your career" explanation. I can filter by topic (Economy, Policy, Regulation, Technology, Workforce demand, Employer activity) and by recency (This week / This month / Older). I can save or dismiss any card, and add a card as a new activity on my roadmap. If nothing is seeded for my profile, or nothing matches my current filters, I see an explanatory empty state (the two cases are distinguishable). The screen is labelled as general career information, not financial, legal, or migration advice. |

**Sourcing rule check:** every seeded item traces to a real, retrievable
government/industry source (jobsandskills.gov.au occupation-and-industry
profiles, ANMF workforce submissions, etc.), each with a real publication
date and a real retrieved date recorded at curation time — nothing
fabricated, per CLAUDE.md. Gemini is only used to summarise/label a supplied
source item (headline, summary, statusLabel, topic, whyItMatters); it never
originates a claim or fetches live news itself.

## 2. Design

**Alternatives considered:**
- Reproducing the mockup's 5-item left-page menu (For you / Industry trends /
  Career advice / Company updates / Learning resources) verbatim — rejected;
  4 of the 5 don't map to any real distinct data source we have, so they'd be
  decorative dead ends. Reduced to a single "For you" entry.
- Using the mockup's own example topic chips (Technology, Career Tips,
  Graduate Programs, AI & Data, Remote Work) — rejected in favour of the
  acceptance criteria's named topics (Economy, Policy, Regulation, Technology,
  Workforce demand, Employer activity), since those are what the user story
  actually specifies as filterable.
- Photo thumbnails per card (as in the mockup) — rejected; no verified,
  rights-clear image exists per article without fabricating/mis-attributing
  one. Replaced with a static, generic icon per topic (decorative only, not
  tied to any specific claim).
- Actual email/push digest delivery for "update frequency" — rejected; this
  stack (Vercel + Supabase free tier + Gemini) has no notification
  infrastructure. Implemented as a stored preference only.
- Local-only (non-persisted) save/dismiss/add-to-plan — rejected in favour of
  Supabase-backed persistence, consistent with how Roadmap/Diary already
  persist per-account state.

**Screens:**

| Screen | Purpose | Content | Primary action | Optional fields | Validations | Error states |
| --- | --- | --- | --- | --- | --- | --- |
| News (`src/pages/MarketUpdates.jsx`, route `/updates`, rewritten) | Show a personalised, sourced feed of occupation/state-relevant updates and let the student act on one | Outer side-tab nav (Diary/News/Profile, unchanged from Roadmap's `TABS`) wrapping an inner two-page spread: **left page** — static "News" cover copy/tagline + a single non-interactive "For you" entry shown as the active view; **right page** — date header, search box, topic chips (All + the 6 acceptance-criteria topics), a recency control (This week/This month/Older/All) and update-frequency preference (Daily/Weekly/Off) behind a filter-icon control, and a scrollable list of update cards (topic icon, headline, summary, status-label pill, source · published · retrieved, save/bookmark toggle) | Click a card → detail panel (modal, mirrors `CheckpointPanel`'s pattern) showing full "why this matters," and Save / Dismiss / Add-to-plan actions | — | None (read/filter-only screen plus toggle actions) | Existing signed-out locked prompt unchanged; "nothing seeded for your profile yet" vs "nothing matches your current filters" are distinct empty states; add-to-plan failure (Supabase error) shows an inline error, not a silent no-op |

**Data (Supabase/Postgres):**
- New table `saved_market_updates` (id, user_id, source_id text, status text check in ('saved','dismissed'), created_at, updated_at) — RLS scoped to `auth.uid()`, one row per (user_id, source_id) via upsert, following the existing per-table RLS-policy pattern in `plans/2026-09-12-supabase-schema.md`.
- New column `profiles.update_frequency` (text, check in ('daily','weekly','off'), default 'weekly').
- `src/data/marketSources.js`: each curated entry gains a stable, unique `id` string; existing fields (`sourceText`, `occupation`, `state`, `source`, `publishedDate`, `retrievedDate`) kept. `state` may be `'National'` for items not tied to one state (e.g. a national occupation-shortage list), matching any profile's state.

**Logic:**
- Personalisation match: an item is shown if `item.occupation` case-insensitively/substring-matches `profile.targetOccupation`, AND (`item.state === profile.state` OR `item.state === 'National'`). Best-effort, not exact — accepted limitation (see §5.2).
- Topic/status classification: `summariseMarketUpdate({ sourceText, occupation, state })` in `src/lib/ai.js` extended to also return `topic` (one of the 6 acceptance-criteria values) alongside its existing `headline`/`summary`/`statusLabel`/`whyItMatters`. If the AI response's `topic` or `statusLabel` falls outside its fixed enum, the item is treated as unusable and excluded from the feed (fail safe, per CLAUDE.md's sourcing rule — never show unlabelled/malformed claims).
- Recency buckets computed from `publishedDate` relative to "today": This week (≤7 days), This month (≤30 days), Older (>30 days).
- Search matches case-insensitively against headline, summary, topic, and source name.
- New pure-logic module `src/lib/marketUpdates.js`: exports the occupation/state match, recency-bucket, and combined filter functions, unit-tested like `roadmap.js`.

**AI (`src/lib/ai.js`):** `summariseMarketUpdate` prompt updated to also emit
`topic` from the fixed 6-value enum; return shape becomes `{ headline,
summary, statusLabel, topic, whyItMatters }`.

## 3. Develop

Single `plan-feature-4d` pass (small enough not to need Capability 2's
6-phase split), sequenced:
1. SQL migration: `saved_market_updates` table + RLS policies, `profiles.update_frequency` column — follow the exact policy-per-operation pattern already used for `profiles`/`plans`/`activities`/`diary_entries`.
2. `src/lib/ai.js`: extend `summariseMarketUpdate` to also classify `topic`; update `ai.test.js`.
3. `src/lib/marketUpdates.js` (new): occupation/state match, recency bucket, search/topic filter — pure functions + unit tests.
4. `src/pages/MarketUpdates.jsx` rewrite: two-page spread, cards, detail panel (new `src/components/UpdateDetailPanel.jsx` mirroring `CheckpointPanel.jsx`), search/topic/recency controls, frequency preference control, both empty states — extend `MarketUpdates.test.jsx`, add `UpdateDetailPanel.test.jsx`.
5. `src/lib/db.js`: `getSavedMarketUpdates(userId)`, `setMarketUpdateStatus(userId, sourceId, status)` (upsert saved/dismissed), `addPlanActivityFromUpdate(planId, userId, activity)` (single-row insert into `activities`), `setUpdateFrequency(userId, frequency)` — extend `db.test.js`.
6. Seed `src/data/marketSources.js` with 6–9 real items across 3 occupations (Registered Nurse/NSW, Carpenter/VIC, Early Childhood Teacher/QLD, plus National-scope items where applicable). Exact publication/retrieved dates must be fetched from the real source pages at execution time (e.g. via WebFetch on jobsandskills.gov.au occupation profiles and the ANMF submission PDF found during this brainstorm) — never guessed or approximated.

**Files touched:** `src/pages/MarketUpdates.jsx`, `src/pages/MarketUpdates.test.jsx`, `src/data/marketSources.js`, `src/lib/ai.js`, `src/lib/ai.test.js`, `src/lib/db.js`, `src/lib/db.test.js`, new `src/lib/marketUpdates.js` + test, new `src/components/UpdateDetailPanel.jsx` + test, new SQL migration file (alongside whatever tracks the existing schema).

**Risks:**
- AI misclassifying `topic`/`statusLabel` outside the fixed enum — mitigated by fail-safe exclusion (above), but needs a unit test asserting exclusion behaviour.
- Free-text `targetOccupation` matching against curated `occupation` strings is best-effort, not exact — a profile's phrasing may not match a seeded item even when topically relevant. Accepted as an out-of-scope limitation for this hackathon pass.
- Deciding which roadmap period an "add to plan" activity lands in (via `addPlanActivityFromUpdate`) needs to reuse existing period-derivation logic (`getExpectedPeriodLabels`/`computeRoadmap`) rather than inventing new placement logic — flagged so planning doesn't re-derive this from scratch.

## 4. Demonstrate

**Golden path:** Sign in as a profile with `targetOccupation: "Registered
Nurse"`, `state: "NSW"` → visit `/updates` → two-page spread renders, right
page shows NSW + National Registered Nurse items, newest first, "All" topic
chip active → click "Workforce demand" topic chip → list narrows → set
recency to "This month" → narrows further → type "shortage" in search →
narrows further → click a card → detail panel opens with full explanation,
status label, why-it-matters, source/dates → click Save → bookmark fills →
reload the page → saved state persists → open another card → click "Add to
plan" → navigate to `/plan` → the new activity appears → return to `/updates`
→ dismiss a third card → it disappears from the feed → open the frequency
control → set to "Weekly" → reload → selection persists.

**Edge cases:** filtering to a topic with nothing seeded for this profile
shows the "doesn't match your filters" empty state; a signed-in profile whose
occupation/state has zero seeded items at all shows the distinct "nothing
seeded for your profile yet" empty state; signed-out visitor to `/updates`
still sees the existing locked prompt unchanged; an AI response with an
out-of-enum `topic` or `statusLabel` is silently excluded from the feed
rather than shown malformed.

## 5. Requirements

### 5.1 Non-functional requirements

None beyond project defaults (Vitest, existing Tailwind/React conventions,
Supabase free tier, Vercel serverless for the one Gemini call this screen
makes).

### 5.2 Out of scope

- Real email/push digest delivery for the frequency preference (stored only).
- Live news fetching/scraping — feed is entirely pre-curated, sourced items.
- Exact occupation-string matching (best-effort substring/case-insensitive
  match accepted instead).
- A Jobs screen/tab (doesn't exist yet in this codebase; unrelated to this
  capability).
- Any migration/visa/legal/financial/licensing advice (per CLAUDE.md).

## 6. Probes raised and resolved

| # | Type | What was raised | Resolution |
| --- | --- | --- | --- |
| 1 | Contradiction | Mockup's two-page book spread vs. Diary/Roadmap's single-page pattern. | Keep the outer side-tab shell, but this screen introduces a new inner two-page spread (left cover + right feed), matching the mockup as requested. |
| 2 | Contradiction | Mockup's example topic chips vs. the acceptance criteria's named topics. | Acceptance-criteria topics (Economy/Policy/Regulation/Technology/Workforce demand/Employer activity) drive filtering; mockup chips were illustrative only. |
| 3 | Gap | CLAUDE.md's sourcing rule vs. mockup's photo thumbnails (unverifiable image provenance). | Dropped photos; generic per-topic icon only. |
| 4 | Gap | "User-selected update frequency ... where alerts or digests are implemented" — no notification infra exists. | Implemented as a stored preference only; no real delivery. |
| 5 | Gap | No stable id/persistence path existed for save/dismiss/add-to-plan. | New `saved_market_updates` table + stable `id` field per curated source item. |
| 6 | Ambiguity | Mockup's 5-item left-page menu doesn't map to distinct real data. | Reduced to a single "For you" entry. |
| 7 | Assumption | Who curates/verifies the real source items for the demo. | Assistant sources real items via WebSearch/WebFetch during execution (jobsandskills.gov.au, ANMF), never fabricated; exact dates pulled from the live pages, not approximated now. |
| 8 | Gap | "Filter by recency" needed a concrete mechanism. | Simple computed buckets (This week/This month/Older) from `publishedDate`. |

## 7. Handoff notes for planning

- This is one `plan-feature-4d` pass, not a multi-phase split like Capability 2.
- Do not re-litigate: the topic taxonomy (6 acceptance-criteria values), the
  no-photos decision, the frequency-preference-only scope, or the two-page
  spread layout — all confirmed above.
- `addPlanActivityFromUpdate`'s period placement must reuse existing
  `roadmap.js` period-derivation logic rather than invent new placement rules.
- Seed data dates/sources must be fetched live (WebFetch) during execution,
  not invented from this brainstorm's WebSearch summaries alone — those were
  sufficient to confirm real sources exist, not to certify exact dates.
- Reuse existing patterns: `CheckpointPanel.jsx`'s modal-detail-panel style
  for `UpdateDetailPanel.jsx`; `LockedAction`/gating pattern already used
  elsewhere is NOT needed here (the whole screen is already gated, per the
  existing `MarketUpdates.jsx` behaviour — do not double-gate individual
  actions).
