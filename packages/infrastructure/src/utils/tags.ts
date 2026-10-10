import type { LancerTags } from "../types/index.ts";

// CLI version - should be updated on release
const CLI_VERSION = "0.1.0";

// Create Lancer tags for a resource
export function createTags(serviceName: string, type: LancerTags["lancer:type"]): LancerTags {
	return {
		"lancer:managed": "true",
		"lancer:service": serviceName,
		"lancer:type": type,
		"lancer:version": CLI_VERSION,
		"lancer:created-at": new Date().toISOString(),
	};
}

// Create foundation tags
export function foundationTags(): LancerTags {
	return createTags("foundation", "foundation");
}

// Create web service tags
export function webServiceTags(serviceName: string): LancerTags {
	return createTags(serviceName, "web");
}

// Create static site tags
export function staticSiteTags(serviceName: string): LancerTags {
	return createTags(serviceName, "static");
}

// Create database tags
export function databaseTags(serviceName: string): LancerTags {
	return createTags(serviceName, "database");
}

// Create cache tags
export function cacheTags(serviceName: string): LancerTags {
	return createTags(serviceName, "cache");
}

// Generic service tags (alias for createTags)
export function serviceTags(serviceName: string, type: LancerTags["lancer:type"]): LancerTags {
	return createTags(serviceName, type);
}

// Convert tags to AWS format (key-value pairs for some resources)
export function toAwsTags(tags: LancerTags): { key: string; value: string }[] {
	return Object.entries(tags).map(([key, value]) => ({
		key,
		value,
	}));
}

// Merge Lancer tags with additional tags
export function mergeTags(
	lancerTags: LancerTags,
	additionalTags: Record<string, string>,
): Record<string, string> {
	return {
		...lancerTags,
		...additionalTags,
	};
}
