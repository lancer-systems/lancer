import { z } from "zod";

export const registerRequestValidationSchema = z.object({
	email: z.email(),
	password: z.string().min(8).max(128),
});

export type RegisterRequest = z.infer<typeof registerRequestValidationSchema>;
