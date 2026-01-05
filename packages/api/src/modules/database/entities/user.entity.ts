import type { users } from "../schemas/users.schema";

export type User = typeof users.$inferSelect;
