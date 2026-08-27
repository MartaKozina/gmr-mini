# Document recipe feature in PRD — Implementation Plan

## Overview

`prd.md` never captured the recipe-persistence capability (save a built meal, browse/edit/delete it later) even though it shipped in code (`src/server/api/routers/recipe.ts`, `src/app/recipes/`). This plan back-fills the PRD with formal FR entries and a new user story, and mirrors a short note in `shape-notes.md`, following the same dated-addendum convention already used for the DER formula correction.

## Current State Analysis

- `prd.md`'s Access Control section already says "own pets and **recipes**", and the persona narrative says "adjusting an existing meal recipe" — the PRD's own language assumed persistence existed, but no FR ever defined it.
- The `recipe` tRPC router implements `create`, `getAll`, `update` (name/dailyMassGrams/days only), and `delete` — all `protectedProcedure`, all ownership-checked (`createdById` match, plus a pet-ownership check on `create`).
- `context/foundation/roadmap.md`'s "Open Roadmap Questions" already flags this exact gap (entry #1) — this change resolves that question by making the PRD authoritative again.
- Precedent for retroactive PRD corrections exists: FR-001/FR-002's DER formula got a dated `> Correction (2026-08-21, during implementation)` blockquote in `prd.md`, mirrored by a short pointer note in `shape-notes.md`. This change follows the same pattern.

## Desired End State

`prd.md` has a new "### Recipe persistence" subsection under Functional Requirements with FR-011 and FR-012, and a new "### US-02" user story under User Stories. `shape-notes.md` has a short dated note pointing to the new FRs, matching the DER-correction precedent. Verification: both files render the new sections correctly and `grep -c "^- FR-"` on `prd.md` increases by exactly 2.

### Key Discoveries:

