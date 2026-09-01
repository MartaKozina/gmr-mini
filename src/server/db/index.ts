import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "~/env";
import * as schema from "./schema";

/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update.
 */
const globalForDb = globalThis as unknown as {
	conn: postgres.Sql | undefined;
};

const conn =
	globalForDb.conn ??
	postgres(env.DATABASE_URL, {
		// Recycle connections proactively so a long-running dev server (e.g.
		// across a laptop sleep/wake, which can leave the cached connection's
		// TCP socket half-open through Docker/colima port-forwarding) doesn't
		// hang for several seconds on a dead connection before failing.
		idle_timeout: 20,
		max_lifetime: 60 * 30,
		// Neon's pooled connection string (what DATABASE_URL is in
		// production) routes through PgBouncer in transaction-pooling mode,
		// which doesn't support server-side prepared statements — postgres.js
		// uses them by default. Without this, queries intermittently fail
		// with an opaque "Failed query" error depending on which pooled
		// backend a given query lands on. Safe to disable everywhere: local
		// Docker Postgres has no pooler and works identically either way.
		prepare: false,
	});
if (env.NODE_ENV !== "production") globalForDb.conn = conn;

export const db = drizzle(conn, { schema });
