import { zodResolver } from "@hookform/resolvers/zod";
import { awsRegions } from "@lancer/shared/constants";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "../../../components/button.tsx";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "../../../components/form.tsx";
import { Input } from "../../../components/input.tsx";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../../components/select.tsx";

const createProviderSchema = z.object({
	name: z
		.string()
		.min(1, "Name is required")
		.max(64, "Name must be at most 64 characters")
		.regex(/^[a-z0-9-]+$/, "Name must be lowercase alphanumeric with hyphens"),
	type: z.literal("aws"),
	region: z.enum(awsRegions.map((r) => r.code) as [string, ...string[]]),
	accessKeyId: z
		.string()
		.min(16, "Access Key ID must be at least 16 characters")
		.max(128, "Access Key ID must be at most 128 characters"),
	secretAccessKey: z
		.string()
		.min(16, "Secret Access Key must be at least 16 characters")
		.max(128, "Secret Access Key must be at most 128 characters"),
});

type CreateProviderFormValues = z.infer<typeof createProviderSchema>;

export function CreateProviderForm() {
	const form = useForm<CreateProviderFormValues>({
		resolver: zodResolver(createProviderSchema),
		defaultValues: {
			name: "",
			type: "aws",
			region: "us-east-1",
			accessKeyId: "",
			secretAccessKey: "",
		},
	});

	// Read-only for now - no submit handler
	function onSubmit(_data: CreateProviderFormValues) {
		// Will be implemented later
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Name</FormLabel>
							<FormControl>
								<Input placeholder="my-aws-provider" disabled {...field} />
							</FormControl>
							<FormDescription>Lowercase letters, numbers, and hyphens only</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="type"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Provider Type</FormLabel>
							<Select onValueChange={field.onChange} defaultValue={field.value} disabled>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Select a provider type" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									<SelectItem value="aws">Amazon Web Services (AWS)</SelectItem>
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="region"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Region</FormLabel>
							<Select onValueChange={field.onChange} defaultValue={field.value} disabled>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Select a region" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{awsRegions.map((region) => (
										<SelectItem key={region.code} value={region.code}>
											{region.name} ({region.code})
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="accessKeyId"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Access Key ID</FormLabel>
							<FormControl>
								<Input placeholder="AKIAIOSFODNN7EXAMPLE" disabled {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="secretAccessKey"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Secret Access Key</FormLabel>
							<FormControl>
								<Input
									type="password"
									placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
									disabled
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<Button type="submit" disabled className="w-full">
					Create Provider (Coming Soon)
				</Button>
			</form>
		</Form>
	);
}
