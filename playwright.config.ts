import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: {
    timeout: 5_000
  },
  fullyParallel: true,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL:
      process.env.PLAYWRIGHT_BASE_URL ??
      process.env.AUTH_URL ??
      "http://localhost:3000",
    trace: "on-first-retry"
  },
  webServer: {
    command:
      "pnpm --filter @meme-foundry/web dev --hostname 0.0.0.0 --port 3000",
    url: `${process.env.PLAYWRIGHT_BASE_URL ?? process.env.AUTH_URL ?? "http://localhost:3000"}/health`,
    reuseExistingServer: true,
    timeout: 120_000
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chrome", use: { ...devices["Pixel 7"] } }
  ]
});
