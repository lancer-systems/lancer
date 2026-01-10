import { expect, test } from "@playwright/test";

test.describe("Create Provider Page", () => {
	test("should display create provider form", async ({ page }) => {
		await page.goto("/providers/create");

		await expect(page.getByRole("heading", { name: "Add Cloud Provider" })).toBeVisible();
		await expect(page.getByText("Connect your cloud provider")).toBeVisible();
	});

	test("should display all form fields", async ({ page }) => {
		await page.goto("/providers/create");

		await expect(page.getByLabel("Name")).toBeVisible();
		await expect(page.getByLabel("Provider Type")).toBeVisible();
		await expect(page.getByLabel("Region")).toBeVisible();
		await expect(page.getByLabel("Access Key ID")).toBeVisible();
		await expect(page.getByLabel("Secret Access Key")).toBeVisible();
	});

	test("should have disabled submit button", async ({ page }) => {
		await page.goto("/providers/create");

		const submitButton = page.getByRole("button", {
			name: "Create Provider (Coming Soon)",
		});
		await expect(submitButton).toBeDisabled();
	});

	test("should have back to dashboard link", async ({ page }) => {
		await page.goto("/providers/create");

		const backLink = page.getByRole("link", { name: "Back to Dashboard" });
		await expect(backLink).toBeVisible();

		await backLink.click();
		await expect(page).toHaveURL("/");
	});
});
