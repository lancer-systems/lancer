import { awsRegions } from "@lancer/shared/constants";
import { z } from "zod";

const awsProviderSchema = z.object({
	name: z
		.string()
		.min(1)
		.max(64)
		.regex(/^[a-z0-9-]+$/, {
			message: "Name must be lowercase alphanumeric with hyphens",
		}),
	type: z.literal("aws"),
	region: z.enum(awsRegions.map((region) => region.code)),
	accessKeyId: z.string().min(16).max(128),
	secretAccessKey: z.string().min(16).max(128),
});

export const createProviderRequestSchema = z.discriminatedUnion("type", [awsProviderSchema]);

export type CreateProviderRequest = z.infer<typeof createProviderRequestSchema>;
export type CreateAwsProviderRequest = z.infer<typeof awsProviderSchema>;
