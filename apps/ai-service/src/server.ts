import "dotenv/config";
import { createHash } from "node:crypto";
import {
  createServer,
  type IncomingMessage,
  type ServerResponse
} from "node:http";
import { pathToFileURL } from "node:url";
import { Prisma } from "@prisma/client";
import { prisma } from "@meme-foundry/db";
import {
  LOCAL_TEXT_MODEL_TARGET,
  buildFounderCoachPrompt,
  buildTokenEventPrompt,
  fallbackAiEvent,
  fallbackFounderCoach,
  fallbackNpcPosts,
  fallbackSeasonCommentary,
  validateAiEventProposal,
  validateFounderCoach,
  validateNpcPosts,
  validateSeasonCommentary,
  type AiContext
} from "@meme-foundry/prompts";

type AiPurpose =
  | "generate-event"
  | "generate-npc-posts"
  | "founder-coach"
  | "season-commentary";

type ModelCaller = (input: {
  system: string;
  user: string;
  purpose: AiPurpose;
}) => Promise<string>;

type GenerateOptions = {
  modelCaller?: ModelCaller;
  persistLog?: boolean;
};

const purposeByPath = new Map<string, AiPurpose>([
  ["/ai/generate-event", "generate-event"],
  ["/ai/generate-npc-posts", "generate-npc-posts"],
  ["/ai/founder-coach", "founder-coach"],
  ["/ai/season-commentary", "season-commentary"]
]);

export function aiTextEnabled() {
  return process.env.AI_TEXT_ENABLED === "true";
}

export function localLlmBaseUrl() {
  return process.env.LOCAL_LLM_BASE_URL ?? "http://127.0.0.1:1234/v1";
}

export function localModelName() {
  return process.env.LOCAL_LLM_MODEL ?? LOCAL_TEXT_MODEL_TARGET;
}

export function isLocalInferenceUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "http:" &&
      (url.hostname === "localhost" ||
        url.hostname === "127.0.0.1" ||
        url.hostname === "::1" ||
        url.hostname.startsWith("192.168.") ||
        url.hostname.startsWith("10.") ||
        /^172\.(1[6-9]|2\d|3[0-1])\./.test(url.hostname))
    );
  } catch {
    return false;
  }
}

export function aiServiceHealth() {
  const baseUrl = localLlmBaseUrl();
  const localOnly = isLocalInferenceUrl(baseUrl);
  const enabled = aiTextEnabled() && localOnly;
  return {
    ok: true,
    service: "meme-foundry-ai-service",
    mode: enabled
      ? "enabled"
      : aiTextEnabled()
        ? "blocked-nonlocal"
        : "fallback",
    localOnly,
    model: localModelName()
  };
}

export async function generateAiPayload(
  purpose: AiPurpose,
  context: AiContext,
  options: GenerateOptions = {}
) {
  const persistLog = options.persistLog ?? true;
  const prompt = promptForPurpose(purpose, context);
  const promptHash = createHash("sha256")
    .update(`${prompt.system}\n${prompt.user}`)
    .digest("hex");
  const model = localModelName();
  const fallback = fallbackForPurpose(purpose, context);

  let rawOutput: string | null = null;
  let status = "disabled_fallback";
  let error: string | null = null;
  let outputJson: unknown = fallback;

  const allowedLocal =
    aiTextEnabled() && isLocalInferenceUrl(localLlmBaseUrl());
  if (options.modelCaller || allowedLocal) {
    try {
      rawOutput = await (options.modelCaller ?? callLocalModel)({
        ...prompt,
        purpose
      });
      const validation = validateForPurpose(purpose, rawOutput);
      if (validation.ok) {
        outputJson = validation.value;
        status = options.modelCaller ? "mocked_model" : "model";
      } else {
        status = "invalid_fallback";
        error = validation.reason;
        outputJson = fallback;
      }
    } catch (caught) {
      status = "error_fallback";
      error =
        caught instanceof Error ? caught.message : "AI model call failed.";
      outputJson = fallback;
    }
  } else if (aiTextEnabled()) {
    status = "blocked_nonlocal_fallback";
    error =
      "AI_TEXT_ENABLED was true but LOCAL_LLM_BASE_URL was not local-only.";
  }

  const log = persistLog
    ? await prisma.aiGeneratedContent.create({
        data: {
          purpose,
          model,
          promptHash,
          inputJson: context as Prisma.InputJsonValue,
          outputJson: outputJson as Prisma.InputJsonValue,
          rawOutput,
          status,
          error
        }
      })
    : null;

  return { output: outputJson, status, error, logId: log?.id ?? null, model };
}

