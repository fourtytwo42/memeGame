import "dotenv/config";
import { spawn, type ChildProcess } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { chromium, type Browser, type Page } from "@playwright/test";
import { prisma } from "../packages/db/src/index";

export type AuditRoute = {
  path: string;
  label: string;
  expected: string;
  protected?: boolean;
};

export function auditBaseUrl() {
  return (
    process.env.PLAYWRIGHT_BASE_URL ??
    process.env.AUTH_URL ??
    "http://127.0.0.1:3000"
  ).replace(/\/$/, "");
}

async function healthOk(baseUrl: string) {
  try {
    const response = await fetch(`${baseUrl}/health`, {
      signal: AbortSignal.timeout(1500)
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function ensureWebServer() {
  const baseUrl = auditBaseUrl();
  if (await healthOk(baseUrl)) {
    return { baseUrl, stop: async () => {} };
  }

  const url = new URL(baseUrl);
  if (!["localhost", "127.0.0.1", "0.0.0.0"].includes(url.hostname)) {
    throw new Error(
      `${baseUrl}/health is not reachable and cannot be started locally.`
    );
  }

  const server: ChildProcess = spawn(
    "pnpm",
    [
      "--filter",
      "@meme-foundry/web",
      "dev",
      "--hostname",
      "0.0.0.0",
      "--port",
      url.port || "3000"
    ],
    {
      cwd: process.cwd(),
      env: process.env,
      stdio: "ignore"
    }
  );

  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    if (await healthOk(baseUrl)) {
      return {
        baseUrl,
        stop: async () => {
          server.kill();
        }
      };
    }
    await delay(1000);
  }

  server.kill();
  throw new Error(`Timed out waiting for ${baseUrl}/health.`);
}

export async function launchAuditBrowser() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1365, height: 900 }
  });
  return { browser, page };
}

export async function signInAsAdmin(page: Page, baseUrl: string) {
  await page.goto(`${baseUrl}/signin`);
  await page.getByLabel("Username or email").fill("spiderman.1983@gmail.com");
  await page.getByLabel("Password").fill("MemeFoundry!123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(`${baseUrl}/`, { timeout: 15_000 });
  await page.waitForLoadState("domcontentloaded");
  const url = new URL(page.url());
  if (url.pathname !== "/") {
    throw new Error(`Admin sign-in landed on ${page.url()} instead of home.`);
  }
}

export async function resolveAuditRoutes(): Promise<AuditRoute[]> {
  const [season, token, crew] = await Promise.all([
    prisma.season.findFirst({
      where: { status: "active" },
      orderBy: { startsAt: "desc" }
    }),
    prisma.launchToken.findFirst({
      where: { status: { in: ["live", "graduated"] } },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      include: { user: true }
    }),
    prisma.crew.findFirst({
      where: { moderationStatus: "active" },
      orderBy: { updatedAt: "desc" }
    })
  ]);

  if (!season) throw new Error("Stage 15 audit needs an active season.");
  if (!token) throw new Error("Stage 15 audit needs a live public token.");
  if (!crew) throw new Error("Stage 15 audit needs an active crew.");

  return [
    { path: "/", label: "home", expected: "Meme Foundry" },
    { path: "/play", label: "play", expected: "Recommended", protected: true },
    {
      path: "/launch/new",
      label: "launch wizard",
      expected: "Name the fake token",
      protected: true
    },
    {
      path: `/launch/${token.id}/manage`,
      label: "manage launch",
      expected: "Manage",
      protected: true
    },
    {
      path: `/token/${token.id}`,
      label: "public token",
      expected: "Help without trading"
    },
    {
      path: `/founder/${token.user.username}`,
      label: "founder profile",
      expected: token.user.username
    },
    {
      path: `/crews/${crew.slug}`,
      label: "crew detail",
      expected: crew.name
    },
    {
      path: `/seasons/${season.slug}`,
      label: "season detail",
      expected: season.name
    },
    {
      path: "/leaderboard",
      label: "leaderboard",
      expected: "Leaderboard"
    },
    { path: "/admin", label: "admin", expected: "Admin", protected: true },
    {
      path: "/admin/assets",
      label: "admin asset gallery",
      expected: "Asset Gallery",
      protected: true
    }
  ];
}

export async function closeBrowser(browser: Browser) {
  await browser.close();
  await prisma.$disconnect();
}
