# Document recipe feature in PRD — Plan Brief

> Full plan: `context/changes/document-recipe-feature-in-prd/plan.md`

## What & Why

The recipe save/browse/edit/delete feature shipped in code (`recipe` tRPC router + `/recipes` page) without ever being written into `prd.md` as a formal requirement — even though the PRD's own Access Control text already assumed "recipes" existed as user-owned data. This change back-fills the PRD so the written spec matches reality, resolving `roadmap.md`'s Open Roadmap Question #1.

## Starting Point

`prd.md` has FR-001 through FR-010 covering pet profiles and the meal calculator, and one user story (US-01) covering live nutrient calculation. Nothing in the PRD currently defines saving a built meal as a recipe, or browsing/editing/deleting it later — that capability exists only in code.

## Desired End State

`prd.md` has two new FRs (FR-011, FR-012) under a new "Recipe persistence" subsection and a new user story (US-02), all dated as a post-MVP addendum rather than presented as originally planned. `shape-notes.md` has a short pointer note mirroring the existing DER-correction precedent.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| FR grouping | 2 FRs (save; browse/edit/delete) | Matches the capability's actual shape better than 1:1 mapping to router procedures | Plan |
| User story | New US-02 | US-01 is scoped to live calculation, not persistence — conflating them muddies both | Plan |
| Priority framing | must-have, with a dated addendum note | The feature is fully built and live; "nice-to-have" would undersell it, but the addendum note keeps the sequencing honest | Plan |
| shape-notes.md | Mirror a short note | Matches the precedent already set by the DER-correction note | Plan |

## Scope

**In scope:** `prd.md` (new FRs + US-02), `shape-notes.md` (mirrored pointer note).

**Out of scope:** Adding a roadmap slice for this capability, any code changes (none needed — feature is already built and tested).

## Architecture / Approach

Pure documentation change, one phase, two files touched in dependency order (PRD first, since shape-notes.md's note references the new FR numbers).

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Back-fill PRD and shape-notes | FR-011, FR-012, US-02 in `prd.md`; mirrored note in `shape-notes.md` | Low — no code paths affected; risk is purely stylistic (matching existing voice/format) |

**Prerequisites:** None.
**Estimated effort:** Single session, one phase.

## Open Risks & Assumptions

- Assumes the reader accepts a retroactively-written FR as legitimate when clearly dated as an addendum — consistent with how the DER correction was already handled in this same PRD.

## Success Criteria (Summary)

- `prd.md` has exactly 12 FR entries and 2 user stories after this change
- `shape-notes.md` references FR-011 in a short pointer note
- Neither file's new content duplicates or contradicts existing entries
