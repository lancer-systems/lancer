import type { FastifyInstance } from "fastify";

import { UnauthorizedException } from "../../common/exceptions/http.exception.ts";
import * as usersAdapter from "../adapters/user.adapter.ts";
import { type LoginRequest, loginRequestValidationSchema } from "../dtos/login.request.ts";
import type { LoginResponse } from "../dtos/login.response.ts";
import * as jwtService from "../services/jwt.service.ts";
import * as passwordService from "../services/password.service.ts";

export async function loginController(app: FastifyInstance) {
	app.route<{ Body: LoginRequest; Reply: LoginResponse }>({
		method: "POST",
		url: "/login",
		config: {
			rateLimit: {
				max: 5,
				timeWindow: "1 minute",
			},
		},
		schema: {
			tags: ["auth"],
			operationId: "login",
			body: loginRequestValidationSchema,
		},
		handler: async ({ body }, reply) => {
			const { email, password } = body;

			const user = usersAdapter.findByEmail(email);

			if (!user) {
				throw new UnauthorizedException("Invalid email or password");
			}

			const isValidPassword = await passwordService.verifyPassword(user.password, password);

			if (!isValidPassword) {
				throw new UnauthorizedException("Invalid email or password");
			}

			const token = await jwtService.signToken({ sub: user.id, email: user.email });

			reply.setCookie("token", token, {
				httpOnly: true,
				secure: true,
				sameSite: "strict",
				path: "/",
				maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
			});

			return reply.status(200).send({
				id: user.id,
				email: user.email,
				createdAt: user.createdAt,
			});
		},
	});
}
