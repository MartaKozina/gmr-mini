/**
 * Fixed, pre-seeded ingredient database (FR-008). No user-submitted or
 * editable ingredients in v1 — see PRD Non-Goals.
 *
 * Nutrient values are approximate, patterned on general USDA-style reference
 * data for common raw-feeding ingredients — NOT lab-verified for this
 * project. Treat as illustrative for the MVP, not a clinical nutrition
 * source; a real ingredient-data provider is a reasonable v2 upgrade.
 */

export const CATEGORIES = [
	"meat",
	"bone",
	"organs",
	"liver",
	"veggies",
	"fruits",
	"others",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
	meat: "Meat",
	bone: "Bone",
	organs: "Organs",
	liver: "Liver",
	veggies: "Veggies",
	fruits: "Fruits",
	others: "Others",
};

export interface Ingredient {
	id: string;
	name: string;
	category: Category;
	kcalPer100g: number;
	proteinPer100g: number;
	fatPer100g: number;
	calciumMgPer100g: number;
	phosphorusMgPer100g: number;
}

export const INGREDIENTS: Ingredient[] = [
	// meat
	{
		id: "chicken-breast",
		name: "Chicken breast",
		category: "meat",
		kcalPer100g: 120,
		proteinPer100g: 22.5,
		fatPer100g: 2.6,
		calciumMgPer100g: 5,
		phosphorusMgPer100g: 196,
	},
	{
		id: "beef-ground",
		name: "Beef (ground, 85% lean)",
		category: "meat",
		kcalPer100g: 215,
		proteinPer100g: 19,
		fatPer100g: 15,
		calciumMgPer100g: 11,
		phosphorusMgPer100g: 173,
	},
	{
		id: "duck-breast",
		name: "Duck breast (skinless)",
		category: "meat",
		kcalPer100g: 140,
		proteinPer100g: 19.6,
		fatPer100g: 6.8,
		calciumMgPer100g: 8,
		phosphorusMgPer100g: 230,
	},
	{
		id: "turkey-breast",
		name: "Turkey breast",
		category: "meat",
		kcalPer100g: 114,
		proteinPer100g: 23.5,
		fatPer100g: 1.5,
		calciumMgPer100g: 9,
		phosphorusMgPer100g: 174,
	},
	// bone (raw meaty bones)
	{
		id: "chicken-neck",
		name: "Chicken neck",
		category: "bone",
		kcalPer100g: 172,
		proteinPer100g: 15,
		fatPer100g: 12,
		calciumMgPer100g: 250,
		phosphorusMgPer100g: 150,
	},
	{
		id: "chicken-feet",
		name: "Chicken feet",
		category: "bone",
		kcalPer100g: 215,
		proteinPer100g: 20,
		fatPer100g: 15,
		calciumMgPer100g: 470,
		phosphorusMgPer100g: 130,
	},
	{
		id: "chicken-wing",
		name: "Chicken wing",
		category: "bone",
		kcalPer100g: 203,
		proteinPer100g: 17,
		fatPer100g: 15,
		calciumMgPer100g: 90,
		phosphorusMgPer100g: 130,
	},
	// organs (non-liver)
	{
		id: "beef-kidney",
		name: "Beef kidney",
		category: "organs",
		kcalPer100g: 99,
		proteinPer100g: 17,
		fatPer100g: 3,
		calciumMgPer100g: 13,
		phosphorusMgPer100g: 250,
	},
	{
		id: "beef-spleen",
		name: "Beef spleen",
		category: "organs",
		kcalPer100g: 106,
		proteinPer100g: 17.5,
		fatPer100g: 3.2,
		calciumMgPer100g: 9,
		phosphorusMgPer100g: 300,
	},
	{
		id: "beef-heart",
		name: "Beef heart",
		category: "organs",
		kcalPer100g: 112,
		proteinPer100g: 17,
		fatPer100g: 3.8,
		calciumMgPer100g: 6,
		phosphorusMgPer100g: 202,
	},
	// liver
	{
		id: "beef-liver",
		name: "Beef liver",
		category: "liver",
		kcalPer100g: 135,
		proteinPer100g: 20,
		fatPer100g: 3.6,
		calciumMgPer100g: 5,
		phosphorusMgPer100g: 387,
	},
	{
		id: "chicken-liver",
		name: "Chicken liver",
		category: "liver",
		kcalPer100g: 119,
		proteinPer100g: 16.9,
		fatPer100g: 4.8,
		calciumMgPer100g: 8,
		phosphorusMgPer100g: 297,
	},
	// veggies
	{
		id: "spinach",
		name: "Spinach",
		category: "veggies",
		kcalPer100g: 23,
		proteinPer100g: 2.9,
		fatPer100g: 0.4,
		calciumMgPer100g: 99,
		phosphorusMgPer100g: 49,
	},
	{
		id: "carrot",
		name: "Carrot",
		category: "veggies",
		kcalPer100g: 41,
		proteinPer100g: 0.9,
		fatPer100g: 0.2,
		calciumMgPer100g: 33,
		phosphorusMgPer100g: 35,
	},
	{
		id: "pumpkin",
		name: "Pumpkin / squash",
		category: "veggies",
		kcalPer100g: 26,
		proteinPer100g: 1,
		fatPer100g: 0.1,
		calciumMgPer100g: 21,
		phosphorusMgPer100g: 44,
	},
	// fruits
	{
		id: "apple",
		name: "Apple (no seeds)",
		category: "fruits",
		kcalPer100g: 52,
		proteinPer100g: 0.3,
		fatPer100g: 0.2,
		calciumMgPer100g: 6,
		phosphorusMgPer100g: 11,
	},
	{
		id: "blueberries",
		name: "Blueberries",
		category: "fruits",
		kcalPer100g: 57,
		proteinPer100g: 0.7,
		fatPer100g: 0.3,
		calciumMgPer100g: 6,
		phosphorusMgPer100g: 12,
	},
	// others
	{
		id: "fish-oil",
		name: "Fish oil",
		category: "others",
		kcalPer100g: 902,
		proteinPer100g: 0,
		fatPer100g: 100,
		calciumMgPer100g: 0,
		phosphorusMgPer100g: 0,
	},
	{
		id: "egg",
		name: "Whole egg",
		category: "others",
		kcalPer100g: 143,
		proteinPer100g: 12.6,
		fatPer100g: 9.5,
		calciumMgPer100g: 56,
		phosphorusMgPer100g: 198,
	},
];

export function getIngredientsByCategory(category: Category): Ingredient[] {
	return INGREDIENTS.filter((i) => i.category === category);
}

export function getIngredientById(id: string): Ingredient | undefined {
	return INGREDIENTS.find((i) => i.id === id);
}
