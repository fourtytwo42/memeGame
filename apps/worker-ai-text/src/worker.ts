import "dotenv/config";
import { pathToFileURL } from "node:url";
import { Prisma } from "@prisma/client";
import { Queue, Worker, type JobsOptions } from "bullmq";
import IORedis from "ioredis";
import { z } from "zod";
import { prisma } from "@meme-foundry/db";
import {
  fallbackAiEvent,
  fallbackFounderCoach,
  fallbackNpcPosts,
  fallbackSeasonCommentary,
  validateAiEventProposal,
  validateFounderCoach,
  validateNpcPosts,
  validateSeasonCommentary,
  type AiContext,
  type AiEventProposal,
  type FounderCoach,
  type NpcPostsResponse,
  type SeasonCommentary
} from "@meme-foundry/prompts";
import {
  closeRealtimePublisher,
  publishRealtimeEvent
} from "@meme-foundry/realtime";

const aiTextJobSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("generate-token-event"),
    tokenId: z.string(),
    idempotencyKey: z.string().optional()
  }),
  z.object({
    type: z.literal("generate-season-commentary"),
    seasonId: z.string(),
    idempotencyKey: z.string().optional()
  }),
  z.object({
    type: z.literal("generate-npc-posts"),
    tokenId: z.string(),
    idempotencyKey: z.string().optional()
  })
]);

export type AiTextJob = z.infer<typeof aiTextJobSchema>;

type ServicePurpose =
  | "generate-event"
  | "generate-npc-posts"
  | "founder-coach"
  | "season-commentary";

type ServiceResult<T> = {
  output: T;
  status: string;
  error: string | null;
  logId: string | null;
  model: string;
};

const queueName = "ai-text-queue";

export function aiTextConcurrency() {
  const requested = Number(process.env.AI_TEXT_CONCURRENCY ?? 1);
  if (!Number.isFinite(requested)) return 1;
  return Math.min(2, Math.max(1, Math.floor(requested)));
}

export function redisConnection() {
  return new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    maxRetriesPerRequest: null
  });
}

export function aiTextQueue(connection = redisConnection()) {
  return new Queue<AiTextJob>(queueName, {
    connection,
    prefix: process.env.REDIS_KEY_PREFIX ?? "meme:dev"
  });
}

export async function enqueueAiTextJob(
  job: AiTextJob,
  options: JobsOptions = {}
) {
  const parsed = aiTextJobSchema.parse(job);
  const queue = aiTextQueue();
  try {
    return await queue.add(parsed.type, parsed, {
      attempts: 2,
      backoff: { delay: 2000, type: "exponential" },
      jobId: parsed.idempotencyKey,
      removeOnComplete: 100,
      removeOnFail: 100,
      ...options
    });
  } finally {
    await queue.close();
  }
}

export async function processAiTextJob(job: AiTextJob) {
  const parsed = aiTextJobSchema.parse(job);
  if (parsed.type === "generate-token-event") {
    return generateTokenEvent(parsed.tokenId);
  }
  if (parsed.type === "generate-npc-posts") {
    return generateNpcPosts(parsed.tokenId);
  }
  return generateSeasonCommentary(parsed.seasonId);
}

export async function founderCoachForContext(context: AiContext) {
  const result = await requestAiService<FounderCoach>(
    "founder-coach",
    context,
    fallbackFounderCoach(context),
    validateFounderCoach
  );
  return result.output;
}

async function generateTokenEvent(tokenId: string) {
  const token = await prisma.launchToken.findUnique({
    where: { id: tokenId },
    include: { season: true }
  });
  if (!token) throw new Error(`Token ${tokenId} was not found.`);

  const context = tokenContext(token);
  const result = await requestAiService<AiEventProposal>(
    "generate-event",
    context,
    fallbackAiEvent(context),
    validateAiEventProposal
  );
  const proposal = result.output;

  const event = await prisma.gameEvent.create({
    data: {
      tokenId: token.id,
      seasonId: token.seasonId,
      type: proposal.type,
      title: proposal.title,
      description: proposal.description,
      source: "ai",
      severity: proposal.severity === "high" ? "warning" : proposal.severity,
      impactJson: {
        effects: proposal.effects,
        aiStatus: result.status,
        aiLogId: result.logId
      } as Prisma.InputJsonValue,
      choicesJson: proposal.choices as Prisma.InputJsonValue
    }
  });

  await publishRealtimeEvent({
    type: "TOKEN_EVENT",
    tokenId: token.id,
    seasonId: token.seasonId,
    event: {
      id: event.id,
      title: event.title,
      description: event.description,
      severity: event.severity
    }
  });

  return { kind: "token-event", eventId: event.id, status: result.status };
}

async function generateNpcPosts(tokenId: string) {
  const token = await prisma.launchToken.findUnique({
    where: { id: tokenId },
    include: { season: true }
  });
  if (!token) throw new Error(`Token ${tokenId} was not found.`);
  const context = tokenContext(token);
  const result = await requestAiService<NpcPostsResponse>(
    "generate-npc-posts",
    context,
    fallbackNpcPosts(context),
    validateNpcPosts
  );
  const created = await prisma.gameEvent.createMany({
    data: result.output.posts.map((post) => ({
      tokenId: token.id,
      seasonId: token.seasonId,
      type: "ai_npc_post",
      title: post.npcName,
      description: post.body,
      source: "ai",
      severity: "info",
      impactJson: {
        mood: post.mood,
        aiStatus: result.status,
        aiLogId: result.logId
      } as Prisma.InputJsonValue
    }))
  });
  return { kind: "npc-posts", count: created.count, status: result.status };
}

