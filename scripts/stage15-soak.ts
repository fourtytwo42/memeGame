import "dotenv/config";
import { setTimeout as delay } from "node:timers/promises";
import { prisma } from "../packages/db/src/index";
import { getOpsHealth } from "../apps/web/src/lib/server/ops-health";

type Sample = {
  at: string;
  web: boolean;
  realtime: boolean;
  dbUsers: number;
  liveTokens: number;
  queuedImages: number;
  failedImages: number;
  aiFallbacksLastHour: number;
  socketClients: number;
  durationMs: number;
};

const durationMinutes = Number(process.env.SOAK_MINUTES ?? 30);
const intervalSeconds = Number(process.env.SOAK_INTERVAL_SECONDS ?? 60);
const webUrl = (process.env.SOAK_WEB_URL ?? "http://127.0.0.1:3000").replace(
  /\/$/,
  ""
);
const realtimeUrl = (
  process.env.REALTIME_URL ?? "http://127.0.0.1:3001"
).replace(/\/$/, "");

async function fetchOk(url: string) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
    return response.ok;
  } catch {
    return false;
  }
}

async function sample(): Promise<Sample> {
  const started = performance.now();
  const [web, realtime, dbUsers, liveTokens, ops] = await Promise.all([
    fetchOk(`${webUrl}/health`),
    fetchOk(`${realtimeUrl}/health`),
    prisma.user.count(),
    prisma.launchToken.count({ where: { status: "live" } }),
    getOpsHealth()
  ]);
  return {
    at: new Date().toISOString(),
    web,
    realtime,
    dbUsers,
    liveTokens,
    queuedImages: ops.queuedImages,
    failedImages: ops.failedImages,
    aiFallbacksLastHour: ops.recentAiErrors,
    socketClients: ops.socketClients,
    durationMs: Math.round(performance.now() - started)
  };
}

async function main() {
  if (durationMinutes <= 0) throw new Error("SOAK_MINUTES must be positive.");
  if (intervalSeconds <= 0) {
    throw new Error("SOAK_INTERVAL_SECONDS must be positive.");
  }
  const iterations = Math.max(
    1,
    Math.ceil((durationMinutes * 60) / intervalSeconds)
  );
  const samples: Sample[] = [];
  const baselineFailedImages = await prisma.imageJob.count({
    where: { status: "failed" }
  });
  const maxFailedImages = Number(
    process.env.SOAK_MAX_FAILED_IMAGES ?? baselineFailedImages
  );
  const started = Date.now();

  for (let index = 0; index < iterations; index += 1) {
    const current = await sample();
    samples.push(current);
    console.log(JSON.stringify({ iteration: index + 1, ...current }));
    if (!current.web) throw new Error("Web health failed during soak.");
    if (!current.realtime) {
      throw new Error("Realtime health failed during soak.");
    }
    if (current.failedImages > maxFailedImages) {
      throw new Error(`Image failures during soak: ${current.failedImages}`);
    }
    if (current.durationMs > Number(process.env.SOAK_MAX_SAMPLE_MS ?? 5000)) {
      throw new Error(`Soak sample too slow: ${current.durationMs}ms`);
    }
    if (index < iterations - 1) {
      await delay(intervalSeconds * 1000);
    }
  }

  const elapsedSeconds = Math.round((Date.now() - started) / 1000);
  console.log(
    JSON.stringify(
      {
        ok: true,
        durationMinutes,
        intervalSeconds,
        iterations,
        elapsedSeconds,
        baselineFailedImages,
        maxFailedImages,
        first: samples[0],
        last: samples.at(-1)
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
