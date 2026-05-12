import {
  closeBrowser,
  ensureWebServer,
  launchAuditBrowser,
  resolveAuditRoutes,
  signInAsAdmin
} from "./stage15-browser-helpers";

async function main() {
  const server = await ensureWebServer();
  const routes = await resolveAuditRoutes();
  const { browser, page } = await launchAuditBrowser();
  const evidence: Array<{ route: string; status: string; title: string }> = [];

  try {
    await signInAsAdmin(page, server.baseUrl);
    for (const route of routes) {
      const response = await page.goto(`${server.baseUrl}${route.path}`, {
        waitUntil: "domcontentloaded"
      });
      if (!response?.ok()) {
        throw new Error(
          `${route.label} returned ${response?.status() ?? "no response"}`
        );
      }

      await page.getByText(route.expected, { exact: false }).first().waitFor({
        state: "visible",
        timeout: 10_000
      });
      await page.getByTestId("desktop-left-nav").waitFor({
        state: "visible",
        timeout: 5_000
      });

      const topBars = await page.getByTestId("app-shell-topbar").count();
      const bottomNavs = await page.getByTestId("mobile-bottom-nav").count();
      if (topBars || bottomNavs) {
        throw new Error(
          `${route.label} still renders top/bottom primary navigation.`
        );
      }

      const bodyText = await page.locator("body").innerText();
      for (const banned of ["real trading enabled", "connect wallet"]) {
        if (bodyText.toLowerCase().includes(banned)) {
          throw new Error(`${route.label} exposes banned phrase: ${banned}`);
        }
      }

      evidence.push({
        route: route.path,
        status: "ok",
        title: await page.title()
      });
    }
    console.log(JSON.stringify({ routes: evidence }, null, 2));
  } finally {
    await closeBrowser(browser);
    await server.stop();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
