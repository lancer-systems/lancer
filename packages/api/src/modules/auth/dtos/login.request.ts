import { z } from "zod";

export const loginRequestValidationSchema = z.object({
	email: z.email(),
	password: z.string().min(1),
});

export type LoginRequest = z.infer<typeof loginRequestValidationSchema>;
