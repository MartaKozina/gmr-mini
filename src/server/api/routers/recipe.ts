import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { proportionsSumTo100 } from "~/lib/calculator";
import { CATEGORIES, type Category } from "~/lib/ingredients";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { recipes } from "~/server/db/schema";

const proportionsShape = Object.fromEntries(
	CATEGORIES.map((c) => [c, z.number().min(0)]),
) as Record<Category, z.ZodNumber>;

const proportionsSchema = z
	.object(proportionsShape)
	.refine(proportionsSumTo100, { message: "Proportions must sum to 100%" });

export const recipeRouter = createTRPCRouter({
	create: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1),
				petId: z.number().int(),
				dailyMassGrams: z.number().positive(),
				days: z.number().int().positive(),
				proportions: proportionsSchema,
				selectedIngredients: z
					.array(
						z.object({
							ingredientId: z.string(),
							grams: z.number().positive(),
						}),
					)
					.min(1),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const pet = await ctx.db.query.pets.findFirst({
				where: (pets, { eq }) => eq(pets.id, input.petId),
			});
			if (!pet || pet.createdById !== ctx.session.user.id) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Pet not found" });
			}

			await ctx.db.insert(recipes).values({
				name: input.name,
				petId: input.petId,
				dailyMassGrams: input.dailyMassGrams,
				days: input.days,
				proportions: input.proportions,
				selectedIngredients: input.selectedIngredients,
				createdById: ctx.session.user.id,
			});
		}),

	// No getById: the list view already returns everything a card needs
	// (including the joined pet), owner-scoped. See pet.getAll for the same
	// IDOR reasoning against adding one.
	getAll: protectedProcedure.query(async ({ ctx }) => {
		return ctx.db.query.recipes.findMany({
			where: (recipes, { eq }) => eq(recipes.createdById, ctx.session.user.id),
			orderBy: (recipes, { desc }) => [desc(recipes.createdAt)],
			with: { pet: true },
		});
	}),

	// Only the scalar summary fields are editable in place — proportions and
	// selectedIngredients define the recipe's actual composition and are only
	// ever set through the calculator's save flow. Changing the composition
	// means building a new recipe there, not editing the ingredient list from
	// this list view.
	update: protectedProcedure
		.input(
			z.object({
				id: z.number().int(),
				name: z.string().min(1),
				dailyMassGrams: z.number().positive(),
				days: z.number().int().positive(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const recipe = await ctx.db.query.recipes.findFirst({
				where: (recipes, { eq }) => eq(recipes.id, input.id),
			});
			if (!recipe || recipe.createdById !== ctx.session.user.id) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Recipe not found",
				});
			}

			await ctx.db
				.update(recipes)
				.set({
					name: input.name,
					dailyMassGrams: input.dailyMassGrams,
					days: input.days,
				})
				.where(eq(recipes.id, input.id));
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.number().int() }))
		.mutation(async ({ ctx, input }) => {
			const recipe = await ctx.db.query.recipes.findFirst({
				where: (recipes, { eq }) => eq(recipes.id, input.id),
			});
			if (!recipe || recipe.createdById !== ctx.session.user.id) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Recipe not found",
				});
			}

			await ctx.db.delete(recipes).where(eq(recipes.id, input.id));
		}),
});
