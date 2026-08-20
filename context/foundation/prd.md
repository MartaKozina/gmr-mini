---
project: "gmr-mini"
version: 1
status: draft
created: 2026-08-19
context_type: greenfield
product_type: web-app
target_scale:
  users: medium
  qps: low
  data_volume: small
timeline_budget:
  mvp_weeks: 1
  hard_deadline: 2026-09-01
  after_hours_only: true
---

# gmr-mini — Product Requirements Document

## Vision & Problem Statement

Raw-feeding dog owners who want to build a nutritionally balanced meal for their dog must currently look up ingredient nutrient data across multiple databases and manually calculate proportions and totals by hand — a slow, error-prone process with no feedback loop: changing the amount of one ingredient means re-doing the whole calculation from scratch.

The insight this product acts on: the manual calculation itself is the friction, not a lack of nutrient data. This is a lean, from-scratch rewrite of the user's own existing product (givemeraw.com) — no migration of old code, data, or users — built specifically to give live, reactive feedback as ingredient quantities change, so a user can explore "what if I add more pork rib" and immediately see the effect on total fat without a full recalculation cycle.

## User & Persona

A hobbyist raw-feeding dog owner — an individual who feeds their dog(s) a raw diet (BARF/PMR-style) and wants to build or adjust a nutritionally complete recipe for a specific dog, without spreadsheet or nutrition expertise. They reach for this product when creating a new dog profile or adjusting an existing meal recipe, and want to see in real time how changing ingredient quantities shifts the total nutrient profile.

## Success Criteria

### Primary
- The end-to-end flow works: create a pet (name, weight, lifestyle) at `/pets` → suggested daily calories computed from weight + lifestyle factor → in `/calculator`, select the pet, enter daily meal mass in grams (step 1) → enter category proportions (meat, bone, organs, liver, veggies, fruits, others) and number of days the batch covers (step 2) → see per-category target mass, add specific ingredients to hit each category target, and see the final nutrient totals for the meal update live as ingredients/amounts change (step 3).

### Secondary
- None — MVP is scoped to the flow above only.

### Guardrails
- Calorie and nutrient math must be correct (matches the declared formulas/ingredient data) — incorrect math is not acceptable at any scope level; this is the one thing that must never regress.

## User Stories

### US-01: User builds a meal recipe for their pet with live nutrient feedback

- **Given** a logged-in user with a pet profile already created
- **When** they select the pet in the calculator, enter daily meal mass, category proportions, and number of days, then add ingredients within each category
- **Then** they see the final nutrient totals for the meal, updating live as they adjust ingredient amounts

#### Acceptance Criteria
- Category target masses are derived from the entered daily meal mass and the entered proportions
- The final nutrient summary is shown and kept live even if a category hasn't yet reached its target mass (partial-fill state is not blocked)
- Changing any ingredient's amount immediately recalculates and re-displays the final nutrient totals

## Functional Requirements

### Pet profile
- FR-001: User can create a pet with name, weight (in kilograms), and lifestyle (each lifestyle maps to a factor). Priority: must-have
  > Socrates: Counter-argument considered: weight units are ambiguous (kg vs lbs), risking silently wrong downstream math. Resolution: weight is entered in kilograms; the daily-calorie formula (DER) is weight(kg) × lifestyle factor, per https://petsdiet.pl/jedzenie-pelne-energii/.
- FR-002: App calculates a suggested daily calorie target (DER) from the pet's weight (kg) and lifestyle factor. Priority: must-have
  > Socrates: No counter-argument raised; stands as written.

### Meal calculator — setup
- FR-003: User can select a pet from a list in the calculator. Priority: must-have
  > Socrates: Counter-argument considered: a user with zero pets hits a dead end (empty/broken list). Resolution: accepted — see FR-010, a new defensive FR covering the empty-pets state.
- FR-004: User can enter the daily meal mass in grams (step 1); the field pre-fills from the pet's suggested daily calorie target (FR-002) converted via a fixed average calorie density of 1.5 kcal/g, and remains fully editable. Priority: must-have
  > Socrates: Counter-argument considered: manual entry duplicates the already-computed calorie target. Resolution: accepted — auto-fill using a fixed 1.5 kcal/g average, user can still override the value.
