export const awsRegions = [
	{ code: "us-east-1", name: "N. Virginia" },
	{ code: "eu-west-1", name: "Ireland" },
	{ code: "ap-northeast-1", name: "Tokyo" },
] as const;

export type AwsRegion = (typeof awsRegions)[number]["code"];
