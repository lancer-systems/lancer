import * as awsProviderAdapter from "../adapters/aws-provider.adapter.ts";
import type { AwsProvider } from "../entities/aws-provider.entity.ts";
import { encrypt } from "./crypto.service.ts";

interface CreateProviderRequest {
	name: string;
	region: string;
	accountId: string;
	accessKeyId: string;
	secretAccessKey: string;
}

export function create(request: CreateProviderRequest): AwsProvider {
	return awsProviderAdapter.create({
		name: request.name,
		region: request.region,
		accountId: request.accountId,
		accessKeyId: encrypt(request.accessKeyId),
		secretAccessKey: encrypt(request.secretAccessKey),
	});
}
