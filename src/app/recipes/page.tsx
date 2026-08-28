import { redirect } from "next/navigation";

import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import { SiteHeader } from "../_components/site-header";
import { RecipesClient } from "./_components/recipes-client";

export default async function RecipesPage() {
	const session = await auth();
	if (!session?.user) {
		redirect(`/api/auth/signin?callbackUrl=${encodeURIComponent("/recipes")}`);
	}

	void api.recipe.getAll.prefetch();

	return (
		<HydrateClient>
			<div className="min-h-screen bg-background">
				<SiteHeader />
				<main className="container mx-auto flex flex-col items-center gap-8 px-4 py-16">
					<h1 className="font-bold text-3xl text-foreground tracking-tight">
						Saved recipes
					</h1>
					<RecipesClient />
				</main>
			</div>
		</HydrateClient>
	);
}
