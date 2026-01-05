import { defineConfig } from "drizzle-kit";

export default defineConfig({
	dialect: "sqlite",
	schema: "./src/modules/database/schemas/*.schema.ts",
	out: "./drizzle",
	dbCredentials: {
		url: "./data/lancer.db",
	},
});
