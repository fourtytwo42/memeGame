import "dotenv/config";
import { prisma } from "../packages/db/src/index";
import { closeRealtimePublisher } from "../packages/realtime/src/index";
import { executeActionForUser } from "../apps/web/src/lib/server/action-loop";
import { executeSupportActionForUser } from "../apps/web/src/lib/server/support-actions";
import { refreshNarrativesAndLeaderboards } from "../apps/web/src/lib/server/world-state";
import type { ActionId } from "@meme-foundry/game-engine";

const launchActions: ActionId[] = [
  "POST_MEME",
  "COMMISSION_ART",
  "OPEN_COMMUNITY_CHAT"
];
const supportActions = ["SHARE_LAUNCH", "MAKE_MEME", "WRITE_LORE"] as const;

async function main() {
  const launchClients = Number(process.env.STRESS_LAUNCH_CLIENTS ?? 12);
  const supportClients = Number(process.env.STRESS_SUPPORT_CLIENTS ?? 24);
  const season = await prisma.season.findFirstOrThrow({
    where: { status: "active" },
    orderBy: { startsAt: "desc" }
  });
  const narrative = await prisma.narrativeMeta.findFirst({
    where: { seasonId: season.id },
    orderBy: { heat: "desc" }
  });

  const usersAndTokens = await Promise.all(
    Array.from({ length: launchClients }, async (_, index) => {
      const ordinal = index + 1;
      const user = await prisma.user.upsert({
        where: { username: `stage15_stress_founder_${ordinal}` },
        update: { status: "active" },
        create: {
          email: `stage15-stress-founder-${ordinal}@example.com`,
          username: `stage15_stress_founder_${ordinal}`,
          status: "active"
        }
      });
      const token = await prisma.launchToken.upsert({
        where: {
          userId_ticker: {
            userId: user.id,
            ticker: `ST15${ordinal.toString().padStart(2, "0")}`
          }
        },
        update: {
          seasonId: season.id,
          status: "live",
          energy: 100,
          treasury: 5000,
          hype: 35,
          trust: 55,
          fatigue: 5,
          launchedAt: new Date()
        },
        create: {
          userId: user.id,
          seasonId: season.id,
          name: `Stage 15 Stress Launch ${ordinal}`,
          ticker: `ST15${ordinal.toString().padStart(2, "0")}`,
          description: "Synthetic launch for release stress testing.",
          narrative: narrative?.name ?? "Stress Narrative",
          narrativeSlug: narrative?.slug,
          status: "live",
          energy: 100,
          treasury: 5000,
          simulatedMarketCap: 10000 + ordinal * 100,
          simulatedHolders: 20 + ordinal,
          hype: 35,
          trust: 55,
          fatigue: 5,
          launchedAt: new Date()
        }
      });
      return { user, token };
    })
  );

  await prisma.playerAction.deleteMany({
    where: {
      tokenId: { in: usersAndTokens.map(({ token }) => token.id) },
      actionType: { in: [...launchActions] }
    }
  });

  const supportUsers = await Promise.all(
    Array.from({ length: supportClients }, (_, index) =>
      prisma.user.upsert({
        where: { username: `stage15_stress_supporter_${index + 1}` },
        update: { status: "active", supportEnergy: 100 },
        create: {
          email: `stage15-stress-supporter-${index + 1}@example.com`,
          username: `stage15_stress_supporter_${index + 1}`,
          status: "active",
          supportEnergy: 100
        }
      })
    )
  );
  await prisma.supportAction.deleteMany({
    where: {
      userId: { in: supportUsers.map((user) => user.id) },
      tokenId: usersAndTokens[0].token.id,
      actionType: { in: [...supportActions] }
    }
  });

  const started = performance.now();
  const launchResults = await Promise.allSettled(
    usersAndTokens.flatMap(({ user, token }, index) =>
      launchActions.map((actionId) =>
        executeActionForUser({
          userId: user.id,
          tokenId: token.id,
          actionId,
          nonce: `stage15-stress-${Date.now()}-${index}-${actionId}`
        })
      )
    )
  );
  const supportResults = await Promise.allSettled(
    supportUsers.map((user, index) =>
      executeSupportActionForUser({
        userId: user.id,
        tokenId: usersAndTokens[0].token.id,
        actionId: supportActions[index % supportActions.length],
        nonce: `stage15-support-${Date.now()}-${index}`
      })
    )
  );
  await refreshNarrativesAndLeaderboards(season.id);

  const launchFailures = launchResults.filter(
    (result) => result.status === "rejected"
  );
  const supportFailures = supportResults.filter(
    (result) => result.status === "rejected"
  );
  if (launchFailures.length || supportFailures.length) {
    throw new Error(
      `Stress failures: launch=${launchFailures.length}, support=${supportFailures.length}`
    );
  }

  const durationMs = Math.round(performance.now() - started);
  const [ticks, events, snapshots] = await Promise.all([
    prisma.tokenTick.count({
      where: { tokenId: { in: usersAndTokens.map(({ token }) => token.id) } }
    }),
    prisma.gameEvent.count({ where: { seasonId: season.id } }),
    prisma.scoreSnapshot.count({ where: { seasonId: season.id } })
  ]);

  if (durationMs > Number(process.env.STRESS_MAX_DURATION_MS ?? 30000)) {
    throw new Error(
      `Stage 15 stress exceeded duration budget: ${durationMs}ms`
    );
  }
  if (snapshots === 0) throw new Error("Stress refresh produced no snapshots.");

  console.log(
    JSON.stringify(
      {
        launchClients,
        supportClients,
        launchActions: launchResults.length,
        supportActions: supportResults.length,
        durationMs,
        ticks,
        events,
        snapshots
      },
      null,
      2
    )
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
