import { type JWTPayload, jwtVerify, SignJWT } from "jose";

import { getJwtSecret } from "../../common/services/secrets.service.ts";

export async function signToken(payload: JWTPayload, expiresIn = "7d"): Promise<string> {
	return new SignJWT(payload)
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime(expiresIn)
		.sign(getJwtSecret());
}

export async function verifyToken(token: string): Promise<JWTPayload> {
	const { payload } = await jwtVerify(token, getJwtSecret());

	return {
		sub: payload.sub,
		email: payload.email,
	};
}
