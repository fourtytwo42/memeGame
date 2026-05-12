import Redis from "ioredis";
import { z } from "zod";

export const realtimeEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("TOKEN_TICK"),
    tokenId: z.string(),
    seasonId: z.string().nullable().optional(),
    price: z.number(),
    marketCap: z.number(),
    volume: z.number(),
    holders: z.number(),
    hype: z.number(),
    trust: z.number(),
    createdAt: z.string()
  }),
  z.object({
    type: z.literal("TOKEN_EVENT"),
    tokenId: z.string(),
    seasonId: z.string().nullable().optional(),
    event: z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      severity: z.string()
    })
  }),
  z.object({
    type: z.literal("SUPPORT_ACTION"),
    tokenId: z.string(),
    user: z.object({ username: z.string() }),
    actionType: z.string(),
    effects: z.record(z.string(), z.number())
  }),
  z.object({
    type: z.literal("CREW_ACTION"),
    crewId: z.string(),
    tokenId: z.string().optional(),
    actionType: z.string(),
    effects: z.record(z.string(), z.number())
  }),
  z.object({
    type: z.literal("NARRATIVE_UPDATE"),
    seasonId: z.string(),
    narrativeId: z.string(),
    slug: z.string(),
    heat: z.number(),
    saturation: z.number(),
    fatigue: z.number(),
    activeLaunches: z.number()
  }),
  z.object({
    type: z.literal("LEADERBOARD_UPDATE"),
    seasonId: z.string(),
    category: z.string(),
    updatedAt: z.string()
  }),
  z.object({
    type: z.literal("GRADUATION_ALERT"),
    tokenId: z.string(),
    seasonId: z.string().nullable().optional(),
    graduationType: z.string(),
    marketCap: z.number()
  })
]);

export type RealtimeEvent = z.infer<typeof realtimeEventSchema>;

export const REALTIME_CHANNEL = "meme:realtime:events";

export function realtimeRoomTargets(event: RealtimeEvent) {
  const rooms = new Set<string>();
  if ("tokenId" in event && event.tokenId) rooms.add(`token:${event.tokenId}`);
  if ("seasonId" in event && event.seasonId)
    rooms.add(`season:${event.seasonId}`);
  if (event.type === "CREW_ACTION") rooms.add(`crew:${event.crewId}`);
  if (event.type === "NARRATIVE_UPDATE") {
    rooms.add(`narrative:${event.narrativeId}`);
    rooms.add(`season:${event.seasonId}`);
  }
  if (event.type === "LEADERBOARD_UPDATE") {
    rooms.add(`leaderboard:${event.seasonId}`);
    rooms.add(`season:${event.seasonId}`);
  }
  return [...rooms];
}

let redis: Redis | null = null;

function redisClient() {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
      keyPrefix: process.env.REDIS_KEY_PREFIX ?? "meme:dev:"
    });
  }
  return redis;
}

export async function publishRealtimeEvent(event: RealtimeEvent) {
  const parsed = realtimeEventSchema.parse(event);
  await redisClient().publish(REALTIME_CHANNEL, JSON.stringify(parsed));
  return parsed;
}

export async function closeRealtimePublisher() {
  if (redis) await redis.quit();
  redis = null;
}
