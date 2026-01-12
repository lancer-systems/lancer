import { z } from "zod";

export const awsProviderResponseSchema = z.object({
	id: z.string(),
	name: z.string(),
	type: z.literal("aws"),
	region: z.string(),
	accountId: z.string(),
	createdAt: z.date(),
});

export type AwsProviderResponse = z.infer<typeof awsProviderResponseSchema>;
