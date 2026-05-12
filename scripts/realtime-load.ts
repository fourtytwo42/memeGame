import "dotenv/config";
import { io } from "socket.io-client";
import { prisma } from "../packages/db/src/index";
import {
  closeRealtimePublisher,
  publishRealtimeEvent
} from "../packages/realtime/src/index";

const clients = Number(process.env.REALTIME_CLIENTS ?? 100);
const url = process.env.REALTIME_URL ?? "http://127.0.0.1:3001";
const overallTimeoutMs = Number(process.env.REALTIME_LOAD_TIMEOUT_MS ?? 30000);

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const token = await prisma.launchToken.findFirstOrThrow({
    where: { status: "live", seasonId: { not: null } }
  });
  let connected = 0;
  let subscribed = 0;
  let ticks = 0;
  const sockets = Array.from({ length: clients }, () =>
    io(url, {
      reconnection: false,
      timeout: 5000,
      transports: ["websocket"]
    })
  );

  try {
    await Promise.race([
      Promise.all(
        sockets.map(
          (socket, index) =>
            new Promise<void>((resolve, reject) => {
              const timeout = setTimeout(
                () => reject(new Error(`client ${index} connect timeout`)),
                10000
              );
              socket.once("connect", () => {
                connected += 1;
                socket.emit("subscribe:token", { tokenId: token.id });
              });
              socket.once("SUBSCRIBED", () => {
                subscribed += 1;
                clearTimeout(timeout);
                resolve();
              });
              socket.once("connect_error", (error) => {
                clearTimeout(timeout);
                reject(error);
              });
              socket.on("TOKEN_TICK", () => {
                ticks += 1;
              });
            })
        )
      ),
      wait(overallTimeoutMs).then(() => {
        throw new Error(
          `Realtime load test timed out after ${overallTimeoutMs}ms with ${connected}/${clients} connected and ${subscribed}/${clients} subscribed.`
        );
      })
    ]);

    await publishRealtimeEvent({
      type: "TOKEN_TICK",
      tokenId: token.id,
      seasonId: token.seasonId,
      price: token.simulatedPrice,
      marketCap: token.simulatedMarketCap + 999,
      volume: token.simulatedVolume,
      holders: token.simulatedHolders,
      hype: token.hype,
      trust: token.trust,
      createdAt: new Date().toISOString()
    });
    await wait(1500);
    if (connected < clients)
      throw new Error(`Only ${connected}/${clients} clients connected.`);
    if (subscribed < clients)
      throw new Error(`Only ${subscribed}/${clients} clients subscribed.`);
    if (ticks < clients)
      throw new Error(`Only ${ticks}/${clients} clients received tick.`);
    console.log(JSON.stringify({ clients, connected, subscribed, ticks }));
  } finally {
    for (const socket of sockets) socket.disconnect();
    await closeRealtimePublisher();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
