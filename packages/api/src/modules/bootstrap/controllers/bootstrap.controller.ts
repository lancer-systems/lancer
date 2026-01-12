import type { FastifyInstance } from "fastify";

import * as usersAdapter from "../../auth/adapters/user.adapter.ts";
import * as usersService from "../../auth/services/users.service.ts";
import { BadRequestException, NotFoundException } from "../../common/exceptions/http.exception.ts";
import * as awsService from "../../provider/services/aws.service.ts";
import * as awsProviderService from "../../provider/services/aws-provider.service.ts";
import { type BootstrapRequest, bootstrapRequestSchema } from "../dtos/bootstrap.request.ts";
import type { BootstrapResponse } from "../dtos/bootstrap.response.ts";

export async function bootstrapController(app: FastifyInstance) {
	app.route<{ Body: BootstrapRequest; Reply: BootstrapResponse }>({
		method: "POST",
		url: "/bootstrap",
		config: {
			rateLimit: {
				max: 3,
				timeWindow: "1 hour",
			},
		},
		schema: {
			hide: true,
			body: bootstrapRequestSchema,
		},
		preHandler: async () => {
			const userCount = usersAdapter.count();

			if (userCount > 0) {
				throw new NotFoundException();
			}
		},
		handler: async ({ body }, reply) => {
			const { admin, provider } = body;

			const accountId = await awsService.validateCredentials(
				provider.accessKeyId,
				provider.secretAccessKey,
				provider.region,
			);

			if (!accountId) {
				throw new BadRequestException("Invalid AWS credentials");
			}

			const user = await usersService.createUser({
				email: admin.email,
				password: admin.password,
			});

			const awsProvider = awsProviderService.create({
				name: provider.name,
				region: provider.region,
				accountId,
				accessKeyId: provider.accessKeyId,
				secretAccessKey: provider.secretAccessKey,
			});

			return reply.status(201).send({
				user: { id: user.id, email: user.email },
				provider: { id: awsProvider.id, name: awsProvider.name },
			});
		},
	});
}
