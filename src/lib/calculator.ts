import { type Category, getIngredientById } from "~/lib/ingredients";

export function categoryTargetGrams(
	dailyMassGrams: number,
	proportionPercent: number,
): number {
	return dailyMassGrams * (proportionPercent / 100);
}

export type Proportions = Record<Category, number>;

/**
 * Epsilon comparison — proportions like 33.3 + 33.3 + 33.4 must not
 * false-negative against a naive `=== 100` check due to float rounding.
 */
export function proportionsSumTo100(proportions: Proportions): boolean {
	const sum = Object.values(proportions).reduce((a, b) => a + b, 0);
	return Math.abs(sum - 100) < 0.05;
}

export function proportionsSum(proportions: Proportions): number {
	return Object.values(proportions).reduce((a, b) => a + b, 0);
}

export interface SelectedIngredient {
	ingredientId: string;
	grams: number;
}

export interface NutrientTotals {
	kcal: number;
	protein: number;
	fat: number;
	calciumMg: number;
	phosphorusMg: number;
	/** null when phosphorus total is 0 — not Infinity/NaN. */
	calciumPhosphorusRatio: number | null;
}

export function sumNutrients(selected: SelectedIngredient[]): NutrientTotals {
	const totals = selected.reduce(
		(acc, { ingredientId, grams }) => {
			const ingredient = getIngredientById(ingredientId);
			if (!ingredient) return acc;
			const factor = grams / 100;
			return {
				kcal: acc.kcal + ingredient.kcalPer100g * factor,
				protein: acc.protein + ingredient.proteinPer100g * factor,
				fat: acc.fat + ingredient.fatPer100g * factor,
				calciumMg: acc.calciumMg + ingredient.calciumMgPer100g * factor,
				phosphorusMg:
					acc.phosphorusMg + ingredient.phosphorusMgPer100g * factor,
			};
		},
		{ kcal: 0, protein: 0, fat: 0, calciumMg: 0, phosphorusMg: 0 },
	);

	return {
		...totals,
		calciumPhosphorusRatio:
			totals.phosphorusMg === 0 ? null : totals.calciumMg / totals.phosphorusMg,
	};
}

export function categoryGramsSoFar(
	selected: SelectedIngredient[],
	category: Category,
): number {
	return selected
		.filter((s) => getIngredientById(s.ingredientId)?.category === category)
		.reduce((sum, s) => sum + s.grams, 0);
}
