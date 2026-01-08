import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { nanoid } from "nanoid";

import type { EncryptedData } from "../../provider/services/crypto.service.ts";

export const awsProviders = sqliteTable("aws_providers", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => nanoid()),
	name: text("name").notNull().unique(),
	region: text("region").notNull(),
	accountId: text("account_id").notNull(),

	// Encrypted credentials (AES-256-GCM as JSON)
	accessKeyId: text("access_key_id", { mode: "json" }).$type<EncryptedData>().notNull(),
	secretAccessKey: text("secret_access_key", { mode: "json" }).$type<EncryptedData>().notNull(),

	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
});
