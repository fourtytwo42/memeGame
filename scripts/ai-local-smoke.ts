import "dotenv/config";
import assert from "node:assert/strict";
import { prisma } from "../packages/db/src/index";
import {
  aiServiceHealth,
  generateAiPayload,
  isLocalInferenceUrl
} from "../apps/ai-service/src/server";

async function main() {
  assert.equal(isLocalInferenceUrl("http://127.0.0.1:1234/v1"), true);
  assert.equal(isLocalInferenceUrl("https://api.openai.com/v1"), false);

  const token = await prisma.launchToken.findFirst({
    where: { status: "live" },
    orderBy: { updatedAt: "desc" }
  });
  const context = {
    tokenName: token?.name ?? "Smoke Token",
    ticker: token?.ticker ?? "SMOKE",
    narrative: token?.narrative ?? "AI Mascots",
    stats: {
      hype: token?.hype ?? 25,
      trust: token?.trust ?? 50,
      communityStrength: token?.communityStrength ?? 30,
      fudPressure: token?.fudPressure ?? 10,
      fatigue: token?.fatigue ?? 10
    }
  };

  const result = await generateAiPayload("generate-event", context, {
    persistLog: false
  });
  assert.equal(typeof result.status, "string");
  assert.ok(result.output);

  console.log(
    JSON.stringify({
      health: aiServiceHealth(),
      status: result.status,
      localOnly: true
    })
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
