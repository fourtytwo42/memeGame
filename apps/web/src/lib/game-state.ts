import type {
  ActionDefinition,
  ActionId,
  MarketState,
  NarrativeState,
  TokenState,
  TokenStats
} from "@meme-foundry/game-engine";
import {
  ACTION_CATALOG,
  createDefaultTokenState
} from "@meme-foundry/game-engine";

export type TokenRecord = TokenStats &
  MarketState & {
    id: string;
    status: string;
    narrativeSlug: string | null;
    launchedAt: Date | null;
    energy: number;
  };

export type TickRecord = {
  price: number;
  marketCap: number;
  volume: number;
  holders: number;
  hype: number;
  trust: number;
  score: number | null;
  createdAt: Date;
};

export function tokenToEngineState(token: TokenRecord): TokenState {
  const launchedAtMinutesAgo = token.launchedAt
    ? Math.max(0, Math.floor((Date.now() - token.launchedAt.getTime()) / 60000))
    : 0;
  return createDefaultTokenState({
    id: token.id,
    status: token.status as TokenState["status"],
    narrativeSlug: token.narrativeSlug,
    launchedAtMinutesAgo,
    simulatedPrice: token.simulatedPrice,
    simulatedMarketCap: token.simulatedMarketCap,
    simulatedLiquidity: token.simulatedLiquidity,
    simulatedHolders: token.simulatedHolders,
    simulatedVolume: token.simulatedVolume,
    hype: token.hype,
    trust: token.trust,
    memeQuality: token.memeQuality,
    narrativeStrength: token.narrativeStrength,
    communityStrength: token.communityStrength,
    whaleInterest: token.whaleInterest,
    botRisk: token.botRisk,
    fudPressure: token.fudPressure,
    fatigue: token.fatigue,
    treasury: token.treasury,
    gameProfit: token.gameProfit,
    score: token.score,
    peakMarketCap: token.simulatedMarketCap
  });
}

export function tokenUpdateFromState(state: TokenState) {
  return {
    status: state.status,
    simulatedPrice: state.simulatedPrice,
    simulatedMarketCap: state.simulatedMarketCap,
    simulatedLiquidity: state.simulatedLiquidity,
    simulatedHolders: state.simulatedHolders,
    simulatedVolume: state.simulatedVolume,
    hype: state.hype,
    trust: state.trust,
    memeQuality: state.memeQuality,
    narrativeStrength: state.narrativeStrength,
    communityStrength: state.communityStrength,
    whaleInterest: state.whaleInterest,
    botRisk: state.botRisk,
    fudPressure: state.fudPressure,
    fatigue: state.fatigue,
    treasury: state.treasury,
    gameProfit: state.gameProfit,
    score: state.score,
    graduatedAt: state.status === "graduated" ? new Date() : undefined
  };
}

export function narrativeToEngineState(
  narrative: NarrativeState | null | undefined
): NarrativeState | undefined {
  if (!narrative) return undefined;
  return {
    slug: narrative.slug,
    heat: narrative.heat,
    saturation: narrative.saturation,
    fatigue: narrative.fatigue,
    activeLaunches: narrative.activeLaunches
  };
}

export function graduationProgress(
  token: Pick<
    TokenRecord,
    | "simulatedMarketCap"
    | "simulatedHolders"
    | "trust"
    | "communityStrength"
    | "fatigue"
    | "botRisk"
  >
) {
  const parts = [
    token.simulatedMarketCap / 69000,
    token.simulatedHolders / 1000,
    token.trust / 40,
    token.communityStrength / 60,
    (100 - token.fatigue) / 20,
    (100 - token.botRisk) / 15
  ];
  return Math.max(0, Math.min(100, Math.round(Math.min(...parts) * 100)));
}

export function statGroups(token: TokenStats) {
  const growth = Math.round((token.hype + token.whaleInterest) / 2);
  const belief = Math.round((token.trust + token.narrativeStrength) / 2);
  const community = Math.round(
    (token.communityStrength + token.memeQuality) / 2
  );
  const risk = Math.round(
    (token.botRisk + token.fudPressure + token.fatigue) / 3
  );
  return [
    {
      label: "Growth",
      value: growth,
      tone: growth >= 45 ? ("good" as const) : ("warn" as const),
      detail:
        growth >= 60
          ? "Attention is strong. Watch fatigue so the crowd does not burn out."
          : "Attention is still forming. A simple meme action can create motion."
    },
    {
      label: "Belief",
      value: belief,
      tone: belief >= 45 ? ("good" as const) : ("warn" as const),
      detail:
        belief >= 60
          ? "People understand the launch and mostly trust the founder."
          : "Belief is fragile. Trust-building choices reduce panic later."
    },
    {
      label: "Community",
      value: community,
      tone: community >= 45 ? ("good" as const) : ("warn" as const),
      detail:
        community >= 60
          ? "Supporters have enough identity to help carry momentum."
          : "The launch needs stronger rituals, art, or community hooks."
    },
    {
      label: "Risk",
      value: risk,
      tone:
        risk >= 65
          ? ("bad" as const)
          : risk >= 35
            ? ("warn" as const)
            : ("good" as const),
      detail:
        risk >= 65
          ? "Risk is high. Defensive choices should come before loud moves."
          : "Risk is manageable, but loud growth actions can change that fast."
    }
  ];
}

export function recommendedActionFor(token: TokenStats): ActionDefinition {
  if (token.fudPressure >= 35 || token.trust < 35)
    return ACTION_CATALOG.FIGHT_FUD;
  if (token.communityStrength < 35) return ACTION_CATALOG.CREATE_MEME_PACK;
  if (token.fatigue >= 55) return ACTION_CATALOG.START_LORE_THREAD;
  return ACTION_CATALOG.POST_MEME;
}

export function actionListByIntent() {
  const intents = [
    "Grow Attention",
    "Build Trust",
    "Strengthen Community",
    "Fight Trouble",
    "High Risk Plays"
  ] as const;
  return intents.map((intent) => ({
    intent,
    actions: Object.values(ACTION_CATALOG).filter(
      (action) => action.intent === intent
    ) as Array<ActionDefinition & { id: ActionId }>
  }));
}

export function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
    notation: "compact",
    style: "currency",
    currency: "USD"
  }).format(value);
}

export function formatPrice(value: number) {
  return value < 0.01 ? value.toExponential(2) : value.toFixed(4);
}
