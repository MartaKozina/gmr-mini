import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./tests/e2e",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	reporter: "list",
	globalSetup: "./tests/e2e/global-setup.ts",
	globalTeardown: "./tests/e2e/global-teardown.ts",
	use: {
		baseURL: "http://localhost:3100",
		storageState: "tests/e2e/.auth/user.json",
		trace: "on-first-retry",
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
	webServer: {
		// A dedicated port, not the default 3000 — this machine can have other
		// projects' dev servers already listening there, and reuseExistingServer
		// would otherwise happily "reuse" a completely unrelated app.
		command: "pnpm exec next dev --turbo -p 3100",
		url: "http://localhost:3100",
		reuseExistingServer: !process.env.CI,
		timeout: 30_000,
	},
});
