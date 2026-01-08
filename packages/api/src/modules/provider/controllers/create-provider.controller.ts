import type { FastifyInstance } from "fastify";

import { BadRequestException, ConflictException } from "../../common/exceptions/http.exception.ts";
import { authGuard } from "../../common/guards/auth.guard.ts";
import {
	type CreateProviderRequest,
	createProviderRequestSchema,
} from "../dtos/create-provider.request.ts";
import type { AwsProviderResponse } from "../dtos/provider.response.ts";
import * as awsService from "../services/aws.service.ts";
import * as awsProviderService from "../services/aws-provider.service.ts";
import * as providerService from "../services/provider.service.ts";

export async function createProviderController(app: FastifyInstance) {
	app.route<{ Body: CreateProviderRequest }>({
		method: "POST",
		url: "/",
		onRequest: [authGuard],
		schema: {
			body: createProviderRequestSchema,
		},
		handler: async ({ body }, reply) => {
			const existing = providerService.findByName(body.type, body.name);

			if (existing) {
				throw new ConflictException(`Provider "${body.name}" already exists`);
			}

			switch (body.type) {
				case "aws": {
					const { name, region, accessKeyId, secretAccessKey } = body;

					const accountId = await awsService.validateCredentials(
						accessKeyId,
						secretAccessKey,
						region,
					);

					if (!accountId) {
						throw new BadRequestException("Invalid AWS credentials");
					}

					const provider = awsProviderService.create({
						name,
						region,
						accountId,
						accessKeyId,
						secretAccessKey,
					});

					return reply.status(201).send({
						id: provider.id,
						name: provider.name,
						type: "aws",
						region: provider.region,
						accountId: provider.accountId,
						createdAt: provider.createdAt,
					} satisfies AwsProviderResponse);
				}
			}
		},
	});
}
