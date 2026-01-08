import type { FastifyInstance } from "fastify";

import { loginController } from "./controllers/login.controller.ts";
import { registerController } from "./controllers/register.controller.ts";

export async function authModule(app: FastifyInstance) {
	app.register(registerController, { prefix: "/auth" });
	app.register(loginController, { prefix: "/auth" });
}
