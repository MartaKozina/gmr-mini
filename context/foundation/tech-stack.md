---
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
---

## Why this stack

A solo developer shipping a 2-day, after-hours MVP with login-required auth and live/reactive nutrient recalculation needs a battle-tested, TypeScript-end-to-end stack that's already sitting in the repo as an untouched scaffold. T3 Stack (Next.js + tRPC + Drizzle + NextAuth) clears all four agent-friendly gates, matches the user's explicit NextAuth preference, and carries verified bootstrapper confidence — no scaffolding surprises expected. Drizzle's ORM supports Postgres with a config change, satisfying the stated database preference despite the card's default SQLite provider. The self-check flagged unfamiliarity with T3's specific conventions (folder layout, official-starter status, judging agent output against T3 idioms), so a CLAUDE.md addition documenting T3's routing/tRPC/Drizzle conventions is recommended to compensate. Deployment defaults to Vercel (the starter's own default); CI runs on GitHub Actions with auto-deploy-on-merge, matching a solo/short-timeline profile.
