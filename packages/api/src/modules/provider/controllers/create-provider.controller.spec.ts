import { faker } from "@faker-js/faker";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { app } from "../../app.module.ts";
import { makeUser } from "../../auth/fixtures/user.fixture.ts";
import * as jwtService from "../../auth/services/jwt.service.ts";
import * as awsProviderAdapter from "../adapters/aws-provider.adapter.ts";
import type { AwsProviderResponse } from "../dtos/provider.response.ts";
import { makeAwsProvider } from "../fixtures/aws-provider.fixture.ts";
import * as awsService from "../services/aws.service.ts";

vi.mock("../services/aws.service.ts", () => ({
	validateCredentials: vi.fn(),
}));

vi.mock("../adapters/aws-provider.adapter.ts", () => ({
	findByName: vi.fn(),
	create: vi.fn(),
}));

describe("Create Provider Controller", () => {
	describe("POST /api/providers", () => {
		let token: string;

		beforeEach(async () => {
			const user = makeUser();

			token = await jwtService.signToken({ sub: user.id, email: user.email });
		});

		afterEach(() => {
			vi.resetAllMocks();
		});

		it("should create an AWS provider with valid credentials", async () => {
			const provider = makeAwsProvider();

			vi.mocked(awsService.validateCredentials).mockResolvedValue(provider.accountId);
			vi.mocked(awsProviderAdapter.findByName).mockReturnValue(undefined);
			vi.mocked(awsProviderAdapter.create).mockReturnValue(provider);

			const response = await app.inject({
				method: "POST",
				url: "/api/providers",
				headers: { cookie: `token=${token}` },
				payload: {
					name: provider.name,
					type: "aws",
					region: provider.region,
					accessKeyId: "AKIAIOSFODNN7EXAMPLE",
					secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
				},
			});

			const body = response.json<AwsProviderResponse>();

			expect(response.statusCode).toBe(201);
			expect(body.id).toBe(provider.id);
			expect(body.name).toBe(provider.name);
			expect(body.type).toBe("aws");
			expect(body.region).toBe(provider.region);
			expect(body.accountId).toBe(provider.accountId);
			expect(body.createdAt).toBeDefined();
		});

		it("should return 401 without authentication", async () => {
			const response = await app.inject({
				method: "POST",
				url: "/api/providers",
				payload: {
					name: "my-provider",
					type: "aws",
					region: "us-east-1",
					accessKeyId: "AKIAIOSFODNN7EXAMPLE",
					secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
				},
			});

			expect(response.statusCode).toBe(401);
			expect(response.json().message).toBe("Authentication required");
		});

		it("should return 409 for duplicate provider name", async () => {
			const existingProvider = makeAwsProvider();

			vi.mocked(awsProviderAdapter.findByName).mockReturnValue(existingProvider);

			const response = await app.inject({
				method: "POST",
				url: "/api/providers",
				headers: { cookie: `token=${token}` },
				payload: {
					name: existingProvider.name,
					type: "aws",
					region: "us-east-1",
					accessKeyId: "AKIAIOSFODNN7EXAMPLE",
					secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
				},
			});

			expect(response.statusCode).toBe(409);
			expect(response.json().message).toBe(`Provider "${existingProvider.name}" already exists`);
		});

		it("should return 400 for invalid AWS credentials", async () => {
			vi.mocked(awsService.validateCredentials).mockResolvedValue(null);
			vi.mocked(awsProviderAdapter.findByName).mockReturnValue(undefined);

			const response = await app.inject({
				method: "POST",
				url: "/api/providers",
				headers: { cookie: `token=${token}` },
				payload: {
					name: `bad-creds-${faker.string.alphanumeric(8).toLowerCase()}`,
					type: "aws",
					region: "us-east-1",
					accessKeyId: "AKIAIOSFODNN7EXAMPLE",
					secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
				},
			});

			expect(response.statusCode).toBe(400);
			expect(response.json().message).toBe("Invalid AWS credentials");
		});

		it("should return 400 for invalid name format", async () => {
			const response = await app.inject({
				method: "POST",
				url: "/api/providers",
				headers: { cookie: `token=${token}` },
				payload: {
					name: "Invalid Name With Spaces",
					type: "aws",
					region: "us-east-1",
					accessKeyId: "AKIAIOSFODNN7EXAMPLE",
					secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
				},
			});

			expect(response.statusCode).toBe(400);
		});

		it("should return 400 for invalid region", async () => {
			const response = await app.inject({
				method: "POST",
				url: "/api/providers",
				headers: { cookie: `token=${token}` },
				payload: {
					name: `region-test-${faker.string.alphanumeric(8).toLowerCase()}`,
					type: "aws",
					region: "invalid-region",
					accessKeyId: "AKIAIOSFODNN7EXAMPLE",
					secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
				},
			});

			expect(response.statusCode).toBe(400);
		});
	});
});
