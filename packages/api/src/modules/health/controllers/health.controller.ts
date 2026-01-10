import { sql } from "drizzle-orm";
import type { FastifyInstance } from "fastify";

import { InternalServerErrorException } from "../../common/exceptions/http.exception.ts";
import { database } from "../../database/database.service.ts";
import type { HealthResponse } from "../dtos/health.response.ts";

export async function healthController(app: FastifyInstance) {
	app.route({
		method: "GET",
		url: "/",
		schema: {
			tags: ["health"],
			operationId: "getHealth",
		},
		handler: async (_, reply) => {
			try {
				database.get(sql`SELECT 1`);

				return reply.send({ status: "healthy", database: "connected" } satisfies HealthResponse);
			} catch {
				throw new InternalServerErrorException("Database connection failed");
			}
		},
	});
}
