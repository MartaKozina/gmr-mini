import Link from "next/link";

import { auth } from "~/server/auth";
import { HydrateClient } from "~/trpc/server";
import { SiteHeader } from "./_components/site-header";

export default async function Home() {
	const session = await auth();

	if (session?.user) {
		return (
			<HydrateClient>
				<div className="min-h-screen bg-background">
					<SiteHeader />
					<main className="container mx-auto flex flex-col items-center gap-12 px-4 py-20">
						<div className="flex flex-col items-center gap-2 text-center">
							<h1 className="font-bold text-3xl text-foreground tracking-tight">
								Welcome back, {session.user.name}
							</h1>
							<p className="text-muted-foreground">
								Pick up where you left off.
							</p>
						</div>
						<div className="grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
							<DashboardTile
								description="Add a dog and get a suggested daily energy target."
								href="/pets"
								title="Your dogs"
							/>
							<DashboardTile
								description="Build a meal in three steps, with live nutrient totals."
								href="/calculator"
								title="Meal calculator"
							/>
							<DashboardTile
								description="Browse the meals you've saved from the calculator."
								href="/recipes"
								title="Saved recipes"
							/>
						</div>
					</main>
				</div>
			</HydrateClient>
		);
	}

	return (
		<HydrateClient>
			<main className="min-h-screen bg-background">
				<div className="container mx-auto flex flex-col items-center gap-16 px-4 py-20">
					<div className="flex flex-col items-center gap-4 text-center">
						<span className="rounded-full bg-muted px-4 py-1 font-medium text-accent text-sm">
							Raw feeding, made calculable
						</span>
						<h1 className="max-w-2xl font-bold text-4xl text-foreground tracking-tight sm:text-5xl">
							gmr<span className="text-primary">mini</span>
						</h1>
						<p className="max-w-md text-lg text-muted-foreground">
							Build a nutritionally balanced raw meal for your dog, with live
							nutrient feedback as you go.
						</p>
						<Link
							className="mt-2 rounded-full bg-primary px-10 py-3 font-semibold text-primary-foreground transition hover:opacity-90"
							href="/api/auth/signin"
						>
							Sign in to get started
						</Link>
					</div>

					<div className="grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-3">
						<Benefit
							description="No mystery fillers — pick exactly what goes into each meal, from meat and bone to organs and produce."
							title="You choose every ingredient"
						/>
						<Benefit
							description="Enter proportions once and see calories, protein, fat, and calcium:phosphorus update live as you build the meal."
							title="No spreadsheet math"
						/>
						<Benefit
							description="Portions and daily energy targets are based on your dog's own weight and lifestyle, not a generic chart."
							title="Built for your dog"
						/>
					</div>

					<div className="flex w-full max-w-2xl flex-col items-center gap-4 rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
						<h2 className="font-semibold text-foreground text-xl">
							How it works
						</h2>
						<ol className="flex flex-col gap-2 text-muted-foreground">
							<li>1. Add your dog — name, weight, lifestyle</li>
							<li>2. Set your meal's category proportions</li>
							<li>3. Add ingredients and watch nutrients update live</li>
						</ol>
					</div>
				</div>
			</main>
		</HydrateClient>
	);
}

function Benefit({
	title,
	description,
}: {
	title: string;
	description: string;
}) {
	return (
		<div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5 shadow-sm">
			<h3 className="font-semibold text-foreground text-lg">{title}</h3>
			<p className="text-muted-foreground text-sm">{description}</p>
		</div>
	);
}

function DashboardTile({
	title,
	description,
	href,
}: {
	title: string;
	description: string;
	href: string;
}) {
	return (
		<Link
			className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-primary/40 hover:shadow-md"
			href={href}
		>
			<h3 className="font-semibold text-foreground text-lg">{title} →</h3>
			<p className="text-muted-foreground text-sm">{description}</p>
		</Link>
	);
}
