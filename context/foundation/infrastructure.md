---
project: gmr-mini
researched_at: 2026-08-20
recommended_platform: Vercel
runner_up: Render
context_type: mvp
tech_stack:
  language: TypeScript
  framework: Next.js 16 (T3 Stack — tRPC + Drizzle ORM + NextAuth v5)
  runtime: Node.js
---

## Recommendation

**Deploy on Vercel.**

You're already familiar with Vercel, and `tech-stack.md` recorded it as the starter's own default deployment target — no new tooling to learn. It clears all five agent-friendly criteria (CLI-first, managed/serverless, agent-readable docs, stable deploy API, a GA hosted MCP server), and none of your hard requirements (no persistent connections needed, single region is fine) rule it out. The trade-off you're accepting knowingly: no co-located Postgres (it's Neon-via-marketplace). The bandwidth bill-shock risk found in the cross-check below turned out to be **Pro-tier-only** — confirmed after actually deploying (see the correction note in the Risk Register): the free **Hobby** plan this project runs on has no metered overage billing at all; it pauses the project on limit instead of charging. Spend Management (the mitigation) is a Pro-only feature, and isn't offered on Hobby because there's nothing to cap.

## Platform Comparison

| Platform   | CLI-first | Managed/Serverless | Agent-readable docs | Stable deploy API | MCP/Integration | Total |
|------------|-----------|---------------------|----------------------|--------------------|------------------|-------|
| Cloudflare | Pass      | Pass                | Pass                 | Pass               | Pass             | 5 Pass |
| Vercel     | Pass      | Pass                | Pass                 | Pass               | Pass             | 5 Pass |
| Render     | Partial   | Pass                | Pass                 | Pass               | Pass             | 4 Pass / 1 Partial |
| Fly.io     | Pass      | Pass                | Pass                 | Pass               | Partial          | 4 Pass / 1 Partial |
| Railway    | Partial   | Pass                | Pass                 | Pass               | Partial          | 3 Pass / 2 Partial |
| Netlify    | Pass      | Pass                | Pass                 | Partial            | Partial          | 3 Pass / 2 Partial |

Notes per platform:

- **Cloudflare** scores maximally on raw agent-friendliness (`wrangler` covers deploy/rollback/logs, `llms.txt` docs, mature MCP tooling including a "Code Mode" server), but has no native Postgres — Hyperdrive is a connection-pooling proxy to an *externally hosted* Postgres, not a co-located database — and its main strength (global edge network) is moot given "single region is fine." Dropped from the shortlist on fit, not on agent-friendliness.
- **Vercel** scores maximally: `vercel` CLI (`deploy`, `rollback`, `logs`), `llms.txt`/`llms-full.txt` docs, a GA hosted MCP server (`mcp.vercel.com`). Postgres is Neon-via-marketplace (not first-party), and bandwidth billing has no default cap (see cross-check below).
- **Render** is close behind: native GA Postgres, GA WebSocket support, GA hosted MCP server (scope-limited to a few resource types), `llms.txt` docs. Its one gap: rollback is dashboard/API-only, not a CLI verb. Free tier exists but its Postgres expires 30 days after creation — not viable past a prototype without paying.
- **Fly.io**: strong container-based fit (native persistent processes, GA WebSockets, `llms.txt`-style docs), but its MCP server is explicitly labeled "experimental" by Fly's own docs, and Managed Postgres v2 is beta and region-limited (unmanaged Postgres is GA but explicitly unsupported by Fly's own support team).
- **Railway**: native Postgres/Redis/MongoDB co-located in one project, low realistic cost floor (~$5–15/mo), but the anti-bias cross-check (run on it before the swap to Vercel) surfaced a confirmed, documented Postgres data-corruption bug and a real March 2026 data-privacy incident (cached data served to the wrong user) — see the "Third place" note below.
- **Netlify**: solid docs/CLI, but rollback is UI-first (not a clean CLI verb) and its MCP server is a small, early-stage repo (60 stars, 7 open issues) rather than a mature, heavily-used integration.

### Shortlisted Platforms

#### 1. Vercel (Recommended)