- `prd.md`'s existing FR numbering ends at FR-010 (FR-011 is unused) — new FRs slot in as FR-011/FR-012 with no renumbering needed.
- `shape-notes.md`'s frontmatter has `frs_drafted: 10` — this should NOT be bumped, since these FRs weren't drafted during shaping; the mirrored note documents them as a post-MVP addendum instead, exactly as the DER correction did (that correction didn't touch `frs_drafted` either).

## What We're NOT Doing

- Not adding a roadmap slice for this capability (`context/foundation/roadmap.md` stays scoped to M-1's original three slices) — that's a separate, follow-up decision once this PRD gap is closed, not part of this change.
- Not changing any code — the recipe feature is already fully implemented and tested; this is a documentation-only change.
- Not writing FR entries for every router procedure 1:1 (rejected in planning — see plan-brief) — two FRs (save; browse/edit/delete) match the capability's actual shape better than four granular ones.

## Implementation Approach

Single phase, two files, in dependency order: write `prd.md` first (the new FR numbers are the source of truth), then mirror the shape-notes.md pointer note referencing those numbers.

## Phase 1: Back-fill PRD and shape-notes

### Overview

Add FR-011, FR-012, and US-02 to `prd.md`; add a mirrored dated note to `shape-notes.md`.

### Changes Required:

#### 1. PRD — new Functional Requirements subsection

**File**: `context/foundation/prd.md`

**Intent**: Add a new "### Recipe persistence" subsection after "### Meal calculator — ingredients & nutrients" (i.e., after FR-009), opened with a dated note explaining these FRs document an already-shipped capability rather than a pre-planned one. FR-011 covers saving a meal from the calculator as a named recipe; FR-012 covers browsing, editing (name/daily mass/days only — not the ingredient composition), and deleting saved recipes. Both `Priority: must-have`, matching what's actually live.

**Contract**: Follows the existing FR entry format exactly (`- FR-NNN: <statement>. Priority: must-have`, optionally followed by a `> Socrates:` or `> Correction:`/note blockquote). The subsection heading and FR numbers are the contract other files (shape-notes.md's mirror note) reference.

#### 2. PRD — new User Story

**File**: `context/foundation/prd.md`

**Intent**: Add "### US-02: User saves and revisits meal recipes" after the existing "### US-01" story, with its own Given/When/Then and Acceptance Criteria — covering save, ownership scoping, editing the summary fields, and deletion.

**Contract**: Follows the existing US-01 entry's exact structure (Given/When/Then bullets, `#### Acceptance Criteria` subsection with bullets).

#### 3. Shape-notes — mirrored addendum note

**File**: `context/foundation/shape-notes.md`

**Intent**: Append a short dated note directly after the existing DER-correction note (same location convention: near the related business-logic/FR text), pointing to `prd.md`'s new FR-011/FR-012 and US-02, without duplicating their full content. Matches how the DER correction was mirrored here.

**Contract**: A single `>` blockquote note, not a new section. Does not modify `frs_drafted` in frontmatter (see Key Discoveries).

#### 4. Roadmap — annotate the now-resolved Open Question

**File**: `context/foundation/roadmap.md`

**Intent**: Append a resolution note to Open Roadmap Question #1 ("PRD's Access Control section and persona narrative reference 'recipes'... but no FR captures it") so the roadmap doesn't go stale the moment this change lands — the question's premise (no FR exists) stops being true once FR-011/FR-012 are written.

**Contract**: Append a short `Resolved 2026-08-26 by FR-011/FR-012 — see context/changes/document-recipe-feature-in-prd/.` clause to the existing entry's text. Do not remove or renumber the entry, and do not touch the frontmatter `updated` field or any other roadmap section — this is a one-line annotation, not a roadmap regeneration.

### Success Criteria:

#### Automated Verification:

- `grep -c "^- FR-" context/foundation/prd.md` returns 12 (10 existing + FR-011, FR-012)
- `grep -c "^### US-" context/foundation/prd.md` returns 2
- `grep -q "FR-011" context/foundation/shape-notes.md` succeeds
- `grep -q "Resolved 2026-08-26" context/foundation/roadmap.md` succeeds

#### Manual Verification:

- Read the new PRD subsection and confirm it reads consistently with the existing FR entries (same voice, same level of detail)
- Confirm the new US-02 doesn't duplicate or contradict US-01
- Confirm the shape-notes.md note doesn't restate the full FR text (pointer only, per the DER-correction precedent)
- Confirm the roadmap.md annotation doesn't disturb the rest of the Open Roadmap Questions section

---

## Testing Strategy

Not applicable — documentation-only change, no code paths affected. Verification is the automated grep checks plus manual read-through above.

## References

- `context/foundation/prd.md` — FR-001/FR-002's `> Correction (2026-08-21, during implementation)` blockquote is the precedent this change follows.
- `context/foundation/shape-notes.md:76` — the mirrored DER-correction note this change's shape-notes addition follows the same pattern as.
- `context/foundation/roadmap.md` — "Open Roadmap Questions" entry #1, the gap this change resolves.
- `src/server/api/routers/recipe.ts` — the shipped implementation this PRD update documents.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Back-fill PRD and shape-notes

#### Automated

- [x] 1.1 `grep -c "^- FR-" context/foundation/prd.md` returns 12 — c14aa58
- [x] 1.2 `grep -c "^### US-" context/foundation/prd.md` returns 2 — c14aa58
- [x] 1.3 `grep -q "FR-011" context/foundation/shape-notes.md` succeeds — c14aa58
- [x] 1.4 `grep -q "Resolved 2026-08-26" context/foundation/roadmap.md` succeeds — c14aa58

#### Manual

- [x] 1.5 New PRD subsection reads consistently with existing FR entries — c14aa58
- [x] 1.6 US-02 doesn't duplicate or contradict US-01 — c14aa58
- [x] 1.7 shape-notes.md note is a pointer, not a duplicate — c14aa58
- [x] 1.8 roadmap.md annotation doesn't disturb the rest of the Open Roadmap Questions section — c14aa58
