import "dotenv/config";
import { mkdir, statfs } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { Queue, Worker, type JobsOptions } from "bullmq";
import IORedis from "ioredis";
import { prisma } from "@meme-foundry/db";
import {
  buildMascotPrompt,
  buildNegativePrompt,
  createTokenImageSet
} from "@meme-foundry/image-pipeline";
import {
  closeRealtimePublisher,
  publishRealtimeEvent
} from "@meme-foundry/realtime";

export type ImageQueueJob = {
  type: "generate-token-image";
  imageJobId: string;
};

const queueName = "image-generate-queue";

export function imageWorkerConcurrency() {
  return 1;
}

export function redisConnection() {
  return new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    maxRetriesPerRequest: null
  });
}

export function imageQueue(connection = redisConnection()) {
  return new Queue<ImageQueueJob>(queueName, {
    connection,
    prefix: process.env.REDIS_KEY_PREFIX ?? "meme:dev"
  });
}

export async function enqueueImageJob(
  job: ImageQueueJob,
  options: JobsOptions = {}
) {
  const queue = imageQueue();
  try {
    return await queue.add(job.type, job, {
      attempts: 2,
      backoff: { delay: 5000, type: "exponential" },
      jobId: job.imageJobId,
      removeOnComplete: 100,
      removeOnFail: 100,
      ...options
    });
  } finally {
    await queue.close();
  }
}

export async function createImageJobForToken(tokenId: string) {
  const token = await prisma.launchToken.findUniqueOrThrow({
    where: { id: tokenId }
  });
  const prompt = buildMascotPrompt({
    tokenName: token.name,
    ticker: token.ticker,
    concept: token.mascotPrompt,
    narrative: token.narrative
  });
  const job = await prisma.imageJob.create({
    data: {
      tokenId: token.id,
      status: "queued",
      prompt,
      negativePrompt: buildNegativePrompt(),
      model: imageBackendName(),
      seed: Math.abs(hashText(`${token.id}:${Date.now()}`))
    }
  });
  try {
    await enqueueImageJob({ type: "generate-token-image", imageJobId: job.id });
  } catch {
    // BullMQ/Redis outages must not block launch creation. The DB job remains queued.
  }
  return job;
}

export async function processImageJob(imageJobId: string) {
  const imageJob = await prisma.imageJob.findUnique({
    where: { id: imageJobId },
    include: { token: { include: { user: true, season: true, crew: true } } }
  });
  if (!imageJob) throw new Error(`Image job ${imageJobId} was not found.`);
  if (imageJob.status === "ready") {
    return { status: "ready", imageJobId, outputUrl: imageJob.outputUrl };
  }

  await assertImageDiskSpace();
  await prisma.imageJob.update({
    where: { id: imageJob.id },
    data: { attempts: { increment: 1 }, error: null, status: "generating" }
  });

  try {
    if (process.env.IMAGE_FORCE_FAIL === "true") {
      throw new Error("IMAGE_FORCE_FAIL requested.");
    }
    const rootDir = process.env.IMAGE_STORAGE_ROOT ?? process.cwd();
    const publicRoot =
      process.env.IMAGE_PUBLIC_ROOT ??
      path.join(process.cwd(), "apps", "web", "public");
    await mkdir(publicRoot, { recursive: true });
    const version = imageJob.attempts + 1;
    const paths = await createTokenImageSet({
      rootDir,
      publicRoot,
      input: {
        tokenId: imageJob.token.id,
        version,
        tokenName: imageJob.token.name,
        ticker: imageJob.token.ticker,
        concept: imageJob.token.mascotPrompt,
        narrative: imageJob.token.narrative,
        founder: imageJob.token.user.username,
        season: imageJob.token.season?.name,
        crew: imageJob.token.crew?.name
      }
    });

    const [, updatedJob] = await prisma.$transaction([
      prisma.launchToken.update({
        where: { id: imageJob.token.id },
        data: {
          mascotUrl: paths.squareUrl,
          cardImageUrl: paths.squareUrl,
          placeholderImageUrl:
            imageJob.token.placeholderImageUrl ??
            "/assets/game/tokens/default-token-placeholder.svg"
        }
      }),
      prisma.imageJob.update({
        where: { id: imageJob.id },
        data: {
          status: "ready",
          outputUrl: paths.squareUrl,
          error: null
        }
      })
    ]);

    await publishRealtimeEvent({
      type: "TOKEN_IMAGE_READY",
      tokenId: imageJob.token.id,
      seasonId: imageJob.token.seasonId,
      imageUrl: paths.squareUrl,
      imageJobId: imageJob.id
    });

    return {
      status: updatedJob.status,
      imageJobId: imageJob.id,
      outputUrl: paths.squareUrl
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Image generation failed.";
    const failed = await prisma.imageJob.update({
      where: { id: imageJob.id },
      data: {
        status: imageJob.attempts > 0 ? "failed" : "retrying",
        error: message
      }
    });
    return { status: failed.status, imageJobId: imageJob.id, error: message };
  }
}

export async function processQueuedImageJobs(limit = 25) {
  const jobs = await prisma.imageJob.findMany({
    where: { status: { in: ["queued", "retrying", "failed"] } },
    orderBy: { createdAt: "asc" },
    take: limit
  });
  const results = [];
  for (const job of jobs) {
    results.push(await processImageJob(job.id));
  }
  return results;
}

export async function assertImageDiskSpace() {
  const rootDir = process.env.IMAGE_STORAGE_ROOT ?? process.cwd();
  const stats = await statfs(rootDir);
  const freeBytes = BigInt(stats.bavail) * BigInt(stats.bsize);
  const minFreeBytes = BigInt(
    Number(process.env.IMAGE_MIN_FREE_BYTES ?? 250_000_000)
  );
  if (freeBytes < minFreeBytes) {
    throw new Error("Image worker disk-space guard blocked generation.");
  }
}

export function createImageWorker(connection = redisConnection()) {
  return new Worker<ImageQueueJob>(
    queueName,
    async (job) => processImageJob(job.data.imageJobId),
    {
      concurrency: imageWorkerConcurrency(),
      connection,
      prefix: process.env.REDIS_KEY_PREFIX ?? "meme:dev"
    }
  );
}

export async function runImageWorker() {
  const worker = createImageWorker();
  console.log("[worker-image] started with concurrency 1");
  const shutdown = async () => {
    await worker.close();
    await closeRealtimePublisher();
    await prisma.$disconnect();
  };
  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());
  return worker;
}

function imageBackendName() {
  return process.env.IMAGE_BACKEND_MODEL ?? "local-procedural-sharp-v1";
}

function hashText(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  runImageWorker().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
