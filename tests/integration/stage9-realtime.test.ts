import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { io as clientIo, type Socket as ClientSocket } from "socket.io-client";
import { prisma } from "../../packages/db/src/index";
import {
  closeRealtimePublisher,
  publishRealtimeEvent
} from "../../packages/realtime/src/index";
import { createRealtimeServer } from "../../apps/realtime/src/server";

type TestServer = ReturnType<typeof createRealtimeServer> & { url: string };

let server: TestServer | null = null;
let sockets: ClientSocket[] = [];

function once<T>(socket: ClientSocket, event: string, timeoutMs = 5000) {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error(`Timed out waiting for ${event}`)),
      timeoutMs
    );
    socket.once(event, (payload: T) => {
      clearTimeout(timeout);
      resolve(payload);
    });
  });
}

async function startServer() {
  const instance = createRealtimeServer({ useRedisAdapter: false });
  await new Promise<void>((resolve) => {
    instance.httpServer.listen(0, "127.0.0.1", resolve);
  });
  const address = instance.httpServer.address();
  if (!address || typeof address === "string") throw new Error("No test port");
  server = { ...instance, url: `http://127.0.0.1:${address.port}` };
  return server;
}

async function stopServer() {
  for (const socket of sockets) socket.disconnect();
  sockets = [];
  if (!server) return;
  await Promise.all([
    server.pubClient.quit(),
    server.subClient.quit(),
    server.eventSubClient.quit()
  ]);
  await closeRealtimePublisher();
  await new Promise<void>((resolve) => server?.io.close(() => resolve()));
  await new Promise<void>((resolve) =>
    server?.httpServer.close(() => resolve())
  );
  server = null;
}

function connect(url: string, userId?: string) {
  const socket = clientIo(url, {
    auth: { userId },
    reconnection: false,
    transports: ["websocket"]
  });
  sockets.push(socket);
  return socket;
}

beforeEach(async () => {
  await startServer();
});

afterEach(async () => {
  await stopServer();
});

describe("stage 9 realtime foundation", () => {
  it("subscribes to public token rooms and receives Redis-published ticks", async () => {
    const token = await prisma.launchToken.findFirstOrThrow({
      where: { status: "live", seasonId: { not: null } }
    });
    const socket = connect(server!.url);
    await once(socket, "REALTIME_READY");
    socket.emit("subscribe:token", { tokenId: token.id });
    const subscribed = await once<{ room: string }>(socket, "SUBSCRIBED");
    expect(subscribed.room).toBe(`token:${token.id}`);

    const tickPromise = once<{ tokenId: string; marketCap: number }>(
      socket,
      "TOKEN_TICK"
    );
    await publishRealtimeEvent({
      type: "TOKEN_TICK",
      tokenId: token.id,
      seasonId: token.seasonId,
      price: token.simulatedPrice,
      marketCap: token.simulatedMarketCap + 123,
      volume: token.simulatedVolume,
      holders: token.simulatedHolders,
      hype: token.hype,
      trust: token.trust,
      createdAt: new Date().toISOString()
    });
    const tick = await tickPromise;
    expect(tick.tokenId).toBe(token.id);
    expect(tick.marketCap).toBeCloseTo(token.simulatedMarketCap + 123);
  });

  it("denies private user rooms to anonymous sockets", async () => {
    const user = await prisma.user.findFirstOrThrow();
    const socket = connect(server!.url);
    await once(socket, "REALTIME_READY");
    socket.emit("subscribe:user", { userId: user.id });
    const denied = await once<{ room: string }>(socket, "SUBSCRIBE_DENIED");
    expect(denied.room).toBe(`user:${user.id}`);
  });

  it("allows authenticated user room subscription in test context", async () => {
    const user = await prisma.user.findFirstOrThrow({
      where: { status: "active" }
    });
    const socket = connect(server!.url, user.id);
    const ready = await once<{ user: { id: string } }>(
      socket,
      "REALTIME_READY"
    );
    expect(ready.user.id).toBe(user.id);
    socket.emit("subscribe:user", { userId: user.id });
    const subscribed = await once<{ room: string }>(socket, "SUBSCRIBED");
    expect(subscribed.room).toBe(`user:${user.id}`);
  });

  it("broadcasts support actions and graduation alerts to token rooms", async () => {
    const token = await prisma.launchToken.findFirstOrThrow({
      where: { status: "live", seasonId: { not: null } }
    });
    const socket = connect(server!.url);
    await once(socket, "REALTIME_READY");
    socket.emit("subscribe:token", { tokenId: token.id });
    await once(socket, "SUBSCRIBED");

    const supportPromise = once<{ tokenId: string; actionType: string }>(
      socket,
      "SUPPORT_ACTION"
    );
    await publishRealtimeEvent({
      type: "SUPPORT_ACTION",
      tokenId: token.id,
      user: { username: "supporter" },
      actionType: "share_boost",
      effects: { hype: 2 }
    });
    expect(await supportPromise).toMatchObject({
      tokenId: token.id,
      actionType: "share_boost"
    });

    const graduationPromise = once<{ tokenId: string; graduationType: string }>(
      socket,
      "GRADUATION_ALERT"
    );
    await publishRealtimeEvent({
      type: "GRADUATION_ALERT",
      tokenId: token.id,
      seasonId: token.seasonId,
      graduationType: "trend_breakout",
      marketCap: token.simulatedMarketCap + 10_000
    });
    expect(await graduationPromise).toMatchObject({
      tokenId: token.id,
      graduationType: "trend_breakout"
    });
  });

  it("broadcasts leaderboard changes to season leaderboard rooms", async () => {
    const season = await prisma.season.findFirstOrThrow({
      where: { status: "active" }
    });
    const socket = connect(server!.url);
    await once(socket, "REALTIME_READY");
    socket.emit("subscribe:leaderboard", { seasonId: season.id });
    const subscribed = await once<{ room: string }>(socket, "SUBSCRIBED");
    expect(subscribed.room).toBe(`leaderboard:${season.id}`);

    const updatePromise = once<{ seasonId: string; category: string }>(
      socket,
      "LEADERBOARD_UPDATE"
    );
    await publishRealtimeEvent({
      type: "LEADERBOARD_UPDATE",
      seasonId: season.id,
      category: "marketCap",
      updatedAt: new Date().toISOString()
    });
    expect(await updatePromise).toMatchObject({
      seasonId: season.id,
      category: "marketCap"
    });
  });
});
