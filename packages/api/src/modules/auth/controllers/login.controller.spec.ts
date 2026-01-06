import { faker } from "@faker-js/faker";
import { describe, expect, it } from "vitest";

import { app } from "~/modules/app.module";
import { seedUser } from "~/modules/database/seeders/user.seeder";

import type { LoginResponse } from "../dtos/login.response";

describe("Login Controller", () => {
	describe("POST /auth/login", () => {
		it("should login successfully with valid credentials", async () => {
			const user = await seedUser();

			const response = await app.inject({
				method: "POST",
				url: "/auth/login",
				payload: { email: user.email, password: user.password },
			});

			const body = response.json<LoginResponse>();

			expect(response.statusCode).toBe(200);
			expect(body.id).toBe(user.id);
			expect(body.email).toBe(user.email);
			expect(body).toHaveProperty("createdAt");
			expect(body).not.toHaveProperty("password");
		});

		it("should set httpOnly cookie on successful login", async () => {
			const user = await seedUser();

			const response = await app.inject({
				method: "POST",
				url: "/auth/login",
				payload: { email: user.email, password: user.password },
			});

			const cookies = response.cookies;
			const authCookie = cookies.find((cookie) => cookie.name === "token");

			expect(authCookie).toBeDefined();
			expect(authCookie?.httpOnly).toBe(true);
			expect(authCookie?.sameSite).toBe("Strict");
		});

		it("should return 401 for non-existent user", async () => {
			const response = await app.inject({
				method: "POST",
				url: "/auth/login",
				payload: {
					email: faker.internet.email(),
					password: faker.internet.password({ length: 12 }),
				},
			});

			expect(response.statusCode).toBe(401);
			expect(response.json().message).toBe("Invalid email or password");
		});

		it("should return 401 for wrong password", async () => {
			const user = await seedUser();

			const response = await app.inject({
				method: "POST",
				url: "/auth/login",
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
				url: "/auth/login",
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
				url: "/auth/login",
				payload: {
					email: faker.internet.email(),
				},
			});

			expect(response.statusCode).toBe(400);
		});
	});
});
