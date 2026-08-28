import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react()],
	test: {
		environment: "happy-dom",
		setupFiles: ["./vitest.setup.ts"],
		exclude: ["**/node_modules/**", "**/*.scaffold/**", "tests/e2e/**"],
	},
	resolve: {
		alias: {
			"~": new URL("./src", import.meta.url).pathname,
		},
	},
});
