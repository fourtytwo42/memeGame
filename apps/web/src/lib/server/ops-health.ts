import Redis from "ioredis";
import { prisma } from "@meme-foundry/db";

export async function getOpsHealth() {
  const started = Date.now();
  const checks = await Promise.allSettled([
    dbPing(),
    redisPing(),
    fetchRealtimeHealth(),
    fetchAiHealth(),
    imageHealth()
  ]);
  const [db, redis, realtime, ai, image] = checks.map((check) =>
    check.status === "fulfilled"
      ? check.value
      : { ok: false, detail: check.reason?.message ?? "check failed" }
  );
  const [sessions, queuedImages, failedImages, recentAiErrors, queueStats] =
    await Promise.all([
      prisma.session.count(),
      prisma.imageJob.count({
        where: { status: { in: ["queued", "retrying"] } }
      }),
      prisma.imageJob.count({ where: { status: "failed" } }),
      prisma.aiGeneratedContent.count({
        where: {
          status: { contains: "fallback" },
          createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) }
        }
      }),
      getQueueStats()
    ]);
  return {
    db,
    redis,
    realtime,
    ai,
    image,
    sessions,
    socketClients:
      "socketClients" in realtime && typeof realtime.socketClients === "number"
        ? realtime.socketClients
        : 0,
    queuedImages,
    failedImages,
    recentAiErrors,
    queueStats,
    checkedAt: new Date().toISOString(),
    durationMs: Date.now() - started
  };
}

async function dbPing() {
  await prisma.$queryRaw`SELECT 1`;
  return { ok: true, detail: "reachable" };
}

async function redisPing() {
  const redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    lazyConnect: true,
    maxRetriesPerRequest: 1
  });
  try {
    await redis.connect();
    const pong = await redis.ping();
    return { ok: pong === "PONG", detail: pong };
  } finally {
    await redis.quit();
  }
}

async function fetchRealtimeHealth() {
  const url = process.env.REALTIME_URL ?? "http://127.0.0.1:3001";
  try {
    const response = await fetch(`${url.replace(/\/$/, "")}/health`, {
      signal: AbortSignal.timeout(1500)
    });
    const body = response.ok
      ? ((await response.json()) as { socketClients?: number })
      : {};
    return {
      ok: response.ok,
      detail: response.ok ? "reachable" : response.status,
      socketClients: body.socketClients ?? 0
    };
  } catch (error) {
    return {
      ok: false,
      detail: error instanceof Error ? error.message : "unreachable",
      socketClients: 0
    };
  }
}

async function fetchAiHealth() {
  const url = process.env.AI_SERVICE_URL ?? "http://127.0.0.1:3002";
  try {
    const response = await fetch(`${url.replace(/\/$/, "")}/health`, {
      signal: AbortSignal.timeout(1500)
    });
    return {
      ok: response.ok,
      detail: response.ok ? "reachable" : response.status
    };
  } catch {
    return { ok: true, detail: "fallback mode; ai-service not required" };
  }
}

async function imageHealth() {
  const failed = await prisma.imageJob.count({ where: { status: "failed" } });
  return {
    ok: failed === 0,
    detail: failed ? `${failed} failed image jobs` : "ready"
  };
}

async function getQueueStats() {
  const redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    keyPrefix: process.env.REDIS_KEY_PREFIX ?? "meme:dev:",
    lazyConnect: true,
    maxRetriesPerRequest: 1
  });
  const oldestQueuedImage = await prisma.imageJob.findFirst({
    where: { status: { in: ["queued", "retrying"] } },
    orderBy: { updatedAt: "asc" },
    select: { updatedAt: true }
  });
  try {
    await redis.connect();
    const [
      imageWaiting,
      imageActive,
      imageFailed,
      aiWaiting,
      aiActive,
      aiFailed
    ] = await Promise.all([
      redis.llen("bull:image-generate-queue:wait"),
      redis.llen("bull:image-generate-queue:active"),
      redis.zcard("bull:image-generate-queue:failed"),
      redis.llen("bull:ai-text-queue:wait"),
      redis.llen("bull:ai-text-queue:active"),
      redis.zcard("bull:ai-text-queue:failed")
    ]);
    return {
      imageWaiting,
      imageActive,
      imageFailed,
      aiWaiting,
      aiActive,
      aiFailed,
      oldestQueuedImageSeconds: oldestQueuedImage
        ? Math.max(
            0,
            Math.round(
              (Date.now() - oldestQueuedImage.updatedAt.getTime()) / 1000
            )
          )
        : 0
    };
  } finally {
    await redis.quit();
  }
}
