import { z } from "zod";

export const LOCAL_TEXT_MODEL_TARGET = "google/gemma-4-e2b";

export const aiEffectKeys = [
  "hype",
  "trust",
  "memeQuality",
  "narrativeStrength",
  "communityStrength",
  "whaleInterest",
  "botRisk",
  "fudPressure",
  "fatigue"
] as const;

export type AiEffectKey = (typeof aiEffectKeys)[number];

const effectKeySet = new Set<string>(aiEffectKeys);

export const aiEffectSchema = z
  .record(z.string(), z.coerce.number())
  .transform((effects) => normalizeEffects(effects));

export const aiChoiceSchema = z.object({
  label: z.string().trim().min(1).max(80),
  effects: aiEffectSchema.default({})
});

export const aiEventProposalSchema = z.object({
  type: z.string().trim().min(1).max(64).default("ai_token_event"),
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(500),
  severity: z
    .enum(["low", "medium", "high", "info", "warning"])
    .default("medium"),
  effects: aiEffectSchema.default({}),
  choices: z.array(aiChoiceSchema).max(3).default([])
});

export const npcPostSchema = z.object({
  npcName: z.string().trim().min(1).max(40),
  body: z.string().trim().min(1).max(220),
  mood: z
    .enum(["bullish", "skeptical", "helpful", "chaotic", "neutral"])
    .default("neutral")
});

export const npcPostsResponseSchema = z.object({
  posts: z.array(npcPostSchema).min(1).max(6)
});

export const founderCoachSchema = z.object({
  status: z.enum(["available", "template", "degraded"]).default("template"),
  summary: z.string().trim().min(1).max(220),
  recommendedActionId: z.string().trim().max(64).nullable().optional(),
  nextSteps: z.array(z.string().trim().min(1).max(120)).min(1).max(4),
  riskNote: z.string().trim().min(1).max(180)
});

export const seasonCommentarySchema = z.object({
  title: z.string().trim().min(1).max(120),
  summary: z.string().trim().min(1).max(500),
  mood: z.enum(["hot", "cooling", "volatile", "steady"]).default("steady")
});

export type AiEventProposal = z.infer<typeof aiEventProposalSchema>;
export type NpcPostsResponse = z.infer<typeof npcPostsResponseSchema>;
export type FounderCoach = z.infer<typeof founderCoachSchema>;
export type SeasonCommentary = z.infer<typeof seasonCommentarySchema>;

export type AiContext = {
  tokenName?: string | null;
  ticker?: string | null;
  narrative?: string | null;
  seasonName?: string | null;
  stats?: Partial<Record<AiEffectKey, number>> & {
    marketCap?: number;
    holders?: number;
    score?: number;
    energy?: number;
    treasury?: number;
  };
};

export const aiEventSystemPrompt = [
  "You are the event writer for a fictional multiplayer memecoin founder simulator.",
  "No real trading occurs and nothing is financial advice.",
  "Return only valid JSON matching the requested schema.",
  "Do not mention real people, real companies, or real projects.",
  "Keep effects bounded and use only allowlisted effect keys.",
  "Use playful internet-native language without hate, sexual content, or slurs."
].join(" ");

export const founderCoachSystemPrompt = [
  "You are a coach for a fictional game about simulated token launches.",
  "Give plain game strategy for the current run.",
  "Do not give real-world financial advice.",
  "Return strict JSON only."
].join(" ");

export function normalizeEffects(
  effects: Record<string, number | string | null | undefined>
) {
  const normalized: Partial<Record<AiEffectKey, number>> = {};
  for (const [key, rawValue] of Object.entries(effects)) {
    if (!effectKeySet.has(key)) continue;
    const value = Number(rawValue);
    if (!Number.isFinite(value)) continue;
    normalized[key as AiEffectKey] = clamp(Math.round(value), -15, 15);
  }
  return normalized;
}

