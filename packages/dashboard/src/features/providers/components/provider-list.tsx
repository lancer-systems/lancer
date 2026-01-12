import { Cloud, Loader2, Plus } from "lucide-react";
import { Link } from "wouter";

import { Button } from "../../../components/button.tsx";
import { Card, CardDescription, CardHeader, CardTitle } from "../../../components/card.tsx";
import { useGetProviders } from "../../../lib/api/endpoints/providers/providers.ts";

export function ProviderList() {
	const { data, error, isLoading } = useGetProviders();

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
				<p className="text-sm text-destructive">
					{error instanceof Error ? error.message : "Failed to load providers"}
				</p>
			</div>
		);
	}

	const providers = data?.providers ?? [];

	if (providers.length === 0) {
		return (
			<div className="py-12 text-center">
				<Cloud className="mx-auto h-12 w-12 text-muted-foreground" />
				<h3 className="mt-4 text-lg font-semibold">No providers</h3>
				<p className="mt-2 text-sm text-muted-foreground">
					Get started by connecting your first cloud provider.
				</p>
				<Button asChild className="mt-4">
					<Link href="/providers/create">
						<Plus className="mr-2 h-4 w-4" />
						Add Provider
					</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{providers.map((provider) => (
				<Card key={provider.id}>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<div>
							<CardTitle className="text-base font-medium">{provider.name}</CardTitle>
							<CardDescription>
								{provider.type.toUpperCase()} - {provider.region}
							</CardDescription>
						</div>
						<div className="text-sm text-muted-foreground">Account: {provider.accountId}</div>
					</CardHeader>
				</Card>
			))}
		</div>
	);
}
