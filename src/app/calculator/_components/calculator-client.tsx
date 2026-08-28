"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
	categoryGramsSoFar,
	categoryTargetGrams,
	type Proportions,
	proportionsSum,
	proportionsSumTo100,
	type SelectedIngredient,
	sumNutrients,
} from "~/lib/calculator";
import {
	CATEGORIES,
	CATEGORY_LABELS,
	type Category,
	getIngredientsByCategory,
} from "~/lib/ingredients";
import {
	calculateDER,
	type LifestyleKey,
	suggestedDailyMassGrams,
} from "~/lib/nutrition";
import { api } from "~/trpc/react";

const EMPTY_PROPORTIONS: Proportions = {
	meat: 0,
	bone: 0,
	organs: 0,
	liver: 0,
	veggies: 0,
	fruits: 0,
	others: 0,
};

export function CalculatorClient() {
	const [pets] = api.pet.getAll.useSuspenseQuery();
	const utils = api.useUtils();

	const [step, setStep] = useState<1 | 2 | 3>(1);
	const [selectedPetId, setSelectedPetId] = useState<number | null>(
		pets[0]?.id ?? null,
	);
	const [dailyMassGrams, setDailyMassGrams] = useState<number>(0);
	const [days, setDays] = useState(1);
	const [proportions, setProportions] =
		useState<Proportions>(EMPTY_PROPORTIONS);
	const [selected, setSelected] = useState<SelectedIngredient[]>([]);
	const [recipeName, setRecipeName] = useState("");
	const [saveError, setSaveError] = useState<string | null>(null);

	const saveRecipe = api.recipe.create.useMutation({
		onSuccess: async () => {
			await utils.recipe.invalidate();
			setRecipeName("");
			setSaveError(null);
		},
		onError: (err) => setSaveError(err.message),
	});

	const selectedPet = pets.find((p) => p.id === selectedPetId);
	const sum = proportionsSum(proportions);
	const sumValid = proportionsSumTo100(proportions);
	const nutrientTotals = useMemo(() => sumNutrients(selected), [selected]);

	if (pets.length === 0) {
		return (
			<div className="flex flex-col items-center gap-4 text-center">
				<p className="text-muted-foreground">
					You don't have any dogs yet. Add one first to start building a meal.
				</p>
				<Link
					className="rounded-full bg-primary px-10 py-3 font-semibold text-primary-foreground transition hover:opacity-90"
					href="/pets"
				>
					Add a dog
				</Link>
			</div>
		);
	}

	function handlePetChange(petId: number) {
		setSelectedPetId(petId);
		const pet = pets.find((p) => p.id === petId);
		if (pet) {
			const der = calculateDER(pet.weightKg, pet.lifestyle as LifestyleKey);
			setDailyMassGrams(Math.round(suggestedDailyMassGrams(der)));
		}
	}

	return (
		<div className="flex w-full max-w-2xl flex-col gap-6">
			<p className="text-center text-muted-foreground text-sm">
				Step {step} of 3
			</p>

			{step === 1 && (
				<div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
					<label className="flex flex-col gap-1">
						<span className="text-muted-foreground text-sm">Dog</span>
						<select
							className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
							onChange={(e) => handlePetChange(Number(e.target.value))}
							value={selectedPetId ?? ""}
						>
							{pets.map((pet) => (
								<option key={pet.id} value={pet.id}>
									{pet.name}
								</option>
							))}
						</select>
					</label>

					{selectedPet && (
						<p className="text-accent text-sm">
							Suggested daily energy: ~
							{Math.round(
								calculateDER(
									selectedPet.weightKg,
									selectedPet.lifestyle as LifestyleKey,
								),
							)}{" "}
							kcal/day
						</p>
					)}

					<label className="flex flex-col gap-1">
						<span className="text-muted-foreground text-sm">
							Daily meal mass (grams)
						</span>
						<input
							className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
							min="0"
							onChange={(e) => setDailyMassGrams(Number(e.target.value))}
							type="number"
							value={dailyMassGrams}
						/>
					</label>

					<button
						className="self-end rounded-full bg-primary px-8 py-3 font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
						disabled={dailyMassGrams <= 0}
						onClick={() => setStep(2)}
						type="button"
					>
						Next →
					</button>
				</div>
			)}

			{step === 2 && (
				<div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
					{CATEGORIES.map((category) => (
						<label
							className="flex items-center justify-between gap-4"
							key={category}
						>
							<span className="text-foreground">
								{CATEGORY_LABELS[category]} (%)
							</span>
							<input
								className="w-24 rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
								min="0"
								onChange={(e) =>
									setProportions((prev) => ({
										...prev,
										[category]: Number(e.target.value),
									}))
								}
								step="0.1"
								type="number"
								value={proportions[category]}
							/>
						</label>
					))}

					<p className={sumValid ? "text-primary" : "text-accent"}>
						Currently {sum.toFixed(1)}% — need 100%
					</p>

					<label className="flex flex-col gap-1">
						<span className="text-muted-foreground text-sm">
							Days this batch covers
						</span>
						<input
							className="w-24 rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
							min="1"
							onChange={(e) => setDays(Number(e.target.value))}
							type="number"
							value={days}
						/>
					</label>
					<p className="text-muted-foreground text-sm">
						Total to prepare for {days} day{days === 1 ? "" : "s"}:{" "}
						{Math.round(dailyMassGrams * days)} g
					</p>

					<div className="flex justify-between">
						<button
							className="rounded-full border border-border px-8 py-3 font-semibold text-foreground transition hover:bg-muted"
							onClick={() => setStep(1)}
							type="button"
						>
							← Back
						</button>
						<button
							className="rounded-full bg-primary px-8 py-3 font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
							disabled={!sumValid}
							onClick={() => setStep(3)}
							type="button"
						>
							Next →
						</button>
					</div>
				</div>
			)}

			{step === 3 && (
				<div className="flex flex-col gap-6">
					{CATEGORIES.map((category) => {
						const target = categoryTargetGrams(
							dailyMassGrams,
							proportions[category],
						);
						const soFar = categoryGramsSoFar(selected, category);
						return (
							<CategorySection
								category={category}
								key={category}
								onAdd={(ingredientId, grams) =>
									setSelected((prev) => [...prev, { ingredientId, grams }])
								}
								onRemove={(index) =>
									setSelected((prev) => prev.filter((_, i) => i !== index))
								}
								selected={selected}
								soFarGrams={soFar}
								targetGrams={target}
							/>
						);
					})}

					<div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-6 shadow-sm">
						<h3 className="font-semibold text-foreground text-lg">
							Final nutrient totals
						</h3>
						<p>Calories: {Math.round(nutrientTotals.kcal)} kcal</p>
						<p>Protein: {nutrientTotals.protein.toFixed(1)} g</p>
						<p>Fat: {nutrientTotals.fat.toFixed(1)} g</p>
						<p>Calcium: {Math.round(nutrientTotals.calciumMg)} mg</p>
						<p>Phosphorus: {Math.round(nutrientTotals.phosphorusMg)} mg</p>
						<p>
							Ca:P ratio:{" "}
							{nutrientTotals.calciumPhosphorusRatio === null
								? "—"
								: `${nutrientTotals.calciumPhosphorusRatio.toFixed(2)}:1`}
						</p>
					</div>

					<form
						className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 shadow-sm"
						onSubmit={(e) => {
							e.preventDefault();
							if (!selectedPetId) return;
							saveRecipe.mutate({
								name: recipeName,
								petId: selectedPetId,
								dailyMassGrams,
								days,
								proportions,
								selectedIngredients: selected,
							});
						}}
					>
						<label className="flex flex-col gap-1">
							<span className="text-muted-foreground text-sm">Recipe name</span>
							<input
								className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
								onChange={(e) => setRecipeName(e.target.value)}
								placeholder="e.g. Chicken & veg mix"
								type="text"
								value={recipeName}
							/>
						</label>
						<button
							className="self-end rounded-full bg-primary px-8 py-3 font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
							disabled={
								saveRecipe.isPending ||
								!recipeName ||
								!sumValid ||
								selected.length === 0
							}
							type="submit"
						>
							{saveRecipe.isPending ? "Saving..." : "Save recipe"}
						</button>
						{saveRecipe.isSuccess && (
							<p className="text-primary text-sm">
								Saved. View it on the{" "}
								<Link className="underline" href="/recipes">
									recipes list
								</Link>
								.
							</p>
						)}
						{saveError && (
							<p className="text-destructive text-sm">{saveError}</p>
						)}
					</form>

					<button
						className="self-start rounded-full border border-border px-8 py-3 font-semibold text-foreground transition hover:bg-muted"
						onClick={() => setStep(2)}
						type="button"
					>
						← Back
					</button>
				</div>
			)}
		</div>
	);
}

