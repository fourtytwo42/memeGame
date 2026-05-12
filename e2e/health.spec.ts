import { expect, test } from "@playwright/test";

test("health page renders", async ({ page }) => {
  await page.goto("/health");
  await expect(page.getByTestId("health-status")).toHaveText("ok");
});

test("home command hub renders", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Meme Foundry" })
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Take recommended action" })
  ).toBeVisible();
});
