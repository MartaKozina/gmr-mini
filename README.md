# gmr-mini

A raw-feeding meal calculator for dogs. Add a dog (weight, lifestyle) and get a
suggested daily energy target, then build a meal in three steps — set category
proportions, add specific ingredients, and watch calories, protein, fat, and
calcium:phosphorus update live as you go. Save meals as recipes and revisit
them later.

This is a lean, from-scratch rewrite of the author's own existing product
(givemeraw.com) — no migration of old code, data, or users. Full requirements
live in [`context/foundation/prd.md`](context/foundation/prd.md); the
domain-logic risk map lives in
[`context/foundation/test-plan.md`](context/foundation/test-plan.md).

Built on the [T3 Stack](https://create.t3.gg/): Next.js 16 (App Router) + tRPC
+ Drizzle ORM (Postgres) + NextAuth v5 (Google OAuth) + Tailwind + Biome, on
pnpm.

## Getting started

1. Copy `.env.example` to `.env` and fill in `AUTH_SECRET` (generate with
   `npx auth secret`), `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` (from the
   [Google Cloud console](https://console.cloud.google.com/apis/credentials)),
   and `DATABASE_URL`.
2. Start local Postgres: `./start-database.sh` (spins up a Docker/Podman
   container using the host/port/db name/password parsed from `DATABASE_URL`).
3. Push the schema: `pnpm db:push`.
4. `pnpm dev` — dev server at `http://localhost:3000`.

Before considering any change done, run `pnpm check` (Biome + `tsc --noEmit`)
and `pnpm test` (Vitest). See [`CLAUDE.md`](CLAUDE.md) for the full command
reference, architecture notes, and the project's non-obvious gotchas
(deliberately pinned dependency versions, the Turbopack build-time bug that
requires `--webpack`, etc.).

### The tested rule

**Convention**: new tRPC feature routers are named `<feature>.ts`, singular, no suffix (e.g. `post.ts`, not `pets.ts` or `petRouter.ts`).

**Method**: gave a fresh, independent agent session the same task — "add a `pets` feature: Drizzle table + tRPC router with a `create` procedure + register it in the root router" — 6 times, with the exact same starting repo state restored between every run. 3 runs had no naming rule in `AGENTS.md`; 3 runs had a one-line rule added.

| Condition | Attempt | Router filename | Time | Tool calls |
| --------- | ------- | --------------- | ---- | ---------- |
| No rule   | 1       | `pet.ts` ✓      | 68s  | 13         |
| No rule   | 2       | `pet.ts` ✓      | 87s  | 13         |
| No rule   | 3       | `pet.ts` ✓      | 120s | 18         |
| With rule | 1       | `pet.ts` ✓      | 86s  | 16         |
| With rule | 2       | `pet.ts` ✓      | 80s  | 14         |
| With rule | 3       | `pet.ts` ✓      | 100s | 15         |

**Result**: 6/6 — the agent converged on the correct naming convention every time, with or without the rule, simply by reading the one existing router (`post.ts`) and the surrounding docs. The rule added no measurable improvement (and cost slightly more tokens on average, since the agent tended to quote it back in its reasoning).

**Decision**: removed the rule from `AGENTS.md`. Per the calibration drill's own criterion — if the agent already performs well without a rule, the rule isn't earning its place in context. Interestingly, _other_ unruled decisions in the same task (auth gating: `protectedProcedure` vs `publicProcedure`; column type: `real` vs `doublePrecision`) did vary across attempts — good candidates for a future rule if that inconsistency ever becomes a real problem.
