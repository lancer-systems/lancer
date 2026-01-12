import { expect, test } from "@playwright/test";

import { getGetProvidersResponseMock } from "../src/lib/api/endpoints/providers/providers.msw.ts";

test.describe("Providers Page", () => {
	test("should redirect to login when not authenticated", async ({ page }) => {
		await page.goto("/providers");

		// The API call will return 401, which triggers redirect to /login
		await expect(page).toHaveURL("/login");
	});

	test("should display page header and add provider button", async ({ page }) => {
		await page.route("**/api/providers/", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(getGetProvidersResponseMock({ providers: [] })),
			});
		});

		await page.goto("/providers");

		await expect(page.getByRole("heading", { name: "Cloud Providers" })).toBeVisible();
		await expect(page.getByText("Manage your connected cloud providers")).toBeVisible();
		await expect(page.getByRole("link", { name: "Add Provider" })).toBeVisible();
	});

	test("should display empty state when no providers", async ({ page }) => {
		await page.route("**/api/providers/", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(getGetProvidersResponseMock({ providers: [] })),
			});
		});

		await page.goto("/providers");

		await expect(page.getByText("No providers")).toBeVisible();
		await expect(
			page.getByText("Get started by connecting your first cloud provider"),
		).toBeVisible();
	});

	test("should display providers list", async ({ page }) => {
		const mockProvider = {
			id: "provider-1",
			name: "my-aws-provider",
			type: "aws" as const,
			region: "us-east-1",
			accountId: "123456789012",
			createdAt: "2024-01-01T00:00:00Z",
		};

		await page.route("**/api/providers/", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(getGetProvidersResponseMock({ providers: [mockProvider] })),
			});
		});

		await page.goto("/providers");

		await expect(page.getByText("my-aws-provider")).toBeVisible();
		await expect(page.getByText("AWS - us-east-1")).toBeVisible();
		await expect(page.getByText("Account: 123456789012")).toBeVisible();
	});

	test("should navigate to create provider page", async ({ page }) => {
		await page.route("**/api/providers/", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(getGetProvidersResponseMock({ providers: [] })),
			});
		});

		await page.goto("/providers");

		await page.getByRole("link", { name: "Add Provider" }).first().click();

		await expect(page).toHaveURL("/providers/create");
	});
});
