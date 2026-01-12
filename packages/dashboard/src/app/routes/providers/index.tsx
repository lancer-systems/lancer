import { Plus } from "lucide-react";
import { Link } from "wouter";

import { Button } from "../../../components/button.tsx";
import { Card, CardContent } from "../../../components/card.tsx";
import { ProviderList } from "../../../features/providers/components/provider-list.tsx";

export function ProvidersPage() {
	return (
		<div className="min-h-screen bg-background p-4 md:p-8">
			<div className="mx-auto max-w-4xl">
				<div className="mb-6 flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold">Cloud Providers</h1>
						<p className="text-muted-foreground">Manage your connected cloud providers</p>
					</div>
					<Button asChild>
						<Link href="/providers/create">
							<Plus className="mr-2 h-4 w-4" />
							Add Provider
						</Link>
					</Button>
				</div>

				<Card>
					<CardContent className="pt-6">
						<ProviderList />
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
