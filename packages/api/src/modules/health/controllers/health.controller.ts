import { sql } from "drizzle-orm";
import type { FastifyInstance } from "fastify";

import { InternalServerErrorException } from "~/modules/common/exceptions/http.exception";
import { database } from "~/modules/database/database.service";

import type { HealthResponse } from "../dtos/health.response";

export async function healthController(app: FastifyInstance) {
	app.route({
		method: "GET",
		url: "/",
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
