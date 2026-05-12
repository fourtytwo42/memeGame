import { expect, test } from "@playwright/test";

test("anonymous users are redirected from protected play", async ({ page }) => {
  await page.goto("/play");
  await expect(page).toHaveURL(/\/signin/);
});

test("seeded founder can sign in and sign out", async ({ page }) => {
  await page.goto("/signin");
  await page.getByLabel("Username or email").fill("founder@example.com");
  await page.getByLabel("Password").fill("MemeFoundry!123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();

  await page.goto("/api/me");
  await expect(page.locator("body")).toContainText('"username":"founder"');

  await page.goto("/");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
});

test("seeded admin can access admin page", async ({ page }) => {
  await page.goto("/signin");
  await page.getByLabel("Username or email").fill("spiderman.1983@gmail.com");
  await page.getByLabel("Password").fill("MemeFoundry!123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/");

  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "Admin control room" })
  ).toBeVisible();
  await expect(page.getByTestId("admin-counts")).toContainText("Users");
});
