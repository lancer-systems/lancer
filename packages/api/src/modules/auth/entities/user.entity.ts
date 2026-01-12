import type { users } from "../../database/schemas/users.schema.ts";

type DatabaseUser = typeof users.$inferSelect;

export interface User {
	id: string;
	createdAt: Date;
	email: string;
	password: string;
}

export function toUser(user: DatabaseUser): User {
	return {
		id: user.id,
		createdAt: user.createdAt,
		email: user.email,
		password: user.password,
	};
}
