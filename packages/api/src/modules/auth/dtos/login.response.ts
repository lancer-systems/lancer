import { z } from "zod";

export const loginResponseSchema = z.object({
	id: z.string(),
	email: z.string(),
	createdAt: z.date(),
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;
