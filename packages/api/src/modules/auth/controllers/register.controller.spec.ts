import { faker } from "@faker-js/faker";
import { describe, expect, it } from "vitest";

import { app } from "../../app.module.ts";
import { makeUser } from "../../database/fixtures/user.fixture.ts";
import type { LoginResponse } from "../dtos/login.response.ts";

describe("Register Controller", () => {
	describe("POST /auth/register", () => {
		it("should register a new user", async () => {
			const user = makeUser();

			const response = await app.inject({
				method: "POST",
				url: "/auth/register",
				payload: { email: user.email, password: user.password },
			});

			const body = response.json<LoginResponse>();

			expect(response.statusCode).toBe(201);
			expect(body).toHaveProperty("id");
			expect(body.email).toBe(user.email);
			expect(body).toHaveProperty("createdAt");
			expect(body).not.toHaveProperty("password");
		});

		it("should return 400 for invalid email", async () => {
			const res = await app.inject({
				method: "POST",
				url: "/auth/register",
				payload: {
					email: "invalid",
					password: faker.internet.password({ length: 12 }),
				},
			});

			expect(res.statusCode).toBe(400);
		});

		it("should return 400 for short password", async () => {
			const res = await app.inject({
				method: "POST",
				url: "/auth/register",
				payload: {
					email: faker.internet.email(),
					password: faker.internet.password({ length: 4 }),
				},
			});

			expect(res.statusCode).toBe(400);
		});

		it("should return 409 for duplicate email", async () => {
			const user = makeUser();

			await app.inject({
				method: "POST",
				url: "/auth/register",
				payload: { email: user.email, password: user.password },
			});

			const response = await app.inject({
				method: "POST",
				url: "/auth/register",
				payload: { email: user.email, password: user.password },
			});

			expect(response.statusCode).toBe(409);
		});
	});
});
