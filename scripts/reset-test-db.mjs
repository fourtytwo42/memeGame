import "dotenv/config";
import { spawnSync } from "node:child_process";

const databaseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("TEST_DATABASE_URL or DATABASE_URL is required");
  process.exit(1);
}
const env = { ...process.env, DATABASE_URL: databaseUrl };

for (const [command, args] of [
  ["pnpm", ["prisma", "migrate", "reset", "--force"]],
  ["pnpm", ["tsx", "prisma/seed.ts"]]
]) {
  const result = spawnSync(command, args, { stdio: "inherit", env });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
