import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../../src/server/db/schema";

/**
 * Seeds one test user + a database-strategy session row directly (this app
 * has no auth provider other than real Google OAuth, which can't be driven
 * headlessly), then writes a Playwright storageState with the session
 * cookie pre-set. Every E2E test runs already authenticated — "auth without
 * the UI" per the E2E rules — without ever touching Google's sign-in flow.
 *
 * Cookie name/attributes verified against @auth/core's defaultCookies()
 * (non-secure variant, since local dev is http, not https):
 * name "authjs.session-token", httpOnly, sameSite "lax", secure false.
 */
export default async function globalSetup() {
	try {
		process.loadEnvFile();
	} catch {
		// no .env file — assume DATABASE_URL is already set
	}

	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) {
		throw new Error("DATABASE_URL is not set — E2E needs the local dev DB.");
	}

	const sql = postgres(databaseUrl);
	const db = drizzle(sql, { schema });

	const userId = randomUUID();
	const sessionToken = randomUUID();
	const expires = new Date(Date.now() + 1000 * 60 * 60 * 24);

	await db.insert(schema.users).values({
		id: userId,
		name: "E2E Test User",
		email: "e2e-test@example.invalid",
	});
	await db.insert(schema.sessions).values({
		sessionToken,
		userId,
		expires,
	});

	await sql.end();

	const authDir = path.join(import.meta.dirname, ".auth");
	fs.mkdirSync(authDir, { recursive: true });

	fs.writeFileSync(
		path.join(authDir, "user.json"),
		JSON.stringify({
			cookies: [
				{
					name: "authjs.session-token",
					value: sessionToken,
					domain: "localhost",
					path: "/",
					expires: Math.floor(expires.getTime() / 1000),
					httpOnly: true,
					secure: false,
					sameSite: "Lax",
				},
			],
			origins: [],
		}),
	);

	// Teardown needs these to clean up exactly what setup created.
	fs.writeFileSync(
		path.join(authDir, "seed.json"),
		JSON.stringify({ userId, sessionToken }),
	);
}
