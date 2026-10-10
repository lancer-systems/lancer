import { describe, expect, it } from "vitest";

import { generateStaticBuildspec } from "./buildspec-static.ts";

describe("generateStaticBuildspec", () => {
	it("generates valid buildspec YAML", () => {
		const config = {
			bucketName: "lancer-my-site-123456789012",
			distributionId: "E1234567890ABC",
			buildCommand: "npm run build",
			outputDir: "dist",
		};

		const buildspec = generateStaticBuildspec(config);

		expect(buildspec).toContain("version: 0.2");
		expect(buildspec).toContain('S3_BUCKET: "lancer-my-site-123456789012"');
		expect(buildspec).toContain('DISTRIBUTION_ID: "E1234567890ABC"');
		expect(buildspec).toContain('OUTPUT_DIR: "dist"');
	});

	it("includes npm ci install step", () => {
		const config = {
			bucketName: "my-bucket",
			distributionId: "DIST123",
			buildCommand: "npm run build",
			outputDir: "dist",
		};

		const buildspec = generateStaticBuildspec(config);

		expect(buildspec).toContain("npm ci || npm install");
	});

	it("includes custom build command", () => {
		const config = {
			bucketName: "my-bucket",
			distributionId: "DIST123",
			buildCommand: "yarn build:prod",
			outputDir: "build",
		};

		const buildspec = generateStaticBuildspec(config);

		expect(buildspec).toContain("yarn build:prod");
	});

	it("syncs to S3 with correct cache headers", () => {
		const config = {
			bucketName: "my-bucket",
			distributionId: "DIST123",
			buildCommand: "npm run build",
			outputDir: "dist",
		};

		const buildspec = generateStaticBuildspec(config);

		expect(buildspec).toContain("aws s3 sync");
		expect(buildspec).toContain("--delete");
		expect(buildspec).toContain("max-age=31536000");
		expect(buildspec).toContain("must-revalidate");
	});

	it("invalidates CloudFront cache", () => {
		const config = {
			bucketName: "my-bucket",
			distributionId: "DIST123",
			buildCommand: "npm run build",
			outputDir: "dist",
		};

		const buildspec = generateStaticBuildspec(config);

		expect(buildspec).toContain("aws cloudfront create-invalidation");
		expect(buildspec).toContain("--distribution-id $DISTRIBUTION_ID");
		expect(buildspec).toContain('--paths "/*"');
	});

	it("caches node_modules", () => {
		const config = {
			bucketName: "my-bucket",
			distributionId: "DIST123",
			buildCommand: "npm run build",
			outputDir: "dist",
		};

		const buildspec = generateStaticBuildspec(config);

		expect(buildspec).toContain("cache:");
		expect(buildspec).toContain("node_modules/**/*");
	});
});
