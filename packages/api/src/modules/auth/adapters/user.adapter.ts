import { eq, count as sqlCount } from "drizzle-orm";

import { database } from "../../database/database.service.ts";
import { users } from "../../database/schemas/users.schema.ts";
import { toUser, type User } from "../entities/user.entity.ts";

export function count(): number {
	const result = database.select({ count: sqlCount() }).from(users).get();

	return result?.count ?? 0;
}

export function findByEmail(email: string): User | undefined {
	const user = database.select().from(users).where(eq(users.email, email)).get();

	if (!user) {
		return undefined;
	}

	return toUser(user);
}

export function findById(id: string): User | undefined {
	const user = database.select().from(users).where(eq(users.id, id)).get();

	if (!user) {
		return undefined;
	}

	return toUser(user);
}

interface CreateUserRequest {
	email: string;
	passwordHash: string;
}

export function create(request: CreateUserRequest): User {
	const [user] = database
		.insert(users)
		.values({ email: request.email, password: request.passwordHash })
		.returning()
		.all();

	return toUser(user);
}
