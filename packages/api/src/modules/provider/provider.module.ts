import type { FastifyInstance } from "fastify";

import { createProviderController } from "./controllers/create-provider.controller.ts";

export async function providerModule(app: FastifyInstance) {
	app.register(createProviderController, { prefix: "/providers" });
}
