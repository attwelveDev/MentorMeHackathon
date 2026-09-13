---
name: execute-plan-4d
description: Executes an existing implementation plan — loads it, reviews it critically against the real codebase and raises every question or concern BEFORE touching code, then works through its tasks in dependency order, following each task's TDD steps and verifications exactly, and stops to ask rather than guess whenever it hits a blocker. Project-scoped fork for Planery where only tasks matching plan-feature's named review-gate conditions require explicit human sign-off. Use whenever the user asks to implement, execute, build, work through, continue or resume a plan.
---

# Execute Plan

Downstream of [`plan-feature-4d`](../plan-feature-4d/SKILL.md), which is downstream
of [`brainstorm-4d`](../brainstorm-4d/SKILL.md). Those two decide *what* to
build and *how*; this skill builds it. It does not re-open settled design,
and it does not invent work the plan doesn't name.

**Two hard rules, for the whole duration:**

1. **Nothing is implemented until the Phase 1 review is clean.** If the
   review raises anything, it goes to the user first.
2. **Never make a test pass by weakening it.** Not by loosening an assertion,
   relaxing a threshold, adding a skip, deleting a case, casting past a type
   error, or asserting the buggy output.

**Gate reminder:** only a task carrying a `Human review:` line needs the
user's explicit accept/reject before being marked done — `plan-feature-4d`
attaches that line only when a task hits one of five named conditions
(schema change, sourcing/compliance, auth/secrets, cross-cutting flow,
irreversible action). Every other task is done on green tests + satisfied
acceptance criteria alone; don't invent extra sign-off steps for those to be
cautious — the point of this fork is rapid prototyping, not gating everything.

## Phase 0 — Load the plan and find out where the work already stands

1. **Resolve which plan.** If several candidates exist under `plans/`, ask
   which one.
2. **Read it in full**, plus anything it points at: the `specs/` file it was
   built from, `CLAUDE.md`, and any sibling plan it declares a dependency on.
3. **Establish what is already done.** Ticked checkboxes, `git log`, and the
   working tree. Never trust a ticked box on its own — spot-check its
   acceptance criteria still hold.
4. **Note the project's commands** — test, typecheck, build, lint — from
   `package.json`, not from memory.

## Phase 1 — Review the plan critically, before touching anything

Read the plan as an adversary would, then check it against the code as it is
now.

**What counts as a real concern:**

- A file path, function, type, prop, signature or line reference that
  doesn't match the current source.
- A dependency the plan assumes is present and isn't.
- A verification command, script or fixture the plan names that doesn't
  exist.
- A task whose acceptance criteria can't be checked as written, or satisfied
  at all.
- A contradiction between two tasks, a dependency cycle, or a task depending
  on something no task delivers.
- A requirement in the plan's requirements section that no task implements.
- Anything the plan leaves as an open question.
- A task that should be gated (schema/sourcing-compliance/auth-secrets/
  cross-cutting/irreversible) but has no `Human review:` line, or one that's
  gated for no matching reason — flag either miscalibration back to
  `plan-feature-4d`.

**What does not count:** the plan's settled design decisions. Preferring a
different approach is not a concern. If you genuinely believe a decided call
is wrong, say so in a sentence or two, then follow the plan anyway.

**Raise everything found once, together, before implementing.** Then get an
actual ruling. If the review is clean, say so and proceed.

## Phase 2 — Build the work list

- Use the harness's todo list if available; otherwise the plan's own
  checkboxes are the work list.
- One item per plan task, ordered by declared **dependencies**.

## Phase 3 — Execute, one task at a time, exactly as written

For each task, in order:

1. **Red.** Write the test(s) the task names, confirm they fail for the
   stated reason.
2. **Green.** The minimum implementation the task names, with the signatures
   it names. Nothing extra.
