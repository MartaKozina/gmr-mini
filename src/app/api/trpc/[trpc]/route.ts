import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type { NextRequest } from "next/server";

import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a HTTP request (e.g. when you make requests from Client Components).
 */
const createContext = async (req: NextRequest) => {
	return createTRPCContext({
		headers: req.headers,
	});
};

const handler = (req: NextRequest) =>
	fetchRequestHandler({
		endpoint: "/api/trpc",
		req,
		router: appRouter,
		createContext: () => createContext(req),
		onError: ({ path, error }) => {
			// TEMP: production logging is normally off (see the dev-only
			// gate this replaced) — turned on everywhere right now to
			// diagnose a production-only query failure. Next.js redacts
			// uncaught Error objects in prod logs, so log the extracted
			// string fields explicitly instead — those aren't redacted.
			console.error(
				`❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`,
			);
			if (error.cause) {
				console.error("cause:", error.cause);
			}
		},
	});

export { handler as GET, handler as POST };
