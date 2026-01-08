import type { users } from "../schemas/users.schema.ts";

export type User = typeof users.$inferSelect;
