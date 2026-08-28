import { expect, test } from "@playwright/test";

// Seed exemplar for this project's E2E tests — see tests/e2e/E2E_RULES.md.
// Every generated test should model itself on the four patterns here:
// role-based locators (getByPlaceholder as the documented fallback for this
// app's unlabeled inputs), test independence (create + cleanup in one test),
// wait-for-state (no waitForTimeout), and a risk-tied test name.

test("created dog persists after page reload", async ({ page }) => {
	const dogName = `E2E Dog ${Date.now()}`;

	// pet.delete's confirm() dialog must be accepted, or Playwright
	// auto-dismisses it and the delete silently no-ops.
	page.on("dialog", (dialog) => dialog.accept());

	await page.goto("/pets");

	await page.getByPlaceholder("Dog's name").fill(dogName);
	await page.getByPlaceholder("Weight (kg)").fill("12");
	await page.getByRole("combobox").selectOption("neutered_adult");
	await page.getByRole("button", { name: "Add dog" }).click();

	await expect(page.getByText(dogName, { exact: true })).toBeVisible();

	await page.reload();
	await expect(page.getByText(dogName, { exact: true })).toBeVisible();

	// Cleanup — scoped to this pet's own card: the shared E2E user can have
	// other tests' pets visible at the same time under parallel execution, and
	// "Delete" isn't a unique button name across cards.
	const card = page
		.locator('[data-testid^="pet-card-"]')
		.filter({ hasText: dogName });
	await card.getByRole("button", { name: "Delete" }).click();
	await expect(page.getByText(dogName, { exact: true })).not.toBeVisible();
});
