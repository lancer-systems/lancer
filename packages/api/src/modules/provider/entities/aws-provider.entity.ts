import type { AwsRegion } from "@lancer/shared/constants";

import type { awsProviders } from "../../database/schemas/aws-providers.schema.ts";

type DatabaseAwsProvider = typeof awsProviders.$inferSelect;

export interface AwsProvider {
	id: string;
	createdAt: Date;
	name: string;
	region: AwsRegion;
	accountId: string;
}

export function toAwsProvider(provider: DatabaseAwsProvider): AwsProvider {
	return {
		id: provider.id,
		createdAt: provider.createdAt,
		name: provider.name,
		region: provider.region as AwsRegion,
		accountId: provider.accountId,
	};
}
