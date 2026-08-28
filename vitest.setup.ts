import "@testing-library/jest-dom/vitest";

// Integration-style tests (e.g. router ownership tests) import the tRPC
// router chain, which reads real env vars (DATABASE_URL, AUTH_GOOGLE_*) at
// module-eval time via ~/env. Vitest doesn't load .env on its own, unlike
// Next's dev/build commands, so load it here. Guarded because CI or other
// environments may inject these vars directly instead of via a .env file.
try {
	process.loadEnvFile();
} catch {
	// no .env file present — assume the environment already provides what's needed
}
