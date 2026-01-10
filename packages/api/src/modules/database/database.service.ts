import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import { awsProviders } from "./schemas/aws-providers.schema.ts";
import { users } from "./schemas/users.schema.ts";

const DATA_DIR = join(import.meta.dirname, "../../../data");
const DB_PATH = join(DATA_DIR, "lancer.db");

if (!existsSync(DATA_DIR)) {
	mkdirSync(DATA_DIR, { recursive: true });
}

export const database = drizzle(new Database(DB_PATH), {
	schema: {
		awsProviders,
		users,
	},
});
