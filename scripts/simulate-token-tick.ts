import { prisma } from "../packages/db/src/index";
import {
  narrativeToEngineState,
  tokenToEngineState,
  tokenUpdateFromState
} from "../apps/web/src/lib/game-state";
import { simulateTokenTick } from "@meme-foundry/game-engine";

async function main() {
  const tokens = await prisma.launchToken.findMany({
    where: { status: "live" },
    orderBy: { updatedAt: "asc" }
  });
  const narratives = await prisma.narrativeMeta.findMany({
    where: {
      seasonId: {
        in: [
          ...new Set(
            tokens.map((token) => token.seasonId).filter(Boolean) as string[]
          )
        ]
      }
    }
  });
  const narrativeByKey = new Map(
    narratives.map((narrative) => [
      `${narrative.seasonId}:${narrative.slug}`,
      narrative
    ])
  );

  let updated = 0;
  for (const token of tokens) {
    const narrative =
      token.seasonId && token.narrativeSlug
        ? narrativeByKey.get(`${token.seasonId}:${token.narrativeSlug}`)
        : null;
    const tick = simulateTokenTick({
      token: tokenToEngineState(token),
      narrative: narrativeToEngineState(narrative),
      seed: `${token.id}:${Date.now()}`,
      minutesElapsed: 1
    });
    await prisma.$transaction([
      prisma.launchToken.update({
        where: { id: token.id },
        data: {
          ...tokenUpdateFromState(tick.after),
          energy: Math.min(100, token.energy + 2)
        }
      }),
      prisma.tokenTick.create({
        data: {
          tokenId: token.id,
          price: tick.after.simulatedPrice,
          marketCap: tick.after.simulatedMarketCap,
          volume: tick.after.simulatedVolume,
          holders: tick.after.simulatedHolders,
          hype: tick.after.hype,
          trust: tick.after.trust,
          score: tick.after.score
        }
      })
    ]);
    if (tick.graduationType || tick.failure) {
      await prisma.gameEvent.create({
        data: {
          tokenId: token.id,
          seasonId: token.seasonId,
          type: tick.graduationType ? "graduation" : "failure",
          title: tick.graduationType ?? `Launch ${tick.failure}`,
          description: tick.graduationType
            ? `The launch reached ${tick.graduationType}.`
            : `The launch ended as ${tick.failure}.`,
          source: "simulation",
          severity: tick.graduationType ? "success" : "warning",
          impactJson: {
            graduationType: tick.graduationType,
            failure: tick.failure,
            momentum: tick.momentum
          }
        }
      });
    }
    updated += 1;
  }

  console.log(JSON.stringify({ updated }));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
