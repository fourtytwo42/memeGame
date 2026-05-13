import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import {
  closeBrowser,
  ensureWebServer,
  launchAuditBrowser,
  resolveAuditRoutes,
  signInAsAdmin
} from "./stage15-browser-helpers";
import { prisma } from "../packages/db/src/index";

const evidenceRoot = path.join(
  process.cwd(),
  "docs/evidence/ui-alignment-baseline"
);

const viewports = [
  { name: "desktop", width: 1365, height: 900 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "mobile", width: 390, height: 844 }
] as const;

function slugFor(input: string) {
  return input
    .replace(/^\/+/, "home")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

async function main() {
  await rm(evidenceRoot, { recursive: true, force: true });
  await mkdir(evidenceRoot, { recursive: true });

  const { baseUrl, stop } = await ensureWebServer();
  const { browser, page } = await launchAuditBrowser();

  try {
    await signInAsAdmin(page, baseUrl);
    const resolved = await resolveAuditRoutes();
    const adminToken = await prisma.launchToken.findFirst({
      where: {
        status: { in: ["live", "graduated"] },
        user: { email: "spiderman.1983@gmail.com" }
      },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }]
    });
    if (!adminToken) {
      throw new Error("UI alignment baseline needs an admin-owned token.");
    }
    const requiredLabels = new Set([
      "play",
      "launch wizard",
      "public token",
      "season detail",
      "leaderboard",
      "crew detail",
      "admin"
    ]);
    const routes = [
      ...resolved.filter((route) => requiredLabels.has(route.label)),
      {
        path: `/launch/${adminToken.id}/manage`,
        label: "manage launch",
        expected: "Manage"
      },
      { path: "/seasons", label: "seasons", expected: "Seasons" },
      { path: "/crews", label: "crews", expected: "Crews" }
    ];

    const results = [];
    for (const viewport of viewports) {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height
      });

      for (const route of routes) {
        await page.goto(`${baseUrl}${route.path}`, {
          timeout: 60_000,
          waitUntil: "domcontentloaded"
        });
        await page.waitForTimeout(250);

        const fileName = `${viewport.name}-${slugFor(route.label)}.png`;
        await page.screenshot({
          path: path.join(evidenceRoot, fileName),
          fullPage: false
        });

        const metrics = await page.evaluate(() => ({
          horizontalOverflow:
            Math.max(
              document.body.scrollWidth,
              document.documentElement.scrollWidth
            ) -
            Math.max(
              document.body.clientWidth,
              document.documentElement.clientWidth
            ),
          imageCount: document.images.length,
          textLength: document.body.innerText.length,
          url: location.href
        }));

        results.push({
          viewport: viewport.name,
          label: route.label,
          path: route.path,
          screenshot: `docs/evidence/ui-alignment-baseline/${fileName}`,
          ...metrics
        });
      }
    }

    console.log(
      JSON.stringify(
        {
          baseUrl,
          evidenceRoot: "docs/evidence/ui-alignment-baseline",
          routeCount: routes.length,
          viewports,
          results
        },
        null,
        2
      )
    );
  } finally {
    await closeBrowser(browser);
    await stop();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