export function parseAiJson(raw: unknown) {
  if (typeof raw !== "string") return raw;
  const trimmed = raw.trim();
  if (!trimmed) return raw;
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const candidate = fenced?.[1] ?? trimmed;
  try {
    return JSON.parse(candidate);
  } catch {
    const first = candidate.indexOf("{");
    const last = candidate.lastIndexOf("}");
    if (first >= 0 && last > first) {
      return JSON.parse(candidate.slice(first, last + 1));
    }
    throw new Error("AI output was not valid JSON.");
  }
}

export function validateAiEventProposal(raw: unknown) {
  let json: unknown;
  try {
    json = parseAiJson(raw);
  } catch (error) {
    return {
      ok: false as const,
      reason: error instanceof Error ? error.message : "AI output parse failed."
    };
  }
  const parsed = aiEventProposalSchema.safeParse(json);
  if (!parsed.success) {
    return {
      ok: false as const,
      reason: parsed.error.issues.map((issue) => issue.message).join("; ")
    };
  }
  if (containsUnsafeText(parsed.data.title, parsed.data.description)) {
    return {
      ok: false as const,
      reason: "AI output contained unsafe or out-of-scope text."
    };
  }
  return { ok: true as const, value: parsed.data };
}

export function validateNpcPosts(raw: unknown) {
  let json: unknown;
  try {
    json = parseAiJson(raw);
  } catch {
    return { ok: false as const, reason: "Invalid NPC post JSON." };
  }
  const parsed = npcPostsResponseSchema.safeParse(json);
  if (!parsed.success)
    return { ok: false as const, reason: "Invalid NPC post schema." };
  if (
    parsed.data.posts.some((post) =>
      containsUnsafeText(post.npcName, post.body, post.mood)
    )
  ) {
    return { ok: false as const, reason: "NPC post contained unsafe text." };
  }
  return { ok: true as const, value: parsed.data };
}

export function validateFounderCoach(raw: unknown) {
  let json: unknown;
  try {
    json = parseAiJson(raw);
  } catch {
    return { ok: false as const, reason: "Invalid founder coach JSON." };
  }
  const parsed = founderCoachSchema.safeParse(json);
  if (!parsed.success) {
    return { ok: false as const, reason: "Invalid founder coach schema." };
  }
  if (
    containsUnsafeText(
      parsed.data.summary,
      parsed.data.riskNote,
      ...parsed.data.nextSteps
    )
  ) {
    return {
      ok: false as const,
      reason: "Founder coach contained unsafe text."
    };
  }
  return { ok: true as const, value: parsed.data };
}

export function validateSeasonCommentary(raw: unknown) {
  let json: unknown;
  try {
    json = parseAiJson(raw);
  } catch {
    return { ok: false as const, reason: "Invalid season commentary JSON." };
  }
  const parsed = seasonCommentarySchema.safeParse(json);
  if (!parsed.success) {
    return { ok: false as const, reason: "Invalid season commentary schema." };
  }
  if (
    containsUnsafeText(parsed.data.title, parsed.data.summary, parsed.data.mood)
  ) {
    return {
      ok: false as const,
      reason: "Season commentary contained unsafe text."
    };
  }
  return { ok: true as const, value: parsed.data };
}

export function fallbackAiEvent(context: AiContext = {}, reason = "template") {
  const ticker = context.ticker ? `$${context.ticker}` : "the launch";
  const narrative = context.narrative ?? "the current meta";
  const statRisk = context.stats?.fudPressure ?? 0;
  const fatigue = context.stats?.fatigue ?? 0;
  return aiEventProposalSchema.parse({
    type: "ai_template_event",
    title: statRisk > 55 ? "Rumor cleanup window" : "Community spark",
    description:
      statRisk > 55
        ? `${ticker} has a chance to calm the feed around ${narrative}. The safest move is clear communication and steady community work.`
        : `${ticker} catches a small wave of attention in ${narrative}. Keep it useful before fatigue turns the moment stale.`,
    severity: statRisk > 55 || fatigue > 65 ? "warning" : "medium",
    effects:
      statRisk > 55
        ? { trust: 2, fudPressure: -3, fatigue: 1 }
        : { hype: 3, communityStrength: 2, fatigue: 1 },
    choices: [
      {
        label: "Make a steady post",
        effects: { trust: 2, hype: 1 }
      },
      {
        label: "Let the community remix it",
        effects: { communityStrength: 2, memeQuality: 1 }
      }
    ],
    fallbackReason: reason
  });
}

