import { GetCallerIdentityCommand, STSClient } from "@aws-sdk/client-sts";

export interface AwsCredentials {
	accessKeyId: string;
	secretAccessKey: string;
	region: string;
}

export interface CallerIdentity {
	accountId: string;
	arn: string;
	userId: string;
}

export async function validateAwsCredentials(credentials: AwsCredentials): Promise<CallerIdentity> {
	const client = new STSClient({
		region: credentials.region,
		credentials: {
			accessKeyId: credentials.accessKeyId,
			secretAccessKey: credentials.secretAccessKey,
		},
	});

	const command = new GetCallerIdentityCommand({});
	const response = await client.send(command);

	if (!response.Account || !response.Arn || !response.UserId) {
		throw new Error("Failed to get caller identity");
	}

	return {
		accountId: response.Account,
		arn: response.Arn,
		userId: response.UserId,
	};
}
