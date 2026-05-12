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
  await page.goto("/launch/new");
  await expect(page.getByTestId("launch-wizard-shell")).toContainText(
    "Launch wizard"
  );
  await expect(page.getByTestId("token-preview-card")).toContainText(
    "Token card preview"
  );
});
