import { expect, test } from "@playwright/test";
import { hash } from "bcryptjs";
import { prisma } from "../packages/db/src/index";

const password = "MemeFoundry!123";

function safeProjectName(projectName: string) {
  return projectName.replace(/[^a-z0-9]/gi, "-").toLowerCase();
}

test.afterAll(async () => {
  await prisma.$disconnect();
});

test("player creates a crew, features a launch, and runs crew support", async ({
  page
}, testInfo) => {
  const isMobile = testInfo.project.name.includes("mobile");
  const suffix = `${safeProjectName(testInfo.project.name)}-${Date.now()}`;
  const passwordHash = await hash(password, 10);
  const season =
    (await prisma.season.findFirst({
      where: { status: "active" },
      orderBy: { startsAt: "desc" }
    })) ??
    (await prisma.season.create({
      data: {
        name: `E2E Crew Season ${testInfo.project.name}`,
        slug: `e2e-crew-season-${safeProjectName(testInfo.project.name)}`,
        status: "active",
        startsAt: new Date(Date.now() - 60_000),
        endsAt: new Date(Date.now() + 86_400_000),
        narratives: {
          create: Array.from({ length: 8 }, (_, index) => ({
            name: `E2E Crew Narrative ${index + 1}`,
            slug: `e2e-crew-narrative-${index + 1}`,
            heat: 50 + index
          }))
        }
      }
    }));
  const owner = await prisma.user.upsert({
    where: {
      email: `crew-owner-${safeProjectName(testInfo.project.name)}@example.com`
    },
    update: {
      passwordHash,
      status: "active",
      username: `crew_owner_${safeProjectName(testInfo.project.name).replaceAll("-", "_")}`
    },
    create: {
      email: `crew-owner-${safeProjectName(testInfo.project.name)}@example.com`,
      passwordHash,
      username: `crew_owner_${safeProjectName(testInfo.project.name).replaceAll("-", "_")}`,
      status: "active"
    }
  });
  const founder = await prisma.user.upsert({
    where: {
      email: `crew-founder-${safeProjectName(testInfo.project.name)}@example.com`
    },
    update: {
      passwordHash,
      status: "active",
      username: `crew_founder_${safeProjectName(testInfo.project.name).replaceAll("-", "_")}`
    },
    create: {
      email: `crew-founder-${safeProjectName(testInfo.project.name)}@example.com`,
      passwordHash,
      username: `crew_founder_${safeProjectName(testInfo.project.name).replaceAll("-", "_")}`,
      status: "active"
    }
  });
  const token = await prisma.launchToken.create({
    data: {
      userId: founder.id,
      seasonId: season.id,
      name: `Crew E2E Target ${suffix}`,
      ticker: `CE${Date.now().toString().slice(-6)}`,
      description: "A live launch for crew E2E support.",
      narrative: "Crew E2E",
      narrativeSlug: "crew-e2e",
      status: "live",
      simulatedMarketCap: 900_000,
      simulatedHolders: 30,
      hype: 25,
      trust: 55,
      communityStrength: 20,
      score: 900_000,
      launchedAt: new Date()
    }
  });
  const crewName = `Browser Crew ${suffix}`;
  const crewSlug = crewName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  await page.goto("/signin");
  await page
    .getByLabel("Username or email")
    .fill(`crew-owner-${safeProjectName(testInfo.project.name)}@example.com`);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/");

  await page.goto("/crews");
  await expect(page.getByTestId("crews-page")).toContainText("Create a crew");
  await page.getByLabel("Crew name").fill(crewName);
  await page
    .getByLabel("Tagline")
    .fill("Coordinated support for browser-tested launches.");
  await page
    .getByLabel("Description")
    .fill("Created by the Stage 11 browser flow.");
  await page.getByRole("button", { name: "Create crew" }).click();

  await expect(page).toHaveURL(new RegExp(`/crews/${crewSlug}`));
  await expect(page.getByTestId("crew-detail-page")).toContainText(crewName);
  await expect(page.getByTestId("crew-member-list")).toContainText(
    owner.username
  );

  await page
    .getByTestId("feature-token-form")
    .getByLabel("Feature live launch")
    .selectOption(token.id);
  await page.mouse.wheel(0, -240);
  const featureButton = page
    .getByTestId("feature-token-form")
    .getByRole("button", { name: "Feature launch" });
  if (isMobile) {
    await featureButton.click({ force: true });
  } else {
    await featureButton.click();
  }
  await expect(page.getByTestId("crew-notice")).toContainText(
    "Featured launch updated"
  );
  await expect(page.getByTestId("featured-launch-panel")).toContainText(
    token.name
  );

  await page.getByTestId("crew-action-SIGNAL_BOOST").scrollIntoViewIfNeeded();
  await page.mouse.wheel(0, -240);
  const crewSupportButton = page
    .getByTestId("crew-action-SIGNAL_BOOST")
    .getByRole("button", { name: "Crew support" });
  if (isMobile) {
    await crewSupportButton.click({ force: true });
  } else {
    await crewSupportButton.click();
  }
  await expect(page.getByTestId("crew-notice")).toContainText(
    "Signal Boost landed"
  );
  await expect(page.getByTestId("crew-event-feed")).toContainText(
    "Signal Boost"
  );
  await expect(page.getByTestId("crew-action-SIGNAL_BOOST")).toContainText(
    "cooldown"
  );
});
