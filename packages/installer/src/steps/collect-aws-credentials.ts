import {
	type AwsCredentials,
	type CallerIdentity,
	validateAwsCredentials,
} from "@lancer/infrastructure";
import { awsRegions } from "@lancer/shared/constants";

import { getAwsProfiles, getProfileCredentials, hasAwsProfiles } from "../lib/aws-profiles.ts";
import { checkAwsPermissions } from "../lib/check-permissions.ts";
import * as ui from "../lib/ui.ts";

export interface AwsCredentialsResult {
	credentials: AwsCredentials;
	identity: CallerIdentity;
}

async function collectCredentialsManually(): Promise<AwsCredentials> {
	const accessKeyId = await ui.text({
		message: "AWS Access Key ID",
		placeholder: "AKIA...",
		validate: (value) => {
			if (!value.startsWith("AKIA") || value.length !== 20) {
				return "Invalid Access Key ID format";
			}
			return undefined;
		},
	});

	const secretAccessKey = await ui.password({
		message: "AWS Secret Access Key",
		validate: (value) => {
			if (value.length < 40) {
				return "Invalid Secret Access Key format";
			}
			return undefined;
		},
	});

	const region = await ui.select({
		message: "AWS Region",
		options: awsRegions.map((r) => ({
			value: r.code,
			label: `${r.code} (${r.name})`,
		})),
	});

	return { accessKeyId, secretAccessKey, region };
}

async function collectCredentialsFromProfile(): Promise<AwsCredentials | null> {
	const profiles = getAwsProfiles();

	const options = [
		...profiles.map((p) => ({
			value: p.name,
			label: p.region ? `${p.name} (${p.region})` : p.name,
		})),
		{ value: "__manual__", label: "Enter credentials manually" },
	];

	const selectedProfile = await ui.select({
		message: "Select AWS profile",
		options,
	});

	if (selectedProfile === "__manual__") {
		return null;
	}

	const spinner = ui.spinner();
	spinner.start("Loading credentials...");

	try {
		const creds = await getProfileCredentials(selectedProfile);
		spinner.stop(ui.colors.success("Credentials loaded"));

		// Get profile region or ask for it
		const profile = profiles.find((p) => p.name === selectedProfile);
		let region = profile?.region;

		if (!region) {
			region = await ui.select({
				message: "AWS Region",
				options: awsRegions.map((r) => ({
					value: r.code,
					label: `${r.code} (${r.name})`,
				})),
			});
		}

		return {
			accessKeyId: creds.accessKeyId,
			secretAccessKey: creds.secretAccessKey,
			region,
		};
	} catch (error) {
		spinner.stop(ui.colors.error("Failed to load credentials"));
		ui.error(error instanceof Error ? error.message : "Unknown error");
		return null;
	}
}

async function validateAndCheckPermissions(
	credentials: AwsCredentials,
): Promise<{ identity: CallerIdentity } | null> {
	const spinner = ui.spinner();
	spinner.start("Validating AWS credentials...");

	try {
		const identity = await validateAwsCredentials(credentials);
		spinner.stop(ui.colors.success("AWS credentials valid"));

		// Check IAM permissions
		spinner.start("Checking IAM permissions...");
		const permissionCheck = await checkAwsPermissions(credentials, identity.arn);

		if (!permissionCheck.success) {
			spinner.stop(ui.colors.error("Insufficient permissions"));
			console.log();
			console.log("  Missing permissions:");
			for (const action of permissionCheck.missingPermissions) {
				console.log(`    ${ui.colors.red("✗")} ${action}`);
			}
			console.log();
			console.log("  Ensure your IAM user/role has the required permissions.");
			console.log();
			return null;
		}

		if (permissionCheck.skipped) {
			spinner.stop(ui.colors.dim("IAM permissions check skipped (no iam:SimulatePrincipalPolicy)"));
		} else {
			spinner.stop(ui.colors.success("IAM permissions verified"));
		}

		console.log(`  Authenticated as ${ui.colors.cyan(identity.arn)}`);
		return { identity };
	} catch {
		spinner.stop(ui.colors.error("Invalid AWS credentials. Please try again."));
		console.log();
		return null;
	}
}

export async function collectAwsCredentials(): Promise<AwsCredentialsResult> {
	while (true) {
		ui.step("AWS Configuration");

		let credentials: AwsCredentials | null = null;

		// Check if AWS CLI profiles are available
		if (hasAwsProfiles()) {
			credentials = await collectCredentialsFromProfile();
		}

		// If no profile selected or no profiles available, collect manually
		if (!credentials) {
			credentials = await collectCredentialsManually();
		}

		const result = await validateAndCheckPermissions(credentials);
		if (result) {
			return { credentials, identity: result.identity };
		}
	}
}
