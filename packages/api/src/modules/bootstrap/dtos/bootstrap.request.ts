import { z } from "zod";

export const bootstrapRequestSchema = z.object({
	admin: z.object({
		email: z.email(),
		password: z.string().min(8).max(128),
	}),
	provider: z.object({
		name: z.string().min(1).max(64),
		region: z.string().min(1),
		accessKeyId: z.string().min(1),
		secretAccessKey: z.string().min(1),
	}),
});

export type BootstrapRequest = z.infer<typeof bootstrapRequestSchema>;
