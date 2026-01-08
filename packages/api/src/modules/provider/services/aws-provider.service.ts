import { eq } from "drizzle-orm";

import { database } from "../../database/database.service.ts";
import { awsProviders } from "../../database/schemas/aws-providers.schema.ts";
import { encrypt } from "./crypto.service.ts";

export function findByName(name: string) {
	return database.select().from(awsProviders).where(eq(awsProviders.name, name)).get();
}

export function create(data: {
	name: string;
	region: string;
	accountId: string;
	accessKeyId: string;
	secretAccessKey: string;
}) {
	const [provider] = database
		.insert(awsProviders)
		.values({
			name: data.name,
			region: data.region,
			accountId: data.accountId,
			accessKeyId: encrypt(data.accessKeyId),
			secretAccessKey: encrypt(data.secretAccessKey),
		})
		.returning()
		.all();

	return provider;
}
