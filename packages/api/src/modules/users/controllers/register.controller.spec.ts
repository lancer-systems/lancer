import { faker } from "@faker-js/faker";
import { describe, expect, it } from "vitest";

import { app } from "~/modules/app.module";
import { makeUser } from "~/modules/database/fixtures/user.fixture";
import type { RegisterResponse } from "../dtos/register.response";

describe("Register Controller", () => {
	describe("POST /users/register", () => {
		const user = makeUser();

		it("should register a new user", async () => {
			const response = await app.inject({
				method: "POST",
				url: "/users/register",
				payload: { email: user.email, password: user.password },
			});

			const body = response.json<RegisterResponse>();

			expect(response.statusCode).toBe(201);
			expect(body).toHaveProperty("id");
			expect(body.email).toBe(user.email);
			expect(body).toHaveProperty("createdAt");
			expect(body).not.toHaveProperty("password");
		});

		it("should return 400 for invalid email", async () => {
			const res = await app.inject({
				method: "POST",
				url: "/users/register",
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
				url: "/users/register",
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
				url: "/users/register",
				payload: { email: user.email, password: user.password },
			});

			const response = await app.inject({
				method: "POST",
				url: "/users/register",
				payload: { email: user.email, password: user.password },
			});

			expect(response.statusCode).toBe(409);
		});
	});
});
