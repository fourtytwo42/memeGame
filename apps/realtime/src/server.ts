import "dotenv/config";
import { createServer } from "node:http";
import { Server, type Socket } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import { getToken } from "next-auth/jwt";
import { prisma } from "@meme-foundry/db";
import {
  REALTIME_CHANNEL,
  realtimeEventSchema,
  realtimeRoomTargets
} from "@meme-foundry/realtime";

type SocketUser = { id: string; username: string; role: string } | null;

type SubscribePayload = {
  tokenId?: string;
  seasonId?: string;
  crewId?: string;
  narrativeId?: string;
  userId?: string;
};

declare module "socket.io" {
  interface Socket {
    user: SocketUser;
  }
}

const port = Number(process.env.REALTIME_PORT ?? 3001);
const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
const redisKeyPrefix = process.env.REDIS_KEY_PREFIX ?? "meme:dev:";

async function findActiveUser(userId: string | null | undefined) {
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.status !== "active") return null;
  return { id: user.id, username: user.username, role: user.role };
}

export function createRealtimeServer(
  options: { useRedisAdapter?: boolean } = {}
) {
  const httpServer = createServer((_req, res) => {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, service: "meme-foundry-realtime" }));
  });
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.WEB_ORIGIN?.split(",") ?? [
        "http://192.168.50.209:3000",
        "http://localhost:3000"
      ],
      credentials: true
    }
  });

  const pubClient = new Redis(redisUrl, { keyPrefix: redisKeyPrefix });
  const subClient = pubClient.duplicate();
  const eventSubClient = pubClient.duplicate();
  if (options.useRedisAdapter ?? true) {
    io.adapter(createAdapter(pubClient, subClient));
  }

  async function findHandshakeUser(socket: Socket): Promise<SocketUser> {
    const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
    const cookie = socket.handshake.headers.cookie;
    if (secret && cookie) {
      const token = await getToken({
        req: { headers: { cookie } },
        secret,
        secureCookie: false
      });
      const userId =
        typeof token?.id === "string"
          ? token.id
          : typeof token?.sub === "string"
            ? token.sub
            : null;
      const user = await findActiveUser(userId);
      if (user) return user;
    }

    if (
      process.env.NODE_ENV === "test" ||
      process.env.ALLOW_INSECURE_SOCKET_USER_ID === "true"
    ) {
      const rawUserId = socket.handshake.auth?.userId;
      if (typeof rawUserId === "string") return findActiveUser(rawUserId);
    }

    return null;
  }

  async function canJoin(
    socketUser: SocketUser,
    room: string,
    payload: SubscribePayload
  ) {
    if (
      room.startsWith("token:") ||
      room.startsWith("season:") ||
      room.startsWith("leaderboard:") ||
      room.startsWith("narrative:")
    ) {
      return true;
    }
    if (!socketUser) return false;
    if (room === `user:${socketUser.id}`) return true;
    if (room.startsWith("crew:") && payload.crewId) {
      const member = await prisma.crewMember.findUnique({
        where: {
          crewId_userId: { crewId: payload.crewId, userId: socketUser.id }
        }
      });
      return Boolean(member);
    }
    return socketUser.role === "admin";
  }

  async function joinRoom(
    socket: Socket,
    eventName: string,
    room: string,
    payload: SubscribePayload
  ) {
    if (!(await canJoin(socket.user, room, payload))) {
      socket.emit("SUBSCRIBE_DENIED", { eventName, room });
      return;
    }
    await socket.join(room);
    socket.emit("SUBSCRIBED", { eventName, room });
  }

  io.use(async (socket, next) => {
    try {
      socket.user = await findHandshakeUser(socket);
      next();
    } catch (error) {
      next(error instanceof Error ? error : new Error("Realtime auth failed"));
    }
  });

  io.on("connection", (socket) => {
    socket.emit("REALTIME_READY", {
      connected: true,
      user: socket.user
        ? {
            id: socket.user.id,
            username: socket.user.username,
            role: socket.user.role
          }
        : null
    });

    socket.on("subscribe:token", async (payload: SubscribePayload) => {
      if (payload.tokenId)
        await joinRoom(
          socket,
          "subscribe:token",
          `token:${payload.tokenId}`,
          payload
        );
    });
    socket.on("unsubscribe:token", async (payload: SubscribePayload) => {
      if (payload.tokenId) await socket.leave(`token:${payload.tokenId}`);
    });
    socket.on("subscribe:season", async (payload: SubscribePayload) => {
      if (payload.seasonId)
        await joinRoom(
          socket,
          "subscribe:season",
          `season:${payload.seasonId}`,
          payload
        );
    });
    socket.on("subscribe:crew", async (payload: SubscribePayload) => {
      if (payload.crewId)
        await joinRoom(
          socket,
          "subscribe:crew",
          `crew:${payload.crewId}`,
          payload
        );
    });
    socket.on("subscribe:leaderboard", async (payload: SubscribePayload) => {
      if (payload.seasonId)
        await joinRoom(
          socket,
          "subscribe:leaderboard",
          `leaderboard:${payload.seasonId}`,
          payload
        );
    });
    socket.on("subscribe:narrative", async (payload: SubscribePayload) => {
      if (payload.narrativeId)
        await joinRoom(
          socket,
          "subscribe:narrative",
          `narrative:${payload.narrativeId}`,
          payload
        );
    });
    socket.on("subscribe:user", async (payload: SubscribePayload) => {
      if (payload.userId)
        await joinRoom(
          socket,
          "subscribe:user",
          `user:${payload.userId}`,
          payload
        );
    });
  });

  eventSubClient.subscribe(REALTIME_CHANNEL).catch((error) => {
    console.error("realtime subscribe failed", error);
  });
  eventSubClient.on("message", (_channel, message) => {
    const parsed = realtimeEventSchema.safeParse(JSON.parse(message));
    if (!parsed.success) return;
    for (const room of realtimeRoomTargets(parsed.data)) {
      io.to(room).emit(parsed.data.type, parsed.data);
    }
  });

  return { httpServer, io, pubClient, subClient, eventSubClient };
}

if (process.env.NODE_ENV !== "test") {
  const server = createRealtimeServer();
  server.httpServer.listen(port, "0.0.0.0", () => {
    console.log(JSON.stringify({ service: "realtime", port }));
  });
}
