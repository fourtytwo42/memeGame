import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import {
  closeBrowser,
  ensureWebServer,
  launchAuditBrowser,
  resolveAuditRoutes,
  signInAsAdmin
} from "./stage15-browser-helpers";

const viewports = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "desktop", width: 1365, height: 900 }
] as const;

function slugFor(input: string) {
  return input
    .replace(/^\/+/, "home")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

async function main() {
  const { baseUrl, stop } = await ensureWebServer();
  const { browser, page } = await launchAuditBrowser();
  const evidenceRoot = path.join(
    process.cwd(),
    "docs/evidence/stage15-responsive-visual-audit"
  );
  await rm(evidenceRoot, { recursive: true, force: true });
  await mkdir(evidenceRoot, { recursive: true });

  try {
    await signInAsAdmin(page, baseUrl);
    const routes = await resolveAuditRoutes();
    const results = [];

    for (const viewport of viewports) {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height
      });

      for (const route of routes) {
        await page.goto(`${baseUrl}${route.path}`, {
          waitUntil: "domcontentloaded"
        });
        await page.waitForTimeout(150);
        await page
          .getByText(route.expected, { exact: false })
          .filter({ visible: true })
          .first()
          .waitFor({
            timeout: 10_000
          });

        const metrics = await page.evaluate(() => {
          const body = document.body;
          const html = document.documentElement;
          const visibleText = body.innerText.trim();
          return {
            textLength: visibleText.length,
            horizontalOverflow:
              Math.max(body.scrollWidth, html.scrollWidth) -
              Math.max(body.clientWidth, html.clientWidth),
            mainCount: document.querySelectorAll("main").length,
            imageCount: document.querySelectorAll("img").length
          };
        });

        if (metrics.textLength < 40) {
          throw new Error(
            `${viewport.name} ${route.path} rendered too little text.`
          );
        }
        if (metrics.horizontalOverflow > 4) {
          throw new Error(
            `${viewport.name} ${route.path} has ${metrics.horizontalOverflow}px horizontal overflow.`
          );
        }
        if (metrics.mainCount !== 1) {
          throw new Error(
            `${viewport.name} ${route.path} has ${metrics.mainCount} main landmarks.`
          );
        }

        const fileName = `${viewport.name}-${slugFor(route.label)}.png`;
        await page.screenshot({
          path: path.join(evidenceRoot, fileName),
          fullPage: false
        });
        results.push({
          viewport: viewport.name,
          route: route.path,
          screenshot: `docs/evidence/stage15-responsive-visual-audit/${fileName}`,
          imageCount: metrics.imageCount,
          status: "ok"
        });
      }
    }

    console.log(
      JSON.stringify({ viewports, routes: routes.length, results }, null, 2)
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
