import Fastify from "fastify";
import {
	serializerCompiler,
	validatorCompiler,
	type ZodTypeProvider,
} from "fastify-type-provider-zod";

import { errorHandlerMiddleware } from "~/modules/common/middlewares/error-handler.middleware";
import { healthController } from "~/modules/health/controllers/health.controller";
import { registerController } from "~/modules/users/controllers/register.controller";

const app = Fastify({
	logger: !process.env.VITEST,
}).withTypeProvider<ZodTypeProvider>();

// Setup Zod validation
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

// Middlewares
app.register(errorHandlerMiddleware);

// Controllers
app.register(healthController, { prefix: "/health" });
app.register(registerController, { prefix: "/users" });

export { app };
