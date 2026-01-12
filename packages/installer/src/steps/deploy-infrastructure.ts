import { randomBytes } from "node:crypto";
import {
	type AwsCredentials,
	type CallerIdentity,
	deployLancer,
	type PreviewLancerResult,
	type PulumiBackend,
	previewLancer,
} from "@lancer/infrastructure";

import * as ui from "../lib/ui.ts";

function isPulumiNotInstalled(error: unknown): boolean {
	if (error instanceof Error) {
		return error.message.includes("ENOENT") && error.message.includes("pulumi");
	}
	return false;
}

function handlePulumiError(error: unknown): never {
	if (isPulumiNotInstalled(error)) {
		ui.error("Pulumi CLI is not installed.");
		console.log();
		console.log("  Install Pulumi:");
		console.log(`    ${ui.colors.cyan("curl -fsSL https://get.pulumi.com | sh")}`);
		console.log();
		console.log(`  More info: ${ui.colors.dim("https://www.pulumi.com/docs/install/")}`);
	} else {
		ui.error(error instanceof Error ? error.message : "Unknown error");
	}
	process.exit(1);
}

export interface DeployConfig {
	credentials: AwsCredentials;
	identity: CallerIdentity;
	backend: PulumiBackend;
}

export interface DeployResult {
	albDnsName: string;
	bootstrapToken: string;
}

function generateBootstrapToken(): string {
	return randomBytes(32).toString("hex");
}

export async function deployInfrastructure(config: DeployConfig): Promise<DeployResult> {
	const { credentials, identity, backend } = config;
	const bootstrapToken = generateBootstrapToken();

	const spinner = ui.spinner();
	spinner.start("Deploying infrastructure...");

	try {
		const result = await deployLancer({
			credentials,
			identity,
			bootstrapToken,
			backend,
			onProgress: (message) => {
				spinner.message(message);
			},
		});

		spinner.stop(ui.colors.success("Infrastructure deployed"));

		return {
			albDnsName: result.albDnsName,
			bootstrapToken,
		};
	} catch (error) {
		spinner.stop(ui.colors.error("Deployment failed"));
		handlePulumiError(error);
	}
}

export async function previewInfrastructure(config: DeployConfig): Promise<PreviewLancerResult> {
	const { credentials, identity, backend } = config;
	const bootstrapToken = generateBootstrapToken();

	const spinner = ui.spinner();
	spinner.start("Analyzing infrastructure changes...");

	try {
		const result = await previewLancer({
			credentials,
			identity,
			bootstrapToken,
			backend,
			onProgress: (message) => {
				spinner.message(message);
			},
		});

		spinner.stop(ui.colors.success("Analysis complete"));

		return result;
	} catch (error) {
		spinner.stop(ui.colors.error("Preview failed"));
		handlePulumiError(error);
	}
}
