import type { FastifyInstance } from "fastify";

import { createProviderController } from "./controllers/create-provider.controller.ts";
import { getProvidersController } from "./controllers/get-providers.controller.ts";

export async function providerModule(app: FastifyInstance) {
	app.register(getProvidersController, { prefix: "/providers" });
	app.register(createProviderController, { prefix: "/providers" });
}
