import * as awsProviderAdapter from "../adapters/aws-provider.adapter.ts";

export type ProviderType = "aws";

export function findByName(type: ProviderType, name: string) {
	switch (type) {
		case "aws":
			return awsProviderAdapter.findByName(name);
		default:
			return null;
	}
}
