import { hash } from "@node-rs/argon2";
import { eq } from "drizzle-orm";

import { database } from "../../database/database.service.ts";
import type { User } from "../../database/entities/user.entity.ts";
import { users } from "../../database/schemas/users.schema.ts";
import type { RegisterRequest } from "../dtos/register.request.ts";

export async function findByEmail(email: string): Promise<User | undefined> {
	return database.select().from(users).where(eq(users.email, email)).get();
}

export async function findById(id: string): Promise<User | undefined> {
	return database.select().from(users).where(eq(users.id, id)).get();
}

export async function createUser(request: RegisterRequest): Promise<User> {
	const [user] = await database
		.insert(users)
		.values({
			email: request.email,
			password: await hash(request.password),
		})
		.returning();

	return user;
}
