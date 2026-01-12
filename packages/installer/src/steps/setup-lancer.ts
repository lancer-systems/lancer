import type { AwsCredentials, CallerIdentity } from "@lancer/infrastructure";

import * as ui from "../lib/ui.ts";
import type { AdminUser } from "./collect-admin-user.ts";

export interface SetupConfig {
	albDnsName: string;
	bootstrapToken: string;
	adminUser: AdminUser;
	credentials: AwsCredentials;
	identity: CallerIdentity;
}

export async function setupLancer(config: SetupConfig): Promise<void> {
	const { albDnsName, bootstrapToken, adminUser, credentials } = config;

	const spinner = ui.spinner();
	spinner.start("Waiting for health check...");

	const baseUrl = `http://${albDnsName}`;

	// Wait for the API to be healthy
	const maxAttempts = 60;
	let healthy = false;

	for (let i = 0; i < maxAttempts; i++) {
		try {
			const response = await fetch(`${baseUrl}/api/health`, {
				signal: AbortSignal.timeout(5000),
			});
			if (response.ok) {
				healthy = true;
				break;
			}
		} catch {
			// API not ready yet
		}
		await new Promise((resolve) => setTimeout(resolve, 5000));
	}

	if (!healthy) {
		spinner.stop(ui.colors.error("Health check failed"));
		ui.error("API did not become healthy within 5 minutes");
		process.exit(1);
	}

	spinner.message("Configuring admin account...");

	try {
		const response = await fetch(`${baseUrl}/api/bootstrap`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${bootstrapToken}`,
			},
			body: JSON.stringify({
				admin: {
					email: adminUser.email,
					password: adminUser.password,
				},
				provider: {
					name: "AWS",
					accessKeyId: credentials.accessKeyId,
					secretAccessKey: credentials.secretAccessKey,
					region: credentials.region,
				},
			}),
		});

		if (!response.ok) {
			const body = (await response.json().catch(() => ({ message: "Unknown error" }))) as {
				message?: string;
			};
			throw new Error(body.message || `HTTP ${response.status}`);
		}

		spinner.stop(ui.colors.success("Lancer configured successfully"));
	} catch (error) {
		spinner.stop(ui.colors.error("Configuration failed"));
		ui.error(error instanceof Error ? error.message : "Unknown error");
		process.exit(1);
	}
}
