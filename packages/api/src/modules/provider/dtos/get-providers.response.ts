import { z } from "zod";

import { awsProviderResponseSchema } from "./provider.response.ts";

export const getProvidersResponseSchema = z.object({
	providers: z.array(awsProviderResponseSchema),
});

export type GetProvidersResponse = z.infer<typeof getProvidersResponseSchema>;
