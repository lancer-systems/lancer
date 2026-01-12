import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { app } from "../../app.module.ts";
import { makeUser } from "../../auth/fixtures/user.fixture.ts";
import * as jwtService from "../../auth/services/jwt.service.ts";
import * as awsProviderAdapter from "../adapters/aws-provider.adapter.ts";
import type { GetProvidersResponse } from "../dtos/get-providers.response.ts";
import { makeAwsProvider } from "../fixtures/aws-provider.fixture.ts";

vi.mock("../adapters/aws-provider.adapter.ts", () => ({
	findAll: vi.fn(),
	findByName: vi.fn(),
	create: vi.fn(),
}));

describe("Get Providers Controller", () => {
	describe("GET /api/providers", () => {
		let token: string;

		beforeEach(async () => {
			const user = makeUser();

			token = await jwtService.signToken({ sub: user.id, email: user.email });
		});

		afterEach(() => {
			vi.resetAllMocks();
		});

		it("should return empty list when no providers exist", async () => {
			vi.mocked(awsProviderAdapter.findAll).mockReturnValue([]);

			const response = await app.inject({
				method: "GET",
				url: "/api/providers",
				headers: { cookie: `token=${token}` },
			});

			const body = response.json<GetProvidersResponse>();

			expect(response.statusCode).toBe(200);
			expect(body.providers).toEqual([]);
		});

		it("should return list of providers", async () => {
			const provider1 = makeAwsProvider();
			const provider2 = makeAwsProvider();

			vi.mocked(awsProviderAdapter.findAll).mockReturnValue([provider1, provider2]);

			const response = await app.inject({
				method: "GET",
				url: "/api/providers",
				headers: { cookie: `token=${token}` },
			});

			const body = response.json<GetProvidersResponse>();

			expect(response.statusCode).toBe(200);
			expect(body.providers).toHaveLength(2);
			expect(body.providers[0].id).toBe(provider1.id);
			expect(body.providers[0].type).toBe("aws");
			expect(body.providers[0].name).toBe(provider1.name);
			expect(body.providers[0].region).toBe(provider1.region);
			expect(body.providers[0].accountId).toBe(provider1.accountId);
			expect(body.providers[1].id).toBe(provider2.id);
		});

		it("should not expose sensitive credentials in response", async () => {
			const provider = makeAwsProvider();
			vi.mocked(awsProviderAdapter.findAll).mockReturnValue([provider]);

			const response = await app.inject({
				method: "GET",
				url: "/api/providers",
				headers: { cookie: `token=${token}` },
			});

			const body = response.json<GetProvidersResponse>();
			const returnedProvider = body.providers[0];

			expect(returnedProvider).not.toHaveProperty("accessKeyId");
			expect(returnedProvider).not.toHaveProperty("secretAccessKey");
		});

		it("should return 401 without authentication", async () => {
			const response = await app.inject({
				method: "GET",
				url: "/api/providers",
			});

			expect(response.statusCode).toBe(401);
			expect(response.json().message).toBe("Authentication required");
		});

		it("should return 401 with invalid token", async () => {
			const response = await app.inject({
				method: "GET",
				url: "/api/providers",
				headers: { cookie: "token=invalid-token" },
			});

			expect(response.statusCode).toBe(401);
			expect(response.json().message).toBe("Invalid or expired token");
		});
	});
});
