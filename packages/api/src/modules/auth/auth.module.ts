import type { FastifyInstance } from "fastify";

import { loginController } from "./controllers/login.controller.ts";

export async function authModule(app: FastifyInstance) {
	app.register(loginController, { prefix: "/auth" });
}
