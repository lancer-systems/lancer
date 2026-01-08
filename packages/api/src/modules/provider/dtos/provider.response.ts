export interface AwsProviderResponse {
	id: string;
	name: string;
	type: "aws";
	region: string;
	accountId: string;
	createdAt: Date;
}
