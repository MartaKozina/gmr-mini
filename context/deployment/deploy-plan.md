---
deployed_at: 2026-08-21
platform: Vercel
status: live
---

# First deployment of gmr-mini to Vercel

Audit trail of the first production deployment, based on `context/foundation/infrastructure.md` (platform decision) and `context/foundation/tech-stack.md` (stack). This is what actually happened — including the account-architecture detour that wasn't in the original plan.

## What's deployed

- **Production URL**: https://gmr-mini-ruddy.vercel.app
- **Vercel account/team**: personal account under `mkozina010@gmail.com`, team `gmr-mini` (project `gmr-mini/gmr-mini`) — deliberately separate from the pre-existing `givemeraw`/`givemeraws-projects` account that hosts the production `givemeraw.com` app.
- **GitHub repo**: `MartaKozina/gmr-mini` (private), `main` branch, git-connected to the Vercel project for preview-per-PR + auto-deploy-on-merge.
- **Database**: Neon Postgres, provisioned via Vercel's marketplace integration (`neon-cyclamen-cave`), connected to Production/Preview/Development environments. Schema pushed via `drizzle-kit push` against the production `DATABASE_URL` — `gmr-mini_*` tables exist.
- **Auth secrets**: `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` (same Google OAuth client as local dev) and a freshly generated `AUTH_SECRET` (not shared with local dev) set for Production + Preview via `vercel env add`.
- **Build**: uses `next build --webpack` (per `package.json`), confirmed in the build log — avoids the Turbopack client-bundle bug this project hit during bootstrapping.

## Deviations from the original plan (approved before execution)

The original plan assumed the existing `givemeraw` GitHub/Vercel accounts would host this project. Mid-execution, the user decided gmr-mini should NOT live under the `givemeraw` identity:

1. Deleted the initially-created `givemeraw/gmr-mini` GitHub repo (manually, by the user).
2. Logged `gh` CLI into a new personal GitHub account (`MartaKozina`, via `mkozina010@gmail.com`) and created `MartaKozina/gmr-mini` there instead.
3. Discovered the Vercel CLI was still authenticated as `givemeraw`, tied to the `givemeraws-projects` team (the same one hosting production `givemeraw.com`) — logged out and back in as a fresh personal Vercel account under `mkozina010@gmail.com`.
4. Hit two sequential one-time manual gates before git integration would work: (a) installing/authorizing the Vercel GitHub App for the `MartaKozina` account, and (b) adding a GitHub **Login Connection** at the Vercel-account level (`vercel.com/account/login-connections`) — the GitHub App install alone wasn't sufficient; the Vercel account itself had no GitHub identity connection.
5. Hit a third manual gate: Neon marketplace integration required accepting terms in-browser before `vercel install neon` could complete.

None of these were destructive — the only irreversible action (deleting the `givemeraw/gmr-mini` repo) was done by the user themselves, not by the agent, after explicit confirmation.

## Manual gates still open

- **Vercel Spend Management hard cap** — not yet enabled. Go to the `gmr-mini` project's team billing settings and set a cap before sharing this URL publicly. This was the top mitigation identified in `infrastructure.md`'s anti-bias cross-check (documented bandwidth bill-shock cases up to $23,000 on Vercel in 2026).
- **Google Cloud Console redirect URI** — add `https://gmr-mini-ruddy.vercel.app/api/auth/callback/google` as an additional authorized redirect URI on the existing Google OAuth client (alongside the `localhost` one already there), so sign-in works on the deployed domain.

## Verification performed

- `curl -I https://gmr-mini-ruddy.vercel.app` → `200`.
- `curl https://gmr-mini-ruddy.vercel.app/api/auth/providers` → returns the `google` provider with the correct production callback URL (confirms `AUTH_GOOGLE_ID`/`SECRET` validated in production).
- `vercel logs` on first request showed `[TRPC] post.hello took 1ms to execute` — confirms the app successfully queried the *production* Neon database, not the local dev `DATABASE_URL` that got uploaded incidentally during the first CLI-based deploy (Vercel's platform env vars took precedence, as expected from Next.js/dotenv's non-destructive env-loading order).
- Added `.vercelignore` (excluding `.env`/`.env.local`/`.env.*.local`) as defense-in-depth so future manual `vercel --prod` runs don't upload local secrets into the build artifact — moot for the ongoing git-based deploy flow, which builds from the GitHub repo and never had `.env` in it to begin with.
- **Not yet verified**: an actual end-to-end Google sign-in on the deployed domain — blocked on the redirect-URI manual gate above, and requires a human clicking through a real OAuth consent screen.
