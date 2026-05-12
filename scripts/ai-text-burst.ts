import "dotenv/config";
import assert from "node:assert/strict";
import { prisma } from "../packages/db/src/index";
import { closeRealtimePublisher } from "../packages/realtime/src/index";
import { processAiTextJob } from "../apps/worker-ai-text/src/worker";

async function main() {
  process.env.AI_TEXT_DISABLED = "true";
  const count = Number(process.env.AI_TEXT_BURST_JOBS ?? 100);
  assert.ok(count >= 100, "Stage 12 burst gate requires at least 100 jobs.");
  const token = await prisma.launchToken.findFirstOrThrow({
    where: { status: "live" },
    orderBy: { updatedAt: "desc" }
  });

  const started = Date.now();
  let fulfilled = 0;
  let failed = 0;
  let fallbacks = 0;
  const concurrency = 10;
  for (let index = 0; index < count; index += concurrency) {
    const batch = Array.from(
      { length: Math.min(concurrency, count - index) },
      (_, offset) =>
        processAiTextJob({
          type: "generate-token-event",
          tokenId: token.id,
          idempotencyKey: `burst-${Date.now()}-${index + offset}`
        })
    );
    const results = await Promise.allSettled(batch);
    for (const result of results) {
      if (result.status === "fulfilled") {
        fulfilled += 1;
        if (String(result.value.status).includes("fallback")) fallbacks += 1;
      } else {
        failed += 1;
      }
    }
  }

  assert.equal(failed, 0);
  assert.equal(fulfilled, count);
  assert.ok(fallbacks >= count);
  console.log(
    JSON.stringify({
      jobs: count,
      fulfilled,
      failed,
      fallbacks,
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