export function fallbackNpcPosts(context: AiContext = {}) {
  const ticker = context.ticker ? `$${context.ticker}` : "this launch";
  return npcPostsResponseSchema.parse({
    posts: [
      {
        npcName: "The Whale",
        body: `${ticker} has motion, but conviction needs receipts. Show me steady community activity.`,
        mood: "skeptical"
      },
      {
        npcName: "Community Mod",
        body: `Keep the feed useful. One clean update beats ten noisy posts.`,
        mood: "helpful"
      }
    ]
  });
}

export function fallbackFounderCoach(context: AiContext = {}) {
  const stats = context.stats ?? {};
  const risk = Math.max(
    stats.botRisk ?? 0,
    stats.fudPressure ?? 0,
    stats.fatigue ?? 0
  );
  const weakCommunity = (stats.communityStrength ?? 0) < 35;
  return founderCoachSchema.parse({
    status: "template",
    summary:
      risk > 60
        ? "Risk is starting to crowd out growth. Stabilize trust before chasing more attention."
        : weakCommunity
          ? "The launch has room to grow, but it needs a clearer community loop."
          : "The run is stable enough for a useful attention push.",
    recommendedActionId:
      risk > 60
        ? "FIGHT_FUD"
        : weakCommunity
          ? "OPEN_COMMUNITY_CHAT"
          : "POST_MEME",
    nextSteps:
      risk > 60
        ? ["Fight FUD", "Avoid high-risk plays", "Use clear updates"]
        : weakCommunity
          ? [
              "Open community chat",
              "Reward early believers",
              "Post one clear update"
            ]
          : ["Post meme", "Start lore thread", "Watch fatigue after the move"],
    riskNote:
      "This is fictional game strategy only. No real trading is involved."
  });
}

export function fallbackSeasonCommentary(context: AiContext = {}) {
  const title = `${context.seasonName ?? "Season"} pulse check`;
  return seasonCommentarySchema.parse({
    title: title.length > 120 ? `${title.slice(0, 117)}...` : title,
    summary:
      "The season is still readable: hot narratives reward clear identity, crowded narratives punish copycat launches, and steady community action remains the safest path.",
    mood: "steady"
  });
}

export function containsUnsafeText(...parts: Array<string | null | undefined>) {
  const text = parts.filter(Boolean).join(" ").toLowerCase();
  if (!text) return false;
  return [
    /\bfinancial advice\b/,
    /\binvestment advice\b/,
    /\bguaranteed profit\b/,
    /\bbuy now\b/,
    /\bsell now\b/,
    /\bopenai\b/,
    /\banthropic\b/,
    /\btesla\b/,
    /\belon\b/,
    /\btrump\b/,
    /\bbiden\b/,
    /\bslur\b/
  ].some((pattern) => pattern.test(text));
}

export function buildTokenEventPrompt(context: AiContext) {
  return {
    system: aiEventSystemPrompt,
    user: JSON.stringify({
      task: "Generate one fictional game event as strict JSON.",
      schema: "AiEventProposal",
      context
    })
  };
}

export function buildFounderCoachPrompt(context: AiContext) {
  return {
    system: founderCoachSystemPrompt,
    user: JSON.stringify({
      task: "Return plain-language next-step advice as strict JSON.",
      schema: "FounderCoach",
      context
    })
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
