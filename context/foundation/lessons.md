# Lessons Learned

> Append-only register of recurring rules and patterns. Re-read at start by /10x-frame, /10x-research, /10x-plan, /10x-plan-review, /10x-implement, /10x-impl-review.

## Always check ownership before reading or mutating user-owned data by id

- **Context**: Every tRPC procedure that reads or mutates a user-owned row (e.g. `pet.ts`, `recipe.ts` — any router operating on rows with `createdById`).
- **Problem**: IDOR — user B can read/edit/delete user A's data. The client supplies an arbitrary id (`petId`, `recipeId`); without checking `createdById`, the server acts on someone else's data. This is exactly what `ownership.test.ts` (R-05) guards against.
- **Rule**: Always verify `createdById` before reading or mutating by a client-supplied id — fetch the row and compare `createdById` to `ctx.session.user.id`, otherwise throw `NOT_FOUND` (not `FORBIDDEN`, to avoid revealing the resource exists).
- **Applies to**: all
