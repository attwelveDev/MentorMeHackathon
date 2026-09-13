---
name: brainstorm-4d
description: Collaborative ideation pass that runs BEFORE plan-feature-4d — explores intent, requirements and design for one feature or fix through back-and-forth dialogue with the user, enforcing the 4D framework (Define, Design, Develop, Demonstrate), and never writes or changes application code. Only once the user has explicitly approved the resulting spec does it hand off to plan-feature-4d. Use whenever the user has a rough idea, wants to brainstorm, explore, or flesh out a feature/fix for Planery before committing to build it.
---

# Brainstorm (4D)

Upstream of [`plan-feature-4d`](../plan-feature-4d/SKILL.md). Turns a rough idea into
an approved spec covering all four points of the **4D framework** before any
implementation planning begins.

**Hard rule:** no code, no edits to application files, no implementation plan.
The only artifact this skill may produce is a spec file under `specs/`.

**No shortcuts for "simple."** Every idea goes through all four D's, even a
trivial one — scale down to a short answer per point, don't skip a point.

## The 4D framework

Every idea must be pinned down on all four before handoff:

1. **DEFINE** — the problem and the user. State it as:
   > [User] struggles with [problem] because [reason]. Our app helps by
   > [solution], so they can [outcome].
   Then break it into user stories ("As a [user], I want [goal], so that
   [benefit]"), each with testable acceptance criteria.
2. **DESIGN** — the flow, data, and logic. What screens/steps the user goes
   through, what data is read/written (and where, per `CLAUDE.md`'s stack —
   Supabase tables, Gemini calls via `src/lib/ai.js`, etc.), and the logic
   that connects them. For each new or non-trivially-changed screen, capture:
   purpose, content, primary action, optional fields, validations, and error
   states — only the fields relevant to that screen, not a rigid template.
3. **DEVELOP** — what building this actually requires: which files/modules it
   touches, sequencing, and risks — the handoff brief for `plan-feature-4d`, not
   the implementation itself.
4. **DEMONSTRATE** — how the finished feature will be shown working: the
   golden path and key edge cases someone could walk through live.

## Phase 1 — Ground yourself

Read the relevant code, `CLAUDE.md`, and any `specs/`/`plans/` files that bear
on the idea before asking anything. Restate the request in your own words
first — it surfaces misunderstanding cheaply.

## Phase 2 — Work through Define → Design, probing continuously

Draft DEFINE and DESIGN with the user, iterating until both are unambiguous.
Throughout, watch for and surface (don't stockpile):

- **Assumptions** about scope, users, environment, or data.
- **Ambiguities** — any requirement readable more than one way.
- **Contradictions** — between the user's statements, or with how the code
  actually works.
- **Gaps** — error/empty/loading states, edge cases, out-of-scope boundaries.
- Anything that would fabricate or invent a source, statistic, or migration
  claim — forbidden per `CLAUDE.md`'s sourcing rule; flag it immediately.

Use `AskUserQuestion` for concrete enumerable decisions; open conversation for
anything more exploratory. Ask a few sharp questions at a time, not a giant
questionnaire.

## Phase 3 — Sketch Develop and Demonstrate

Once Define/Design are solid, sketch the other two D's with the user:
what building it touches (DEVELOP) and how it'll be shown working
(DEMONSTRATE). These stay brief — they're inputs for `plan-feature-4d` and later
manual testing, not deliverables of this skill.

## Phase 4 — Present and get explicit approval

Summarize all four D's back to the user as a complete statement, not a
question, and ask directly for approval. Don't treat silence or a vague "ok"
as approval — get an actual yes. A challenge here is normal; loop back to
Phase 2/3 and re-present.

## Phase 5 — Final probe sweep

Before finishing, re-check against the *final* design, out loud:

- [ ] All four D's are stated and confirmed
- [ ] Each user story has testable acceptance criteria
- [ ] Each new/changed screen's purpose, content, primary action, and error
  states are captured (only where relevant to that screen)
- [ ] Every assumption is stated and confirmed or removed
- [ ] No ambiguous term or contradiction remains
- [ ] No obvious gap left unaddressed
- [ ] No unsourced claim slipped in anywhere

Resolve anything this finds before finishing.

## Phase 6 — Write a spec file (only when it earns its keep)

If the 4D summary from Phase 4 is small enough to carry forward as-is, skip
the file. Otherwise write `specs/YYYY-MM-DD-<feature-slug>.md` using
`template.md` (next to this file). Don't commit it unless asked.

## Phase 7 — Hand off to plan-feature-4d

Once approved and the sweep is clean, invoke `plan-feature-4d` in the same
conversation, pointing it at the finalized Define/Design/Develop notes (inline
or via the spec file). `plan-feature-4d` should treat this as settled input, not
re-run requirements from scratch. This skill's job ends here — implementation
is `plan-feature-4d`/`execute-plan-4d`'s work, and the DEMONSTRATE walkthrough
happens after that build, not now.
