import type { FastifyInstance } from "fastify";

import { ConflictException } from "~/modules/common/exceptions/http.exception";

import { type RegisterRequest, registerRequestValidationSchema } from "../dtos/register.request";
import type { RegisterResponse } from "../dtos/register.response";
import * as usersService from "../services/users.service";

export async function registerController(app: FastifyInstance) {
	app.route<{ Body: RegisterRequest }>({
		method: "POST",
		url: "/register",
		schema: {
			body: registerRequestValidationSchema,
		},
		handler: async ({ body }, reply) => {
			const { email, password } = body;

			const existingUser = await usersService.findByEmail(email);

			if (existingUser) {
				throw new ConflictException("A user with this email already exists");
			}

			const user = await usersService.createUser({ email, password });

			return reply.status(201).send({
				id: user.id,
				email: user.email,
				createdAt: user.createdAt,
			} satisfies RegisterResponse);
		},
	});
}
