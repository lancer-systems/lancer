import type { FastifyInstance } from "fastify";

import { authGuard } from "../../common/guards/auth.guard.ts";
import * as awsProviderAdapter from "../adapters/aws-provider.adapter.ts";
import {
	type GetProvidersResponse,
	getProvidersResponseSchema,
} from "../dtos/get-providers.response.ts";

export async function getProvidersController(app: FastifyInstance) {
	app.route<{ Reply: GetProvidersResponse }>({
		method: "GET",
		url: "/",
		onRequest: [authGuard],
		schema: {
			tags: ["providers"],
			operationId: "getProviders",
			response: {
				200: getProvidersResponseSchema,
			},
		},
		handler: async (_, reply) => {
			const providers = awsProviderAdapter.findAll();

			return reply.send({
				providers: providers.map((provider) => ({
					id: provider.id,
					name: provider.name,
					type: "aws" as const,
					region: provider.region,
					accountId: provider.accountId,
					createdAt: provider.createdAt,
				})),
			});
		},
	});
}
