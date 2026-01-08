import type { FastifyError, FastifyInstance } from "fastify";

import { HttpException } from "../exceptions/http.exception.ts";

export async function errorHandlerMiddleware(app: FastifyInstance) {
	app.setErrorHandler((error: FastifyError | HttpException, request, reply) => {
		if (error instanceof HttpException) {
			return reply.status(error.statusCode).send({
				error: error.statusCode,
				message: error.message,
			});
		}

		// Zod validation errors
		if ("validation" in error && error.validation) {
			return reply.status(400).send({
				error: 400,
				message: "Validation error",
				details: error.validation,
			});
		}

		// Unhandled errors
		request.log.error(error);
		return reply.status(500).send({
			error: 500,
			message: "Internal Server Error",
		});
	});
}
