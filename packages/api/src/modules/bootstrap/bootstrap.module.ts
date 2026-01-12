import bearerAuth from "@fastify/bearer-auth";
import type { FastifyInstance } from "fastify";

import { bootstrapController } from "./controllers/bootstrap.controller.ts";

export async function bootstrapModule(app: FastifyInstance) {
	const bootstrapToken = process.env.LANCER_BOOTSTRAP_TOKEN;

	if (!bootstrapToken) {
		return;
	}

	await app.register(bearerAuth, {
		keys: new Set([bootstrapToken]),
		errorResponse: () => ({ error: "Unauthorized" }),
	});

	await app.register(bootstrapController);
}