- FR-005: User can enter category proportions — meat, bone, organs, liver, veggies, fruits, others (step 2). Proportions must sum to exactly 100%; progression to step 3 is blocked with an error until they do. Priority: must-have
  > Socrates: Counter-argument considered: unvalidated proportions could make category targets inconsistent with the total meal mass. Resolution: accepted — block progression with an error until proportions sum to 100%.
- FR-006: User can select how many days the meal batch covers (step 2). The entered daily meal mass × number of days determines the total batch mass to shop/prep for; category targets and nutrient totals in step 3 remain per-day (based on the entered daily mass), not for the whole batch. Priority: must-have
  > Socrates: Counter-argument considered: selecting "days" with no portioning effect makes it a label with no calculation impact. Resolution: accepted — days multiplies daily mass into a total batch-to-prepare figure; per-day category targets/nutrients are unaffected.
- FR-010: If the user has no pets yet, the calculator (`/calculator`) shows an inline empty-state with a shortcut to create a pet, instead of a blank/broken pet list. Priority: must-have

### Meal calculator — ingredients & nutrients
- FR-007: App calculates the target mass per category from total mass + proportions, and displays it (step 3). Priority: must-have
  > Socrates: Counter-argument considered: category targets depend on FR-005's proportions being valid. Resolution: resolved by FR-005's 100%-sum validation — no independent change needed here.
- FR-008: User can add specific ingredients from a fixed, pre-seeded ingredient database within a category, with an amount, to reach that category's target mass. Priority: must-have
  > Socrates: Counter-argument considered: a fixed, non-extensible ingredient list may not include ingredients the user actually has on hand. Resolution: accepted as an MVP limitation — user-submitted ingredients are out of scope for v1 (see Non-Goals).
- FR-009: App calculates and displays the final nutrient totals for the meal, updating live as ingredients or amounts change. Priority: must-have
  > Socrates: No counter-argument raised; stands as written. Recalculation performance/debouncing is a downstream implementation concern, not a PRD-level decision.

## Non-Functional Requirements

- A user can only ever see or edit their own pets and recipes — never another account's data.
- Nutrient totals visibly update within a perceptibly instant window (target: under ~300ms) after any ingredient or amount change.

## Business Logic

For a given dog, the app derives a suggested daily energy requirement from weight and lifestyle, breaks the meal down into per-category ingredient targets from user-set proportions, and continuously recalculates the meal's total nutrient profile as the user selects and adjusts ingredients.

The rule consumes user-facing inputs: the dog's weight (kg) and lifestyle (mapped to an energy factor), a daily meal mass, a set of category proportions (meat, bone, organs, liver, veggies, fruits, others) that must sum to 100%, a number of days the batch covers, and the specific ingredients (with amounts) the user picks within each category.

Its output is twofold: a suggested daily energy target for the dog, and — as the user builds the meal — a live nutrient profile, derived from the sum of the nutrient content of every selected ingredient weighted by its amount.

The user encounters this rule entirely within the calculator flow: category proportions determine target masses per category before any ingredient is picked, and once ingredients are added, the final nutrient totals update immediately with every change — there is no separate "calculate" step the user must trigger.

## Access Control

Login required (account-based). Flat user model — every authenticated user has the same capabilities, scoped to their own dogs and recipes; no admin/member/guest role distinction. No unauthenticated access to dog/recipe data.

## Non-Goals

- No user-submitted or editable ingredients — the ingredient database is fixed, pre-seeded data only in v1.
- No multi-client / professional features — this serves a single hobbyist owner managing their own pet(s), not breeders, consultants, or kennels managing multiple clients.
- No roles or admin features — the flat user model stays flat; no admin panel or role management.

## Open Questions

None — all inputs were resolved during shaping (see `context/foundation/shape-notes.md`); the quality cross-check recorded no gaps.
