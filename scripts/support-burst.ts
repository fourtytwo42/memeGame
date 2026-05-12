import "dotenv/config";
import { prisma } from "../packages/db/src/index";
import { closeRealtimePublisher } from "../packages/realtime/src/index";
import { executeSupportActionForUser } from "../apps/web/src/lib/server/support-actions";

async function main() {
  const clients = Number(process.env.SUPPORT_BURST_CLIENTS ?? 20);
  const token = await prisma.launchToken.findFirstOrThrow({
    where: { status: "live" },
    orderBy: { updatedAt: "desc" }
  });
  let users = await prisma.user.findMany({
    where: { id: { not: token.userId }, status: "active" },
    take: clients
  });
  if (users.length < clients) {
    const missing = clients - users.length;
    await prisma.user.createMany({
      data: Array.from({ length: missing }, (_, index) => {
        const ordinal = users.length + index + 1;
        return {
          id: `support-burst-user-${ordinal}`,
          email: `support-burst-user-${ordinal}@example.com`,
          username: `support_burst_user_${ordinal}`,
          status: "active",
          supportEnergy: 100
        };
      }),
      skipDuplicates: true
    });
    users = await prisma.user.findMany({
      where: { id: { not: token.userId }, status: "active" },
      orderBy: { id: "asc" },
      take: clients
    });
  }
  if (users.length < clients) {
    throw new Error(`Only found ${users.length}/${clients} support users.`);
  }
  await prisma.user.updateMany({
    where: { id: { in: users.map((user) => user.id) } },
    data: { supportEnergy: 100 }
  });
  await prisma.supportAction.deleteMany({
    where: {
      tokenId: token.id,
      actionType: { in: ["SHARE_LAUNCH", "JOIN_RAID"] },
      userId: { in: users.map((user) => user.id) }
    }
  });

  const started = performance.now();
  const results = await Promise.allSettled(
    users.map((user, index) =>
      executeSupportActionForUser({
        userId: user.id,
        tokenId: token.id,
        actionId: index % 2 === 0 ? "SHARE_LAUNCH" : "JOIN_RAID",
        nonce: `burst-${Date.now()}-${index}`
      })
    )
  );
  const fulfilled = results.filter((result) => result.status === "fulfilled");
  if (fulfilled.length !== clients) {
    throw new Error(
      `Only ${fulfilled.length}/${clients} burst supports landed.`
    );
  }

  const duplicate = await Promise.allSettled([
    executeSupportActionForUser({
      userId: users[0].id,
      tokenId: token.id,
      actionId: "SHARE_LAUNCH",
      nonce: `dupe-a-${Date.now()}`
    }),
    executeSupportActionForUser({
      userId: users[0].id,
      tokenId: token.id,
      actionId: "SHARE_LAUNCH",
      nonce: `dupe-b-${Date.now()}`
    })
  ]);
  const duplicateFailures = duplicate.filter(
    (result) => result.status === "rejected"
  ).length;
  if (duplicateFailures !== 2) {
    throw new Error("Cooldown did not block duplicate support attempts.");
  }

  const updated = await prisma.launchToken.findUniqueOrThrow({
    where: { id: token.id }
  });
  for (const [label, value] of Object.entries({
    hype: updated.hype,
    trust: updated.trust,
    communityStrength: updated.communityStrength,
    botRisk: updated.botRisk,
    fatigue: updated.fatigue
  })) {
    if (value < 0 || value > 100) {
      throw new Error(`${label} escaped bounds: ${value}`);
    }
  }

  console.log(
    JSON.stringify({
      clients,
      fulfilled: fulfilled.length,
      duplicateFailures,
      durationMs: Math.round(performance.now() - started),
      tokenId: token.id
    })
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeRealtimePublisher();
    await prisma.$disconnect();
  });
