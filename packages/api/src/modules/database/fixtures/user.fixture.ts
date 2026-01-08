import { faker } from "@faker-js/faker";
import { nanoid } from "nanoid";

import type { User } from "../entities/user.entity.ts";

export function makeUser(overrides?: Partial<User>): User {
	return {
		id: nanoid(),
		createdAt: faker.date.past(),
		updatedAt: faker.date.recent(),
		email: faker.internet.email(),
		password: faker.internet.password({ length: 12, memorable: true }),
		...overrides,
	};
}