function CategorySection({
	category,
	targetGrams,
	soFarGrams,
	selected,
	onAdd,
	onRemove,
}: {
	category: Category;
	targetGrams: number;
	soFarGrams: number;
	selected: SelectedIngredient[];
	onAdd: (ingredientId: string, grams: number) => void;
	onRemove: (index: number) => void;
}) {
	const options = getIngredientsByCategory(category);
	const [ingredientId, setIngredientId] = useState(options[0]?.id ?? "");
	const [grams, setGrams] = useState("");

	const rows = selected
		.map((s, index) => ({ ...s, index }))
		.filter((s) => options.some((o) => o.id === s.ingredientId));

	return (
		<div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-6 shadow-sm">
			<div className="flex items-center justify-between">
				<h3 className="font-semibold text-foreground">
					{CATEGORY_LABELS[category]}
				</h3>
				<span className="text-muted-foreground text-sm">
					{Math.round(soFarGrams)} / {Math.round(targetGrams)} g
				</span>
			</div>

			{rows.map((row) => {
				const ingredient = options.find((o) => o.id === row.ingredientId);
				return (
					<div
						className="flex items-center justify-between text-sm"
						key={row.index}
					>
						<span className="text-foreground">
							{ingredient?.name} — {row.grams} g
						</span>
						<button
							className="text-muted-foreground underline hover:text-foreground"
							onClick={() => onRemove(row.index)}
							type="button"
						>
							Remove
						</button>
					</div>
				);
			})}

			<div className="flex gap-2">
				<select
					className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
					onChange={(e) => setIngredientId(e.target.value)}
					value={ingredientId}
				>
					{options.map((o) => (
						<option key={o.id} value={o.id}>
							{o.name}
						</option>
					))}
				</select>
				<input
					className="w-20 rounded-lg border border-border bg-background px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
					min="0"
					onChange={(e) => setGrams(e.target.value)}
					placeholder="g"
					type="number"
					value={grams}
				/>
				<button
					className="rounded-full bg-primary px-4 py-2 font-semibold text-primary-foreground text-sm transition hover:opacity-90 disabled:opacity-40"
					disabled={!ingredientId || !grams}
					onClick={() => {
						const g = Number.parseFloat(grams);
						if (!ingredientId || Number.isNaN(g) || g <= 0) return;
						onAdd(ingredientId, g);
						setGrams("");
					}}
					type="button"
				>
					Add
				</button>
			</div>
		</div>
	);
}
