import { redirect } from "next/navigation";

import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import { SiteHeader } from "../_components/site-header";
import { PetsClient } from "./_components/pets-client";

export default async function PetsPage() {
	const session = await auth();
	if (!session?.user) {
		redirect(`/api/auth/signin?callbackUrl=${encodeURIComponent("/pets")}`);
	}

	void api.pet.getAll.prefetch();

	return (
		<HydrateClient>
			<div className="min-h-screen bg-background">
				<SiteHeader />
				<main className="container mx-auto flex flex-col items-center gap-8 px-4 py-16">
					<h1 className="font-bold text-3xl text-foreground tracking-tight">
						Your dogs
					</h1>
					<PetsClient />
				</main>
			</div>
		</HydrateClient>
	);
}
