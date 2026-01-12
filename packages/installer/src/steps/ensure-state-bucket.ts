import {
	CreateBucketCommand,
	HeadBucketCommand,
	PutBucketVersioningCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import type { AwsCredentials } from "@lancer/infrastructure";

import * as ui from "../lib/ui.ts";

export function getStateBucketName(accountId: string): string {
	return `lancer-state-${accountId}`;
}

export interface EnsureStateBucketOptions {
	credentials: AwsCredentials;
	accountId: string;
}

export async function ensureStateBucket(options: EnsureStateBucketOptions): Promise<string> {
	const { credentials, accountId } = options;
	const bucketName = getStateBucketName(accountId);

	const client = new S3Client({
		region: credentials.region,
		credentials: {
			accessKeyId: credentials.accessKeyId,
			secretAccessKey: credentials.secretAccessKey,
		},
	});

	const spinner = ui.spinner();
	spinner.start("Setting up state bucket...");

	// Check if bucket exists
	try {
		await client.send(new HeadBucketCommand({ Bucket: bucketName }));
		spinner.stop(ui.colors.success("State bucket ready"));
		return bucketName;
	} catch (error) {
		// Bucket doesn't exist, create it
		if (!(error instanceof Error) || error.name !== "NotFound") {
			// If it's not a NotFound error, rethrow
			if (error instanceof Error && error.name !== "NotFound") {
				spinner.stop(ui.colors.error("Failed to check state bucket"));
				throw error;
			}
		}
	}

	// Create bucket
	try {
		await client.send(
			new CreateBucketCommand({
				Bucket: bucketName,
				// LocationConstraint required for non-us-east-1 regions
				...(credentials.region !== "us-east-1" && {
					CreateBucketConfiguration: {
						LocationConstraint: credentials.region,
					},
				}),
			}),
		);

		// Enable versioning
		await client.send(
			new PutBucketVersioningCommand({
				Bucket: bucketName,
				VersioningConfiguration: { Status: "Enabled" },
			}),
		);

		spinner.stop(ui.colors.success("State bucket created"));
		return bucketName;
	} catch (error) {
		spinner.stop(ui.colors.error("Failed to create state bucket"));
		throw error;
	}
}
