import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { fromIni } from "@aws-sdk/credential-providers";

export interface AwsProfile {
	name: string;
	region?: string;
}

export interface AwsProfileCredentials {
	accessKeyId: string;
	secretAccessKey: string;
	sessionToken?: string;
}

/**
 * Parse an INI-style file to extract section names
 */
function parseIniSections(filePath: string): Map<string, Record<string, string>> {
	const sections = new Map<string, Record<string, string>>();

	if (!existsSync(filePath)) {
		return sections;
	}

	try {
		const content = readFileSync(filePath, "utf-8");
		let currentSection = "";

		for (const line of content.split("\n")) {
			const trimmed = line.trim();

			// Skip empty lines and comments
			if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith(";")) {
				continue;
			}

			// Section header
			const sectionMatch = trimmed.match(/^\[(.+)\]$/);
			if (sectionMatch) {
				currentSection = sectionMatch[1];
				// In config file, profiles are prefixed with "profile " except default
				if (currentSection.startsWith("profile ")) {
					currentSection = currentSection.slice(8);
				}
				sections.set(currentSection, {});
				continue;
			}

			// Key = value
			const keyValueMatch = trimmed.match(/^([^=]+)=(.*)$/);
			if (keyValueMatch && currentSection) {
				const section = sections.get(currentSection);
				if (section) {
					section[keyValueMatch[1].trim()] = keyValueMatch[2].trim();
				}
			}
		}
	} catch {
		// Ignore read errors
	}

	return sections;
}

/**
 * Get available AWS profiles from ~/.aws/credentials and ~/.aws/config
 */
export function getAwsProfiles(): AwsProfile[] {
	const awsDir = join(homedir(), ".aws");
	const credentialsPath = join(awsDir, "credentials");
	const configPath = join(awsDir, "config");

	const profiles = new Map<string, AwsProfile>();

	// Read credentials file - profiles with actual credentials
	const credentialsSections = parseIniSections(credentialsPath);
	for (const name of credentialsSections.keys()) {
		profiles.set(name, { name });
	}

	// Read config file for regions
	const configSections = parseIniSections(configPath);
	for (const [name, values] of configSections.entries()) {
		const existing = profiles.get(name);
		if (existing) {
			existing.region = values.region;
		}
		// Don't add profiles that only exist in config (no credentials)
	}

	return Array.from(profiles.values());
}

/**
 * Check if AWS CLI is configured with at least one profile
 */
export function hasAwsProfiles(): boolean {
	return getAwsProfiles().length > 0;
}

/**
 * Get credentials for a specific profile using AWS SDK
 */
export async function getProfileCredentials(profileName: string): Promise<AwsProfileCredentials> {
	const credentialProvider = fromIni({ profile: profileName });
	const credentials = await credentialProvider();

	return {
		accessKeyId: credentials.accessKeyId,
		secretAccessKey: credentials.secretAccessKey,
		sessionToken: credentials.sessionToken,
	};
}
