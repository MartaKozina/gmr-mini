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

## 10xDevs AI Toolkit — Module 1, Lesson 5

Pick a deployment platform and ship to production with the **infra chain**:

```
(/10x-init  →  /10x-shape  →  /10x-prd  →  /10x-tech-stack-selector  →  /10x-bootstrapper  →  /10x-agents-md  →  /10x-rule-review  →  /10x-lesson)  →  /10x-infra-research  →  Plan Mode deploy
```

The full Module 1 chain ships from Lessons 1–4 (re-included so you can fix any earlier contract mid-flight). `/10x-infra-research` is the lesson's main topic; the deploy step itself uses the host's built-in **Plan Mode** rather than a dedicated skill — the artifact (`context/deployment/deploy-plan.md`) is what carries forward.

### Task Router — Where to start

| Skill | Use it when |
| --- | --- |
| **Infrastructure (lesson focus)** | |
| `/10x-infra-research [path-to-tech-stack-or-prd]` | You have a `context/foundation/tech-stack.md` (and ideally a `prd.md`) and need to pick an MVP deployment platform. The skill loads the stack as a hard constraint, runs a 5-question developer interview (persistent connections, cost sensitivity, existing familiarity, global reach, co-location preference), spawns parallel subagent research across six candidate platforms, scores them Pass/Partial/Fail across the five agent-friendly criteria from `references/agent-friendly-criteria.md`, shortlists the top three, and runs a three-lens anti-bias cross-check on the leader (devil's advocate, pre-mortem, unknown unknowns) before writing `context/foundation/infrastructure.md`. Use AFTER `/10x-tech-stack-selector`, BEFORE `/10x-implement`. |
| **Deploy (host built-in, not a skill)** | |
| Plan Mode deploy | You have `infrastructure.md` + `tech-stack.md` and want a read-only plan reviewed before any mutation hits the platform. Activate the host's plan mode (Claude Code: `Shift+Tab` cycles default → auto-accept → plan; IDE: dedicated button) with the prompt "Wykonajmy pierwsze wdrożenie w oparciu o `@infrastructure.md`, zgodnie ze stackiem z `@tech-stack.md`". Read the plan, demand corrections, approve, then let the agent execute. The approved plan persists at `context/deployment/deploy-plan.md` so the next lesson's milestone planning can reference what's already deployed and which secrets are already wired. |
| **Re-run upstream if needed** | |
| `/10x-init` / `/10x-shape` / `/10x-prd` / `/10x-tech-stack-selector` / `/10x-bootstrapper` / `/10x-agents-md` / `/10x-rule-review` / `/10x-lesson` / `/10x-stack-assess` / `/10x-health-check` | Bundled so you can patch any earlier contract mid-flight. If the anti-bias cross-check forces a platform swap that pushes a stack-shaped decision (e.g. "this DB doesn't fit any platform we'd accept"), re-run `/10x-tech-stack-selector` to keep `tech-stack.md` and `infrastructure.md` aligned. |

### How the chain hands off

- `/10x-infra-research` reads `context/foundation/tech-stack.md` (language, framework, runtime, database) as **hard constraints** — platforms that can't run the stack are dropped before scoring. It also reads `context/foundation/prd.md` (scale, latency, uptime expectations) as **soft weights** when scoring. Both inputs are optional but strongly recommended; without them the skill proceeds but warns.
- The skill writes `context/foundation/infrastructure.md` as the third foundation contract: frontmatter (`project`, `researched_at`, `recommended_platform`, `runner_up`, `context_type`, `tech_stack`) plus a body covering recommendation, full platform comparison with scoring matrix, anti-bias findings, operational story (preview / secrets / rollback / approval / logs), and a risk register tying every entry back to the lens that surfaced it. On collision the skill prompts: overwrite, save as `infrastructure-v2.md`, or abort.
- Plan Mode reads `infrastructure.md` and `tech-stack.md` together. The agent emits a step-by-step plan covering automated steps it owns, manual setup gates (account creation, secret configuration), exact deploy commands (Pages vs Workers commands are NOT interchangeable on Cloudflare — the plan must specify), and verification steps. The plan is rejected/edited until it's right; only then does Plan Mode exit and execution begin. The approved plan lands at `context/deployment/deploy-plan.md` and is consumed downstream by milestone-planning skills as ground truth for "what's already deployed".

### What the lesson's skills capture (and what they do NOT)

- **`/10x-infra-research` captures**: platform shortlist scored against five agent-friendly criteria (CLI quality, managed/serverless degree, agent-readable docs, stable/scriptable deploy API, MCP or first-class agent integration), three anti-bias outputs on the leader (numbered weaknesses, 150–200-word failure narrative, 3–5 unknown-unknowns), an operational story with one concrete answer per axis (not categories), and a risk register where every row names its source lens (`Devil's advocate` / `Pre-mortem` / `Unknown unknowns` / `Research finding`). Status of every non-GA feature is captured inline (`beta` / `preview` / `region-limited` / `deprecated`) with the date the status was checked.
- **`/10x-infra-research` does NOT** build Docker images or write Dockerfiles, configure CI/CD pipelines, or plan beyond MVP scope (multi-region HA is explicitly out of scope). It does NOT decide for you — the user accepts, swaps to runner-up, or aborts after the cross-check, and that decision is recorded in the output.
- **Plan Mode** captures: an explicit human gate between "agent has a plan" and "agent mutates production". The artifact (`deploy-plan.md`) is the audit trail for "what was supposed to happen" when the live run goes sideways. Plan Mode does NOT replace `/10x-infra-research` (the platform decision must already be made — Plan Mode plans the deploy, it doesn't pick where to deploy).

### The five agent-friendly criteria (and why they're load-bearing)

The criteria that make `/10x-infra-research`'s scoring matrix are not generic "good platform" axes — they're the specific traits that determine whether an agent can operate this platform from a session without you holding its hand:

1. **CLI-first** — every routine operation has a documented command; the agent doesn't need to click in a panel.
2. **Managed / serverless** — fewer moving pieces means fewer ways the agent (or you) breaks something the platform was supposed to handle.
3. **Agent-readable docs** — markdown / `llms.txt` / GitHub-hosted docs the agent can fetch and parse, not JS-rendered marketing pages.
4. **Stable, scriptable deploy API** — predictable exit codes, structured output, no interactive prompts mid-deploy.
5. **MCP server or first-class agent integration** — bonus, not required. CLI alone is fine for MVP; MCP earns its keep when the agent makes dozens of structured queries against live state.

Hard filters apply before scoring (persistent-connection requirement drops Netlify/Vercel serverless-only; tech-stack runtime mismatch drops the platform entirely). Interview answers reweight criteria after — cost sensitivity penalizes expensive base tiers, familiarity breaks ties, global-reach preference favours edge-native platforms, co-location preference favours integrated databases.

### Anti-bias as a decision discipline (not theatre)

Every research conversation with an LLM has a built-in tilt toward whatever the user already signalled. `/10x-infra-research` runs three structured lenses against the leader BEFORE the file is written, not after:

- **Devil's advocate** — *find the weaknesses, hidden costs, and failure modes specific to deploying `<this stack>` on `<this platform>`*. Output is a numbered list of 3–5 specifics, not categories.
- **Pre-mortem** — *six months later, this decision turned out to be a complete disaster; walk through the assumptions and underestimated risks that led there*. Output is a 150–200-word narrative; narratives surface concrete failure shapes that abstract risk lists hide.
- **Unknown unknowns** — *what's true about this combination that the marketing page and docs don't make obvious?* Output is 3–5 non-obvious risks.

After the cross-check the user has three real options: **proceed with the leader and absorb the risks into the register**, **swap to runner-up** (and re-run the cross-check on the new leader), or **swap to third place**. The third option is rare; if it never happens across many runs, the cross-check has degraded into a ritual and should be rewritten.

Two additional techniques (no skill required, raw prompts) belong in the same toolbox: forcing the model to compare three alternatives in a markdown table (structure beats "the same answer in different words"), and role-rotation (the same decision through a frontend dev's, security person's, and cost owner's eyes — surface the cost each role pays and propose alternatives if any of them flinch).

### CLI vs MCP for live-infra operability

After deploy, the agent needs a way to talk to the running platform. Two paths, complementary not competing:

- **CLI** (`wrangler`, `flyctl`, `vercel`, `gh`) — explicit and auditable, output stays in the terminal, safer defaults for irreversible actions (e.g. `netlify deploy` is draft by default; `--prod` must be passed). Best for MVP: minimal setup, low context cost (no tool schemas pre-loaded), and the agent has to know the command (which is where a per-tool skill helps).
- **MCP** — a dedicated server exposing structured tools with schemas (`pages_deployments_list`, etc.). Each connected MCP server adds tool definitions to the context window, so cost compounds across servers. Earns its keep when the agent makes many discovery-style queries against live state (logs, deployment diffs) and structured JSON beats parsing CLI output.

Sensible default: start with CLI, add MCP when you notice a recurring pattern of `--help` traversal the agent has to do to answer a class of questions. Anthropic's own [building-agents-that-reach-production](https://claude.com/blog/building-agents-that-reach-production-systems-with-mcp) framing is "API, CLI, and MCP are three complementary paths" — pick by task, not by hype.

### Production-access boundary (minimal permissions, human-on-irreversibles)

Both CLI and MCP can give the agent direct access to production. The lesson sets a default posture:

- **Tokens are scoped, not master keys.** On Cloudflare: an API token limited to Pages or Workers for one project, no DNS, no Workers Secrets for unrelated projects, no billing. AWS / GCP equivalent: scoped IAM role with `console-only-user` or read-only on production, full access on staging.
- **Tokens live in env vars, not in `.mcp.json` committed to the repo.** The agent picks them up via the MCP server or CLI's env-discovery, not via plaintext in conversation.
- **Destructive actions are human-only.** Drop a database, rotate a primary secret, delete a project — those are panel-by-hand operations, even if the agent suggests them. Manual click costs 30 seconds; cleanup after an automated mistake costs hours.

This is the MVP posture. As the project matures, the natural evolution is staging gets full agent access, production becomes read-only — covered in later modules.

### Foundation paths used by this lesson

- `context/foundation/tech-stack.md` — input (Lesson 2 hand-off, hard constraints)
- `context/foundation/prd.md` — input (Lesson 1 hand-off, soft weights)
- `context/foundation/infrastructure.md` — output (the third foundation contract)
- `context/deployment/deploy-plan.md` — output of Plan Mode deploy (audit trail of "what was supposed to happen")
- `context/foundation/lessons.md` — recurring rules & pitfalls (use `/10x-lesson` from Lesson 4 if you spot a class of agent failure during research or deploy)
- `docs/reference/contract-surfaces.md` — load-bearing names registry

### Universal language

The shipped skill carries no 10xDevs / cohort / certification references. The candidate platform list (Cloudflare, Vercel, Netlify, Fly.io, Railway, Render) is the starting research lens, not a recommendation set — the scoring + interview + cross-check pipeline is what's load-bearing, and a platform absent from the default list can be added by extending the research step. The five agent-friendly criteria are the artifact's true core; `/10x-infra-research` re-reads them from `references/agent-friendly-criteria.md` so they evolve as platforms do.

Skills must not write to `context/archive/`. Archived changes are immutable; if a resolved target path starts with `context/archive/`, abort with: "This change is archived. Open a new change with `/10x-new` instead."

<!-- END @przeprogramowani/10x-cli -->
