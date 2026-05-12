"use server";

import { auth } from "@/auth";
import { prisma } from "@meme-foundry/db";
import { createDefaultTokenState } from "@meme-foundry/game-engine";
import {
  buildMascotPrompt,
  buildNegativePrompt
} from "@meme-foundry/image-pipeline";
import { launchTokenSchema } from "@meme-foundry/validation";
import type { Route } from "next";
import { redirect } from "next/navigation";

export type LaunchActionState = { error?: string };

function strategyStats(strategy: string, riskLevel: string) {
  const base = createDefaultTokenState();
  const strategyBoosts = {
    balanced: {},
    growth: {
      hype: base.hype + 10,
      whaleInterest: base.whaleInterest + 4,
      trust: base.trust - 3
    },
    community: {
      communityStrength: base.communityStrength + 12,
      memeQuality: base.memeQuality + 4
    },
    trust: {
      trust: base.trust + 12,
      fudPressure: Math.max(0, base.fudPressure - 3)
    }
  } as const;
  const riskBoosts = {
    low: { botRisk: 0, fatigue: 0 },
    medium: { hype: 5, botRisk: 4, fatigue: 2 },
    high: { hype: 12, whaleInterest: 4, botRisk: 10, fatigue: 5, trust: -4 }
  } as const;
  return {
    ...strategyBoosts[strategy as keyof typeof strategyBoosts],
    ...riskBoosts[riskLevel as keyof typeof riskBoosts]
  };
}

export async function createLaunch(
  _state: LaunchActionState,
  formData: FormData
): Promise<LaunchActionState> {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const profile = await prisma.founderProfile.findUnique({
    where: { userId: session.user.id }
  });
  if (!profile) redirect("/profile");

  const parsed = launchTokenSchema.safeParse({
    name: formData.get("name"),
    ticker: String(formData.get("ticker") ?? "").toUpperCase(),
    description: formData.get("description"),
    narrativeSlug: formData.get("narrativeSlug"),
    mascotPrompt: formData.get("mascotPrompt"),
    founderStance: formData.get("founderStance"),
    strategy: formData.get("strategy"),
    riskLevel: formData.get("riskLevel")
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Check the launch fields."
    };
  }

  const season = await prisma.season.findFirst({
    where: { status: "active" },
    orderBy: { startsAt: "desc" }
  });
  if (!season) return { error: "No active season is available." };
  const narrative = await prisma.narrativeMeta.findUnique({
    where: {
      seasonId_slug: { seasonId: season.id, slug: parsed.data.narrativeSlug }
    }
  });
  if (!narrative) return { error: "Pick an active narrative." };

  const defaults = createDefaultTokenState(
    strategyStats(parsed.data.strategy, parsed.data.riskLevel)
  );

  try {
    const token = await prisma.launchToken.create({
      data: {
        userId: session.user.id,
        seasonId: season.id,
        name: parsed.data.name,
        ticker: parsed.data.ticker,
        description: parsed.data.description,
        narrative: narrative.name,
        narrativeSlug: narrative.slug,
        mascotPrompt: parsed.data.mascotPrompt,
        placeholderImageUrl: "/assets/game/tokens/default-token-mascot.png",
        cardImageUrl: "/assets/game/tokens/default-token-mascot.png",
        status: "live",
        launchedAt: new Date(),
        simulatedPrice: defaults.simulatedPrice,
        simulatedMarketCap: defaults.simulatedMarketCap,
        simulatedLiquidity: defaults.simulatedLiquidity,
        simulatedHolders: defaults.simulatedHolders,
        simulatedVolume: defaults.simulatedVolume,
        hype: defaults.hype,
        trust: defaults.trust,
        memeQuality: defaults.memeQuality,
        narrativeStrength: defaults.narrativeStrength,
        communityStrength: defaults.communityStrength,
        whaleInterest: defaults.whaleInterest,
        botRisk: defaults.botRisk,
        fudPressure: defaults.fudPressure,
        fatigue: defaults.fatigue,
        treasury: defaults.treasury,
        gameProfit: defaults.gameProfit,
        energy: 100,
        score: defaults.score,
        events: {
          create: {
            seasonId: season.id,
            type: "first_action_prompt",
            title: "Your launch is live. Post the first meme?",
            description:
              "A new launch needs attention. Posting a meme improves Growth and Meme Quality, but adds a little Fatigue.",
            source: "system",
            severity: "info",
            impactJson: {
              recommendedAction: "POST_MEME",
              helps: ["Growth", "Meme Quality"],
              risks: ["Fatigue"]
            },
            choicesJson: [
              {
                id: "post_meme",
                label: "Post first meme",
                actionId: "POST_MEME"
              }
            ]
          }
        }
      }
    });

    await Promise.all([
      prisma.founderProfile.update({
        where: { userId: session.user.id },
        data: { launchesCreated: { increment: 1 } }
      }),
      prisma.narrativeMeta.update({
        where: { id: narrative.id },
        data: { activeLaunches: { increment: 1 } }
      }),
      prisma.imageJob.create({
        data: {
          tokenId: token.id,
          status: "queued",
          prompt: buildMascotPrompt({
            tokenName: token.name,
            ticker: token.ticker,
            concept: token.mascotPrompt,
            narrative: token.narrative
          }),
          negativePrompt: buildNegativePrompt(),
          model: "local-procedural-sharp-v1"
        }
      })
    ]);

    redirect(`/launch/${token.id}/manage?launched=1` as Route);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return { error: "You already used that ticker. Pick a different one." };
    }
    throw error;
  }
}
