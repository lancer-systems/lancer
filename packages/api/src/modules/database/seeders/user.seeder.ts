import { hash } from "@node-rs/argon2";

import { database } from "../database.service.ts";
import type { User } from "../entities/user.entity.ts";
import { makeUser } from "../fixtures/user.fixture.ts";
import { users } from "../schemas/users.schema.ts";

export async function seedUser(overrides?: Partial<User>): Promise<User> {
	const user = makeUser(overrides);

	database
		.insert(users)
		.values({
			...user,
			password: await hash(user.password),
		})
		.returning()
		.all();

	return user;
}
