import { expect, test } from "@playwright/test";

test.describe("Login Page", () => {
	test("should display login form", async ({ page }) => {
		await page.goto("/login");

		await expect(page.getByRole("heading", { name: "Lancer" })).toBeVisible();
		await expect(page.getByText("Sign in to your account")).toBeVisible();
		await expect(page.getByLabel("Email")).toBeVisible();
		await expect(page.getByLabel("Password")).toBeVisible();
		await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
	});

	test("should show validation errors for empty form", async ({ page }) => {
		await page.goto("/login");

		await page.getByRole("button", { name: "Sign in" }).click();

		await expect(page.getByText("Invalid email address")).toBeVisible();
		await expect(page.getByText("Password is required")).toBeVisible();
	});

	test("should show validation error for invalid email", async ({ page }) => {
		await page.goto("/login");

		await page.getByLabel("Email").fill("invalid-email");
		await page.getByLabel("Password").fill("password123");
		await page.getByRole("button", { name: "Sign in" }).click();

		await expect(page.getByText("Invalid email address")).toBeVisible();
	});
});
