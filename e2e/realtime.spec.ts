import { expect, test } from "@playwright/test";
import { prisma } from "../packages/db/src/index";
import {
  closeRealtimePublisher,
  publishRealtimeEvent
} from "../packages/realtime/src/index";

function visibleManageLink(page: import("@playwright/test").Page) {
  return page.locator('[data-testid="manage-launch-affordance"]:visible');
}

test("manage dashboard receives token ticks without refreshing", async ({
  page
}) => {
  await page.goto("/signin");
  await page.getByLabel("Username or email").fill("founder@example.com");
  await page.getByLabel("Password").fill("MemeFoundry!123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/");

  await page.goto("/play");
  await visibleManageLink(page).click();
  await expect(page.getByTestId("realtime-status-panel")).toContainText(
    "Live updates connected",
    { timeout: 10_000 }
  );

  const tokenId = new URL(page.url()).pathname.split("/")[2];
  const token = await prisma.launchToken.findUniqueOrThrow({
    where: { id: tokenId }
  });

  try {
    await publishRealtimeEvent({
      type: "TOKEN_TICK",
      tokenId,
      seasonId: token.seasonId,
      price: token.simulatedPrice,
      marketCap: token.simulatedMarketCap + 777,
      volume: token.simulatedVolume,
      holders: token.simulatedHolders,
      hype: token.hype,
      trust: token.trust,
      createdAt: new Date().toISOString()
    });

    await expect(page.getByTestId("realtime-message-feed")).toContainText(
      "Live tick received",
      { timeout: 10_000 }
    );
  } finally {
    await closeRealtimePublisher();
  }
});
