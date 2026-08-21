# Repository Guidelines

gmr-mini is a T3 Stack app — Next.js 16 (App Router) + tRPC + Drizzle ORM (Postgres) + NextAuth v5 + Tailwind + Biome — managed with pnpm.

## Hard rules

- Keep the `--webpack` flag on `pnpm build`/`pnpm preview` — Turbopack leaks the `postgres` driver into the client bundle on this project. Details: `@CLAUDE.md`.
- Don't bump `vite`, `vitest`, or `@vitejs/plugin-react` off their pinned versions (`7.3.6` / `3.2.7` / `4.7.0`) without re-verifying the upstream bugs in `@CLAUDE.md` are fixed; upgrade all three together, never individually.
- Test environment is `happy-dom`, not `jsdom` (real ESM/CJS crashes at current `jsdom` versions) — don't re-add it.
- `zod` stays on v3 pending tRPC v11 compatibility verification.
- `.scaffold`-suffixed files/dirs (e.g. `src.scaffold/`) are leftover rescaffold diffs, not live code — never edit them.
- `context/` holds bootstrap-toolkit artifacts (PRD, tech-stack, health checks), not application code.

## Project Structure

Source lives in `src/`: `app/` (Next App Router routes), `server/api/` (tRPC routers, aggregated in `root.ts`), `server/db/` (Drizzle schema + client), `server/auth/` (NextAuth config), `trpc/` (client/server tRPC wiring). See `@CLAUDE.md` for the full request-flow description.

## Build, Test, and Development Commands

- `pnpm dev` — dev server (Turbopack).
- `pnpm build` — production build (`--webpack`, see Hard rules).
- `pnpm check` — Biome check + `tsc --noEmit`; run before considering work done.
- `pnpm test` — Vitest, all tests once.
- `pnpm db:push` / `db:studio` — Drizzle Kit against `DATABASE_URL`.

Full script list: `@package.json`.

## Coding Style & Naming Conventions

Tabs, enforced by Biome (`@biome.jsonc`) — run `pnpm check:write` to auto-format, not a separate formatter. TypeScript `strict: true`. Import path alias `~/*` resolves to `src/*`.

## Testing Guidelines

Vitest + `happy-dom` + Testing Library, config in `@vitest.config.ts`. Tests co-locate as `*.test.tsx`/`*.test.ts` next to source.

## Commit & Pull Request Guidelines

No established convention yet — history is a single setup commit and no remote is configured. Define a convention (e.g. Conventional Commits) before the team grows past solo use.

## Security & Configuration Tips

Every env var must be declared in `src/env.js`'s zod schema, its `runtimeEnv` mapping, and `.env`/`.env.example` — see `@CLAUDE.md` for why all three are required. Auth is Google OAuth only (`AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET`); real values live in `.env` (gitignored).
