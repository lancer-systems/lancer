import { describe, expect, it } from "vitest";

import { app } from "~/modules/app.module";

import type { HealthResponse } from "../dtos/health.response";

describe("Health Controller", () => {
	describe("GET /health", () => {
		it("should return healthy status", async () => {
			const response = await app.inject({
				method: "GET",
				url: "/health",
			});

			const body = response.json<HealthResponse>();

			expect(response.statusCode).toBe(200);
			expect(body.status).toBe("healthy");
			expect(body.database).toBe("connected");
		});
	});
});
