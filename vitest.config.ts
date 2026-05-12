import "dotenv/config";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));
const databaseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;

export default defineConfig({
  resolve: {
    alias: {
      "@/": `${root}apps/web/src/`,
      "@meme-foundry/db": `${root}packages/db/src/index.ts`,
      "@meme-foundry/game-engine": `${root}packages/game-engine/src/index.ts`,
      "@meme-foundry/realtime": `${root}packages/realtime/src/index.ts`
    }
  },
  test: {
    environment: "node",
    env: databaseUrl ? { DATABASE_URL: databaseUrl } : undefined,
    include: ["tests/**/*.test.ts", "packages/**/*.test.ts"],
    coverage: {
      reporter: ["text", "html"]
    }
  }
});
