import type { ProviderType } from "../../database/entities/provider.entity.ts";
import * as awsProviderService from "./aws-provider.service.ts";

export function findByName(type: ProviderType, name: string) {
	switch (type) {
		case "aws":
			return awsProviderService.findByName(name);
		default:
			return null;
	}
}
