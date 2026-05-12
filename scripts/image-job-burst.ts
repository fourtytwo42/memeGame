import "dotenv/config";
import assert from "node:assert/strict";
import { prisma } from "../packages/db/src/index";
import { closeRealtimePublisher } from "../packages/realtime/src/index";
import {
  buildMascotPrompt,
  buildNegativePrompt
} from "../packages/image-pipeline/src/index";
import { processImageJob } from "../apps/worker-image/src/worker";

async function main() {
  const count = Number(process.env.IMAGE_BURST_JOBS ?? 25);
  assert.ok(
    count >= 25,
    "Stage 13 image burst gate requires at least 25 jobs."
  );
  const season = await prisma.season.findFirstOrThrow({
    where: { status: "active" }
  });
  const user =
    (await prisma.user.findFirst({ where: { username: "image_burst" } })) ??
    (await prisma.user.create({
      data: {
        email: "image-burst@example.com",
        username: "image_burst",
        status: "active"
      }
    }));

  const started = Date.now();
  let ready = 0;
  let failed = 0;
  for (let index = 0; index < count; index += 1) {
    const ticker = `IB${Date.now().toString().slice(-4)}${index}`;
    const token = await prisma.launchToken.create({
      data: {
        userId: user.id,
        seasonId: season.id,
        name: `Image Burst ${index}`,
        ticker,
        narrative: "AI Mascots",
        narrativeSlug: "ai-mascots",
        status: "draft",
        placeholderImageUrl:
          "/assets/game/tokens/default-token-placeholder.svg",
        cardImageUrl: "/assets/game/tokens/default-token-placeholder.svg"
      }
    });
    const imageJob = await prisma.imageJob.create({
      data: {
        tokenId: token.id,
        status: "queued",
        prompt: buildMascotPrompt({
          tokenName: token.name,
          ticker: token.ticker,
          narrative: token.narrative
        }),
        negativePrompt: buildNegativePrompt(),
        model: "local-procedural-sharp-v1"
      }
    });
    const result = await processImageJob(imageJob.id);
    if (result.status === "ready") ready += 1;
    else failed += 1;
  }

  assert.equal(failed, 0);
  assert.equal(ready, count);
  console.log(
    JSON.stringify({
      jobs: count,
      ready,
      failed,
      concurrency: 1,
      durationMs: Date.now() - started
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
