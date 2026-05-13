import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ActiveTokenDashboard } from "@/components/game/active-token-dashboard";
import { AppShell } from "@/components/shell/app-shell";
import {
  actionListByIntent,
  formatPrice,
  graduationProgress,
  recommendedActionFor,
  statGroups
} from "@/lib/game-state";
import { prisma } from "@meme-foundry/db";
import { ACTION_CATALOG } from "@meme-foundry/game-engine";
import {
  fallbackFounderCoach,
  founderCoachSchema
} from "@meme-foundry/prompts";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function actionExplanation(resultJson: unknown) {
  if (
    resultJson &&
    typeof resultJson === "object" &&
    "explanation" in resultJson &&
    typeof resultJson.explanation === "string"
  ) {
    return resultJson.explanation;
  }
  return "Action applied. The simulated market reacted and the event feed was updated.";
}

export default async function ManageTokenPage({
  params,
  searchParams
}: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/signin");
  const [{ id }, query] = await Promise.all([params, searchParams]);

  const token = await prisma.launchToken.findFirst({
    where: { id, userId: session.user.id },
    include: {
      user: true,
      season: true,
      crew: { include: { _count: { select: { members: true } } } },
      ticks: { orderBy: { createdAt: "asc" }, take: 40 },
      events: { orderBy: { createdAt: "desc" }, take: 8 },
      actions: { orderBy: { createdAt: "desc" }, take: 12 }
    }
  });
  if (!token) redirect("/play");

  const recommended = recommendedActionFor(token);
  const [rankSnapshot, narrativeMeta, supportActions, featuringCrew] =
    await Promise.all([
      token.seasonId
        ? prisma.scoreSnapshot.findFirst({
            where: {
              category: "score",
              entityId: token.id,
              entityType: "token",
              seasonId: token.seasonId
            }
          })
        : null,
      token.seasonId && token.narrativeSlug
        ? prisma.narrativeMeta.findUnique({
            where: {
              seasonId_slug: {
                seasonId: token.seasonId,
                slug: token.narrativeSlug
              }
            }
          })
        : null,
      prisma.supportAction.findMany({
        where: { tokenId: token.id },
        include: { crew: true, user: true },
        orderBy: { createdAt: "desc" },
        take: 20
      }),
      prisma.crew.findFirst({
        where: { featuredTokenId: token.id },
        include: { _count: { select: { members: true } } },
        orderBy: { score: "desc" }
      })
    ]);
  const supporterMap = new Map<
    string,
    {
      username: string;
      actions: number;
      latestAction: string;
      crewName?: string | null;
    }
  >();
  for (const support of supportActions) {
    const existing = supporterMap.get(support.userId);
    if (existing) {
      existing.actions += 1;
      continue;
    }
    supporterMap.set(support.userId, {
      username: support.user.username,
      actions: 1,
      latestAction: support.actionType
        .split("_")
        .map((part) => part[0] + part.slice(1).toLowerCase())
        .join(" "),
      crewName: support.crew?.name
    });
  }
  const topSupporters = [...supporterMap.values()]
    .sort((a, b) => b.actions - a.actions)
    .slice(0, 5);
  const crew = token.crew ?? featuringCrew;
  const latestByAction = new Map(
    token.actions.map((action) => [action.actionType, action.createdAt])
  );
  const actionsByIntent = actionListByIntent().map((group) => ({
    intent: group.intent,
    actions: group.actions.map((action) => {
      const last = latestByAction.get(action.id);
      const readyAt = last
        ? new Date(last.getTime() + action.cooldownSeconds * 1000)
        : null;
      const remainingSeconds = readyAt
        ? Math.max(0, Math.ceil((readyAt.getTime() - Date.now()) / 1000))
        : 0;
      return {
        ...action,
        cooldown: { remainingSeconds, readyAt: readyAt?.toISOString() ?? null },
        disabledReason:
          token.energy < action.energyCost
            ? "Not enough energy."
            : token.treasury < action.cost
              ? "Not enough fake budget."
              : null
      };
    })
  }));

  const pinned = token.events.find(
    (event) => !event.resolvedAt && event.type === "first_action_prompt"
  );
  const pinnedChoice = Array.isArray(pinned?.choicesJson)
    ? (pinned.choicesJson.find(
        (choice) =>
          choice &&
          typeof choice === "object" &&
          "actionId" in choice &&
          typeof choice.actionId === "string" &&
          choice.actionId in ACTION_CATALOG
      ) as { actionId: string } | undefined)
    : undefined;

  const chartTicks = token.ticks.length
    ? token.ticks
    : [
        {
          createdAt: token.updatedAt,
          marketCap: token.simulatedMarketCap,
          price: token.simulatedPrice,
          holders: token.simulatedHolders
        }
      ];

  const actionMessage = readParam(query, "action");
  const message = actionMessage
    ? `${ACTION_CATALOG[actionMessage as keyof typeof ACTION_CATALOG]?.label ?? "Action"} applied. Stats, chart, and event feed updated.`
    : (readParam(query, "notice") ?? null);
  const latestAiLog = await prisma.aiGeneratedContent.findFirst({
    where: { purpose: "founder-coach" },
    orderBy: { createdAt: "desc" }
  });
  const templateCoach = fallbackFounderCoach({
    tokenName: token.name,
    ticker: token.ticker,
    narrative: token.narrative,
    seasonName: token.season?.name,
    stats: {
      hype: token.hype,
      trust: token.trust,
      memeQuality: token.memeQuality,
      narrativeStrength: token.narrativeStrength,
      communityStrength: token.communityStrength,
      whaleInterest: token.whaleInterest,
      botRisk: token.botRisk,
      fudPressure: token.fudPressure,
      fatigue: token.fatigue,
      marketCap: token.simulatedMarketCap,
      holders: token.simulatedHolders,
      score: token.score,
      energy: token.energy,
      treasury: token.treasury
    }
  });
  const loggedCoach = founderCoachSchema.safeParse(latestAiLog?.outputJson);
  const aiCoach = loggedCoach.success ? loggedCoach.data : templateCoach;

  return (
    <AppShell>
      <ActiveTokenDashboard
        actionFeed={token.actions.slice(0, 5).map((action) => ({
          id: action.id,
          actionType:
            ACTION_CATALOG[action.actionType as keyof typeof ACTION_CATALOG]
              ?.label ?? action.actionType,
          createdAt: action.createdAt.toISOString(),
          explanation: actionExplanation(action.resultJson)
        }))}
        actionsByIntent={actionsByIntent}
        aiCoach={{
          ...aiCoach,
          status:
            latestAiLog?.status?.includes("model") && loggedCoach.success
              ? "available"
              : aiCoach.status,
          generatedAt: latestAiLog?.createdAt.toISOString() ?? null
        }}
        chart={chartTicks.map((tick, index) => ({
          label: index === chartTicks.length - 1 ? "Now" : `${index + 1}`,
          marketCap: tick.marketCap,
          price: tick.price,
          holders: tick.holders
        }))}
        error={readParam(query, "error") ?? null}
        events={token.events.map((event) => ({
          id: event.id,
          title: event.title,
          description: event.description,
          severity: event.severity,
          createdAt: event.createdAt.toISOString()
        }))}
        message={message}
        nonceSeed={`${token.id}-${Date.now()}`}
        pinnedEvent={
          pinned
            ? {
                title: pinned.title,
                description: pinned.description,
                actionId: pinnedChoice?.actionId
              }
            : null
        }
        seasonId={token.seasonId}
        userId={session.user.id}
        recommendedActionId={recommended.id}
        statGroups={statGroups(token)}
        token={{
          id: token.id,
          name: token.name,
          ticker: token.ticker,
          status: token.status,
          founderName: token.user.name ?? token.user.username,
          launchedAt:
            token.launchedAt?.toISOString() ?? token.createdAt.toISOString(),
          rank: rankSnapshot?.rank ?? null,
          imageUrl:
            token.cardImageUrl ??
            token.placeholderImageUrl ??
            "/assets/game/tokens/default-token-mascot.png",
          marketCap: token.simulatedMarketCap,
          price: formatPrice(token.simulatedPrice),
          holders: token.simulatedHolders,
          volume: token.simulatedVolume,
          treasury: token.treasury,
          energy: token.energy,
          score: token.score,
          graduationProgress: graduationProgress(token),
          stats: {
            Hype: token.hype,
            Trust: token.trust,
            "Meme Quality": token.memeQuality,
            Narrative: token.narrativeStrength,
            Community: token.communityStrength,
            "Whale Interest": token.whaleInterest,
            "Bot Risk": token.botRisk,
            "FUD Pressure": token.fudPressure,
            Fatigue: token.fatigue
          }
        }}
        crewSupport={
          crew
            ? {
                name: crew.name,
                avatarUrl: crew.avatarUrl,
                members: crew._count.members,
                resources: crew.resources,
                score: crew.score
              }
            : null
        }
        narrativeContext={{
          activeLaunches: narrativeMeta?.activeLaunches ?? null,
          fatigue: narrativeMeta?.fatigue ?? null,
          heat: narrativeMeta?.heat ?? null,
          name: narrativeMeta?.name ?? token.narrative,
          saturation: narrativeMeta?.saturation ?? null,
          slug: narrativeMeta?.slug ?? token.narrativeSlug
        }}
        topSupporters={topSupporters}
      />
    </AppShell>
  );
}
