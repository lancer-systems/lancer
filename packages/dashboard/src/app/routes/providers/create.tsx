import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

import { Button } from "../../../components/button.tsx";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../../components/card.tsx";
import { CreateProviderForm } from "../../../features/providers/components/create-provider-form.tsx";

export function CreateProviderPage() {
	return (
		<div className="min-h-screen bg-background p-4 md:p-8">
			<div className="mx-auto max-w-2xl">
				<div className="mb-6">
					<Button variant="ghost" asChild>
						<Link href="/">
							<ArrowLeft className="mr-2 h-4 w-4" />
							Back to Dashboard
						</Link>
					</Button>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Add Cloud Provider</CardTitle>
						<CardDescription>
							Connect your cloud provider to deploy and manage your services.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<CreateProviderForm />
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