export async function callLocalModel({
  system,
  user
}: {
  system: string;
  user: string;
  purpose: AiPurpose;
}) {
  const baseUrl = localLlmBaseUrl();
  if (!isLocalInferenceUrl(baseUrl)) {
    throw new Error("Refusing to call non-local LLM endpoint.");
  }
  const timeoutMs = Number(process.env.AI_TEXT_TIMEOUT_MS ?? 25000);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(
      `${baseUrl.replace(/\/$/, "")}/chat/completions`,
      {
        body: JSON.stringify({
          model: localModelName(),
          messages: [
            { role: "system", content: system },
            { role: "user", content: user }
          ],
          temperature: 0.7
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
        signal: controller.signal
      }
    );
    if (!response.ok) {
      throw new Error(`Local model returned HTTP ${response.status}.`);
    }
    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content;
    if (!content) throw new Error("Local model returned no message content.");
    return content;
  } finally {
    clearTimeout(timeout);
  }
}

function promptForPurpose(purpose: AiPurpose, context: AiContext) {
  if (purpose === "founder-coach") return buildFounderCoachPrompt(context);
  if (purpose === "generate-npc-posts") {
    return {
      system:
        "Generate fictional NPC posts for a no-real-trading game. Return strict JSON only.",
      user: JSON.stringify({
        task: "Generate safe NPC posts.",
        schema: "NpcPostsResponse",
        context
      })
    };
  }
  if (purpose === "season-commentary") {
    return {
      system:
        "Generate fictional season commentary for a no-real-trading game. Return strict JSON only.",
      user: JSON.stringify({
        task: "Generate safe season commentary.",
        schema: "SeasonCommentary",
        context
      })
    };
  }
  return buildTokenEventPrompt(context);
}

function fallbackForPurpose(purpose: AiPurpose, context: AiContext) {
  if (purpose === "founder-coach") return fallbackFounderCoach(context);
  if (purpose === "generate-npc-posts") return fallbackNpcPosts(context);
  if (purpose === "season-commentary") return fallbackSeasonCommentary(context);
  return fallbackAiEvent(context);
}

function validateForPurpose(purpose: AiPurpose, rawOutput: string) {
  if (purpose === "founder-coach") return validateFounderCoach(rawOutput);
  if (purpose === "generate-npc-posts") return validateNpcPosts(rawOutput);
  if (purpose === "season-commentary")
    return validateSeasonCommentary(rawOutput);
  return validateAiEventProposal(rawOutput);
}

async function readJson(req: IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function sendJson(res: ServerResponse, statusCode: number, body: unknown) {
  res.writeHead(statusCode, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

export function createAiServiceServer() {
  return createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", "http://127.0.0.1");
      if (req.method === "GET" && url.pathname === "/health") {
        sendJson(res, 200, aiServiceHealth());
        return;
      }
      const purpose = purposeByPath.get(url.pathname);
      if (req.method === "POST" && purpose) {
        const body = (await readJson(req)) as { context?: AiContext };
        const result = await generateAiPayload(purpose, body.context ?? {});
        sendJson(res, 200, result);
        return;
      }
      sendJson(res, 404, { error: "not_found" });
    } catch (error) {
      sendJson(res, 500, {
        error: error instanceof Error ? error.message : "AI service failed."
      });
    }
  });
}

export async function startAiService() {
  const port = Number(process.env.AI_SERVICE_PORT ?? 3002);
  const host = process.env.AI_SERVICE_HOST ?? "0.0.0.0";
  const server = createAiServiceServer();
  await new Promise<void>((resolve) => server.listen(port, host, resolve));
  console.log(`[ai-service] listening on http://${host}:${port}`);
  return server;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  startAiService().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