async function generateSeasonCommentary(seasonId: string) {
  const season = await prisma.season.findUnique({
    where: { id: seasonId },
    include: {
      narratives: { orderBy: { heat: "desc" }, take: 5 },
      tokens: { where: { status: "live" }, orderBy: { score: "desc" }, take: 5 }
    }
  });
  if (!season) throw new Error(`Season ${seasonId} was not found.`);
  const context: AiContext = {
    seasonName: season.name,
    narrative: season.narratives.map((narrative) => narrative.name).join(", "),
    stats: {
      score: season.tokens.reduce((total, token) => total + token.score, 0),
      holders: season.tokens.reduce(
        (total, token) => total + token.simulatedHolders,
        0
      )
    }
  };
  const result = await requestAiService<SeasonCommentary>(
    "season-commentary",
    context,
    fallbackSeasonCommentary(context),
    validateSeasonCommentary
  );
  const event = await prisma.gameEvent.create({
    data: {
      seasonId: season.id,
      type: "ai_season_commentary",
      title: result.output.title,
      description: result.output.summary,
      source: "ai",
      severity: result.output.mood === "volatile" ? "warning" : "info",
      impactJson: {
        mood: result.output.mood,
        aiStatus: result.status,
        aiLogId: result.logId
      } as Prisma.InputJsonValue
    }
  });
  return {
    kind: "season-commentary",
    eventId: event.id,
    status: result.status
  };
}

async function requestAiService<T>(
  purpose: ServicePurpose,
  context: AiContext,
  fallback: T,
  validate: (
    raw: unknown
  ) => { ok: true; value: T } | { ok: false; reason: string }
): Promise<ServiceResult<T>> {
  const serviceUrl = process.env.AI_SERVICE_URL ?? "http://127.0.0.1:3002";
  if (
    process.env.AI_TEXT_DISABLED === "true" ||
    !isLocalServiceUrl(serviceUrl)
  ) {
    const log = await logFallback(
      purpose,
      context,
      fallback,
      "disabled_fallback",
      null
    );
    return {
      output: fallback,
      status: "disabled_fallback",
      error: null,
      logId: log.id,
      model: "template"
    };
  }

  try {
    const response = await fetch(
      `${serviceUrl.replace(/\/$/, "")}/ai/${purpose}`,
      {
        body: JSON.stringify({ context }),
        headers: { "content-type": "application/json" },
        method: "POST",
        signal: AbortSignal.timeout(
          Number(process.env.AI_TEXT_TIMEOUT_MS ?? 25000)
        )
      }
    );
    if (!response.ok) throw new Error(`AI service HTTP ${response.status}.`);
    const json = (await response.json()) as ServiceResult<unknown>;
    const parsed = validate(json.output);
    if (parsed.ok) {
      return {
        output: parsed.value,
        status: json.status,
        error: json.error,
        logId: json.logId,
        model: json.model
      };
    }
    const log = await logFallback(
      purpose,
      context,
      fallback,
      "invalid_service_fallback",
      parsed.reason
    );
    return {
      output: fallback,
      status: "invalid_service_fallback",
      error: parsed.reason,
      logId: log.id,
      model: "template"
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "AI service failed.";
    const log = await logFallback(
      purpose,
      context,
      fallback,
      "error_fallback",
      message
    );
    return {
      output: fallback,
      status: "error_fallback",
      error: message,
      logId: log.id,
      model: "template"
    };
  }
}

async function logFallback(
  purpose: ServicePurpose,
  context: AiContext,
  output: unknown,
  status: string,
  error: string | null
) {
  return prisma.aiGeneratedContent.create({
    data: {
      purpose,
      model: "template",
      inputJson: context as Prisma.InputJsonValue,
      outputJson: output as Prisma.InputJsonValue,
      status,
      error
    }
  });
}

function isLocalServiceUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "http:" &&
      (url.hostname === "localhost" ||
        url.hostname === "127.0.0.1" ||
        url.hostname === "::1" ||
        url.hostname.startsWith("192.168."))
    );
  } catch {
    return false;
  }
}

function tokenContext(token: {
  name: string;
  ticker: string;
  narrative: string;
  season?: { name: string } | null;
  hype: number;
  trust: number;
  memeQuality: number;
  narrativeStrength: number;
  communityStrength: number;
  whaleInterest: number;
  botRisk: number;
  fudPressure: number;
  fatigue: number;
  simulatedMarketCap: number;
  simulatedHolders: number;
  score: number;
  energy: number;
  treasury: number;
}) {
  return {
    tokenName: token.name,
    ticker: token.ticker,
    narrative: token.narrative,
    seasonName: token.season?.name,
    stats: {
      hype: token.hype,
      trust: token.trust,
      memeQuality: token.memeQuality,
      narrativeStrength: token.narrativeStrength,
      communityStrength: token.communityStrength,
      whaleInterest: token.whaleInterest,
      botRisk: token.botRisk,
      fudPressure: token.fudPressure,
      fatigue: token.fatigue,
      marketCap: token.simulatedMarketCap,
      holders: token.simulatedHolders,
      score: token.score,
      energy: token.energy,
      treasury: token.treasury
    }
  };
}

export function createAiTextWorker(connection = redisConnection()) {
  return new Worker<AiTextJob>(
    queueName,
    async (job) => processAiTextJob(job.data),
    {
      concurrency: aiTextConcurrency(),
      connection,
      prefix: process.env.REDIS_KEY_PREFIX ?? "meme:dev"
    }
  );
}

export async function runAiTextWorker() {
  const worker = createAiTextWorker();
  console.log(
    `[worker-ai-text] started with concurrency ${aiTextConcurrency()}`
  );
  const shutdown = async () => {
    await worker.close();
    await closeRealtimePublisher();
    await prisma.$disconnect();
  };
  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());
  return worker;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  runAiTextWorker().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
