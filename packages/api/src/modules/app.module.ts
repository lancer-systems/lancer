import cookie from "@fastify/cookie";
import jwt from "@fastify/jwt";
import Fastify from "fastify";
import {
	serializerCompiler,
	validatorCompiler,
	type ZodTypeProvider,
} from "fastify-type-provider-zod";

import { authModule } from "~/modules/auth/auth.module";
import { getJwtSecret } from "~/modules/auth/services/jwt.service";
import { errorHandlerMiddleware } from "~/modules/common/middlewares/error-handler.middleware";
import { healthModule } from "~/modules/health/health.module";

const app = Fastify({
	logger: !process.env.VITEST,
}).withTypeProvider<ZodTypeProvider>();

// Setup Zod validation
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

// Plugins
app.register(cookie);
app.register(jwt, { secret: getJwtSecret() });

// Middlewares
app.register(errorHandlerMiddleware);

// Modules
app.register(authModule);
app.register(healthModule);

export { app };
