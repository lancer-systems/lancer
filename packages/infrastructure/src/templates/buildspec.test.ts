import { describe, expect, it } from "vitest";

import { generateBuildspec, generateDockerfile } from "./buildspec.ts";

describe("generateBuildspec", () => {
	it("generates valid buildspec YAML", () => {
		const config = {
			serviceName: "my-api",
			region: "us-east-1",
			accountId: "123456789012",
			ecrRepositoryUrl: "123456789012.dkr.ecr.us-east-1.amazonaws.com/lancer-my-api",
			clusterName: "lancer-cluster",
		};

		const buildspec = generateBuildspec(config);

		expect(buildspec).toContain("version: 0.2");
		expect(buildspec).toContain('AWS_DEFAULT_REGION: "us-east-1"');
		expect(buildspec).toContain('AWS_ACCOUNT_ID: "123456789012"');
		expect(buildspec).toContain('SERVICE_NAME: "my-api"');
		expect(buildspec).toContain('CLUSTER_NAME: "lancer-cluster"');
		expect(buildspec).toContain("docker build");
		expect(buildspec).toContain("docker push");
		expect(buildspec).toContain("aws ecs update-service");
	});

	it("includes build command when provided", () => {
		const config = {
			serviceName: "my-api",
			region: "us-east-1",
			accountId: "123456789012",
			ecrRepositoryUrl: "123456789012.dkr.ecr.us-east-1.amazonaws.com/lancer-my-api",
			clusterName: "lancer-cluster",
			buildCommand: "npm run build",
		};

		const buildspec = generateBuildspec(config);

		expect(buildspec).toContain("npm run build");
		expect(buildspec).toContain("Running build command");
	});

	it("uses custom Dockerfile path when provided", () => {
		const config = {
			serviceName: "my-api",
			region: "us-east-1",
			accountId: "123456789012",
			ecrRepositoryUrl: "123456789012.dkr.ecr.us-east-1.amazonaws.com/lancer-my-api",
			clusterName: "lancer-cluster",
			dockerfilePath: "docker/Dockerfile.prod",
		};

		const buildspec = generateBuildspec(config);

		expect(buildspec).toContain("-f docker/Dockerfile.prod");
	});

	it("defaults to Dockerfile when no path provided", () => {
		const config = {
			serviceName: "my-api",
			region: "us-east-1",
			accountId: "123456789012",
			ecrRepositoryUrl: "123456789012.dkr.ecr.us-east-1.amazonaws.com/lancer-my-api",
			clusterName: "lancer-cluster",
		};

		const buildspec = generateBuildspec(config);

		expect(buildspec).toContain("-f Dockerfile");
	});
});

describe("generateDockerfile", () => {
	it("generates valid Dockerfile", () => {
		const dockerfile = generateDockerfile("npm start", 3000);

		expect(dockerfile).toContain("FROM node:20-alpine");
		expect(dockerfile).toContain("WORKDIR /app");
		expect(dockerfile).toContain("COPY package*.json ./");
		expect(dockerfile).toContain("RUN npm ci --only=production");
		expect(dockerfile).toContain("EXPOSE 3000");
		expect(dockerfile).toContain('CMD ["npm","start"]');
	});

	it("handles complex start commands", () => {
		const dockerfile = generateDockerfile("node dist/server.js --port 8080", 8080);

		expect(dockerfile).toContain("EXPOSE 8080");
		expect(dockerfile).toContain('CMD ["node","dist/server.js","--port","8080"]');
	});

	it("handles different ports", () => {
		const dockerfile = generateDockerfile("npm start", 8000);

		expect(dockerfile).toContain("EXPOSE 8000");
	});
});
