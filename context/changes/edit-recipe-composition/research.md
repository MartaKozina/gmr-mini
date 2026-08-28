---
date: 2026-08-27T09:04:35Z
researcher: Claude Sonnet 5
git_commit: 4088bcc
branch: task/01
repository: gmr-mini
topic: "How should editing a saved recipe's ingredient composition be implemented, given the existing calculator/recipe architecture?"
tags: [research, codebase, recipe, calculator, ui-architecture, data-model]
status: complete
last_updated: 2026-08-27
last_updated_by: Claude Sonnet 5
---

# Research: Editing a saved recipe's ingredient composition

**Date**: 2026-08-27T09:04:35Z
**Researcher**: Claude Sonnet 5
**Git Commit**: 4088bcc
**Branch**: task/01
**Repository**: gmr-mini

## Research Question

`recipe.update` currently accepts only `name`, `dailyMassGrams`, and `days` — it deliberately excludes `proportions` and `selectedIngredients` (the recipe's actual ingredient composition). Changing composition today means deleting the recipe and rebuilding it from scratch via the calculator. What would it actually take to lift that limitation — let a user edit an existing recipe's category proportions and ingredient list in place?

## Summary

The data layer is **not** the blocker: the `recipes` table already stores `proportions` and `selectedIngredients` as jsonb columns, no migration is needed, and the ownership-check + validation pattern used everywhere else in this codebase (`proportionsSchema` with its `proportionsSumTo100` refine) is directly reusable — it just isn't currently wired into `recipe.update`'s input schema. The real cost is on the UI side: `CalculatorClient` is a stateful 3-step wizard (7 pieces of state spanning all three steps, plus a nested `CategorySection` subcomponent with its own local state) built with the implicit assumption that it always starts empty. There is no prop-driven "initial state" path today — everything seeds from either a hardcoded default or the freshly-fetched pets list.

The codebase already has a working "edit an entity in place" pattern (`PetCard`/`RecipeCard`'s inline-form-toggle), but it's a poor fit here: that pattern assumes one flat form pre-filled once from props and submitted once, whereas the wizard's state is assembled incrementally across three gated steps. Applying the same pattern to the wizard would mean either (a) refactoring `CalculatorClient` to accept an optional "seed from an existing recipe" prop and derive all seven state slices from it, or (b) building a second, parallel edit-only UI — both are real engineering work, not a config flag.

Crucially, the original decision to exclude composition editing was **never framed as a hard constraint** — `prd.md`'s own Socrates note calls it "a v1 limitation" motivated by UI effort, with an explicit escape hatch (rebuild via the calculator). That framing means this is a legitimate, currently-open scope question, not something previously ruled out for a technical reason that would need re-litigating.

## Detailed Findings

### CalculatorClient's state model (UI layer)

`src/app/calculator/_components/calculator-client.tsx` holds seven independent `useState` slices: `step` (1|2|3), `selectedPetId`, `dailyMassGrams`, `days`, `proportions`, `selected` (the ingredient list), and `recipeName` (calculator-client.tsx:42-51). None of them are derived from props or route/query params — the component takes zero props (calculator-client.tsx:38) and every slice starts from a hardcoded default except `selectedPetId`, which seeds from `pets[0]` (the tRPC-fetched pet list), not from any "existing recipe" source.

Step transitions are validation-gated, not free navigation: step 1→2 requires `dailyMassGrams > 0` (calculator-client.tsx:141), step 2→3 requires `proportionsSumTo100(proportions)` (calculator-client.tsx:207). The nested `CategorySection` component (calculator-client.tsx:320-411) adds its own local `ingredientId`/`grams` state per category card and mutates the parent's `selected` array via `onAdd`/`onRemove` callbacks — so "the ingredient list" isn't one flat piece of state, it's assembled through N independent sub-forms (one per category) writing into a shared array.

The save mutation (`api.recipe.create.useMutation`, calculator-client.tsx:53-58) fires on step 3's form submit and sends exactly the 6 fields that make up a recipe: `name` (from `recipeName`), `petId`, `dailyMassGrams`, `days`, `proportions`, `selectedIngredients` (calculator-client.tsx:261-272).

### recipe.ts / schema.ts (data layer)

The `recipes` table (schema.ts:39-68) already has `proportions` (`jsonb().notNull().$type<Record<string, number>>()`, schema.ts:50) and `selectedIngredients` (`jsonb().notNull().$type<{ ingredientId: string; grams: number }[]>()`, schema.ts:51-54) — both columns exist and are populated by `create` today. **No schema change or `db:push` would be needed** to let `update` write to them.

`recipe.update`'s input schema (recipe.ts:73-79) is `{ id, name, dailyMassGrams, days }` — `proportions`/`selectedIngredients` are simply absent from both the zod input and the `.set({...})` call (recipe.ts:94-98). By contrast, `recipe.create`'s input (recipe.ts:20-36) includes both, validated through `proportionsSchema` (recipe.ts:10-16 — built from `CATEGORIES` via `Object.fromEntries`, refined with the shared `proportionsSumTo100` from `~/lib/calculator`). That schema is a **local `const`, not exported** — it would need to be exported (or duplicated) to reuse in `update`. The ownership-check pattern (fetch row, compare `createdById` to `ctx.session.user.id`, throw `NOT_FOUND` otherwise) is already identical across `create`/`update`/`delete` (recipe.ts:38-43, 82-90, 105-113) and needs no change — this is also the exact pattern just codified in `context/foundation/lessons.md`.

### Existing edit-mode UI precedent, and why it doesn't generalize

`PetCard` (pets-client.tsx:97-212) and `RecipeCard` (recipes-client.tsx:41-184) both implement the same shape: an `editing` boolean toggles between a read-only view and a `<form>` whose fields are seeded once from the entity prop at mount (e.g. `useState(recipe.name)`), Cancel just flips the flag back (discarding uncommitted edits), and the `update` mutation's `onSuccess` invalidates the query and flips `editing` back to `false` so the refetched prop repopulates the read-only view.

This pattern assumes **one flat form, pre-filled once, submitted once** — it doesn't map onto `CalculatorClient`'s reality: 7 state slices spanning 3 gated steps, plus a per-category sub-form pattern for the ingredient list. Reusing this exact toggle pattern for recipe composition would require either reconstructing all 7 state slices from a persisted recipe inside a card (working around the wizard's gating logic, which was never built to be entered mid-flow) or building an entirely separate edit surface.

### Historical framing of the original exclusion

`prd.md`'s FR-012 Socrates note (quoted from `context/changes/document-recipe-feature-in-prd/plan.md` and `prd.md` directly):

> "Counter-argument considered: allowing the ingredient composition itself to be edited in place would need re-exposing the full calculator UI from the list view. Resolution: accepted as a v1 limitation — editing is scoped to the summary fields (name, daily mass, days); changing composition means building a new recipe via the calculator's save flow (FR-011)."

This is an effort/scope tradeoff, explicitly labeled "a v1 limitation," not a claim that it's technically infeasible. Nothing in `context/changes/document-recipe-feature-in-prd/` or `context/foundation/lessons.md` frames it otherwise.

## Code References

- `src/app/calculator/_components/calculator-client.tsx:42-51` — the 7 state slices `CalculatorClient` holds
- `src/app/calculator/_components/calculator-client.tsx:38` — component takes zero props; nothing to seed initial state from today
- `src/app/calculator/_components/calculator-client.tsx:141,207` — step-gating validation (`dailyMassGrams > 0`, `proportionsSumTo100`)
- `src/app/calculator/_components/calculator-client.tsx:261-272` — `saveRecipe.mutate(...)` payload, i.e. the full shape a recipe is made of
- `src/app/calculator/_components/calculator-client.tsx:320-411` — `CategorySection`'s own local state and its `onAdd`/`onRemove` contract with the parent
- `src/server/db/schema.ts:39-68` — `recipes` table, including the already-existing `proportions`/`selectedIngredients` jsonb columns
- `src/server/api/routers/recipe.ts:10-16` — `proportionsSchema`, local-only, not exported
- `src/server/api/routers/recipe.ts:20-36` vs `73-79` — `create`'s full input schema vs `update`'s scalar-only input schema
- `src/server/api/routers/recipe.ts:38-43,82-90,105-113` — the repeated ownership-check pattern
- `src/app/pets/_components/pets-client.tsx:97-212` — `PetCard`'s inline-edit-toggle pattern
- `src/app/recipes/_components/recipes-client.tsx:41-184` — `RecipeCard`'s inline-edit-toggle pattern (same shape as `PetCard`)

## Architecture Insights

- This codebase's established "edit an entity" pattern (boolean toggle + form seeded once from props) works well for flat, single-step entities but has no precedent yet for editing something assembled through a multi-step, gated wizard. Extending it here would be the first instance of that harder case, not a copy-paste of an existing solution.
- The data layer was clearly built anticipating this: the jsonb columns and the `create`-time validation already exist in the exact shape `update` would need. The gap is entirely in the router's input schema and the UI's inability to be entered with pre-existing state — this is a UI-architecture problem, not a data-modeling one.
- `proportionsSchema` not being exported is a small, easily-fixed friction point (recipe.ts:10-16) — any future work reusing it in `update` should hoist it to a shared location (or export it) rather than duplicating the `Object.fromEntries`/refine construction.

## Historical Context (from prior changes)

- `context/changes/document-recipe-feature-in-prd/plan.md` — the plan that back-filled `prd.md` with FR-011/FR-012; documents (rather than decides) the existing `create`/`update`/`delete` split, including the composition-editing exclusion.
- `context/changes/document-recipe-feature-in-prd/plan-brief.md:23` — frames that whole PRD back-fill as retroactively documenting already-shipped code, not as fresh design decisions — reinforcing that the "v1 limitation" framing was itself written after the fact, not a deliberate architectural ruling made with this exact tradeoff in mind at build time.
- `context/foundation/lessons.md` — the one existing entry ("Always check ownership before reading or mutating user-owned data by id") is directly applicable to any new `update` input surface this work would add — no new ownership pattern needs to be invented.

## Related Research

None — this is the first `research.md` in this repo.

## Open Questions

1. **Product shape**: should editing composition happen via a modal/expanded view launched from `RecipeCard` (closer to the existing edit-toggle pattern, reusing `CalculatorClient`'s step-3-only UI in isolation), or as a dedicated `/recipes/[id]/edit` route that reopens the full 3-step wizard pre-filled? This is a real design decision, not something this research resolves — it directly shapes how much of `CalculatorClient` needs refactoring to accept initial state versus how much can be a smaller, composition-only editor.
2. **Step 1/2 re-validation**: if a user edits composition only (skipping straight to "step 3" of a pre-filled wizard), do steps 1 and 2's pre-filled values (pet, daily mass, proportions) need to be re-validated/re-editable too, or can they be locked once a recipe already exists? This affects how much of the wizard's gating logic needs to run in edit mode.
3. **Whether this is worth building at all**: the original "v1 limitation" framing included an escape hatch (delete + rebuild) that already works today. This research establishes *feasibility and cost*, not *priority* — that's a product call for `/10x-plan` (or a roadmap discussion) to make, not this document.
