# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager is **pnpm** (see `packageManager` in `package.json`); npm/yarn will not respect the lockfile.

- `pnpm dev` — dev server via Turbopack (`next dev --turbo`).
- `pnpm build` — **must** keep the `--webpack` flag (`next build --webpack`). Turbopack is the Next 16 default builder, but it has a confirmed bug in this project: it leaks the `postgres` driver (which needs Node's `tls`/`net`) into the client bundle even though it's only ever reached via a `type`-only import of `AppRouter`. Don't drop `--webpack` without re-verifying upstream has fixed this. `pnpm preview` (build + start) needs the same flag and already has it.
- `pnpm check` — `biome check .` followed by `tsc --noEmit`; run before considering work done. `pnpm check:write` / `check:unsafe` auto-fix.
- `pnpm test` — `vitest run` (all tests, once).
- `pnpm db:generate` / `db:migrate` / `db:push` / `db:studio` — Drizzle Kit, against `DATABASE_URL`.
- `./start-database.sh` — spins up a local Postgres container (Docker/Podman) using the host/port/db name/password parsed out of `DATABASE_URL` in `.env`.

## Architecture

T3 Stack app: Next.js 16 (App Router) + tRPC + Drizzle ORM (Postgres) + NextAuth v5 (Auth.js) + Tailwind + Biome.

**Request flow**: `src/app/**` (routes/pages) → `src/trpc/*` (client/server tRPC wiring — `react.tsx` is the `"use client"` provider consumed by client components, `server.ts` is for server-side/RSC calls, `query-client.ts` builds the shared `QueryClient`) → `src/server/api/*` (`root.ts` aggregates every feature router into `appRouter`; `trpc.ts` defines the request context, `publicProcedure`, and `protectedProcedure`; `routers/` holds one file per feature). A new router must be manually wired into `appRouter` in `root.ts` — nothing auto-registers.

**Env vars**: validated in `src/env.js` via `@t3-oss/env-nextjs` + zod. Adding one requires touching three places in that file: the `server`/`client` zod schema, the `runtimeEnv` mapping, and `.env`/`.env.example` — missing any one fails validation at build/dev time with a clear error naming the var.

**Auth**: NextAuth v5, Google OAuth only (`AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET`) — the `create-t3-app` default was Discord and was swapped out for this project. `DrizzleAdapter` persists users/accounts/sessions/verification-tokens via the schema in `src/server/db/schema.ts`. Local dev's OAuth redirect URI is `http://localhost:3000/api/auth/callback/google`.

**DB naming**: all tables go through `createTable = pgTableCreator((name) => \`gmr-mini_${name}\`)` in `schema.ts` (see the file's own `@see` comment). `drizzle.config.ts`'s `tablesFilter: ["gmr-mini_*"]` must match that same prefix — keep them in sync if it ever changes.

**Testing**: Vitest + **happy-dom** (deliberately not jsdom — see pinned-versions note below) + Testing Library. Config in `vitest.config.ts`, global setup in `vitest.setup.ts`.

### Deliberately pinned dependency versions

These are pinned from direct testing, not oversights — don't "helpfully" bump them without checking whether the upstream bug is fixed:

- `vite@7.3.6`, `vitest@3.2.7`, `@vitejs/plugin-react@4.7.0` — a verified-working set. `vitest@4.x` pulls in `vite@8.x`/Rolldown, which hit a native-binding resolution failure on this machine; `@vitejs/plugin-react@6.x` requires `vite@^8` while `vitest@3.x` runs on `vite@7`, so mixing majors silently breaks JSX transform. Upgrade all three together, as a set, if ever.
- `jsdom` was replaced by `happy-dom` entirely — jsdom 28+ pulls in `html-encoding-sniffer@6`, which `require()`s an ESM-only dependency (`@exodus/bytes`) and crashes; older jsdom majors cascade into similar ESM/CJS breaks elsewhere in their tree (e.g. `@asamuzakjp/css-color`).
- `zod` held at v3, not v4, pending verification that tRPC v11 is compatible with zod v4's API changes.

### Non-obvious repo layout

- `context/` holds artifacts from a "10xDevs" AI-toolkit bootstrap chain (PRD, shape-notes, tech-stack selection, health-check reports) — planning/audit-trail content, not application code.
- Files/dirs suffixed `.scaffold` (`.env.scaffold`, `README.md.scaffold`, `src.scaffold/`, etc.) are leftover diff-reference copies from a rescaffold, not live code — they're excluded from `tsconfig.json`, `biome.jsonc`, and `vitest.config.ts`. Don't edit them as if they were real source; diff against the live file and delete once reconciled.

<!-- BEGIN @przeprogramowani/10x-cli -->

## 10xDevs AI Toolkit - Module 3, Lesson 4 (E2E Tests)

**For E2E tests, use the `/10x-e2e` skill.** It is the single source of truth
for the workflow — risk → seed test + rules → generate → review against the five
anti-patterns → re-prompt → verify. The skill's `references/` carry the full
rules, anti-patterns, seed pattern, and prompt-template.

A few hard rules that hold even before you invoke the skill:

- **Locators:** `getByRole` / `getByLabel` / `getByText` first; `getByTestId`
  only when accessibility attributes are ambiguous. Never CSS selectors, XPath,
  or DOM structure.
- **Never `page.waitForTimeout()`.** Wait for state: `toBeVisible()`,
  `waitForURL()`, `waitForResponse()`.
- **Test independence + cleanup.** Each test runs standalone — its own setup,
  action, assertion, and cleanup; unique ids (timestamp suffix) so parallel runs
  and re-runs don't collide.

Two boundaries to keep straight:

- **DOM (snapshot) is the default.** Vision (`--caps=vision`) is a supplement for
  visual-only risks (layout, z-index, animation); for pixel regression prefer
  deterministic tools (`toMatchSnapshot`, Argos, Lost Pixel). VLM model
  selection/cost is a debugging topic (Lesson 5), not testing.
- **Healer helps on selectors, harms on logic.** A changed selector → healer
  re-finds it (route through PR review). A changed business behavior → healer
  masks the bug; that failing-test-to-fix case is Lesson 5.

<!-- END @przeprogramowani/10x-cli -->
