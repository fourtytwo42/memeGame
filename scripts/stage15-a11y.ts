import {
  closeBrowser,
  ensureWebServer,
  launchAuditBrowser,
  resolveAuditRoutes,
  signInAsAdmin
} from "./stage15-browser-helpers";

type Issue = {
  route: string;
  issue: string;
};

async function main() {
  const server = await ensureWebServer();
  const routes = await resolveAuditRoutes();
  const { browser, page } = await launchAuditBrowser();
  const issues: Issue[] = [];

  try {
    await signInAsAdmin(page, server.baseUrl);
    for (const route of routes) {
      await page.goto(`${server.baseUrl}${route.path}`, {
        waitUntil: "domcontentloaded"
      });

      const h1Count = await page.locator("h1").count();
      if (h1Count < 1) issues.push({ route: route.path, issue: "missing h1" });

      const mainCount = await page.locator("main").count();
      if (mainCount !== 1) {
        issues.push({
          route: route.path,
          issue: `expected one main landmark, found ${mainCount}`
        });
      }

      const primaryNav = await page
        .getByRole("navigation", { name: "Primary" })
        .count();
      if (primaryNav !== 1) {
        issues.push({
          route: route.path,
          issue: `expected one primary nav, found ${primaryNav}`
        });
      }

      const missingAlt = await page.locator("img:not([alt])").count();
      if (missingAlt > 0) {
        issues.push({
          route: route.path,
          issue: `${missingAlt} image(s) missing alt text`
        });
      }

      const unnamedControls = await page
        .locator(
          "button:not([aria-label]):not([aria-labelledby]), a:not([aria-label]):not([aria-labelledby])"
        )
        .evaluateAll((nodes) =>
          nodes
            .filter((node) => {
              const element = node as HTMLElement;
              const rect = element.getBoundingClientRect();
              if (rect.width === 0 || rect.height === 0) return false;
              return !element.innerText.trim();
            })
            .map((node) => (node as HTMLElement).outerHTML.slice(0, 120))
        );
      for (const control of unnamedControls) {
        issues.push({
          route: route.path,
          issue: `unnamed visible control: ${control}`
        });
      }

      const unlabeledInputs = await page
        .locator("input, textarea, select")
        .evaluateAll((nodes) =>
          nodes
            .filter((node) => {
              const element = node as HTMLInputElement;
              const rect = element.getBoundingClientRect();
              if (rect.width === 0 || rect.height === 0) return false;
              if (element.type === "hidden") return false;
              if (element.getAttribute("aria-label")) return false;
              if (element.getAttribute("aria-labelledby")) return false;
              if (
                element.id &&
                document.querySelector(`label[for="${element.id}"]`)
              ) {
                return false;
              }
              return !element.closest("label");
            })
            .map((node) => (node as HTMLElement).outerHTML.slice(0, 120))
        );
      for (const input of unlabeledInputs) {
        issues.push({
          route: route.path,
          issue: `unlabeled form control: ${input}`
        });
      }
    }

    if (issues.length) {
      console.error(JSON.stringify({ issues }, null, 2));
      process.exitCode = 1;
      return;
    }
    console.log(JSON.stringify({ routes: routes.length, issues: 0 }, null, 2));
  } finally {
    await closeBrowser(browser);
    await server.stop();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
