import { faker } from "@faker-js/faker";
import type { AwsRegion } from "@lancer/shared/constants";
import { nanoid } from "nanoid";

import type { AwsProvider } from "../entities/aws-provider.entity.ts";

export function makeAwsProvider(overrides?: Partial<AwsProvider>): AwsProvider {
	return {
		id: nanoid(),
		createdAt: faker.date.past(),
		name: `provider-${faker.string.alphanumeric(8).toLowerCase()}`,
		region: faker.helpers.arrayElement<AwsRegion>(["us-east-1", "eu-west-1", "ap-northeast-1"]),
		accountId: faker.string.numeric(12),
		...overrides,
	};
}
