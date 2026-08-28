import { describe, expect, it } from "vitest";
import {
	categoryGramsSoFar,
	categoryTargetGrams,
	proportionsSumTo100,
	sumNutrients,
} from "./calculator";

describe("categoryTargetGrams", () => {
	it("multiplies daily mass by the proportion percentage", () => {
		expect(categoryTargetGrams(1000, 30)).toBe(300);
	});
});

describe("proportionsSumTo100", () => {
	const base = {
		meat: 0,
		bone: 0,
		organs: 0,
		liver: 0,
		veggies: 0,
		fruits: 0,
		others: 0,
	};

	it("accepts an exact 100 sum", () => {
		expect(
			proportionsSumTo100({ ...base, meat: 80, bone: 10, liver: 10 }),
		).toBe(true);
	});

	it("accepts a float sum within epsilon (33.3+33.3+33.4)", () => {
		expect(
			proportionsSumTo100({ ...base, meat: 33.3, bone: 33.3, liver: 33.4 }),
		).toBe(true);
	});

	it("rejects a sum that is genuinely off", () => {
		expect(proportionsSumTo100({ ...base, meat: 99 })).toBe(false);
	});
});

describe("sumNutrients", () => {
	it("returns all-zero totals and a null Ca:P ratio for an empty selection", () => {
		const totals = sumNutrients([]);
		expect(totals.kcal).toBe(0);
		expect(totals.calciumPhosphorusRatio).toBeNull();
	});

	it("scales a single ingredient's per-100g values by grams", () => {
		// chicken-breast: 120 kcal / 22.5g protein / 2.6g fat per 100g
		const totals = sumNutrients([
			{ ingredientId: "chicken-breast", grams: 200 },
		]);
		expect(totals.kcal).toBeCloseTo(240, 5);
		expect(totals.protein).toBeCloseTo(45, 5);
		expect(totals.fat).toBeCloseTo(5.2, 5);
	});

	it("returns null Ca:P ratio when phosphorus totals to 0 (e.g. fish oil alone)", () => {
		const totals = sumNutrients([{ ingredientId: "fish-oil", grams: 50 }]);
		expect(totals.phosphorusMg).toBe(0);
		expect(totals.calciumPhosphorusRatio).toBeNull();
	});

	it("ignores unknown ingredient ids rather than throwing", () => {
		const totals = sumNutrients([{ ingredientId: "not-real", grams: 100 }]);
		expect(totals.kcal).toBe(0);
	});
});

describe("categoryGramsSoFar", () => {
	it("sums only the grams for ingredients in the given category", () => {
		const selected = [
			{ ingredientId: "chicken-breast", grams: 100 }, // meat
			{ ingredientId: "beef-liver", grams: 50 }, // liver
			{ ingredientId: "beef-ground", grams: 100 }, // meat
		];
		expect(categoryGramsSoFar(selected, "meat")).toBe(200);
		expect(categoryGramsSoFar(selected, "liver")).toBe(50);
		expect(categoryGramsSoFar(selected, "bone")).toBe(0);
	});
});
