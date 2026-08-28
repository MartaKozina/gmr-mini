---
project: "gmr-mini"
version: 1
status: draft
created: 2026-08-26
---

# gmr-mini — Test Plan

## Purpose

This document names the concrete risks in gmr-mini's domain logic — the parts of the app a bug in would silently mislead someone about how to feed their dog — and maps each one to the test that protects against it. It exists so test coverage is driven by *what must not break*, not by what happens to be easiest to test.

Out of scope for this version: UI/styling correctness and infrastructure/deployment risk — those are reviewed separately, not through automated tests.

## Risk Map

### R-01: DER/RER formula miscalculation → under/overfeeding a dog

**Risk**: `calculateRER`/`calculateDER` (`src/lib/nutrition.ts`) is the formula every other number in the app derives from (suggested daily mass, per-day calorie totals). A sign error, wrong exponent, or wrong lifestyle-factor lookup would silently produce a wrong daily energy target — the single number this app exists to get right (FR-001/FR-002 in `prd.md`).

**Likelihood**: Low (formula is fixed and small), **Impact**: High (directly drives feeding amounts).

**Covered by**: `src/lib/nutrition.test.ts` — known-value assertions for `calculateRER` and `calculateDER` across all six lifestyle factors.

**Status**: ✅ Covered.

### R-02: Meal proportions silently don't sum to 100%

**Risk**: `proportionsSumTo100` (`src/lib/calculator.ts`) gates progression from step 2 to step 3 of the calculator (FR-005). If it false-negatives on a valid float sum (e.g. `33.3 + 33.3 + 33.4`) it blocks a correct meal; if it false-positives on an invalid sum, a user proceeds to build a meal whose category targets don't actually add up to the intended daily mass.

**Likelihood**: Medium (float rounding is exactly the kind of thing that breaks a naive `=== 100` check), **Impact**: Medium (blocks a valid meal, or lets an invalid one through).

**Covered by**: `src/lib/calculator.test.ts` — exact-100 case, float-epsilon case (`33.3+33.3+33.4`), and a genuinely-wrong-sum rejection case.

**Status**: ✅ Covered.

### R-03: Calcium:Phosphorus ratio divide-by-zero

**Risk**: `sumNutrients` (`src/lib/calculator.ts`) computes `calciumMg / phosphorusMg`. Phosphorus totals to exactly 0 on every fresh calculator session (before any bone/organ ingredient is added) and whenever a user selects only phosphorus-free ingredients (e.g. fish oil). An unguarded division produces `Infinity`/`NaN`, which would either crash the recipe/calculator view or silently display garbage instead of "—".

**Likelihood**: High (this is the *default* state, not an edge case), **Impact**: Medium (broken display, not data loss).

**Covered by**: `src/lib/calculator.test.ts` — empty-selection case and fish-oil-only case, both asserting `calciumPhosphorusRatio` is `null`, not `Infinity`/`NaN`.

**Status**: ✅ Covered.

### R-04: Nutrient totals don't scale correctly with ingredient amount

**Risk**: `sumNutrients` scales each ingredient's per-100g values by `grams / 100` and sums across the selection (FR-009). A scaling or accumulation bug would produce final kcal/protein/fat/calcium/phosphorus totals a user trusts as the actual nutritional content of a meal they intend to feed their dog.

**Likelihood**: Low, **Impact**: High (directly misrepresents a real meal's nutrition).

**Covered by**: `src/lib/calculator.test.ts` — single-ingredient scaling assertion (200g of chicken breast → exactly double the per-100g values) and an unknown-ingredient-id case (ignored rather than throwing or polluting totals).

**Status**: ✅ Covered.

### R-05: Cross-user data access (IDOR)

**Risk**: A user sees or modifies another user's dogs or recipes — e.g. by guessing a `petId`/`recipe.id`. The PRD's access-control section (`prd.md`) states this as a hard requirement: "a user can only ever see or edit their own pets and recipes."

**Likelihood**: Low (every procedure filters/checks `createdById` — see `src/server/api/routers/pet.ts` and `recipe.ts`), **Impact**: High (data exposure across accounts).

**Covered by**: `src/server/api/routers/ownership.test.ts` — an integration test using `createCaller` with two real (throwaway) users against the real routers and local Postgres. Asserts user B cannot see user A's pet/recipe in `getAll`, and that `pet.update`, `pet.delete`, `recipe.create` (via another user's `petId`), `recipe.update`, and `recipe.delete` all reject with `NOT_FOUND` when attempted by user B against user A's data.

**Status**: ✅ Covered.

### R-06: A created pet silently doesn't persist (UI/DB round-trip)

**Risk**: The pet-creation flow crosses auth → routing → tRPC → DB → cache-invalidation → re-render. A break anywhere in that chain (e.g. a broken mutation, a stale cache, a silently-swallowed insert) could leave the UI showing a pet that was never actually saved — invisible to unit tests, since they never exercise the real browser/HTTP/session round-trip together. This is the one risk in this document that genuinely needs a browser, not an isolated function or router call.

**Likelihood**: Low, **Impact**: High (a user builds a meal plan around a pet that silently doesn't exist after their next visit).

**Covered by**: `tests/e2e/seed.spec.ts` (Playwright) — creates a pet through the real `/pets` UI, asserts it's visible, reloads the page (forcing a real server round-trip, not just client state), and asserts it's still visible, then cleans up via the real delete flow. Verified with a deliberate-break check: temporarily no-opped `pet.create`'s DB insert (`src/server/api/routers/pet.ts`) and confirmed the test failed red before reverting — the assertion isn't decorative.

**Status**: ✅ Covered.

## Summary

| Risk | Impact | Status |
|---|---|---|
| R-01 DER/RER formula error | High | ✅ `nutrition.test.ts` |
| R-02 Proportion-sum validation | Medium | ✅ `calculator.test.ts` |
| R-03 Ca:P divide-by-zero | Medium | ✅ `calculator.test.ts` |
| R-04 Nutrient scaling error | High | ✅ `calculator.test.ts` |
| R-05 Cross-user data access | High | ✅ `ownership.test.ts` |
| R-06 Pet creation UI/DB round-trip | High | ✅ `tests/e2e/seed.spec.ts` |

All six identified risks are covered by tests: R-01 through R-04 by unit tests in `src/lib/`, R-05 by an integration test against the real routers and database, R-06 by a browser-level Playwright test against the real running app.
