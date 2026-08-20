---
project: gmr-mini
checked_at: 2026-08-20T11:10:44Z
health_status: healthy
context_type: brownfield
language_family: js
stack_assessment_available: false
checks_run:
  - lockfile
  - dependency_audit
  - outdated_deps
  - test_runner
  - ci_cd
  - configuration
audit_findings:
  critical: 0
  high: 0
  moderate: 1
  low: 0
test_runner_detected: true
ci_provider: null
recommended_fixes: 4
---

## Dependency Health

### Lockfile

```
Status: present (pnpm-lock.yaml)
Package manager: pnpm
```

The previous dual-lockfile issue (a leftover `package-lock.json` from a rescaffold that didn't match the live `package.json`) is resolved — `pnpm-lock.yaml` is now the single, consistent lockfile.

### Security Audit

```
Tool: pnpm audit --json
Summary: 0 CRITICAL, 0 HIGH, 1 MODERATE, 0 LOW
Direct vs transitive: the 1 MODERATE finding is transitive
```

All 4 HIGH findings from the previous check (direct `drizzle-orm` SQL-injection advisory, transitive `next`/`postcss`/`sharp` findings) are resolved — `drizzle-orm` was upgraded to 0.45.2 and `next` to 16.3.1.

#### MODERATE findings

- **esbuild** (transitive, via `drizzle-kit` → deprecated `@esbuild-kit/esm-loader` → `@esbuild-kit/core-utils`) — GHSA-67mh-4wv8-2f99: dev server exposes responses to any origin via permissive CORS (CVSS 5.3). Dev-only exposure, not present in production builds. Not fixable from this project alone — `drizzle-kit@0.31.10` (latest) still depends on the deprecated `@esbuild-kit` packages upstream; resolving this requires `drizzle-kit` itself to drop that dependency in a future release.

### Outdated Dependencies

```
Packages with major version gaps: 7
```

- **@types/node**: 20.19.43 → 26.2.0 (6 major versions behind)
- **typescript**: 5.9.3 → 7.0.2 (2 major versions behind, skips 6.x)
- **eslint**: 9.39.5 → 10.8.1 (1 major version behind)
- **zod**: 3.25.76 → 4.4.3 (1 major version behind — T3/tRPC stacks commonly pin zod v3 deliberately; verify tRPC compatibility before upgrading)
- **@vitejs/plugin-react**: 4.7.0 → 6.1.0 (2 major versions behind — **intentionally pinned**: 6.x requires `vite@^8`, which doesn't match the `vite@7.3.6` this project's Vitest setup uses; upgrading requires bumping `vite` in lockstep, see below)
- **vite**: 7.3.6 → 8.2.2 (1 major version behind — **intentionally pinned** to match `@vitejs/plugin-react@4.7.0` and avoid a real Rolldown native-binding resolution bug hit during `vitest@4`/`vite@8` testing)
- **vitest**: 3.2.7 → 4.1.11 (1 major version behind — **intentionally downgraded** from 4.x after hitting the Rolldown binding bug above and a separate jsdom/ESM interop crash; 3.2.7 + happy-dom is the verified-working combination)

Three of these (`@vitejs/plugin-react`, `vite`, `vitest`) are deliberate pins recorded from direct testing, not oversights — re-attempt the 4.x/8.x upgrade path together, as a set, once those upstream bugs are fixed.

## Test Suite

```
Test runner: Vitest 3.2.7
Tests found: 1 test (1 test file)
Test execution: passing
```

```
Configuration: vitest.config.ts (environment: happy-dom, setup: vitest.setup.ts)
Framework: Vitest 3.2.7 + @testing-library/react 16.3.2 + happy-dom 20.11.6
```

The current test is a smoke test (`src/smoke.test.tsx`) proving the pipeline works end-to-end — there's no real business logic yet to test (the PRD's calculator/DER functionality hasn't been implemented). Real test coverage is expected to grow alongside feature work.

## CI/CD

```
Provider: not detected
Configuration: not found
```

ℹ No CI/CD configuration detected. You'll set this up in the infrastructure and deployment lesson. For now, a local, working test runner is what matters for agent collaboration — and that's now in place.

## Configuration

### Low severity

- **.editorconfig** — missing. Ensures consistent indentation/charset/EOL across editors, independent of your JS-specific formatter. Fix: add a basic `.editorconfig` matching your Biome/Prettier settings.

All other checked configuration is present: `.gitignore`, `.env.example`, `tsconfig.json` with `strict: true`, and a working test runner.

**Advisory note (carried over, still unresolved)**: this project still has BOTH Biome (`biome.jsonc`) AND Prettier + ESLint (`prettier.config.js`, `eslint.config.js`) configured simultaneously — the decision to pick one was deliberately deferred last time. Still worth resolving before an agent starts formatting code against two disagreeing rule sets.

## Stack Assessment Cross-Reference

No stack-assessment.md found. Run `/10x-stack-assess` for quality-gate analysis.

## Recommended Fixes

### Fix before agent work (Category A)

### 1. Two formatters/linters configured (Biome + Prettier/ESLint)

**Impact**: an agent given ambiguous formatting instructions may thrash between two tools' conflicting rules, producing noisy diffs.
**Severity**: medium
**Effort**: moderate (15–30 min to decide and remove the unused toolchain)
**Fix**: pick one. To keep Biome: `rm prettier.config.js eslint.config.js` and remove `eslint`/`prettier`-related devDependencies. To keep Prettier+ESLint (matches this project's pre-existing setup): `rm biome.jsonc` and remove `@biomejs/biome` from devDependencies.

### 2. Residual MODERATE audit finding (esbuild via drizzle-kit)

**Impact**: dev-server-only CORS exposure; low real-world risk since it only affects your local dev server, not production builds.
**Severity**: low
**Effort**: quick (accept the risk; no action available until drizzle-kit updates upstream)
**Fix**: no direct fix available today. Track `drizzle-kit`'s releases for when it drops the deprecated `@esbuild-kit` dependency chain; re-run `pnpm audit` after future `drizzle-kit` upgrades.

### 3. Missing .editorconfig

**Impact**: minor — editors without your JS formatter's settings (e.g. editing a `.md` or `.yaml` file) may use inconsistent indentation/EOL.
**Severity**: low
**Effort**: quick
**Fix**: add a basic `.editorconfig` matching your Biome/Prettier settings (indent size, charset, EOL).

### 4. Outdated dependencies with major gaps (@types/node, typescript, eslint, zod)

**Impact**: large version gaps risk accumulating breaking changes; `zod` v3→v4 in particular has known tRPC-ecosystem compatibility considerations.
**Severity**: low
**Effort**: moderate
**Fix**:

```
pnpm add -D @types/node@latest typescript@latest eslint@latest
pnpm run check
```
Hold off on `zod@4` until you've verified tRPC v11's compatibility with it. Leave `@vitejs/plugin-react`, `vite`, and `vitest` pinned at their current versions (see Outdated Dependencies above for why).

### Addressed in upcoming lessons (Category B)

### No CI/CD pipeline

**Lesson**: [Sprint Zero z Agentem: infrastruktura, walking skeleton i pierwszy deploy (M1L5)](https://platforma.przeprogramowani.pl/external/10xdevs-3/m1-l5)
**What you'll do there**: set up a GitHub Actions pipeline covering lint, typecheck, test, and build stages (all of which now pass locally), plus your first deploy.

### Missing AGENTS.md

**Lesson**: [Agent Onboarding: Agents.md, AI Rules i feedback loops (M1L4)](https://platforma.przeprogramowani.pl/external/10xdevs-3/m1-l4)
**What you'll do there**: build `AGENTS.md` with the right content for this stack (your `CLAUDE.md` is already present and can inform it).

### Missing deployment configuration

**Lesson**: [Sprint Zero z Agentem: infrastruktura, walking skeleton i pierwszy deploy (M1L5)](https://platforma.przeprogramowani.pl/external/10xdevs-3/m1-l5)
**What you'll do there**: wire up deployment to Vercel (your recorded deployment target) as part of the walking-skeleton exercise.

## Summary

Health status: healthy

Since the last check, all 4 HIGH and 3 of 4 MODERATE security findings were resolved (dependency upgrades), the dual-lockfile ambiguity was cleared, a working test runner (Vitest) was added and verified passing, the auth provider was switched from Discord to Google with real credentials wired in, and a genuine Next.js 16 Turbopack build bug was found and worked around. What remains is minor: one unresolved formatter-toolchain overlap (Biome vs. Prettier+ESLint), a residual dev-only MODERATE advisory with no available fix, and routine dependency modernization — none of it blocking.

Next step: your project is healthy — proceed to agent onboarding.
