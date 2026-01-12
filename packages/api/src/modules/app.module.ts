import { existsSync } from "node:fs";
import { join } from "node:path";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import fastifyStatic from "@fastify/static";
import fastifySwagger from "@fastify/swagger";
import Fastify from "fastify";
import {
	jsonSchemaTransform,
	serializerCompiler,
	validatorCompiler,
	type ZodTypeProvider,
} from "fastify-type-provider-zod";

import { authModule } from "./auth/auth.module.ts";
import { bootstrapModule } from "./bootstrap/bootstrap.module.ts";
import { errorHandlerMiddleware } from "./common/middlewares/error-handler.middleware.ts";
import { healthModule } from "./health/health.module.ts";
import { providerModule } from "./provider/provider.module.ts";

const publicDir = join(import.meta.dirname, "../../public");

const app = Fastify({
	logger: process.env.NODE_ENV !== "test",
}).withTypeProvider<ZodTypeProvider>();

// Setup Zod validation
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

// Plugins
app.register(cookie);

// CORS - Allow all origins (API accessible from installer, CLI, dashboard)
// Security is handled by Bearer tokens and httpOnly cookies
app.register(cors, { origin: true, credentials: true });

// Rate limiting - configured per-route, not global
// Disabled in test environment to avoid test interference
if (process.env.NODE_ENV !== "test") {
	app.register(rateLimit, { global: false });
}

// OpenAPI/Swagger documentation
app.register(fastifySwagger, {
	openapi: {
		openapi: "3.1.0",
		info: {
			title: "Lancer API",
			description: "API for Lancer dashboard",
			version: "0.1.0",
		},
		tags: [
			{ name: "auth", description: "Authentication endpoints" },
			{ name: "health", description: "Health check endpoints" },
			{ name: "providers", description: "Cloud provider management" },
		],
	},
	transform: jsonSchemaTransform,
});

// Middlewares
app.register(errorHandlerMiddleware);

// Modules (all under /api prefix)
app.register(authModule, { prefix: "/api" });
app.register(bootstrapModule, { prefix: "/api" });
app.register(healthModule, { prefix: "/api" });
app.register(providerModule, { prefix: "/api" });

// Serve dashboard static files in production
if (existsSync(publicDir)) {
	app.register(fastifyStatic, { root: publicDir, prefix: "/" });

	// SPA fallback: serve index.html for all non-API routes
	app.setNotFoundHandler((request, reply) => {
		if (!request.url.startsWith("/api")) {
			return reply.sendFile("index.html");
		}

		return reply.status(404).send({ message: "Not Found" });
	});
}

export { app };