Matches your stated platform familiarity and the tech-stack default. Zero-config Next.js 16 support, `next build --webpack` (this project's pinned build flag) works unmodified per the official upgrade guide. Next.js 16.3+ moving middleware to Node-only `proxy.ts` actually *resolves* historical NextAuth v5 edge-runtime crypto incompatibilities — a genuine positive for this exact auth setup. The cost risk (bandwidth overage bill shock) is real but has a concrete, one-time mitigation: enable Spend Management before going live.

#### 2. Render

Nearly identical agent-friendliness profile to the platform originally in the lead (Railway), with native co-located Postgres and no comparable incident findings surfaced in this research pass. Would be the strongest pick if co-location mattered more to you than platform familiarity — worth revisiting if the Vercel bill-shock mitigation ever feels insufficient. Its free tier is demo-only (Postgres expires after 30 days), so budget for the paid tier (~$7+/mo web service, ~$7+/mo Postgres) from day one if you switch.

#### 3. Railway

Was the original top recommendation on pure cost/co-location fit — native Postgres, lowest realistic cost floor of the shortlist. Dropped to third after the anti-bias cross-check surfaced two confirmed, primary-sourced findings: a documented Postgres major-version auto-upgrade corruption bug (data directory reinitialized to a newer Postgres version than the running service, producing an unbootable, sometimes-unrecoverable database) and a March 30, 2026 data-privacy incident (Railway's own engineering blog: authenticated user data cached and served to the wrong user). Both are real risks for a project storing Google-authenticated user data, not hypothetical.

## Anti-Bias Cross-Check: Vercel

### Devil's Advocate — Weaknesses

1. Usage-based bandwidth billing has no default spend cap — documented 2026 cases show bills spiking from $20/mo to $700–$1,100 from a traffic spike, and one case reaching $23,000 after a DDoS attack, because every byte of attack traffic bills at the standard overage rate. This directly conflicts with the stated priority of minimizing cost.
2. The mitigation (Spend Management hard cap) exists but is opt-in, buried in Settings → Billing — most affected users only discovered it after the damaging invoice.
3. "Vercel Postgres" no longer exists as a first-party product — it's Neon accessed via Vercel's marketplace, billed with a margin over buying Neon directly, working against the stated co-location preference.
4. Native WebSocket support is public beta (announced 2026-06-22) with connections pinned to a single function instance — moot for this project (no persistent-connection requirement) but a real gap if that ever changes.
5. Community reports describe `vercel.json` function-duration config being silently ignored for certain catch-all API route patterns (e.g. tRPC's `[trpc]` handler) — worth explicit verification during deploy rather than trusting the config file.

### Pre-Mortem — How This Could Fail

*(Note: this narrative describes a Pro-tier failure mode. Confirmed post-deploy that this project runs on the free Hobby plan, where the described billing mechanism doesn't exist — see the Risk Register correction below. Kept here as the reasoning trail, and as the relevant scenario if this project ever upgrades to Pro.)*

The team deployed gmr-mini on Vercel, drawn by familiarity and the zero-config Next.js integration. Six months later, it was a mess — not from a code bug, but from the bill. A stated goal from day one was minimizing cost, so nobody enabled Vercel's Spend Management hard cap, assuming the Pro tier's included bandwidth was a safe ceiling. Then a botnet found the app's public sign-in page and hammered it for two days. Every byte of that attack traffic — none of it real users — got billed at Vercel's standard overage rate once the 1TB allowance was gone. The monthly bill went from roughly $20 to over $700 before anyone noticed, because nobody was watching a dashboard for a side project. Meanwhile, the Postgres data lived in Neon, reached through Vercel's marketplace layer — a second vendor's pricing was now also this project's problem, despite the original preference for one co-located platform. The underestimated risk: choosing the familiar platform without turning on the one setting that would have prevented exactly this.

### Unknown Unknowns

- No default billing ceiling exists — "Spend Management" hard caps must be manually enabled per team; several 2026 cases (up to $23,000) hit teams who didn't know the feature existed until after the invoice.
- "Vercel Postgres" is Neon-via-marketplace — one vendor relationship expected, two actually exist, each with its own pricing and status page.
- Next.js 16.3+ removed `runtime = 'edge'` on routes/pages; middleware became `proxy.ts` (Node-only) — a positive here, but a breaking change for any code written against older edge-runtime patterns.
- `vercel.json` function-duration overrides reportedly get silently ignored for some catch-all route patterns — verify explicitly after first deploy.
- Default function timeout on new projects is 15 seconds; extending it requires separately enabling Fluid Compute (up to 800s on Pro), not automatic.

## Operational Story

- **Preview deploys**: every git push to a non-production branch gets an automatic preview URL via Vercel's GitHub integration; no extra config needed. Preview deployments are publicly reachable by default unless Vercel's deployment-protection (password or SSO) is enabled — worth turning on given this app handles real Google-authenticated user data even in preview.
- **Secrets**: environment variables live in the Vercel dashboard (Project → Settings → Environment Variables), scoped per environment (Development/Preview/Production). `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET`/`AUTH_SECRET`/`DATABASE_URL` must each be set for Production explicitly — they are not inherited from `.env` at deploy time. Rotation: update the value in the dashboard and redeploy (or use `vercel env add` from the CLI); no automatic rotation.
- **Rollback**: `vercel rollback [deployment-id]` reverts traffic to a prior deployment instantly (build artifact swap, not a rebuild) — typically seconds. Caveat: this does not roll back the database. Any Drizzle migration applied by the failed deploy stays applied; a rollback that needs a schema revert requires a manual `drizzle-kit` down-migration or restore, run separately.
- **Approval**: routine deploys (preview and production, via `vercel --prod` or a merge to main) can run unattended by an agent. Human-only actions: enabling/raising the Spend Management cap, rotating `AUTH_SECRET` in production (invalidates all active sessions), and any destructive database operation (drop table, restore over live data).
- **Logs**: `vercel logs --environment production` for a scriptable tail; add `--status-code 5xx` to filter to errors. The hosted MCP server (`mcp.vercel.com`, set up via `vercel mcp`) exposes deployments, env vars, and domain status as structured tools for agent-driven queries without CLI-output parsing.

## Risk Register

| Risk | Source | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| Bandwidth overage bill shock — **corrected post-deploy**: this only applies on the Pro plan. The Hobby (free) plan this project actually runs on has no metered overage billing — it pauses the project when a limit is hit instead of charging. Spend Management is Pro-only and isn't offered on Hobby (confirmed in the dashboard: it's listed under "Upgrade to Pro"). | Devil's advocate → corrected by direct observation, 2026-08-21 | L (on Hobby; would return to M/H if upgraded to Pro) | L (on Hobby, worst case is downtime, not a bill; H if ever on Pro without the cap enabled) | On Hobby: no action needed — there's nothing to cap. **If this project ever upgrades to Pro** (e.g. once Hobby's non-commercial restriction stops applying), enable Spend Management with a hard cap *before* that upgrade takes effect, not after. |
| Postgres billed through a second vendor (Neon-via-marketplace), not co-located | Devil's advocate / Research finding | H (certain, by design) | L | Accepted trade-off for platform familiarity; monitor Neon's own status page separately from Vercel's. |
| `vercel.json` function-duration override silently ignored on tRPC catch-all route | Unknown unknowns | M | M | After first deploy, explicitly test a long-running tRPC call in production and confirm the configured duration applies; don't assume from config alone. |
| Rollback doesn't revert database migrations | Research finding | M | H | Before any schema-changing deploy, confirm the Drizzle migration is backward-compatible or have a tested down-migration ready; never treat `vercel rollback` as a full undo. |
| Preview deployments publicly reachable by default | Research finding | M | M | Enable Vercel's deployment protection (password or SSO) for preview environments given this app handles real authenticated user data. |
| WebSocket support still public beta if persistent connections are ever needed later | Devil's advocate | L (not needed now) | M | Re-evaluate platform fit if a future feature requires real-time push; don't build on the beta WebSocket path without re-checking its GA status first. |

## Getting Started

1. Install the CLI: `npm i -g vercel` (or `npx vercel` per-command without a global install).
2. From the project root, run `vercel link` to connect this repo to a Vercel project (creates one if none exists).
3. Set production environment variables via the dashboard or CLI: `vercel env add AUTH_GOOGLE_ID production`, repeating for `AUTH_GOOGLE_SECRET`, `AUTH_SECRET`, and `DATABASE_URL`.
4. ~~Before the first real deploy: go to Settings → Billing → Spend Management and set a hard cap~~ — **corrected post-deploy**: this project runs on the Hobby (free) plan, where Spend Management doesn't exist and isn't needed (no metered overage billing on Hobby — it pauses the project on limit instead of charging). Revisit only if/when upgrading to Pro.
5. Deploy: `vercel --prod`. Verify the build actually used `next build --webpack` as configured in `package.json`'s `build` script (Vercel respects the project's own script, not its own default builder choice).
6. Add a redirect URI for production in the Google Cloud Console OAuth client (`https://<your-domain>/api/auth/callback/google`) alongside the existing localhost one.

## Out of Scope

The following were not evaluated in this research:
- Docker image configuration
- CI/CD pipeline setup
- Production-scale architecture (multi-region, HA, DR)
