import { describe, expect, it } from "vitest";
import {
	CALORIE_DENSITY_KCAL_PER_G,
	calculateDER,
	calculateRER,
	LIFESTYLE_FACTORS,
	LIFESTYLE_KEYS,
	suggestedDailyMassGrams,
} from "./nutrition";

describe("calculateRER", () => {
	it("matches the metabolic body weight formula (70 * weight^0.75)", () => {
		// 10^0.75 ≈ 5.6234 -> RER ≈ 393.6
		expect(calculateRER(10)).toBeCloseTo(393.6, 0);
	});

	it("increases with weight", () => {
		expect(calculateRER(20)).toBeGreaterThan(calculateRER(10));
	});

	it("is zero for a zero weight (formula edge case)", () => {
		expect(calculateRER(0)).toBe(0);
	});
});

describe("calculateDER", () => {
	it("equals RER * lifestyle factor for every lifestyle key", () => {
		const weightKg = 15;
		const rer = calculateRER(weightKg);
		for (const key of LIFESTYLE_KEYS) {
			const expected = rer * LIFESTYLE_FACTORS[key].factor;
			expect(calculateDER(weightKg, key)).toBeCloseTo(expected, 5);
		}
	});

	it("has exactly 6 lifestyle options, all adult (no puppy/pregnancy/lactation/heavy-work)", () => {
		expect(LIFESTYLE_KEYS).toHaveLength(6);
	});
});

describe("suggestedDailyMassGrams", () => {
	it("divides DER by the fixed calorie density (FR-004)", () => {
		expect(CALORIE_DENSITY_KCAL_PER_G).toBe(1.5);
		expect(suggestedDailyMassGrams(300)).toBe(200);
	});
});
