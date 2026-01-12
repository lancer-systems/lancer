import { sql } from "drizzle-orm";
import type { FastifyInstance } from "fastify";

import { InternalServerErrorException } from "../../common/exceptions/http.exception.ts";
import { database } from "../../database/database.service.ts";
import { type HealthResponse, healthResponseSchema } from "../dtos/health.response.ts";

export async function healthController(app: FastifyInstance) {
	app.route<{ Reply: HealthResponse }>({
		method: "GET",
		url: "/",
		schema: {
			tags: ["health"],
			operationId: "getHealth",
			response: {
				200: healthResponseSchema,
			},
		},
		handler: async (_, reply) => {
			try {
				database.get(sql`SELECT 1`);

				return reply.status(200).send({ status: "healthy", database: "connected" });
			} catch {
				throw new InternalServerErrorException("Database connection failed");
			}
		},
	});
}
