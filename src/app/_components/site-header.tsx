import Link from "next/link";

export function SiteHeader() {
	return (
		<header className="w-full border-border border-b bg-card">
			<div className="container mx-auto flex items-center justify-between px-4 py-4">
				<Link className="font-bold text-foreground text-lg" href="/">
					gmr<span className="text-primary">mini</span>
				</Link>
				<nav className="flex items-center gap-6 font-medium text-muted-foreground text-sm">
					<Link className="transition hover:text-foreground" href="/pets">
						Dogs
					</Link>
					<Link className="transition hover:text-foreground" href="/calculator">
						Calculator
					</Link>
					<Link className="transition hover:text-foreground" href="/recipes">
						Recipes
					</Link>
					<Link
						className="transition hover:text-foreground"
						href="/api/auth/signout"
					>
						Sign out
					</Link>
				</nav>
			</div>
		</header>
	);
}
