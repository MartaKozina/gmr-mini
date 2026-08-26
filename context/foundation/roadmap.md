---
project: gmr-mini
version: 1
status: draft
created: 2026-08-26
updated: 2026-08-26
prd_version: 1
main_goal: speed
top_blocker: none
milestone_id: core-meal-flow
milestone_seq: 1
milestone_status: open
---

# Roadmap: gmr-mini

> Derived from `context/foundation/prd.md` (v1) + auto-researched codebase baseline.
> Edit-in-place; archive when superseded.
> Slices below are listed in dependency order. The "At a glance" table is the index.

## Milestone

**M-1: Core meal flow** — Status: open

- **Intent:** Ship the end-to-end flow from PRD Success Criteria — create a pet, get a suggested daily energy target, and build a meal in the calculator with live nutrient feedback — so a raw-feeding dog owner can complete one full meal-planning session without manual math.
- **Source materials:** `context/foundation/prd.md` (v1)
- **Done when:** S-01, S-02, and S-03 below are `done`.
- **Scope anchors:** FR-001 through FR-010, US-01.

## Vision recap

Raw-feeding dog owners currently calculate meal proportions and nutrient totals by hand across multiple ingredient databases — slow, error-prone, and with no feedback loop between changing an ingredient amount and seeing its effect. gmr-mini exists to give live, reactive feedback as ingredient quantities change, so a user can ask "what if I add more pork rib" and see the effect on total fat immediately, without re-doing the calculation.

## North star

**S-03: User can add ingredients within each category and see live nutrient totals update as amounts change** — this is the smallest end-to-end slice whose successful delivery proves the product's core hypothesis (live reactive feedback), and every earlier slice exists only to make this one possible.

> A reader-facing gloss: "north star" here means the smallest end-to-end slice that, if it works, proves the product's core idea — placed as early in the sequence as its prerequisites allow, because everything else only matters if this works.

## At a glance

| ID   | Change ID                      | Outcome (user can …)                                                              | Prerequisites | PRD refs                                    | Status   |
| ---- | ------------------------------- | ----------------------------------------------------------------------------------- | -------------- | -------------------------------------------- | -------- |
| S-01 | `pet-profile-and-der`          | create a pet and see a suggested daily energy target                                | —              | FR-001, FR-002, US-01                        | ready    |
| S-02 | `meal-setup-wizard`            | pick a pet, set daily meal mass, category proportions, and batch days               | S-01           | FR-003, FR-004, FR-005, FR-006, FR-010, US-01 | proposed |
| S-03 | `live-nutrient-recalculation`  | add ingredients per category and see live nutrient totals update as amounts change  | S-02           | FR-007, FR-008, FR-009, US-01, NFR (live-update budget) | proposed |

## Baseline

What's already in place in the codebase as of `2026-08-26` (auto-researched + user-confirmed). No Foundations are needed for this milestone — every layer below is already present.

- **Frontend:** present — Next.js App Router pages (`src/app/page.tsx`, `src/app/pets/page.tsx`, `src/app/calculator/page.tsx`, `src/app/recipes/page.tsx`).
- **Backend / API:** present — tRPC routers `src/server/api/routers/pet.ts` and `recipe.ts`, registered in `root.ts`.
- **Data:** present — Drizzle schema `src/server/db/schema.ts` (`pets`, `recipes`, NextAuth tables), local Postgres via Docker, pushed via `drizzle-kit`.
- **Auth:** present — NextAuth v5 (Google OAuth), `protectedProcedure` gate, `createdById` ownership checks on every procedure.
- **Deploy / infra:** present — deployed to Vercel with Neon Postgres (`context/foundation/infrastructure.md`, `context/deployment/deploy-plan.md`).
- **Observability:** absent — no logging/error-tracking/metrics library. Not required by any PRD NFR for this milestone, so no foundation is opened for it here.

## Foundations

No foundations for this milestone — Baseline reports every layer the slices depend on (frontend, backend, data, auth, deploy) as already present. Nothing needs scaffolding before S-01 can proceed.

## Slices

### S-01: User can create a pet and see a suggested daily energy target

