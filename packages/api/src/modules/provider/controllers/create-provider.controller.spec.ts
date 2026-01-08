import { faker } from "@faker-js/faker";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { app } from "../../app.module.ts";
import * as jwtService from "../../auth/services/jwt.service.ts";
import { seedUser } from "../../database/seeders/user.seeder.ts";
import type { AwsProviderResponse } from "../dtos/provider.response.ts";
import * as awsService from "../services/aws.service.ts";

vi.mock("../services/aws.service.ts", () => ({
	validateCredentials: vi.fn(),
}));

describe("Create Provider Controller", () => {
	describe("POST /providers", () => {
		let token: string;

		beforeEach(async () => {
			const user = await seedUser();
			token = await jwtService.signToken({ sub: user.id, email: user.email });
		});

		afterEach(() => {
			vi.mocked(awsService.validateCredentials).mockReset();
		});

		it("should create an AWS provider with valid credentials", async () => {
			const mockAccountId = "123456789012";

			vi.mocked(awsService.validateCredentials).mockResolvedValue(mockAccountId);

			const providerName = `test-provider-${faker.string.alphanumeric(8).toLowerCase()}`;

			const response = await app.inject({
				method: "POST",
				url: "/providers",
				headers: { cookie: `token=${token}` },
				payload: {
					name: providerName,
					type: "aws",
					region: "us-east-1",
					accessKeyId: "AKIAIOSFODNN7EXAMPLE",
					secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
				},
			});

			const body = response.json<AwsProviderResponse>();

			expect(response.statusCode).toBe(201);
			expect(body.id).toBeDefined();
			expect(body.name).toBe(providerName);
			expect(body.type).toBe("aws");
			expect(body.region).toBe("us-east-1");
			expect(body.accountId).toBe(mockAccountId);
			expect(body.createdAt).toBeDefined();
		});

		it("should return 401 without authentication", async () => {
			const response = await app.inject({
				method: "POST",
				url: "/providers",
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
			const mockAccountId = "123456789012";

			vi.mocked(awsService.validateCredentials).mockResolvedValue(mockAccountId);

			const providerName = `dup-provider-${faker.string.alphanumeric(8).toLowerCase()}`;

			await app.inject({
				method: "POST",
				url: "/providers",
				headers: { cookie: `token=${token}` },
				payload: {
					name: providerName,
					type: "aws",
					region: "us-east-1",
					accessKeyId: "AKIAIOSFODNN7EXAMPLE",
					secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
				},
			});

			const response = await app.inject({
				method: "POST",
				url: "/providers",
				headers: { cookie: `token=${token}` },
				payload: {
					name: providerName,
					type: "aws",
					region: "eu-west-1",
					accessKeyId: "AKIAIOSFODNN7EXAMPLE",
					secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
				},
			});

			expect(response.statusCode).toBe(409);
			expect(response.json().message).toBe(`Provider "${providerName}" already exists`);
		});

		it("should return 400 for invalid AWS credentials", async () => {
			vi.mocked(awsService.validateCredentials).mockResolvedValue(null);

			const response = await app.inject({
				method: "POST",
				url: "/providers",
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
				url: "/providers",
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
				url: "/providers",
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
