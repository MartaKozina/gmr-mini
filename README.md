# Create T3 App

This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`.

## What's next? How do I make an app with this?

We try to keep this project as simple as possible, so you can start with just the scaffolding we set up for you, and add additional things later when they become necessary.

If you are not familiar with the different technologies used in this project, please refer to the respective docs. If you still are in the wind, please join our [Discord](https://t3.gg/discord) and ask for help.

- [Next.js](https://nextjs.org)
- [NextAuth.js](https://next-auth.js.org)
- [Prisma](https://prisma.io)
- [Drizzle](https://orm.drizzle.team)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io)

## Learn More

To learn more about the [T3 Stack](https://create.t3.gg/), take a look at the following resources:

- [Documentation](https://create.t3.gg/)
- [Learn the T3 Stack](https://create.t3.gg/en/faq#what-learning-resources-are-currently-available) — Check out these awesome tutorials

You can check out the [create-t3-app GitHub repository](https://github.com/t3-oss/create-t3-app) — your feedback and contributions are welcome!

## How do I deploy this?

Follow our deployment guides for [Vercel](https://create.t3.gg/en/deployment/vercel), [Netlify](https://create.t3.gg/en/deployment/netlify) and [Docker](https://create.t3.gg/en/deployment/docker) for more information.

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