- **Outcome:** user can create a pet (name, weight in kg, lifestyle) and see a suggested daily energy target (DER) computed from weight and lifestyle factor.
- **Change ID:** `pet-profile-and-der`
- **PRD refs:** FR-001, FR-002, US-01
- **Prerequisites:** —
- **Parallel with:** —
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Low — a straightforward create-and-read flow plus a fixed formula. Sequenced first because every later slice needs a pet with a computed DER to pre-fill from.
- **Status:** ready

### S-02: User can set up a meal — pet, daily mass, proportions, and batch days

- **Outcome:** user can select a pet, enter the daily meal mass (pre-filled from the pet's DER, editable), set category proportions that must sum to 100%, and choose how many days the batch covers. Zero-pets state shows an inline prompt instead of a broken list.
- **Change ID:** `meal-setup-wizard`
- **PRD refs:** FR-003, FR-004, FR-005, FR-006, FR-010, US-01
- **Prerequisites:** S-01 (needs a pet with a computed DER to pre-fill daily mass)
- **Parallel with:** —
- **Blockers:** —
- **Unknowns:** —
- **Risk:** The proportion-sum validation is the one place a false negative (rejects a valid float sum) or false positive (accepts an invalid sum) would silently break the next slice's category targets. Sequenced after S-01 since FR-004's pre-fill reads the pet's DER.
- **Status:** proposed

### S-03: User can add ingredients per category and see live nutrient totals

- **Outcome:** user can add specific ingredients from the fixed ingredient database within each category, working toward that category's target mass, and see the final nutrient totals (calories, protein, fat, calcium, phosphorus) recalculate immediately on every change — with no separate "calculate" step.
- **Change ID:** `live-nutrient-recalculation`
- **PRD refs:** FR-007, FR-008, FR-009, US-01, NFR (updates within ~300ms)
- **Prerequisites:** S-02 (needs valid category targets to add ingredients against)
- **Parallel with:** —
- **Blockers:** —
- **Unknowns:** —
- **Risk:** This is where the product's core hypothesis lives — live recalculation on every ingredient change is the whole point of the Vision. It's sequenced last only because it needs S-02's category targets to exist first, not because it's lower priority; it's the North Star.
- **Status:** proposed

## Backlog Handoff

| Roadmap ID | Change ID                     | Suggested issue title                                              | Ready for `/10x-plan` | Notes                          |
| ---------- | ------------------------------ | -------------------------------------------------------------------- | ---------------------- | ------------------------------- |
| S-01       | `pet-profile-and-der`         | Pet profile: create + suggested daily energy target                  | yes                    | —                                |
| S-02       | `meal-setup-wizard`           | Meal calculator: pet/mass/proportions/days setup wizard               | no                     | Waits on S-01                   |
| S-03       | `live-nutrient-recalculation` | Meal calculator: per-category ingredients + live nutrient totals      | no                     | Waits on S-02 — North Star      |

## Open Roadmap Questions

1. **PRD's Access Control section and persona narrative reference "recipes" as user-owned data ("their own dogs and recipes"; "adjusting an existing meal recipe"), implying persistence — but no FR in this PRD version captures saving/browsing/editing/deleting a recipe.** That capability has since been built in code (`recipe` router, `/recipes` page) ahead of the written spec. Owner: user. Block: roadmap-wide (this milestone doesn't track it, since it isn't in `prd.md` yet) — recommend back-filling the PRD with an FR for it, then opening a follow-up milestone once M-1 closes. **Resolved 2026-08-26 by FR-011/FR-012 — see `context/changes/document-recipe-feature-in-prd/`.**

## Parked

- **User-submitted or editable ingredients** — Why parked: PRD Non-Goals — the ingredient database is fixed, pre-seeded data only in v1.
- **Multi-client / professional features** — Why parked: PRD Non-Goals — this serves a single hobbyist owner, not breeders, consultants, or kennels managing multiple clients.
- **Roles or admin features** — Why parked: PRD Non-Goals — the flat user model stays flat; no admin panel or role management.

## Milestone History

(empty — first milestone)

## Done

(empty on first generation — `/10x-archive` appends entries here as changes are archived)