3. **Refactor.** Only what the task names.
4. **Verify.** Run the task's own verification, then the project's full check
   command. Walk the acceptance criteria one at a time. **Only if the task
   carries a `Human review:` line**, green checks are necessary but not
   sufficient: present the named artifact to the user and get an explicit
   accept or reject before treating the task as done. Ungated tasks are done
   as soon as checks and acceptance criteria pass — no extra pause.
5. **Record.** Tick the task in the plan file, commit per the project's
   convention (one commit per task once checks are green). Never push. Never
   tick or commit a gated task before the user has explicitly accepted it.

**While executing:**

- **Follow the steps exactly.** A step that looks wrong is a blocker — stop
  and ask.
- **Stay in scope.** Anything you notice outside the current task gets
  written down and reported, not silently fixed.
- **Match the surrounding code**: naming, error handling, file layout, test
  conventions.
- **Never fabricate verification.** If a check couldn't be run, say which and
  why.
- **Leave no debris**: no stray debug logging, commented-out experiments,
  temporary files, `.only` on a test.
- **Never hand-edit generated or build output.**
- **Never commit a secret**, and never widen ignore rules to make one
  committable.

## Phase 4 — Blockers: stop and ask, don't guess

**Stop when:**

- A verification, test or check fails and the fix isn't plainly inside the
  current task's scope.
- A dependency is missing or would need installing beyond what the plan
  authorises.
- A step or acceptance criterion is ambiguous, or two readings lead to
  materially different work.
- The code no longer matches what the plan describes.
- A task's acceptance criteria can't be met as written.
- The next action is destructive or hard to reverse and the plan didn't
  explicitly authorise it — deleting data, rewriting history, touching
  anything outward-facing. (This overlaps the plan's own gate list, but
  applies even to an ungated task if the action itself turns out irreversible
  at implementation time — the plan can under-call this; you can't.)
- Credentials, permissions or access are needed that you don't have.
- A gated task comes back rejected from the user.

**How to stop:**

- Stop at a task boundary where you can.
- **Don't retry the same failing thing more than twice.**
- Finish any remaining work that doesn't depend on the answer, then stop and
  report both parts.
- Report it like this:

  ```
  BLOCKED — Task <n>: <one-line title>

  What failed:   <the command, and the actual output — not a paraphrase>
  Expected:      <what the plan says should happen>
  Why I stopped: <which blocker condition this is>
  What I tried:  <briefly, and why it didn't resolve it>
  What I need:   <the specific decision or information>
  Tree state:    <clean at Task n-1 / files changed but uncommitted / etc.>
  ```

Reserve this for genuine blockers. A choice with an obvious default and no
material consequence is a routine judgement call: make it, note it in the
report, keep going.

### When a gated task is rejected

- **The wording/artifact was off, the approach wasn't.** Redraft and
  re-present. No need to leave this skill.
- **The task's approach, or the plan itself, was wrong.** Hand back to
  `plan-feature-4d` with the user's specific findings, then resume execution
  against the updated plan (Phase 5).

## Phase 5 — Re-review whenever the plan or the approach changes

Trigger a fresh Phase 1 review whenever:

- The user updates the plan or gives feedback that changes it.
- Resolving a blocker changes the approach.
- Execution reveals the plan was wrong about the code, design, or sequencing.
- A gated-task rejection reveals the task's approach needs to change.

Then:

- **Update the plan file in place** rather than diverging silently.
- If the change is big enough that the task breakdown no longer holds, hand
  back to `plan-feature-4d` rather than improvising a new breakdown here.

## Phase 6 — Report honestly

- What completed, which tasks are ticked, which commits were made.
- What was **skipped or left undone, and why**.
- Which verifications actually ran, and which didn't.
- Anything found out of scope: listed, not fixed.
- Any routine judgement calls made along the way.

Report completion only when every task's acceptance criteria have actually
been checked. If tests fail, say so and show the output.

## The plan is a shared record, not a private script

Two people should be able to read the plan afterwards and agree on what was
built. Ticked as work lands, edited when the approach changes, never quietly
departed from.
