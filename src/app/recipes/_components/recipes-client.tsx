"use client";

import Link from "next/link";
import { useState } from "react";

import { sumNutrients } from "~/lib/calculator";
import { CATEGORIES, CATEGORY_LABELS } from "~/lib/ingredients";
import type { RouterOutputs } from "~/trpc/react";
import { api } from "~/trpc/react";

type Recipe = RouterOutputs["recipe"]["getAll"][number];

export function RecipesClient() {
	const [recipes] = api.recipe.getAll.useSuspenseQuery();

	if (recipes.length === 0) {
		return (
			<div className="flex flex-col items-center gap-4 text-center">
				<p className="text-muted-foreground">
					No saved recipes yet — build one in the calculator and save it.
				</p>
				<Link
					className="rounded-full bg-primary px-10 py-3 font-semibold text-primary-foreground transition hover:opacity-90"
					href="/calculator"
				>
					Go to meal calculator
				</Link>
			</div>
		);
	}

	return (
		<div className="flex w-full max-w-2xl flex-col gap-4">
			{recipes.map((recipe) => (
				<RecipeCard key={recipe.id} recipe={recipe} />
			))}
		</div>
	);
}

function RecipeCard({ recipe }: { recipe: Recipe }) {
	const utils = api.useUtils();
	const [editing, setEditing] = useState(false);
	const [name, setName] = useState(recipe.name);
	const [dailyMassGrams, setDailyMassGrams] = useState(
		String(recipe.dailyMassGrams),
	);
	const [days, setDays] = useState(String(recipe.days));
	const [error, setError] = useState<string | null>(null);

	const updateRecipe = api.recipe.update.useMutation({
		onSuccess: async () => {
			await utils.recipe.invalidate();
			setEditing(false);
			setError(null);
		},
		onError: (err) => setError(err.message),
	});

	const deleteRecipe = api.recipe.delete.useMutation({
		onSuccess: async () => {
			await utils.recipe.invalidate();
			setError(null);
		},
		onError: (err) => setError(err.message),
	});

	if (editing) {
		return (
			<form
				className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5 shadow-sm"
				onSubmit={(e) => {
					e.preventDefault();
					const parsedMass = Number.parseFloat(dailyMassGrams);
					const parsedDays = Number.parseInt(days, 10);
					if (Number.isNaN(parsedMass) || Number.isNaN(parsedDays)) return;
					updateRecipe.mutate({
						id: recipe.id,
						name,
						dailyMassGrams: parsedMass,
						days: parsedDays,
					});
				}}
			>
				<input
					className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
					onChange={(e) => setName(e.target.value)}
					type="text"
					value={name}
				/>
				<div className="flex gap-2">
					<label className="flex flex-1 flex-col gap-1">
						<span className="text-muted-foreground text-sm">
							Daily mass (g)
						</span>
						<input
							className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
							min="0"
							onChange={(e) => setDailyMassGrams(e.target.value)}
							type="number"
							value={dailyMassGrams}
						/>
					</label>
					<label className="flex flex-1 flex-col gap-1">
						<span className="text-muted-foreground text-sm">Days</span>
						<input
							className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
							min="1"
							onChange={(e) => setDays(e.target.value)}
							type="number"
							value={days}
						/>
					</label>
				</div>
				{error && <p className="text-destructive text-sm">{error}</p>}
				<div className="flex justify-end gap-2">
					<button
						className="rounded-full border border-border px-4 py-2 font-semibold text-foreground text-sm transition hover:bg-muted"
						onClick={() => setEditing(false)}
						type="button"
					>
						Cancel
					</button>
					<button
						className="rounded-full bg-primary px-4 py-2 font-semibold text-primary-foreground text-sm transition hover:opacity-90 disabled:opacity-40"
						disabled={
							updateRecipe.isPending || !name || !dailyMassGrams || !days
						}
						type="submit"
					>
						{updateRecipe.isPending ? "Saving..." : "Save"}
					</button>
				</div>
			</form>
		);
	}

	const totals = sumNutrients(recipe.selectedIngredients);
	return (
		<div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5 shadow-sm">
			<div className="flex items-baseline justify-between">
				<h3 className="font-semibold text-foreground text-lg">{recipe.name}</h3>
				<div className="flex items-center gap-3">
					<span className="text-muted-foreground text-sm">
						{new Date(recipe.createdAt).toLocaleDateString()}
					</span>
					<button
						className="text-muted-foreground text-sm underline hover:text-foreground"
						onClick={() => setEditing(true)}
						type="button"
					>
						Edit
					</button>
					<button
						className="text-muted-foreground text-sm underline hover:text-foreground"
						disabled={deleteRecipe.isPending}
						onClick={() => deleteRecipe.mutate({ id: recipe.id })}
						type="button"
					>
						Delete
					</button>
				</div>
			</div>
			{error && <p className="text-destructive text-sm">{error}</p>}
			<p className="text-muted-foreground text-sm">
				For {recipe.pet.name} · {Math.round(recipe.dailyMassGrams)} g/day ·{" "}
				{recipe.days} day{recipe.days === 1 ? "" : "s"}
			</p>

			<p className="text-muted-foreground text-sm">
				{CATEGORIES.filter((c) => recipe.proportions[c]).map((c) => (
					<span className="mr-3" key={c}>
						{CATEGORY_LABELS[c]}: {recipe.proportions[c]}%
					</span>
				))}
			</p>

			<div className="grid grid-cols-2 gap-x-4 gap-y-1 text-foreground text-sm">
				<p>Calories: {Math.round(totals.kcal)} kcal</p>
				<p>Protein: {totals.protein.toFixed(1)} g</p>
				<p>Fat: {totals.fat.toFixed(1)} g</p>
				<p>
					Ca:P ratio:{" "}
					{totals.calciumPhosphorusRatio === null
						? "—"
						: `${totals.calciumPhosphorusRatio.toFixed(2)}:1`}
				</p>
			</div>
		</div>
	);
}
