---
name: plan-feature-4d
description: Locks down requirements through back-and-forth with the user, then writes a rigorous, TDD-driven, self-contained implementation plan for exactly one feature (or bug fix), verifies it against the real codebase, and saves it to plans/YYYY-MM-DD-<feature-slug>.md. Project-scoped fork for Planery that gates human review to a strict, named list of conditions to keep hackathon prototyping fast. Use whenever the user asks to plan, scope, or write an implementation/spec doc for a piece of work before coding starts.
---

# Plan Feature

Produces a persisted planning document (a file under `plans/`), not an
in-session plan-mode approval. Follow every phase below in order; do not skip
to drafting because the request "sounds simple."

If this was reached via a hand-off from the
[`brainstorm-4d`](../brainstorm-4d/SKILL.md) skill — inline, or by being
pointed at a `specs/` file it wrote — treat that as the requirements source
for Phase 1: read it fully (Define/Design/Develop/Demonstrate, user stories,
screen table) and only re-open the conversation with the user if something is
still missing or if your own codebase investigation (Phase 2) turns up
something the design didn't anticipate.

## Scope rule: one plan, one feature

A plan file covers exactly one feature or one bug fix. If the user's request
actually spans several independent features, say so and produce one plan file
per feature — never merge unrelated features into one document, and never
split a single feature across multiple files.

## Review gate: default is no gate

**Bias toward rapid prototyping.** A task needs an explicit `Human review:`
line, and the sign-off it requires before being marked done, **only** if it
falls into one of these:

1. **Schema/data model change** — new/altered Supabase table, column, or
   relationship.
2. **Sourcing/compliance surface** — how job-market, occupation-demand, or
   migration data is fetched, labelled, or displayed (CLAUDE.md's sourcing
   rule), or anything brushing the out-of-scope list (visa/legal/financial/
   licensing advice, guarantees, auto-applications).
3. **Auth/permissions or secrets** — Supabase Auth rules, env vars, API keys,
   deployment config.
4. **Cross-cutting flow change** — touches more than one existing
   screen/feature's behavior, not just adds a new one.
5. **Irreversible action** — deletes user data, overwrites existing
   diary/plan entries, or anything with no undo.

Everything else — a new screen, a new activity type within the existing data
model, copy/UI/styling, additive non-schema logic, most bug fixes — ships on
green tests and satisfied acceptance criteria alone. Do not add a
`Human review:` line out of habit or for subjective polish (tone, visual
feel) unless it also happens to land in one of the five categories above.

## Phase 1 — Lock the requirements

Do not draft a plan against ambiguous or incomplete requirements.

1. Read what the user (or `brainstorm-4d`'s spec) has already given you. If it
   already answers the questions below unambiguously, don't re-ask — move to
   Phase 2.
2. Otherwise, work it out with the user, through normal conversation and
   `AskUserQuestion` for discrete/closed decisions, until you can state
   without hedging:
   - The functional requirements (user stories + acceptance criteria are
     sufficient here), each specific enough that you could name a test that
     would fail without it.
   - Non-functional constraints (performance, accessibility, security, data
     limits — whatever applies).
   - What's explicitly out of scope.
   - Whether any part of this request falls under the review-gate list above.
3. Restate the requirements back to the user in plain language and get
   explicit confirmation before writing anything to disk.
4. Only after confirmation, move to Phase 2.

## Phase 2 — Investigate the real codebase

Every claim about existing code in the plan must come from actually reading
that code this turn, not from memory, convention, or a similar project.

- Find and read every file the feature will touch or depend on.
- Record the exact current signatures of any type/function/prop the plan will
  reference or change.
- Note the testing setup for this repo: framework, exact commands, where
  tests for this area live.
- Note established conventions in the surrounding code (naming, error
  handling, file layout) that the new work should match.

Use `Explore` or `general-purpose` agents for breadth if the codebase is
large — but the signatures and file contents that land in the plan must still
be verified, not delegated blindly.

## Phase 3 — Draft the plan

Copy `template.md` (next to this file) and fill in every section. Rules for
the task breakdown, non-negotiable:

- **Concrete and final.** Every task names exact files, exact function/type
  names, exact signatures. No "handle X", "improve Y", "TODO: figure out Z".
- **Agile-sized.** Each task is small enough to finish and review in one
  sitting, independently valuable or testable, with dependencies stated
  explicitly.
- **TDD, explicitly.** Every task lists the failing test(s) to write first
  (red), the minimum implementation to pass them (green), then any refactor.
  Bug fixes start with a test that reproduces the bug.
- **Every task has acceptance criteria** that are independently checkable.
- **Gate check.** For each task, check it against the five review-gate
  conditions above. Only if it matches one, add a **Human review:** line
  naming the exact artifact to look at and what a pass looks like. Otherwise
  omit the line — don't add it defensively.

Also fill in the non-functional-requirements, out-of-scope, assumptions, and
existing-code-context sections seriously. Write "None." explicitly rather
than omitting a section.

### Gated tasks are not done until the user says so

A `Human review:` line changes what "done" means for that task: green tests
and satisfied acceptance criteria are necessary but not sufficient — the task
is only accepted once the user has looked at the named artifact and said so
explicitly. Ungated tasks need no such step; green + acceptance criteria is
done.

If the user rejects a gated task, route it back through this skill rather
than letting whoever is executing freelance a fix: a wording tweak that stays
inside the task's existing approach can be redrafted in place (back to Phase
3 for that task); a rejection that reveals the approach or requirement was
wrong goes back to Phase 1. Update the plan file in place either way.

## Phase 4 — Verify and fix before finalising

1. **Coverage.** Walk every requirement in §2 and confirm it maps to at least
   one task in §5 (fill in §7 as you go). Fix any gap.
2. **Correctness.** Re-check every type, signature, function name, prop name,
   and file path against the actual source read in Phase 2.
3. **No loose ends.** §8 (risks/open questions) must end up empty.
4. **Gate coverage.** Confirm every task matching one of the five gate
   conditions carries a `Human review:` line, and no task outside those five
   carries one it doesn't need.

Only once all four pass does the plan's `Status` become `Approved`.

## Phase 5 — Save and report

1. Determine today's date (`YYYY-MM-DD`) and a kebab-case slug for the
   feature name.
2. Save to `plans/YYYY-MM-DD-<feature-slug>.md`, creating `plans/` if needed.
3. Tell the user where it landed, a one- or two-sentence summary, and the
   task count. If any task is gated, name it and which of the five conditions
   triggered it.
4. Do not commit the file to git unless the user explicitly asks you to.

## A living checklist, not a one-shot artifact

The saved plan uses GitHub-style task checkboxes so it can be checked off as
work proceeds. If the user later asks to update, re-scope, or continue a
plan, re-open the same file, re-run the Phase 4 verification against the
current state of the code, and edit it in place rather than creating a second
file for the same feature.
