import "dotenv/config";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const restoreDb = process.env.RESTORE_SMOKE_DB ?? "meme_foundry_restore_smoke";
const dockerPostgresService = process.env.BACKUP_SMOKE_DOCKER_SERVICE;

function run(command: string, args: string[], input?: string) {
  const result = spawnSync(command, args, { encoding: "utf8", input });
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed: ${result.stderr || result.stdout}`
    );
  }
  return result;
}

function dockerPostgresUrl(input: string) {
  const url = new URL(input);
  url.hostname = "127.0.0.1";
  url.port = "5432";
  return url;
}

function dockerPgArgs(binary: string, args: string[]) {
  if (!dockerPostgresService) return { command: binary, args };
  return {
    command: "docker",
    args: ["compose", "exec", "-T", dockerPostgresService, binary, ...args]
  };
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required.");
  const effectiveDatabaseUrl = dockerPostgresService
    ? dockerPostgresUrl(databaseUrl).toString()
    : databaseUrl;
  const maintenanceUrl = new URL(effectiveDatabaseUrl);
  maintenanceUrl.pathname = "/postgres";
  const restoreUrl = new URL(effectiveDatabaseUrl);
  restoreUrl.pathname = `/${restoreDb}`;
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "meme-backup-smoke-"));
  const dumpPath = path.join(tempDir, "schema.sql");
  try {
    if (dockerPostgresService) {
      const dump = dockerPgArgs("pg_dump", [
        "--schema-only",
        "--no-owner",
        effectiveDatabaseUrl
      ]);
      await writeFile(dumpPath, run(dump.command, dump.args).stdout);
    } else {
      run("pg_dump", [
        "--schema-only",
        "--no-owner",
        "--file",
        dumpPath,
        effectiveDatabaseUrl
      ]);
    }
    await stat(dumpPath);
    const drop = dockerPgArgs("dropdb", [
      "--if-exists",
      "--maintenance-db",
      maintenanceUrl.toString(),
      restoreDb
    ]);
    run(drop.command, drop.args);
    const create = dockerPgArgs("createdb", [
      "--maintenance-db",
      maintenanceUrl.toString(),
      restoreDb
    ]);
    run(create.command, create.args);
    const restore = dockerPgArgs("psql", [restoreUrl.toString()]);
    run(restore.command, restore.args, await readFile(dumpPath, "utf8"));
    const cleanup = dockerPgArgs("dropdb", [
      "--if-exists",
      "--maintenance-db",
      maintenanceUrl.toString(),
      restoreDb
    ]);
    run(cleanup.command, cleanup.args);
    console.log(
      JSON.stringify({
        ok: true,
        dumpPath,
        restoreDb,
        mode: dockerPostgresService ? "docker" : "host"
      })
    );
  } finally {
    await rm(tempDir, { force: true, recursive: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
