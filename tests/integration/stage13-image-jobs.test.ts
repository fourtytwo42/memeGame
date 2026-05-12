import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "../../packages/db/src/index";
import { closeRealtimePublisher } from "../../packages/realtime/src/index";
import {
  buildMascotPrompt,
  buildNegativePrompt
} from "../../packages/image-pipeline/src/index";
import { processImageJob } from "../../apps/worker-image/src/worker";

afterEach(async () => {
  delete process.env.IMAGE_FORCE_FAIL;
  await closeRealtimePublisher();
});

async function imageFixture(label: string) {
  const suffix = `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const season = await prisma.season.findFirstOrThrow({
    where: { status: "active" }
  });
  const user = await prisma.user.create({
    data: {
      email: `${suffix}@example.com`,
      username: suffix.replace(/[^a-z0-9_]/gi, "_"),
      status: "active"
    }
  });
  const token = await prisma.launchToken.create({
    data: {
      userId: user.id,
      seasonId: season.id,
      name: `Image ${suffix}`,
      ticker: `I${Date.now().toString().slice(-5)}`,
      narrative: "AI Mascots",
      narrativeSlug: "ai-mascots",
      status: "draft",
      placeholderImageUrl: "/assets/game/tokens/default-token-placeholder.svg",
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
  return { imageJob, token };
}

describe("stage 13 image jobs", () => {
  it("moves queued jobs to ready and updates the token image URL", async () => {
    const { imageJob, token } = await imageFixture("ready");
    const result = await processImageJob(imageJob.id);
    expect(result.status).toBe("ready");
    const [updatedJob, updatedToken] = await Promise.all([
      prisma.imageJob.findUniqueOrThrow({ where: { id: imageJob.id } }),
      prisma.launchToken.findUniqueOrThrow({ where: { id: token.id } })
    ]);
    expect(updatedJob.outputUrl).toContain("/generated/tokens/");
    expect(updatedToken.cardImageUrl).toBe(updatedJob.outputUrl);
  });

  it("keeps the placeholder when generation fails", async () => {
    const { imageJob, token } = await imageFixture("failed");
    process.env.IMAGE_FORCE_FAIL = "true";
    const result = await processImageJob(imageJob.id);
    expect(result.status).toBe("retrying");
    const updatedToken = await prisma.launchToken.findUniqueOrThrow({
      where: { id: token.id }
    });
    expect(updatedToken.cardImageUrl).toBe(
      "/assets/game/tokens/default-token-placeholder.svg"
    );
  });
});
