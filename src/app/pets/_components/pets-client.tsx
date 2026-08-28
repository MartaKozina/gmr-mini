"use client";

import { useState } from "react";

import {
	calculateDER,
	LIFESTYLE_FACTORS,
	LIFESTYLE_KEYS,
	type LifestyleKey,
} from "~/lib/nutrition";
import { api } from "~/trpc/react";

type Pet = {
	id: number;
	name: string;
	weightKg: number;
	lifestyle: string;
};

export function PetsClient() {
	const [pets] = api.pet.getAll.useSuspenseQuery();
	const utils = api.useUtils();

	const [name, setName] = useState("");
	const [weightKg, setWeightKg] = useState("");
	const [lifestyle, setLifestyle] = useState<LifestyleKey>(LIFESTYLE_KEYS[0]);
	const [error, setError] = useState<string | null>(null);

	const createPet = api.pet.create.useMutation({
		onSuccess: async () => {
			await utils.pet.invalidate();
			setName("");
			setWeightKg("");
			setError(null);
		},
		onError: (err) => setError(err.message),
	});

	return (
		<div className="flex w-full max-w-md flex-col gap-8">
			<div className="flex flex-col gap-3">
				{pets.length === 0 ? (
					<p className="text-muted-foreground">
						You have no dogs yet — add one below.
					</p>
				) : (
					pets.map((pet) => <PetCard key={pet.id} pet={pet} />)
				)}
			</div>

			<form
				className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm"
				onSubmit={(e) => {
					e.preventDefault();
					const parsedWeight = Number.parseFloat(weightKg);
					if (Number.isNaN(parsedWeight)) return;
					createPet.mutate({ name, weightKg: parsedWeight, lifestyle });
				}}
			>
				<input
					className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
					onChange={(e) => setName(e.target.value)}
					placeholder="Dog's name"
					type="text"
					value={name}
				/>
				<input
					className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
					max="120"
					min="0.5"
					onChange={(e) => setWeightKg(e.target.value)}
					placeholder="Weight (kg)"
					step="0.1"
					type="number"
					value={weightKg}
				/>
				<select
					className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
					onChange={(e) => setLifestyle(e.target.value as LifestyleKey)}
					value={lifestyle}
				>
					{LIFESTYLE_KEYS.map((key) => (
						<option key={key} value={key}>
							{LIFESTYLE_FACTORS[key].label}
						</option>
					))}
				</select>
				{error && <p className="text-destructive text-sm">{error}</p>}
				<button
					className="rounded-full bg-primary px-10 py-3 font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
					disabled={createPet.isPending || !name || !weightKg}
					type="submit"
				>
					{createPet.isPending ? "Adding..." : "Add dog"}
				</button>
			</form>
		</div>
	);
}

function PetCard({ pet }: { pet: Pet }) {
	const utils = api.useUtils();
	const [editing, setEditing] = useState(false);
	const [weightKg, setWeightKg] = useState(String(pet.weightKg));
	const [lifestyle, setLifestyle] = useState<LifestyleKey>(
		pet.lifestyle as LifestyleKey,
	);
	const [error, setError] = useState<string | null>(null);

	const updatePet = api.pet.update.useMutation({
		onSuccess: async () => {
			await utils.pet.invalidate();
			setEditing(false);
			setError(null);
		},
		onError: (err) => setError(err.message),
	});

	const deletePet = api.pet.delete.useMutation({
		onSuccess: async () => {
			await utils.pet.invalidate();
			await utils.recipe.invalidate();
			setError(null);
		},
		onError: (err) => setError(err.message),
	});

	if (editing) {
		return (
			<form
				className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 shadow-sm"
				onSubmit={(e) => {
					e.preventDefault();
					const parsedWeight = Number.parseFloat(weightKg);
					if (Number.isNaN(parsedWeight)) return;
					updatePet.mutate({ id: pet.id, weightKg: parsedWeight, lifestyle });
				}}
			>
				<p className="font-semibold text-foreground text-lg">{pet.name}</p>
				<input
					className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
					max="120"
					min="0.5"
					onChange={(e) => setWeightKg(e.target.value)}
					step="0.1"
					type="number"
					value={weightKg}
				/>
				<select
					className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
					onChange={(e) => setLifestyle(e.target.value as LifestyleKey)}
					value={lifestyle}
				>
					{LIFESTYLE_KEYS.map((key) => (
						<option key={key} value={key}>
							{LIFESTYLE_FACTORS[key].label}
						</option>
					))}
				</select>
				{error && <p className="text-destructive text-sm">{error}</p>}
				<div className="flex justify-end gap-2">
					<button
						className="rounded-full border border-border px-4 py-2 font-semibold text-foreground text-sm transition hover:bg-muted"
						onClick={() => setEditing(false)}
						type="button"
					>
						Cancel
					</button>
					<button
						className="rounded-full bg-primary px-4 py-2 font-semibold text-primary-foreground text-sm transition hover:opacity-90 disabled:opacity-40"
						disabled={updatePet.isPending || !weightKg}
						type="submit"
					>
						{updatePet.isPending ? "Saving..." : "Save"}
					</button>
				</div>
			</form>
		);
	}

	const der = calculateDER(pet.weightKg, pet.lifestyle as LifestyleKey);
	return (
		<div
			className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-4 shadow-sm"
			data-testid={`pet-card-${pet.id}`}
		>
			<div className="flex items-start justify-between">
				<p className="font-semibold text-foreground text-lg">{pet.name}</p>
				<div className="flex items-center gap-3">
					<button
						className="text-muted-foreground text-sm underline hover:text-foreground"
						onClick={() => setEditing(true)}
						type="button"
					>
						Edit
					</button>
					<button
						className="text-muted-foreground text-sm underline hover:text-foreground"
						disabled={deletePet.isPending}
						onClick={() => {
							if (
								window.confirm(
									`Delete ${pet.name}? This also deletes any recipes saved for ${pet.name}.`,
								)
							) {
								deletePet.mutate({ id: pet.id });
							}
						}}
						type="button"
					>
						Delete
					</button>
				</div>
			</div>
			{error && <p className="text-destructive text-sm">{error}</p>}
			<p className="text-muted-foreground text-sm">
				{pet.weightKg} kg ·{" "}
				{LIFESTYLE_FACTORS[pet.lifestyle as LifestyleKey]?.label ??
					pet.lifestyle}
			</p>
			<p className="text-accent text-sm">
				Suggested daily energy: ~{Math.round(der)} kcal/day
			</p>
		</div>
	);
}
