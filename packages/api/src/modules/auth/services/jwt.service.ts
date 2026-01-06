import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";

import { database } from "~/modules/database/database.service";
import { settings } from "~/modules/database/schemas/settings.schema";

const JWT_SECRET_KEY = "jwt_secret";

/** Returns the JWT secret from DB, generating one on first call. */
export function getJwtSecret(): string {
	const existing = database.select().from(settings).where(eq(settings.key, JWT_SECRET_KEY)).get();

	if (existing) {
		return existing.value;
	}

	const secret = randomBytes(64).toString("base64");

	database.insert(settings).values({ key: JWT_SECRET_KEY, value: secret }).run();

	return secret;
}
