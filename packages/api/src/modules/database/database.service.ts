import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import { awsProviders } from "./schemas/aws-providers.schema.ts";
import { users } from "./schemas/users.schema.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "../../../data");
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
