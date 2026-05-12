import { spawnSync } from "node:child_process";

const result = spawnSync("pnpm", ["prisma", "validate"], { stdio: "inherit" });
process.exit(result.status ?? 1);
