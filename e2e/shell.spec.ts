import { expect, test } from "@playwright/test";

test("shell exposes icon-only help", async ({ page }) => {
  await page.goto("/");
  const notifications = page.getByTestId("icon-help-button").first();
  await expect(notifications).toHaveAccessibleName("Notifications");
  await notifications.hover();
  await expect(page.getByTestId("icon-help-tooltip")).toContainText(
    "urgent launch events"
  );
});

test("launch wizard shell exposes preview and stable controls", async ({
  page
}) => {
  await page.goto("/signin");
  await page.getByLabel("Username or email").fill("founder@example.com");
  await page.getByLabel("Password").fill("MemeFoundry!123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/");

  await page.goto("/launch/new");
  await expect(page.getByTestId("launch-wizard-form")).toContainText(
    "Name the fake token"
  );
  await expect(page.getByTestId("live-token-preview")).toContainText(
    "Live token card preview"
  );
});

test("play command hub follows reference composition", async ({ page }) => {
  await page.goto("/signin");
  await page.getByLabel("Username or email").fill("founder@example.com");
  await page.getByLabel("Password").fill("MemeFoundry!123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/");

  await page.goto("/play");
  await expect(page.getByTestId("play-command-hub")).toContainText(
    "Recommended"
  );
  await expect(page.getByTestId("narrative-heat-panel")).toContainText(
    "Narrative heat"
  );
  await expect(page.getByTestId("leaderboard-preview-panel")).toContainText(
    "Leaderboard"
  );
  await expect(page.getByTestId("crew-status-panel")).toContainText(
    "Crew status"
  );
});

test("season and leaderboard pages expose shared world state", async ({
  page
}) => {
  await page.goto("/signin");
  await page.getByLabel("Username or email").fill("founder@example.com");
  await page.getByLabel("Password").fill("MemeFoundry!123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/");

  await page.goto("/seasons");
  await expect(page.getByTestId("narrative-heat-map")).toContainText("Hot");
  await expect(page.getByTestId("season-event-feed")).toContainText(
    "Public season feed"
  );

  await page.goto("/leaderboard");
  await expect(page.getByTestId("leaderboard-tabs")).toContainText(
    "Market cap"
  );
  await expect(page.getByTestId("leaderboard-results")).toContainText("$");

  await page.goto("/leaderboard?tab=holders");
  await expect(page.getByTestId("leaderboard-tabs")).toContainText("Holders");
  await expect(page.getByTestId("leaderboard-results")).toBeVisible();
});
