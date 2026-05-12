import "dotenv/config";
import { mkdtemp, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const restoreDb = process.env.RESTORE_SMOKE_DB ?? "meme_foundry_restore_smoke";

function run(command: string, args: string[]) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed: ${result.stderr || result.stdout}`
    );
  }
  return result;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required.");
  const maintenanceUrl = new URL(databaseUrl);
  maintenanceUrl.pathname = "/postgres";
  const restoreUrl = new URL(databaseUrl);
  restoreUrl.pathname = `/${restoreDb}`;
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "meme-backup-smoke-"));
  const dumpPath = path.join(tempDir, "schema.sql");
  try {
    run("pg_dump", [
      "--schema-only",
      "--no-owner",
      "--file",
      dumpPath,
      databaseUrl
    ]);
    await stat(dumpPath);
    run("dropdb", [
      "--if-exists",
      "--maintenance-db",
      maintenanceUrl.toString(),
      restoreDb
    ]);
    run("createdb", ["--maintenance-db", maintenanceUrl.toString(), restoreDb]);
    run("psql", [restoreUrl.toString(), "--file", dumpPath]);
    run("dropdb", [
      "--if-exists",
      "--maintenance-db",
      maintenanceUrl.toString(),
      restoreDb
    ]);
    console.log(JSON.stringify({ ok: true, dumpPath, restoreDb }));
  } finally {
    await rm(tempDir, { force: true, recursive: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
