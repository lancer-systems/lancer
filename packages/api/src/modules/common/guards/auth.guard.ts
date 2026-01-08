import type { FastifyRequest } from "fastify";

import { verifyToken } from "../../auth/services/jwt.service.ts";
import { UnauthorizedException } from "../exceptions/http.exception.ts";

export async function authGuard(request: FastifyRequest) {
	const token = request.cookies.token;

	if (!token) {
		throw new UnauthorizedException("Authentication required");
	}

	try {
		await verifyToken(token);
	} catch {
		throw new UnauthorizedException("Invalid or expired token");
	}
}
