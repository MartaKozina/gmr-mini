---
bootstrapped_at: 2026-08-20T08:06:24Z
starter_id: t3
starter_name: T3 Stack
project_name: gmr-mini
language_family: js
package_manager: npm
cwd_strategy: subdir-then-move
bootstrapper_confidence: verified
phase_3_status: ok
audit_command: "npm audit --json"
---

## Hand-off

```yaml
starter_id: t3
package_manager: npm
project_name: gmr-mini
hints:
  language_family: js
  team_size: solo
  deployment_target: vercel
  ci_provider: github-actions
  ci_default_flow: auto-deploy-on-merge
  bootstrapper_confidence: verified
  path_taken: custom
  quality_override: false
  self_check_answers:
    typed: true
    from_official_starter: false
    conventions: false
    docs_current: true
    can_judge_agent: false
  has_auth: true
  has_payments: false
  has_realtime: true
  has_ai: false
  has_background_jobs: false
```

### Why this stack

A solo developer shipping a 2-day, after-hours MVP with login-required auth and live/reactive nutrient recalculation needs a battle-tested, TypeScript-end-to-end stack that's already sitting in the repo as an untouched scaffold. T3 Stack (Next.js + tRPC + Drizzle + NextAuth) clears all four agent-friendly gates, matches the user's explicit NextAuth preference, and carries verified bootstrapper confidence — no scaffolding surprises expected. Drizzle's ORM supports Postgres with a config change, satisfying the stated database preference despite the card's default SQLite provider. The self-check flagged unfamiliarity with T3's specific conventions (folder layout, official-starter status, judging agent output against T3 idioms), so a CLAUDE.md addition documenting T3's routing/tRPC/Drizzle conventions is recommended to compensate. Deployment defaults to Vercel (the starter's own default); CI runs on GitHub Actions with auto-deploy-on-merge, matching a solo/short-timeline profile.

## Pre-scaffold verification

| Signal             | Value                                          | Severity | Notes                                          |
| ------------------ | ----------------------------------------------- | -------- | ----------------------------------------------- |
| npm package        | create-t3-app v7.40.0 published 2025-11-05       | stale    | resolved from cmd_template                      |
| GitHub repo        | not run                                          | n/a      | docs_url (https://create.t3.gg) is not a GitHub repo URL |

## Scaffold log

**Resolved invocation**: `npx create-t3-app@latest .bootstrap-scaffold --CI --tailwind --trpc --drizzle --appRouter --biome --dbProvider sqlite --noGit`
**Strategy**: subdir-then-move
**Exit code**: 0 (retry — first attempt exited 1; see below)
**Files moved**: 13 (9 sidelined as `.scaffold` siblings, 2 moved silently, `.gitignore` needed no change, `node_modules` skipped)
**Conflicts (.scaffold siblings)**: `.env`, `.env.example`, `README.md`, `drizzle.config.ts`, `next-env.d.ts`, `next.config.js`, `package.json`, `postcss.config.js`, `tsconfig.json`, `public/` (as `public.scaffold/`), `src/` (as `src.scaffold/`)
**.gitignore handling**: compared byte-for-byte identical between scaffold and cwd — no new lines to append, cwd `.gitignore` left unchanged
**.bootstrap-scaffold cleanup**: deleted after move-up

**First attempt (retried)**: the initial invocation without `--noGit` exited 1 — the T3 CLI's own internal `git init` step failed with `SystemError [ERR_TTY_INIT_FAILED]` (no TTY available in this shell environment). Since cwd already has its own `.git` history (predates this bootstrap chain) and bootstrapper never initializes git itself, the fix was to re-run with `--noGit`, which the CLI supports natively. The retry scaffolded, boilerplated, installed dependencies, and formatted successfully.

**Deviations from the literal conflict matrix, noted for the record**:
- `node_modules/` — present in both scaffold and cwd. Rather than sidelining the scaffold's copy as `node_modules.scaffold` (a multi-hundred-file directory copy with no reconcilable value — it's a derived, reinstallable artifact, not source the user would want to diff), it was left out of the move-up entirely and deleted with the rest of `.bootstrap-scaffold/`. cwd's existing `node_modules` (installed via pnpm) is untouched.
- `package-lock.json` — did not exist in cwd (cwd uses `pnpm-lock.yaml`), so per the matrix it moved silently. **Flag for the user**: cwd now has both `pnpm-lock.yaml` (existing) and `package-lock.json` (from this scaffold) — two lockfiles for two different package managers. Since `package.json` itself was NOT replaced (existing won, scaffold's version sits at `package.json.scaffold`), `package-lock.json` does not actually correspond to the live `package.json` in cwd. Recommend deleting `package-lock.json` unless you intend to reconcile `package.json` vs `package.json.scaffold` and switch to npm.

## Post-scaffold audit

**Tool**: npm audit --json
**Summary**: 0 CRITICAL, 4 HIGH, 4 MODERATE, 0 LOW
**Direct vs transitive**: 0/2 direct of total 0/4 CRITICAL/HIGH; 1/4 direct of total MODERATE (drizzle-kit only); the rest are transitive

Note: this audit ran against cwd's **existing** `package.json`/`node_modules` (pnpm-installed) — not the new scaffold's dependency set, since the scaffold's `package.json` was sidelined rather than merged (see conflict matrix above). Both dependency trees are T3-Stack-shaped, so the findings below are illustrative of what's already installed in this project.

#### HIGH findings
- **drizzle-orm** (direct) — SQL injection via improperly escaped SQL identifiers (GHSA-gpj5-g38j-94v9, CVSS 7.5). Affected range `<0.45.2`. Fix available: upgrade to `drizzle-orm@0.45.2` (semver-major).
- **next** (direct) — vulnerable via transitive `postcss` and `sharp`. Fix available: upgrade to `next@16.3.1` (semver-major).
- **postcss** (transitive, via next) — path traversal / arbitrary `.map` file disclosure via `sourceMappingURL` (GHSA-r28c-9q8g-f849, CVSS 7.5; also GHSA-6g55-p6wh-862q, CVSS 7.5). Affected range `<=8.5.22`.
- **sharp** (transitive, via next) — inherited libvips vulnerabilities (CVE-2026-33327, CVE-2026-33328, CVE-2026-35590, CVE-2026-35591; GHSA-f88m-g3jw-g9cj). Affected range `<0.35.0`.

#### MODERATE findings
- **drizzle-kit** (direct) — vulnerable via transitive `esbuild`/`@esbuild-kit/esm-loader`. Fix available: upgrade to `drizzle-kit@0.31.10` (semver-major).
- **esbuild** (transitive) — dev server allows any website to send requests and read responses (GHSA-67mh-4wv8-2f99, CVSS 5.3). Affected range `<=0.24.2`.
- **@esbuild-kit/core-utils** (transitive, via esbuild) — inherits the esbuild advisory above.
- **@esbuild-kit/esm-loader** (transitive, via @esbuild-kit/core-utils) — inherits the same advisory chain.

#### LOW / INFO findings
None.

## Hints recorded but not acted on

| Hint                       | Value                              |
| --------------------------- | ----------------------------------- |
| bootstrapper_confidence     | verified                            |
| quality_override            | false                                |
| path_taken                  | custom                               |
| self_check_answers          | typed: true, from_official_starter: false, conventions: false, docs_current: true, can_judge_agent: false |
| team_size                   | solo                                 |
| deployment_target           | vercel                               |
| ci_provider                 | github-actions                       |
| ci_default_flow             | auto-deploy-on-merge                 |
| has_auth                    | true                                  |
| has_payments                | false                                 |
| has_realtime                | true                                  |
| has_ai                      | false                                 |
| has_background_jobs         | false                                 |

## Next steps

Next: a future skill will set up agent context (CLAUDE.md, AGENTS.md). For now, your project is scaffolded and verified — happy hacking.

Useful manual steps in the meantime:
- Review the `.scaffold` siblings (`.env.scaffold`, `README.md.scaffold`, `package.json.scaffold`, `drizzle.config.ts.scaffold`, `next-env.d.ts.scaffold`, `next.config.js.scaffold`, `postcss.config.js.scaffold`, `tsconfig.json.scaffold`, `public.scaffold/`, `src.scaffold/`) and decide what, if anything, to merge from the fresh scaffold into your existing files — most look identical to what you already had (this repo was already a T3 scaffold), but `package.json.scaffold` is worth a diff since it declares dependency versions.
- Resolve the dual-lockfile situation: delete `package-lock.json` (doesn't match the live `package.json`) unless you're deliberately switching from pnpm to npm.
- `git init` is not needed — this repo already has its own history.
- Address the audit findings above per your risk tolerance — `drizzle-orm` and `next` both have direct HIGH findings with fixes available, though both are semver-major upgrades.
