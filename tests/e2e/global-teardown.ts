import fs from "node:fs";
import path from "node:path";
import { eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../../src/server/db/schema";

/** Removes exactly what global-setup created (and anything the tests built
 * for that user), so repeated local/CI runs don't accumulate test data. */
export default async function globalTeardown() {
	const authDir = path.join(import.meta.dirname, ".auth");
	const seedPath = path.join(authDir, "seed.json");
	if (!fs.existsSync(seedPath)) return;

	const { userId, sessionToken } = JSON.parse(
		fs.readFileSync(seedPath, "utf-8"),
	) as { userId: string; sessionToken: string };

	try {
		process.loadEnvFile();
	} catch {}

	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) return;

	const sql = postgres(databaseUrl);
	const db = drizzle(sql, { schema });

	const pets = await db.query.pets.findMany({
		where: (pets, { eq }) => eq(pets.createdById, userId),
	});
	const petIds = pets.map((p) => p.id);
	if (petIds.length > 0) {
		await db
			.delete(schema.recipes)
			.where(inArray(schema.recipes.petId, petIds));
	}
	await db.delete(schema.pets).where(eq(schema.pets.createdById, userId));
	await db
		.delete(schema.sessions)
		.where(eq(schema.sessions.sessionToken, sessionToken));
	await db.delete(schema.users).where(eq(schema.users.id, userId));

	await sql.end();

	fs.rmSync(authDir, { recursive: true, force: true });
}
