import type { FastifyInstance } from "fastify";

import { healthController } from "./controllers/health.controller";

export async function healthModule(app: FastifyInstance) {
	app.register(healthController, { prefix: "/health" });
}
