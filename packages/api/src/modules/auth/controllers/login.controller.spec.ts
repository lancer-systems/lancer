import { faker } from "@faker-js/faker";
import { afterEach, describe, expect, it, vi } from "vitest";

import { app } from "../../app.module.ts";
import * as userAdapter from "../adapters/user.adapter.ts";
import type { LoginResponse } from "../dtos/login.response.ts";
import { makeUser } from "../fixtures/user.fixture.ts";
import * as passwordService from "../services/password.service.ts";

vi.mock("../adapters/user.adapter.ts", () => ({
	findByEmail: vi.fn(),
	findById: vi.fn(),
	count: vi.fn(),
	create: vi.fn(),
}));

vi.mock("../services/password.service.ts", () => ({
	verifyPassword: vi.fn(),
	hashPassword: vi.fn(),
}));

describe("Login Controller", () => {
	afterEach(() => {
		vi.resetAllMocks();
	});

	describe("POST /api/auth/login", () => {
		it("should login successfully with valid credentials", async () => {
			const user = makeUser();

			vi.mocked(userAdapter.findByEmail).mockReturnValue(user);
			vi.mocked(passwordService.verifyPassword).mockResolvedValue(true);

			const response = await app.inject({
				method: "POST",
				url: "/api/auth/login",
				payload: { email: user.email, password: user.password },
			});

			const body = response.json<LoginResponse>();

			expect(response.statusCode).toBe(200);
			expect(body.id).toBe(user.id);
			expect(body.email).toBe(user.email);
			expect(body).toHaveProperty("createdAt");
			expect(body).not.toHaveProperty("password");
			expect(userAdapter.findByEmail).toHaveBeenCalledWith(user.email);
		});

		it("should set httpOnly cookie on successful login", async () => {
			const user = makeUser();

			vi.mocked(userAdapter.findByEmail).mockReturnValue(user);
			vi.mocked(passwordService.verifyPassword).mockResolvedValue(true);

			const response = await app.inject({
				method: "POST",
				url: "/api/auth/login",
				payload: { email: user.email, password: user.password },
			});

			const cookies = response.cookies;
			const authCookie = cookies.find((cookie) => cookie.name === "token");

			expect(authCookie).toBeDefined();
			expect(authCookie?.httpOnly).toBe(true);
			expect(authCookie?.sameSite).toBe("Strict");
		});

		it("should return 401 for non-existent user", async () => {
			vi.mocked(userAdapter.findByEmail).mockReturnValue(undefined);

			const response = await app.inject({
				method: "POST",
				url: "/api/auth/login",
				payload: {
					email: faker.internet.email(),
					password: faker.internet.password({ length: 12 }),
				},
			});

			expect(response.statusCode).toBe(401);
			expect(response.json().message).toBe("Invalid email or password");
		});

		it("should return 401 for wrong password", async () => {
			const user = makeUser();

			vi.mocked(userAdapter.findByEmail).mockReturnValue(user);
			vi.mocked(passwordService.verifyPassword).mockResolvedValue(false);

			const response = await app.inject({
				method: "POST",
				url: "/api/auth/login",
				payload: {
					email: user.email,
					password: "wrong-password-123",
				},
			});

			expect(response.statusCode).toBe(401);
			expect(response.json().message).toBe("Invalid email or password");
		});

		it("should return 400 for invalid email format", async () => {
			const response = await app.inject({
				method: "POST",
				url: "/api/auth/login",
				payload: {
					email: "not-an-email",
					password: faker.internet.password({ length: 12 }),
				},
			});

			expect(response.statusCode).toBe(400);
		});

		it("should return 400 for missing password", async () => {
			const response = await app.inject({
				method: "POST",
				url: "/api/auth/login",
				payload: {
					email: faker.internet.email(),
				},
			});

			expect(response.statusCode).toBe(400);
		});
	});
});
