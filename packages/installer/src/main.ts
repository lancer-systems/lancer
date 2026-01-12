import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { defineCommand, runMain } from "citty";

import * as ui from "./lib/ui.ts";
import { collectAdminUser } from "./steps/collect-admin-user.ts";
import { collectAwsCredentials } from "./steps/collect-aws-credentials.ts";
import { deployInfrastructure, previewInfrastructure } from "./steps/deploy-infrastructure.ts";
import { ensurePulumi } from "./steps/ensure-pulumi.ts";
import { ensureStateBucket } from "./steps/ensure-state-bucket.ts";
import { setupLancer } from "./steps/setup-lancer.ts";

const main = defineCommand({
	meta: {
		name: "lancer-installer",
		description: "Install Lancer on AWS",
	},
	args: {
		"dry-run": {
			type: "boolean",
			description: "Preview changes without deploying",
			default: false,
		},
	},
	async run({ args }) {
		const dryRun = args["dry-run"];

		ui.intro("Lancer Installer");

		// Ensure Pulumi CLI is installed
		await ensurePulumi();

		// Step 1: Collect AWS credentials
		const { credentials, identity } = await collectAwsCredentials();

		// Step 2: Collect admin user info
		const adminUser = await collectAdminUser();

		// Show cost estimate
		console.log();
		ui.step("Estimated Monthly Cost");
		console.log();
		console.log("  Foundation (shared infrastructure):");
		console.log(
			`    ${ui.colors.dim("VPC, ALB, ECS Cluster")}         ${ui.colors.cyan("~$16/month")}`,
		);
		console.log();
		console.log("  Lancer API:");
		console.log(
			`    ${ui.colors.dim("t3.micro EC2 instance")}         ${ui.colors.cyan("~$9/month")}`,
		);
		console.log();
		console.log(
			`  ${ui.colors.bold("Total:")}                           ${ui.colors.cyan("~$25/month")}`,
		);
		console.log();

		if (dryRun) {
			ui.info("Dry-run mode: no resources will be created.");
		}

		// Confirm
		const confirmMessage = dryRun ? "Run Pulumi preview?" : "Proceed with deployment?";
		const shouldProceed = await ui.confirm(confirmMessage);

		if (!shouldProceed) {
			ui.outro("Installation cancelled.");
			process.exit(0);
		}

		console.log();

		if (dryRun) {
			// Dry-run: use temporary local backend (no S3 bucket created)
			const tempDir = mkdtempSync(join(tmpdir(), "lancer-preview-"));

			try {
				const result = await previewInfrastructure({
					credentials,
					identity,
					backend: { type: "local", path: tempDir },
				});

				console.log();
				ui.step("Infrastructure Preview");
				console.log();

				const { foundation, api } = result.summary;
				const totalCreate = foundation.create + api.create;
				const totalUpdate = foundation.update + api.update;
				const totalDelete = foundation.delete + api.delete;

				// Foundation breakdown
				console.log(
					`  ${ui.colors.bold("Foundation")} ${ui.colors.dim("(VPC, ALB, ECS Cluster)")}`,
				);
				if (foundation.create > 0) {
					console.log(`    ${ui.colors.green("+")} ${foundation.create} resources to create`);
				}
				if (foundation.update > 0) {
					console.log(`    ${ui.colors.yellow("~")} ${foundation.update} resources to update`);
				}
				if (foundation.delete > 0) {
					console.log(`    ${ui.colors.red("-")} ${foundation.delete} resources to delete`);
				}
				if (foundation.same > 0) {
					console.log(`    ${ui.colors.dim("=")} ${foundation.same} resources unchanged`);
				}
				console.log();

				// API breakdown
				console.log(
					`  ${ui.colors.bold("Lancer API")} ${ui.colors.dim("(ECS Service, ECR, CodeBuild)")}`,
				);
				if (api.create > 0) {
					console.log(`    ${ui.colors.green("+")} ${api.create} resources to create`);
				}
				if (api.update > 0) {
					console.log(`    ${ui.colors.yellow("~")} ${api.update} resources to update`);
				}
				if (api.delete > 0) {
					console.log(`    ${ui.colors.red("-")} ${api.delete} resources to delete`);
				}
				if (api.same > 0) {
					console.log(`    ${ui.colors.dim("=")} ${api.same} resources unchanged`);
				}
				console.log();

				// Total
				const changes: string[] = [];
				if (totalCreate > 0) {
					changes.push(ui.colors.green(`+${totalCreate}`));
				}
				if (totalUpdate > 0) {
					changes.push(ui.colors.yellow(`~${totalUpdate}`));
				}
				if (totalDelete > 0) {
					changes.push(ui.colors.red(`-${totalDelete}`));
				}

				if (changes.length > 0) {
					console.log(`  ${ui.colors.bold("Total:")} ${changes.join(", ")} resources`);
				} else {
					console.log(`  ${ui.colors.dim("No changes detected")}`);
				}
				console.log();
			} finally {
				// Cleanup temp directory
				rmSync(tempDir, { recursive: true, force: true });
			}

			ui.outro("No changes were made (dry-run)");
			return;
		}

		// Normal mode: create S3 bucket for state storage
		const stateBucket = await ensureStateBucket({
			credentials,
			accountId: identity.accountId,
		});

		// Deploy infrastructure
		const { albDnsName, bootstrapToken } = await deployInfrastructure({
			credentials,
			identity,
			backend: { type: "s3", bucket: stateBucket, region: credentials.region },
		});

		// Setup Lancer (create admin + provider)
		await setupLancer({
			albDnsName,
			bootstrapToken,
			adminUser,
			credentials,
			identity,
		});

		// Success!
		console.log();
		ui.success("Lancer is ready!");
		console.log();
		console.log(`  URL: ${ui.colors.cyan(`http://${albDnsName}`)}`);
		console.log(`  Admin: ${ui.colors.cyan(adminUser.email)}`);
		console.log();

		ui.outro("Happy deploying!");
	},
});

runMain(main).catch((error) => {
	ui.error(error instanceof Error ? error.message : "Unknown error");
	process.exit(1);
});
