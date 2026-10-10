import { describe, expect, it } from "vitest";

import {
	cacheTags,
	createTags,
	databaseTags,
	foundationTags,
	mergeTags,
	staticSiteTags,
	toAwsTags,
	webServiceTags,
} from "./tags.ts";

describe("createTags", () => {
	it("creates basic lancer tags", () => {
		const tags = createTags("test-service", "web");

		expect(tags["lancer:managed"]).toBe("true");
		expect(tags["lancer:service"]).toBe("test-service");
		expect(tags["lancer:type"]).toBe("web");
		expect(tags["lancer:version"]).toBeDefined();
		expect(tags["lancer:created-at"]).toBeDefined();
	});

	it("creates valid ISO timestamp", () => {
		const tags = createTags("api", "web");
		const timestamp = tags["lancer:created-at"];

		// Should be a valid ISO 8601 date
		expect(() => new Date(timestamp)).not.toThrow();
		expect(new Date(timestamp).toISOString()).toBe(timestamp);
	});
});

describe("foundationTags", () => {
	it("creates foundation type tags", () => {
		const tags = foundationTags();

		expect(tags["lancer:service"]).toBe("foundation");
		expect(tags["lancer:type"]).toBe("foundation");
	});
});

describe("webServiceTags", () => {
	it("creates web type tags", () => {
		const tags = webServiceTags("api");

		expect(tags["lancer:service"]).toBe("api");
		expect(tags["lancer:type"]).toBe("web");
	});
});

describe("staticSiteTags", () => {
	it("creates static type tags", () => {
		const tags = staticSiteTags("frontend");

		expect(tags["lancer:service"]).toBe("frontend");
		expect(tags["lancer:type"]).toBe("static");
	});
});

describe("databaseTags", () => {
	it("creates database type tags", () => {
		const tags = databaseTags("mydb");

		expect(tags["lancer:service"]).toBe("mydb");
		expect(tags["lancer:type"]).toBe("database");
	});
});

describe("cacheTags", () => {
	it("creates cache type tags", () => {
		const tags = cacheTags("redis");

		expect(tags["lancer:service"]).toBe("redis");
		expect(tags["lancer:type"]).toBe("cache");
	});
});

describe("toAwsTags", () => {
	it("converts tags to AWS key-value format", () => {
		const tags = foundationTags();
		const awsTags = toAwsTags(tags);

		expect(Array.isArray(awsTags)).toBe(true);
		expect(awsTags.length).toBeGreaterThan(0);

		// Check that each tag has key and value properties
		for (const tag of awsTags) {
			expect(tag).toHaveProperty("key");
			expect(tag).toHaveProperty("value");
		}

		// Check specific tags
		const managedTag = awsTags.find((t) => t.key === "lancer:managed");
		expect(managedTag).toBeDefined();
		expect(managedTag?.value).toBe("true");
	});
});

describe("mergeTags", () => {
	it("merges lancer tags with additional tags", () => {
		const lancerTags = foundationTags();
		const additionalTags = {
			Name: "my-resource",
			Environment: "production",
		};

		const merged = mergeTags(lancerTags, additionalTags);

		// Should have all lancer tags
		expect(merged["lancer:managed"]).toBe("true");
		expect(merged["lancer:service"]).toBe("foundation");

		// Should have additional tags
		expect(merged.Name).toBe("my-resource");
		expect(merged.Environment).toBe("production");
	});

	it("additional tags override lancer tags if same key", () => {
		const lancerTags = foundationTags();
		const additionalTags = {
			"lancer:service": "overridden",
		};

		const merged = mergeTags(lancerTags, additionalTags);

		// Should be overridden
		expect(merged["lancer:service"]).toBe("overridden");
	});
});
