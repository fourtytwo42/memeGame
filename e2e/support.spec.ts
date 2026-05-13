import { expect, test } from "@playwright/test";
import { prisma } from "../packages/db/src/index";

test("supporter can support another public token and sees cooldown", async ({
  page
}, testInfo) => {
  const actionId =
    testInfo.project.name === "mobile-chrome" ? "MAKE_MEME" : "SHARE_LAUNCH";
  const actionLabel = actionId === "MAKE_MEME" ? "Make Meme" : "Signal Boost";
  const supporter = await prisma.user.findUniqueOrThrow({
    where: { email: "supporter@example.com" }
  });
  const token = await prisma.launchToken.findFirstOrThrow({
    where: { status: "live", userId: { not: supporter.id } },
    orderBy: { updatedAt: "desc" }
  });
  await prisma.user.update({
    where: { id: supporter.id },
    data: { supportEnergy: 100 }
  });
  await prisma.supportAction.deleteMany({
    where: {
      userId: supporter.id,
      tokenId: token.id,
      actionType: actionId
    }
  });

  await page.goto("/signin");
  await page.getByLabel("Username or email").fill("supporter@example.com");
  await page.getByLabel("Password").fill("MemeFoundry!123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/");

  await page.goto(`/token/${token.id}`);
  await expect(page.getByTestId("public-token-page")).toContainText(
    "Help without trading"
  );
  const supportCard = page.getByTestId(`support-action-${actionId}`);
  await supportCard.getByRole("button", { name: "Support launch" }).click();
  await expect(page.getByTestId("support-success")).toContainText(
    `${actionLabel} landed`
  );
  await expect(page.getByTestId("supporter-list")).toContainText(
    supporter.username
  );
  await expect(page.getByTestId(`support-action-${actionId}`)).toContainText(
    "cooldown"
  );
});
