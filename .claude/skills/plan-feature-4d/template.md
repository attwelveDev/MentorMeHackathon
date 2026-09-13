<!--
  Skeleton for a single-feature implementation plan. Copy this structure,
  fill in every section, delete this comment block, and delete any
  instructional italics text once the real content replaces it.
  Do not remove a section for being "not applicable" — write "None." instead.
-->

# <Feature name>

- **Date:** YYYY-MM-DD
- **Status:** Draft
- **Requirements confirmed by user:** yes — YYYY-MM-DD

## 1. Summary

*One paragraph: what this feature is, who/what it's for, and why it's being
built.*

## 2. Requirements

### 2.1 Functional requirements

*Numbered, testable statements — user stories + acceptance criteria from
`brainstorm-4d` are sufficient here if already settled.*

1. ...
2. ...

### 2.2 Non-functional requirements

*Performance, accessibility, security, data constraints, etc. "None beyond
project defaults." if genuinely none.*

### 2.3 Out of scope

*Explicitly excluded behaviour.*

### 2.4 Assumptions

*Anything taken as given because it couldn't be pinned down. Should be few —
most resolved by the requirements conversation.*

## 3. Existing code context

- Relevant files/modules and what they currently do today
- Relevant existing types/functions and their **exact current signatures**
- Conventions already established in this codebase that new work must follow
- Test setup: framework, exact command(s), where tests for this area live

## 4. Approach

*The chosen implementation approach and why. Note alternatives seriously
considered and why rejected, if any.*

## 5. Task breakdown

*Each task: small, independently shippable/testable, TDD (red → green →
refactor). Concrete titles — name the files, functions, behaviour.*

### Task 1: <concrete, specific title>

- **Description:** exactly what changes and why.
- **Files touched:** exact paths, new or existing.
- **Tests first (red):** exact test file(s) and case names, what each
  asserts, including signatures under test.
- **Implementation (green):** exact functions/types/props/exports to add or
  change, with final signatures. Minimum needed to pass the tests above.
- **Refactor:** cleanup expected once green (or "None expected.").
- **Acceptance criteria:** bullet list, each independently checkable.
- **Review gate:** does this task match one of the five conditions in
  SKILL.md (schema change / sourcing-compliance / auth-secrets /
  cross-cutting flow / irreversible action)? If yes, add **Human review:**
  naming the exact artifact and what a pass looks like. If no, write "No gate
  — green tests + acceptance criteria are sufficient."
- **Depends on:** other task numbers, or "None."

### Task 2: ...

*(repeat — one task per unit of work, numbered in execution order; note
dependencies explicitly)*

## 6. Feature-level Definition of Done

- [ ] Every task in §5 complete and its tests passing
- [ ] `<exact test command for this repo>` passes
- [ ] `<exact full project check command for this repo>` passes
- [ ] Manually verified: `<concrete steps — golden path and named edge cases>`
- [ ] Every requirement in §2 is covered — see §7
- [ ] Every gated task (Review gate: yes) has been shown to the user and
  explicitly accepted
- [ ] No item remains in §8

## 7. Requirements coverage check

| Requirement | Covered by |
| --- | --- |
| 2.1.1 | Task 1 |
| ... | ... |

## 8. Risks / open questions

*Must be empty in a finalised plan.*
