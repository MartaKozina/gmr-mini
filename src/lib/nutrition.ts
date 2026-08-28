/**
 * DER (Daily Energy Requirement) formula for dogs.
 *
 * RER = 70 * weight(kg)^0.75 (metabolic body weight)
 * DER = RER * lifestyle factor
 *
 * @see https://petsdiet.pl/jedzenie-pelne-energii/
 *
 * Adults only — puppy/pregnancy/lactation/heavy-work life stages have their
 * own, more complex multipliers per the same source and are out of MVP scope.
 */
export const LIFESTYLE_FACTORS = {
	intact_adult: { label: "Intact adult", factor: 1.8 },
	neutered_adult: { label: "Neutered / spayed adult", factor: 1.6 },
	low_activity: { label: "Low activity / overweight-prone", factor: 1.4 },
	weight_loss: { label: "Weight loss", factor: 1.0 },
	light_work: { label: "Light work / training", factor: 2.0 },
	moderate_work: { label: "Moderate work", factor: 3.0 },
} as const;

export type LifestyleKey = keyof typeof LIFESTYLE_FACTORS;

// Literal tuple (not derived via Object.keys) so zod's z.enum() can infer
// the exact literal union type at compile time.
export const LIFESTYLE_KEYS = [
	"intact_adult",
	"neutered_adult",
	"low_activity",
	"weight_loss",
	"light_work",
	"moderate_work",
] as const satisfies readonly LifestyleKey[];

export function isLifestyleKey(value: string): value is LifestyleKey {
	return value in LIFESTYLE_FACTORS;
}

export function calculateRER(weightKg: number): number {
	return 70 * weightKg ** 0.75;
}

export function calculateDER(
	weightKg: number,
	lifestyle: LifestyleKey,
): number {
	return calculateRER(weightKg) * LIFESTYLE_FACTORS[lifestyle].factor;
}

/** Fixed average calorie density used to pre-fill daily meal mass (FR-004). */
export const CALORIE_DENSITY_KCAL_PER_G = 1.5;

export function suggestedDailyMassGrams(derKcal: number): number {
	return derKcal / CALORIE_DENSITY_KCAL_PER_G;
}
