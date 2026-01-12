import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { app } from "../../app.module.ts";
import * as usersAdapter from "../../auth/adapters/user.adapter.ts";
import { makeUser } from "../../auth/fixtures/user.fixture.ts";
import { makeAwsProvider } from "../../provider/fixtures/aws-provider.fixture.ts";
import * as awsService from "../../provider/services/aws.service.ts";
import * as awsProviderService from "../../provider/services/aws-provider.service.ts";
import { makeBootstrapRequest } from "../fixtures/bootstrap-request.fixture.ts";
import { makeBootstrapToken } from "../fixtures/bootstrap-token.fixture.ts";

vi.mock("../../provider/services/aws.service.ts", () => ({
	validateCredentials: vi.fn(),
}));

vi.mock("../../auth/adapters/user.adapter.ts", () => ({
	count: vi.fn(),
	create: vi.fn(),
	findByEmail: vi.fn(),
	findById: vi.fn(),
}));

vi.mock("../../provider/services/aws-provider.service.ts", () => ({
	create: vi.fn(),
	findByName: vi.fn(),
}));

describe("Bootstrap Controller", () => {
	const bootstrapToken = makeBootstrapToken();

	beforeEach(() => {
		process.env.LANCER_BOOTSTRAP_TOKEN = bootstrapToken;

		vi.mocked(awsService.validateCredentials).mockResolvedValue("123456789012");
		vi.mocked(usersAdapter.count).mockReturnValue(0);
	});

	afterEach(() => {
		delete process.env.LANCER_BOOTSTRAP_TOKEN;
		vi.resetAllMocks();
	});

	describe("POST /api/bootstrap", () => {
		it("should return 401 without Authorization header", async () => {
			const response = await app.inject({
				method: "POST",
				url: "/api/bootstrap",
				payload: makeBootstrapRequest(),
			});

			expect(response.statusCode).toBe(401);
		});

		it("should return 401 with invalid token", async () => {
			const response = await app.inject({
				method: "POST",
				url: "/api/bootstrap",
				headers: { Authorization: "Bearer wrong-token" },
				payload: makeBootstrapRequest(),
			});

			expect(response.statusCode).toBe(401);
		});

		it("should return 404 if users already exist", async () => {
			vi.mocked(usersAdapter.count).mockReturnValue(1);

			const response = await app.inject({
				method: "POST",
				url: "/api/bootstrap",
				headers: { Authorization: `Bearer ${bootstrapToken}` },
				payload: makeBootstrapRequest(),
			});

			expect(response.statusCode).toBe(404);
		});

		it("should return 400 for invalid AWS credentials", async () => {
			vi.mocked(awsService.validateCredentials).mockResolvedValue(null);

			const response = await app.inject({
				method: "POST",
				url: "/api/bootstrap",
				headers: { Authorization: `Bearer ${bootstrapToken}` },
				payload: makeBootstrapRequest(),
			});

			expect(response.statusCode).toBe(400);
			expect(response.json().message).toBe("Invalid AWS credentials");
		});

		it("should create admin user and provider with valid token", async () => {
			const payload = makeBootstrapRequest();
			const user = makeUser({ email: payload.admin.email });
			const provider = makeAwsProvider({ name: payload.provider.name });

			vi.mocked(usersAdapter.create).mockResolvedValue(user);
			vi.mocked(awsProviderService.create).mockReturnValue(provider);

			const response = await app.inject({
				method: "POST",
				url: "/api/bootstrap",
				headers: { Authorization: `Bearer ${bootstrapToken}` },
				payload,
			});

			expect(response.statusCode).toBe(201);

			const body = response.json();
			expect(body.user).toHaveProperty("id");
			expect(body.user.email).toBe(payload.admin.email);
			expect(body.provider).toHaveProperty("id");
			expect(body.provider.name).toBe(payload.provider.name);
		});

		it("should return 400 for invalid email format", async () => {
			const payload = makeBootstrapRequest();
			payload.admin.email = "not-an-email";

			const response = await app.inject({
				method: "POST",
				url: "/api/bootstrap",
				headers: { Authorization: `Bearer ${bootstrapToken}` },
				payload,
			});

			expect(response.statusCode).toBe(400);
		});

		it("should return 400 for short password", async () => {
			const payload = makeBootstrapRequest();
			payload.admin.password = "short";

			const response = await app.inject({
				method: "POST",
				url: "/api/bootstrap",
				headers: { Authorization: `Bearer ${bootstrapToken}` },
				payload,
			});

			expect(response.statusCode).toBe(400);
		});
	});
});
