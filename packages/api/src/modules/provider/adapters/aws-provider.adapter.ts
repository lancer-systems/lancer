import { eq } from "drizzle-orm";

import { database } from "../../database/database.service.ts";
import { awsProviders } from "../../database/schemas/aws-providers.schema.ts";
import { type AwsProvider, toAwsProvider } from "../entities/aws-provider.entity.ts";
import type { EncryptedData } from "../services/crypto.service.ts";

interface CreateProviderRequest {
	name: string;
	region: string;
	accountId: string;
	accessKeyId: EncryptedData;
	secretAccessKey: EncryptedData;
}

export function findByName(name: string): AwsProvider | undefined {
	const provider = database.select().from(awsProviders).where(eq(awsProviders.name, name)).get();

	if (!provider) {
		return undefined;
	}

	return toAwsProvider(provider);
}

export function findAll(): AwsProvider[] {
	const providers = database.select().from(awsProviders).all();

	return providers.map((provider) => toAwsProvider(provider));
}

export function create(request: CreateProviderRequest): AwsProvider {
	const [provider] = database.insert(awsProviders).values(request).returning().all();

	return toAwsProvider(provider);
}
