import { expect, test } from "@playwright/test";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../../src/server/db/schema";

// Regression test for the "swallowed errors" fix (m3l5): every mutation in
// this app used to have only onSuccess — a failed mutation left the UI
// exactly as it was, with zero feedback. This reproduces a real trigger for
// that failure (the pet was already removed elsewhere — another tab, another
// device — between page load and the delete click, so the server correctly
// rejects it with NOT_FOUND) and asserts the error is now visible, not
// silent.

test("shows an error instead of failing silently when deleting an already-gone pet", async ({
	page,
}) => {
	const dogName = `E2E Stale ${Date.now()}`;

	page.on("dialog", (dialog) => dialog.accept());

	await page.goto("/pets");
	await page.getByPlaceholder("Dog's name").fill(dogName);
	await page.getByPlaceholder("Weight (kg)").fill("10");
	await page.getByRole("combobox").selectOption("neutered_adult");
	await page.getByRole("button", { name: "Add dog" }).click();
	await expect(page.getByText(dogName, { exact: true })).toBeVisible();

	// Remove the pet directly, out from under the still-rendered UI — the
	// same shape of failure as a stale tab or a concurrent delete elsewhere.
	try {
		process.loadEnvFile();
	} catch {}
	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) throw new Error("DATABASE_URL is not set");
	const sql = postgres(databaseUrl);
	const db = drizzle(sql, { schema });
	await db.delete(schema.pets).where(eq(schema.pets.name, dogName));
	await sql.end();

	// Scoped to this pet's own card — see seed.spec.ts for why a bare
	// getByRole("button", { name: "Delete" }) isn't safe under parallel runs.
	const card = page
		.locator('[data-testid^="pet-card-"]')
		.filter({ hasText: dogName });
	await card.getByRole("button", { name: "Delete" }).click();

	await expect(page.getByText(/not found/i)).toBeVisible();
});
