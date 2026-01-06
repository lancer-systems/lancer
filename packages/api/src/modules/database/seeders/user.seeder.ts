import { hash } from "@node-rs/argon2";

import { database } from "~/modules/database/database.service";
import type { User } from "~/modules/database/entities/user.entity";
import { makeUser } from "~/modules/database/fixtures/user.fixture";
import { users } from "~/modules/database/schemas/users.schema";

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
