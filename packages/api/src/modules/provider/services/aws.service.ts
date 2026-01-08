import { GetCallerIdentityCommand, STSClient } from "@aws-sdk/client-sts";

export async function validateCredentials(
	accessKeyId: string,
	secretAccessKey: string,
	region: string,
): Promise<string | null> {
	try {
		const client = new STSClient({
			region,
			credentials: { accessKeyId, secretAccessKey },
		});

		const response = await client.send(new GetCallerIdentityCommand({}));

		return response.Account ?? null;
	} catch {
		return null;
	}
}
