import type { awsProviders } from "../schemas/aws-providers.schema.ts";

export type ProviderType = "aws";

export type AwsProvider = typeof awsProviders.$inferSelect;
