import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import { awsProviders } from "./schemas/aws-providers.schema.ts";
import { users } from "./schemas/users.schema.ts";

const dataDir = join(import.meta.dirname, "../../../data");
const dbPath = join(dataDir, "lancer.db");

if (!existsSync(dataDir)) {
	mkdirSync(dataDir, { recursive: true });
}

export const database = drizzle(new Database(dbPath), {
	schema: {
		awsProviders,
		users,
	},
});
