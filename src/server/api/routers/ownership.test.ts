// @vitest-environment node
//
// R-05 (context/foundation/test-plan.md): a user must never be able to read,
// update, or delete another user's pets or recipes. Every mutating procedure
// in pet.ts/recipe.ts enforces this by checking `createdById`/pet ownership
// against the caller's session. This test exercises that boundary directly —
// two real (throwaway) users, the real routers, and the real local Postgres
// — rather than trusting the code review alone.
//
// Runs in the "node" environment (not the suite's default happy-dom) because
// importing the router chain pulls in ~/env, whose client/server guard
// misfires under happy-dom's `window` global.

import { inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// This test never calls `auth()` — every session is a manually-constructed
// context (see `callerFor` below) — but importing the router chain still
// imports ~/server/auth at module-eval time, which pulls in next-auth's
// internals. Those don't resolve under Vitest's plain Vite/Node module
// resolution (unlike Next's own bundler), so mock the module out rather than
// let an unrelated resolution failure block a test that doesn't need it.
vi.mock("~/server/auth", () => ({ auth: vi.fn() }));

import { createCaller } from "~/server/api/root";
import { db } from "~/server/db";
import { pets, recipes, users } from "~/server/db/schema";

const userA = {
	id: crypto.randomUUID(),
	name: "Test User A",
	email: `test-a-${crypto.randomUUID()}@example.invalid`,
};
const userB = {
	id: crypto.randomUUID(),
	name: "Test User B",
	email: `test-b-${crypto.randomUUID()}@example.invalid`,
};

function callerFor(user: typeof userA) {
	return createCaller({
		db,
		session: {
			user: { id: user.id, name: user.name, email: user.email },
			expires: new Date(Date.now() + 60_000).toISOString(),
		},
		headers: new Headers(),
	});
}

const recipeInput = {
	dailyMassGrams: 300,
	days: 1,
	proportions: {
		meat: 80,
		bone: 10,
		organs: 0,
		liver: 10,
		veggies: 0,
		fruits: 0,
		others: 0,
	},
	selectedIngredients: [{ ingredientId: "chicken-breast", grams: 300 }],
};

let callerA: ReturnType<typeof callerFor>;
let callerB: ReturnType<typeof callerFor>;

beforeAll(async () => {
	await db.insert(users).values([userA, userB]);
	callerA = callerFor(userA);
	callerB = callerFor(userB);
});

afterAll(async () => {
	// Children before parents: recipes -> pets -> users.
	const ownedPets = await db.query.pets.findMany({
		where: (pets, { inArray }) =>
			inArray(pets.createdById, [userA.id, userB.id]),
	});
	const petIds = ownedPets.map((p) => p.id);
	if (petIds.length > 0) {
		await db.delete(recipes).where(inArray(recipes.petId, petIds));
	}
	await db.delete(pets).where(inArray(pets.createdById, [userA.id, userB.id]));
	await db.delete(users).where(inArray(users.id, [userA.id, userB.id]));
});

describe("cross-user ownership (R-05)", () => {
	it("blocks reading, updating, and deleting another user's pet", async () => {
		await callerA.pet.create({
			name: "Rex",
			weightKg: 20,
			lifestyle: "intact_adult",
		});
		const petA = (await callerA.pet.getAll()).find((p) => p.name === "Rex");
		if (!petA) throw new Error("expected petA to exist");

		const bList = await callerB.pet.getAll();
		expect(bList.find((p) => p.id === petA.id)).toBeUndefined();

		await expect(
			callerB.pet.update({
				id: petA.id,
				weightKg: 99,
				lifestyle: "weight_loss",
			}),
		).rejects.toMatchObject({ code: "NOT_FOUND" });

		await expect(callerB.pet.delete({ id: petA.id })).rejects.toMatchObject({
			code: "NOT_FOUND",
		});
	});

	it("blocks creating a recipe against another user's pet", async () => {
		const petA = (await callerA.pet.getAll()).find((p) => p.name === "Rex");
		if (!petA) throw new Error("expected petA to exist");

		await expect(
			callerB.recipe.create({
				name: "Stolen recipe",
				petId: petA.id,
				...recipeInput,
			}),
		).rejects.toMatchObject({ code: "NOT_FOUND" });
	});

	it("blocks reading, updating, and deleting another user's recipe", async () => {
		const petA = (await callerA.pet.getAll()).find((p) => p.name === "Rex");
		if (!petA) throw new Error("expected petA to exist");

		await callerA.recipe.create({
			name: "A's recipe",
			petId: petA.id,
			...recipeInput,
		});
		const recipeA = (await callerA.recipe.getAll()).find(
			(r) => r.name === "A's recipe",
		);
		if (!recipeA) throw new Error("expected recipeA to exist");

		const bList = await callerB.recipe.getAll();
		expect(bList.find((r) => r.id === recipeA.id)).toBeUndefined();

		await expect(
			callerB.recipe.update({
				id: recipeA.id,
				name: "Hijacked",
				dailyMassGrams: 1,
				days: 1,
			}),
		).rejects.toMatchObject({ code: "NOT_FOUND" });

		await expect(
			callerB.recipe.delete({ id: recipeA.id }),
		).rejects.toMatchObject({ code: "NOT_FOUND" });
	});
});
