import { expect, test } from "@playwright/test";
import { hash } from "bcryptjs";
import { prisma } from "../packages/db/src/index";

const password = "MemeFoundry!123";

function rookieEmail(projectName: string) {
  return `rookie-${projectName.replace(/[^a-z0-9]/gi, "-").toLowerCase()}@example.com`;
}

test.beforeEach(async ({}, testInfo) => {
  const email = rookieEmail(testInfo.project.name);
  const passwordHash = await hash(password, 12);
  const rookie = await prisma.user.upsert({
    where: { email },
    update: {
      name: `Rookie ${testInfo.project.name}`,
      passwordHash,
      role: "user",
      status: "active",
      username: `rookie_${testInfo.project.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}`
    },
    create: {
      email,
      name: `Rookie ${testInfo.project.name}`,
      passwordHash,
      username: `rookie_${testInfo.project.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}`
    }
  });
  await prisma.launchToken.deleteMany({ where: { userId: rookie.id } });
  await prisma.founderProfile.deleteMany({ where: { userId: rookie.id } });
});

test.afterAll(async () => {
  await prisma.$disconnect();
});

test("first-time player creates founder profile and launches token", async ({
  page
}, testInfo) => {
  test.setTimeout(90000);
  const email = rookieEmail(testInfo.project.name);
  const ticker = `RK${Date.now().toString().slice(-6)}`;

  await page.goto("/signin");
  await page.getByLabel("Username or email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/");

  await page.goto("/play");
  await expect(page.getByTestId("recommended-action-card")).toContainText(
    "Create founder profile"
  );
  await page.getByRole("link", { name: "Create founder profile" }).click();
  await expect(page.getByTestId("founder-profile-form")).toBeVisible();
  await page.getByLabel("Founder display name").fill("Rookie Founder");
  await page
    .getByLabel("Founder bio")
    .fill("Learning the launch loop through clear choices.");
  await page.getByRole("button", { name: "Save founder profile" }).click();

  await expect(page.getByTestId("launch-wizard-form")).toBeVisible();
  await page.getByLabel("Token name").fill("Rookie Reactor");
  await page.getByLabel("Ticker").fill(ticker);
  await page
    .getByLabel("Description")
    .fill("A fictional launch for learning the first Meme Foundry loop.");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByTestId("wizard-narrative-step")).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByTestId("wizard-mascot-step")).toBeVisible();
  await page
    .getByLabel("Mascot concept")
    .fill("a rookie reactor mascot with a bright helmet");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByTestId("wizard-strategy-step")).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByTestId("wizard-review-step")).toBeVisible();
  await expect(page.getByTestId("live-token-preview")).toContainText(
    "Rookie Reactor"
  );
  await expect(page.getByTestId("wizard-review-step")).toContainText(
    "no real trading"
  );
  await page.getByTestId("launch-submit-button").click({ noWaitAfter: true });

  await expect(page).toHaveURL(/\/launch\/.+\/manage\?launched=1/, {
    timeout: 60000
  });
  await expect(page.getByTestId("manage-token-header")).toContainText(
    "Manage Rookie Reactor"
  );
  await expect(page.getByTestId("action-panel")).toContainText("Post Meme");

  for (const actionId of [
    "POST_MEME",
    "COMMISSION_ART",
    "OPEN_COMMUNITY_CHAT"
  ]) {
    await page
      .getByTestId(`action-card-${actionId}-panel`)
      .getByRole("button", { name: "Take action" })
      .click();
    await expect(page).toHaveURL(new RegExp(`action=${actionId}`));
  }
  await expect(page.getByTestId("recent-action-feed")).toContainText(
    "Open Community Chat"
  );

  const token = await prisma.launchToken.findFirst({
    where: { ticker, user: { email } },
    include: { actions: true, ticks: true, events: true }
  });
  expect(token?.status).toBe("live");
  expect(token?.placeholderImageUrl).toBe(
    "/assets/game/tokens/default-token-mascot.png"
  );
  expect(token?.energy).toBeLessThan(100);
  expect(token?.actions.length).toBeGreaterThanOrEqual(3);
  expect(token?.ticks.length).toBeGreaterThanOrEqual(3);
  expect(token?.events.some((event) => event.type === "player_action")).toBe(
    true
  );
});
