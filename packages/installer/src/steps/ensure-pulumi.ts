import { execSync, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import * as ui from "../lib/ui.ts";

function getPulumiPath(): string | null {
	// Check common installation paths
	const home = homedir();
	const pulumiPaths = [
		join(home, ".pulumi", "bin", "pulumi"),
		"/usr/local/bin/pulumi",
		"/opt/homebrew/bin/pulumi",
	];

	for (const path of pulumiPaths) {
		if (existsSync(path)) {
			return path;
		}
	}

	// Try to find in PATH
	try {
		execSync("which pulumi", { stdio: "ignore" });
		return "pulumi";
	} catch {
		return null;
	}
}

function isPulumiInstalled(): boolean {
	return getPulumiPath() !== null;
}

function ensurePulumiInPath(): void {
	const home = homedir();
	const pulumiBinDir = join(home, ".pulumi", "bin");

	if (!process.env.PATH?.includes(pulumiBinDir)) {
		process.env.PATH = `${pulumiBinDir}:${process.env.PATH}`;
	}
}

async function installPulumi(): Promise<void> {
	return new Promise((resolve, reject) => {
		// Use Pulumi's --silent flag to suppress output
		// Use --no-edit-path since we manage PATH ourselves
		// Redirect all output to /dev/null to prevent any terminal interference
		const child = spawn(
			"sh",
			[
				"-c",
				"curl -fsSL https://get.pulumi.com 2>/dev/null | sh -s -- --silent --no-edit-path >/dev/null 2>&1",
			],
			{ stdio: ["ignore", "ignore", "ignore"], detached: false },
		);

		child.on("close", (code) => {
			if (code === 0) {
				resolve();
			} else {
				reject(new Error(`Installation failed with code ${code}`));
			}
		});

		child.on("error", reject);
	});
}

export async function ensurePulumi(): Promise<void> {
	// Ensure ~/.pulumi/bin is in PATH (in case it was installed but not in current shell)
	ensurePulumiInPath();

	if (isPulumiInstalled()) {
		return;
	}

	ui.step("Pulumi CLI");
	ui.info("Pulumi CLI is required but not installed.");
	console.log();

	const shouldInstall = await ui.confirm("Install Pulumi CLI now?");

	if (!shouldInstall) {
		console.log();
		console.log("  Install manually:");
		console.log(`    ${ui.colors.cyan("curl -fsSL https://get.pulumi.com | sh")}`);
		console.log();
		process.exit(1);
	}

	const spinner = ui.spinner();
	spinner.start("Installing Pulumi CLI...");

	try {
		await installPulumi();

		// Ensure PATH is updated for current session
		ensurePulumiInPath();

		spinner.stop(ui.colors.success("Pulumi CLI installed"));
	} catch (error) {
		spinner.stop(ui.colors.error("Installation failed"));
		ui.error(error instanceof Error ? error.message : "Unknown error");
		process.exit(1);
	}

	console.log();
}
