import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { LIFESTYLE_KEYS } from "~/lib/nutrition";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { pets, recipes } from "~/server/db/schema";

export const petRouter = createTRPCRouter({
	create: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1),
				weightKg: z.number().positive().max(120),
				lifestyle: z.enum(LIFESTYLE_KEYS),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await ctx.db.insert(pets).values({
				name: input.name,
				weightKg: input.weightKg,
				lifestyle: input.lifestyle,
				createdById: ctx.session.user.id,
			});
		}),

	// Only weight and lifestyle are editable — a dog's name isn't expected to
	// change, and keeping the update surface narrow keeps the ownership check
	// simple to reason about.
	update: protectedProcedure
		.input(
			z.object({
				id: z.number().int(),
				weightKg: z.number().positive().max(120),
				lifestyle: z.enum(LIFESTYLE_KEYS),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const pet = await ctx.db.query.pets.findFirst({
				where: (pets, { eq }) => eq(pets.id, input.id),
			});
			if (!pet || pet.createdById !== ctx.session.user.id) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Pet not found" });
			}

			await ctx.db
				.update(pets)
				.set({ weightKg: input.weightKg, lifestyle: input.lifestyle })
				.where(eq(pets.id, input.id));
		}),

	// No getById: the calculator only ever needs this already-owner-scoped
	// array, picked by id client-side. A single-pet fetch would need its own
	// ownership check to avoid an IDOR (any id -> any user's pet data).
	getAll: protectedProcedure.query(async ({ ctx }) => {
		return ctx.db.query.pets.findMany({
			where: (pets, { eq }) => eq(pets.createdById, ctx.session.user.id),
			orderBy: (pets, { desc }) => [desc(pets.createdAt)],
		});
	}),

	delete: protectedProcedure
		.input(z.object({ id: z.number().int() }))
		.mutation(async ({ ctx, input }) => {
			const pet = await ctx.db.query.pets.findFirst({
				where: (pets, { eq }) => eq(pets.id, input.id),
			});
			if (!pet || pet.createdById !== ctx.session.user.id) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Pet not found" });
			}

			// Recipes hold a required FK to their pet, so it has to go first —
			// deleting a pet takes its recipes with it rather than leaving
			// orphaned recipes pointing at a pet that no longer exists.
			await ctx.db.transaction(async (tx) => {
				await tx.delete(recipes).where(eq(recipes.petId, input.id));
				await tx.delete(pets).where(eq(pets.id, input.id));
			});
		}),
});
