import cookie from "@fastify/cookie";
import Fastify from "fastify";
import {
	serializerCompiler,
	validatorCompiler,
	type ZodTypeProvider,
} from "fastify-type-provider-zod";

import { authModule } from "./auth/auth.module.ts";
import { errorHandlerMiddleware } from "./common/middlewares/error-handler.middleware.ts";
import { healthModule } from "./health/health.module.ts";
import { providerModule } from "./provider/provider.module.ts";

const app = Fastify({
	logger: process.env.NODE_ENV !== "test",
}).withTypeProvider<ZodTypeProvider>();

// Setup Zod validation
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

// Plugins
app.register(cookie);

// Middlewares
app.register(errorHandlerMiddleware);

// Modules
app.register(authModule);
app.register(healthModule);
app.register(providerModule);

export { app };
