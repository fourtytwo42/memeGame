export type TokenStatus =
  | "draft"
  | "live"
  | "dead"
  | "rugged"
  | "graduated"
  | "archived";

export type GraduationType =
  | "Clean Graduation"
  | "Chaotic Graduation"
  | "Community Graduation"
  | "Meme Graduation"
  | "Whale Graduation"
  | "Standard Graduation";

export type ActionIntent =
  | "Grow Attention"
  | "Build Trust"
  | "Strengthen Community"
  | "Fight Trouble"
  | "High Risk Plays";

export type TokenStats = {
  hype: number;
  trust: number;
  memeQuality: number;
  narrativeStrength: number;
  communityStrength: number;
  whaleInterest: number;
  botRisk: number;
  fudPressure: number;
  fatigue: number;
};

export type MarketState = {
  simulatedPrice: number;
  simulatedMarketCap: number;
  simulatedLiquidity: number;
  simulatedHolders: number;
  simulatedVolume: number;
  treasury: number;
  gameProfit: number;
  score: number;
};

export type TokenState = TokenStats &
  MarketState & {
    id: string;
    status: TokenStatus;
    narrativeSlug?: string | null;
    launchedAtMinutesAgo: number;
    peakMarketCap: number;
  };

export type NarrativeState = {
  slug: string;
  heat: number;
  saturation: number;
  fatigue: number;
  activeLaunches: number;
};

export type ActionDefinition = {
  id: string;
  label: string;
  intent: ActionIntent;
  plainPurpose: string;
  upside: string;
  downside: string;
  cost: number;
  energyCost: number;
  cooldownSeconds: number;
  effects: Partial<TokenStats & MarketState>;
  riskLevel: "low" | "medium" | "high";
};

export type ActionResult = {
  action: ActionDefinition;
  before: TokenState;
  after: TokenState;
  deltas: Partial<TokenStats & MarketState>;
  explanation: string;
  idempotencyKey: string;
};

export type TickResult = {
  before: TokenState;
  after: TokenState;
  attention: number;
  sellPressure: number;
  momentum: number;
  priceChangePercent: number;
  holderDelta: number;
  graduationType: GraduationType | null;
  failure: "dead" | "rugged" | null;
  randomNoise: number;
};

const statKeys = [
  "hype",
  "trust",
  "memeQuality",
  "narrativeStrength",
  "communityStrength",
  "whaleInterest",
  "botRisk",
  "fudPressure",
  "fatigue"
] as const;

export const ACTION_CATALOG = {
  POST_MEME: {
    id: "POST_MEME",
    label: "Post Meme",
    intent: "Grow Attention",
    plainPurpose: "Get quick attention with a small fatigue cost.",
    upside: "+ Hype, + Meme quality",
    downside: "+ Fatigue",
    cost: 0,
    energyCost: 5,
    cooldownSeconds: 300,
    effects: { hype: 8, memeQuality: 3, fatigue: 2 },
    riskLevel: "low"
  },
  COMMISSION_ART: {
    id: "COMMISSION_ART",
    label: "Commission Art",
    intent: "Strengthen Community",
    plainPurpose:
      "Improve the token identity and give holders something to share.",
    upside: "+ Meme quality, + Trust",
    downside: "Costs budget",
    cost: 200,
    energyCost: 8,
    cooldownSeconds: 900,
    effects: { memeQuality: 10, trust: 2, treasury: -200 },
    riskLevel: "low"
  },
  CREATE_MEME_PACK: {
    id: "CREATE_MEME_PACK",
    label: "Create Meme Pack",
    intent: "Strengthen Community",
    plainPurpose:
      "Give the community reusable material and a reason to participate.",
    upside: "+ Meme quality, + Community, + Hype",
    downside: "No major downside",
    cost: 0,
    energyCost: 10,
    cooldownSeconds: 1200,
    effects: { memeQuality: 7, communityStrength: 5, hype: 5 },
    riskLevel: "low"
  },
  START_LORE_THREAD: {
    id: "START_LORE_THREAD",
    label: "Start Lore Thread",
    intent: "Build Trust",
    plainPurpose: "Make the launch easier to understand and rally around.",
    upside: "+ Narrative, + Community",
    downside: "+ Fatigue",
    cost: 0,
    energyCost: 10,
    cooldownSeconds: 1200,
    effects: { narrativeStrength: 12, communityStrength: 5, fatigue: 3 },
    riskLevel: "low"
  },
  OPEN_COMMUNITY_CHAT: {
    id: "OPEN_COMMUNITY_CHAT",
    label: "Open Community Chat",
    intent: "Strengthen Community",
    plainPurpose: "Create a home base for supporters.",
    upside: "+ Community, + Trust",
    downside: "+ FUD pressure",
    cost: 0,
    energyCost: 8,
    cooldownSeconds: 900,
    effects: { communityStrength: 8, trust: 2, fudPressure: 1 },
    riskLevel: "low"
  },
  REWARD_EARLY_BELIEVERS: {
    id: "REWARD_EARLY_BELIEVERS",
    label: "Reward Early Believers",
    intent: "Build Trust",
    plainPurpose: "Make supporters feel seen and improve retention.",
    upside: "+ Community, + Trust",
    downside: "Costs budget",
    cost: 150,
    energyCost: 8,
    cooldownSeconds: 1500,
    effects: { communityStrength: 10, trust: 5, treasury: -150 },
    riskLevel: "low"
  },
  HOST_COMMUNITY_EVENT: {
    id: "HOST_COMMUNITY_EVENT",
    label: "Host Community Event",
    intent: "Strengthen Community",
    plainPurpose:
      "Create an activity spike without making the launch feel empty.",
    upside: "+ Community, + Hype",
    downside: "+ Fatigue",
    cost: 0,
    energyCost: 12,
    cooldownSeconds: 1800,
    effects: { communityStrength: 12, hype: 5, fatigue: 3 },
    riskLevel: "medium"
  },
  FIGHT_FUD: {
    id: "FIGHT_FUD",
    label: "Fight FUD",
    intent: "Fight Trouble",
    plainPurpose: "Push back on negative pressure before it scares holders.",
    upside: "+ Trust, - FUD",
    downside: "Costs energy that could grow attention",
    cost: 0,
    energyCost: 15,
    cooldownSeconds: 900,
    effects: { trust: 10, fudPressure: -12 },
    riskLevel: "low"
  },
  INFLUENCER_OUTREACH: {
    id: "INFLUENCER_OUTREACH",
    label: "Influencer Outreach",
    intent: "Grow Attention",
    plainPurpose: "Buy a burst of attention that may look less organic.",
    upside: "+ Hype, + Whale interest",
    downside: "Costs budget, - Trust, + FUD",
    cost: 400,
    energyCost: 14,
    cooldownSeconds: 2400,
    effects: {
      hype: 20,
      whaleInterest: 8,
      treasury: -400,
      trust: -4,
      fudPressure: 3
    },
    riskLevel: "medium"
  },
  COORDINATE_RAID: {
    id: "COORDINATE_RAID",
    label: "Coordinate Raid",
    intent: "High Risk Plays",
    plainPurpose: "Get attention fast, but the launch can look spammy.",
    upside: "+ Hype, + Community",
    downside: "+ Bot risk, - Trust",
    cost: 150,
    energyCost: 12,
    cooldownSeconds: 1800,
    effects: {
      hype: 15,
      communityStrength: 5,
      botRisk: 8,
      trust: -3,
      treasury: -150
    },
    riskLevel: "high"
  },
  PAID_VISIBILITY: {
    id: "PAID_VISIBILITY",
    label: "Paid Visibility",
    intent: "Grow Attention",
    plainPurpose: "Push the launch in front of more simulated people.",
    upside: "+ Hype, + Volume",
    downside: "+ Bot risk, costs budget",
    cost: 300,
    energyCost: 12,
    cooldownSeconds: 1800,
    effects: { hype: 18, simulatedVolume: 2500, botRisk: 10, treasury: -300 },
    riskLevel: "medium"
  },
  PARTNER_WITH_TOKEN: {
    id: "PARTNER_WITH_TOKEN",
    label: "Partner With Another Token",
    intent: "Build Trust",
    plainPurpose: "Borrow credibility and make the narrative feel bigger.",
    upside: "+ Narrative, + Community, + Whale interest",
    downside: "Can trigger rivalry later",
    cost: 0,
    energyCost: 10,
    cooldownSeconds: 2400,
    effects: { narrativeStrength: 8, communityStrength: 4, whaleInterest: 3 },
    riskLevel: "medium"
  },
  CONTROVERSY_BAIT: {
    id: "CONTROVERSY_BAIT",
    label: "Controversy Bait",
    intent: "High Risk Plays",
    plainPurpose: "Create attention by inviting conflict.",
    upside: "+ Hype",
    downside: "+ FUD, - Trust, + Fatigue",
    cost: 0,
    energyCost: 12,
    cooldownSeconds: 2400,
    effects: { hype: 25, fudPressure: 15, trust: -10, fatigue: 8 },
    riskLevel: "high"
  },
  FAKE_BIG_ANNOUNCEMENT: {
    id: "FAKE_BIG_ANNOUNCEMENT",
    label: "Fake Big Announcement",
    intent: "High Risk Plays",
    plainPurpose: "A reckless attention spike that can collapse trust.",
    upside: "+ Hype",
    downside: "Large trust loss and FUD spike",
    cost: 0,
    energyCost: 18,
    cooldownSeconds: 3600,
    effects: { hype: 30, trust: -20, fudPressure: 20 },
    riskLevel: "high"
  },
  MYSTERY_ROADMAP: {
    id: "MYSTERY_ROADMAP",
    label: "Mystery Roadmap",
    intent: "High Risk Plays",
    plainPurpose: "Hint at future plans without proving much.",
    upside: "+ Narrative, + Hype",
    downside: "Small trust loss",
    cost: 0,
    energyCost: 8,
    cooldownSeconds: 1800,
    effects: { narrativeStrength: 10, hype: 8, trust: -4 },
    riskLevel: "medium"
  },
  SUPPLY_BURN: {
    id: "SUPPLY_BURN",
    label: "Supply Burn",
    intent: "Build Trust",
    plainPurpose: "Signal commitment inside the fictional economy.",
    upside: "+ Trust, + Hype",
    downside: "Costs budget",
    cost: 100,
    energyCost: 8,
    cooldownSeconds: 1800,
    effects: { trust: 6, hype: 8, treasury: -100 },
    riskLevel: "low"
  }
} satisfies Record<string, ActionDefinition>;

export type ActionId = keyof typeof ACTION_CATALOG;

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function clampStat(value: number) {
  return clamp(Math.round(value), 0, 100);
}

export function normalizeTokenState(token: TokenState): TokenState {
  const normalized = { ...token };
  for (const key of statKeys) normalized[key] = clampStat(normalized[key]);
  normalized.simulatedPrice = Math.max(0.00000001, normalized.simulatedPrice);
  normalized.simulatedMarketCap = Math.max(0, normalized.simulatedMarketCap);
  normalized.simulatedLiquidity = Math.max(0, normalized.simulatedLiquidity);
  normalized.simulatedHolders = Math.max(
    0,
    Math.round(normalized.simulatedHolders)
  );
  normalized.simulatedVolume = Math.max(0, normalized.simulatedVolume);
  normalized.treasury = Math.max(0, normalized.treasury);
  normalized.peakMarketCap = Math.max(
    normalized.peakMarketCap,
    normalized.simulatedMarketCap
  );
  normalized.score = Math.max(0, Math.round(normalized.score));
  return normalized;
}

export function createDefaultTokenState(
  overrides: Partial<TokenState> = {}
): TokenState {
  return normalizeTokenState({
    id: "token-default",
    status: "live",
    narrativeSlug: "default",
    launchedAtMinutesAgo: 0,
    simulatedPrice: 0.000001,
    simulatedMarketCap: 1000,
    simulatedLiquidity: 500,
    simulatedHolders: 0,
    simulatedVolume: 0,
    hype: 10,
    trust: 50,
    memeQuality: 25,
    narrativeStrength: 25,
    communityStrength: 10,
    whaleInterest: 5,
    botRisk: 0,
    fudPressure: 5,
    fatigue: 0,
    treasury: 1000,
    gameProfit: 0,
    score: 0,
    peakMarketCap: 1000,
    ...overrides
  });
}

export function seededNoise(seed: string | number, min = -10, max = 10) {
  const input = String(seed);
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  const normalized = (hash >>> 0) / 4294967295;
  return min + normalized * (max - min);
}

export function calculateAttention(
  token: TokenState,
  narrative?: NarrativeState
) {
  const saturationPenalty = narrative ? narrative.saturation * 0.15 : 0;
  const heatBonus = narrative ? narrative.heat * 0.1 : 0;
  const fatiguePenalty = narrative ? narrative.fatigue * 0.2 : 0;
  const effectiveNarrative = clamp(
    token.narrativeStrength - saturationPenalty + heatBonus - fatiguePenalty,
    0,
    100
  );
  return (
    token.hype * 0.35 +
    token.memeQuality * 0.2 +
    effectiveNarrative * 0.2 +
    token.communityStrength * 0.15 +
    token.whaleInterest * 0.1
  );
}

export function calculateSellPressure(token: TokenState) {
  return (
    token.fatigue * 0.3 +
    token.fudPressure * 0.25 +
    token.botRisk * 0.2 +
    Math.max(0, 50 - token.trust) * 0.25
  );
}

export function calculateScore(token: TokenState) {
  const botRiskPenalty = token.botRisk * 50;
  const fudPenalty = token.fudPressure * 30;
  return Math.max(
    0,
    Math.round(
      token.gameProfit * 0.4 +
        token.peakMarketCap * 0.25 +
        token.simulatedHolders * 10 * 0.15 +
        token.trust * 100 * 0.1 +
        token.communityStrength * 100 * 0.1 -
        botRiskPenalty -
        fudPenalty
    )
  );
}

export function getGraduationType(token: TokenState): GraduationType | null {
  if (
    token.simulatedMarketCap < 69000 ||
    token.simulatedHolders < 1000 ||
    token.trust < 40 ||
    token.communityStrength < 60 ||
    token.fatigue > 80 ||
    token.botRisk > 85
  ) {
    return null;
  }
  if (token.trust >= 80 && token.botRisk <= 20) return "Clean Graduation";
  if (token.fudPressure >= 70 && token.hype >= 80) return "Chaotic Graduation";
  if (token.communityStrength >= 85) return "Community Graduation";
  if (token.memeQuality >= 85) return "Meme Graduation";
  if (token.whaleInterest >= 85) return "Whale Graduation";
  return "Standard Graduation";
}

export function getFailureState(token: TokenState): "dead" | "rugged" | null {
  if (token.trust <= 5 && token.fudPressure >= 80) return "rugged";
  if (
    token.simulatedMarketCap < 500 &&
    token.hype < 10 &&
    token.communityStrength < 15 &&
    token.launchedAtMinutesAgo > 30
  ) {
    return "dead";
  }
  return null;
}

export function actionIdempotencyKey(
  tokenId: string,
  actionId: ActionId,
  actorId: string,
  nonce: string
) {
  return `${tokenId}:${actorId}:${actionId}:${nonce}`;
}

export function applyAction(input: {
  token: TokenState;
  actionId: ActionId;
  actorId: string;
  nonce: string;
}): ActionResult {
  const action = ACTION_CATALOG[input.actionId];
  const before = normalizeTokenState(input.token);
  const next: TokenState = { ...before };
  const deltas: Partial<TokenStats & MarketState> = {};

  for (const [key, delta] of Object.entries(action.effects) as Array<
    [keyof (TokenStats & MarketState), number]
  >) {
    deltas[key] = delta;
    next[key] = Number(next[key] ?? 0) + delta;
  }

  const after = normalizeTokenState(next);
  after.score = calculateScore(after);

  return {
    action,
    before,
    after,
    deltas,
    explanation: `${action.label} changed the launch because it ${action.plainPurpose.toLowerCase()} Helps: ${action.upside}. Risk: ${action.downside}.`,
    idempotencyKey: actionIdempotencyKey(
      input.token.id,
      input.actionId,
      input.actorId,
      input.nonce
    )
  };
}

export function simulateTokenTick(input: {
  token: TokenState;
  narrative?: NarrativeState;
  seed: string | number;
  minutesElapsed?: number;
}): TickResult {
  const before = normalizeTokenState(input.token);
  if (before.status !== "live") {
    return {
      before,
      after: before,
      attention: 0,
      sellPressure: 0,
      momentum: 0,
      priceChangePercent: 0,
      holderDelta: 0,
      graduationType: null,
      failure: null,
      randomNoise: 0
    };
  }

  const randomNoise = seededNoise(input.seed, -10, 10);
  const attention = calculateAttention(before, input.narrative);
  const sellPressure = calculateSellPressure(before);
  const momentum = attention - sellPressure + randomNoise;
  const priceChangePercent = clamp(momentum / 100, -0.35, 0.45);
  const holderDelta = Math.round(
    attention * 2 - sellPressure + seededNoise(`${input.seed}:holders`, -50, 75)
  );
  const minutesElapsed = input.minutesElapsed ?? 1;
  const after = normalizeTokenState({
    ...before,
    launchedAtMinutesAgo: before.launchedAtMinutesAgo + minutesElapsed,
    simulatedPrice: before.simulatedPrice * (1 + priceChangePercent),
    simulatedMarketCap: before.simulatedMarketCap * (1 + priceChangePercent),
    simulatedVolume: Math.max(
      0,
      before.simulatedVolume * 0.65 + Math.abs(momentum) * 120
    ),
    simulatedHolders: before.simulatedHolders + holderDelta,
    hype: before.hype * 0.92,
    fatigue:
      before.fatigue +
      before.hype * 0.03 +
      Math.min(10, before.launchedAtMinutesAgo / 120),
    trust: before.trust - before.botRisk * 0.01 - before.fudPressure * 0.02
  });
  after.gameProfit = Math.max(0, after.simulatedMarketCap - 1000);
  after.score = calculateScore(after);

  const graduationType = getGraduationType(after);
  const failure = graduationType ? null : getFailureState(after);
  if (graduationType) after.status = "graduated";
  if (failure) after.status = failure;

  return {
    before,
    after,
    attention,
    sellPressure,
    momentum,
    priceChangePercent,
    holderDelta,
    graduationType,
    failure,
    randomNoise
  };
}

export function updateNarrativeMeta(input: {
  narrative: NarrativeState;
  activeLaunches: number;
  recentGraduations?: number;
  averageHype?: number;
  minutesElapsed?: number;
}): NarrativeState {
  const recentGraduations = input.recentGraduations ?? 0;
  const averageHype = input.averageHype ?? 0;
  const minutesElapsed = input.minutesElapsed ?? 5;
  return {
    ...input.narrative,
    activeLaunches: input.activeLaunches,
    saturation: clampStat(input.activeLaunches * 4),
    heat: clampStat(
      input.narrative.heat +
        recentGraduations * 6 +
        averageHype * 0.05 -
        input.narrative.fatigue * 0.03
    ),
    fatigue: clampStat(
      input.narrative.fatigue +
        input.activeLaunches * 0.4 +
        minutesElapsed * 0.05
    )
  };
}

export function simulateBulk(input: {
  tokens: TokenState[];
  narratives?: Record<string, NarrativeState>;
  ticks: number;
  seed: string | number;
}) {
  let tokens = input.tokens.map((token) => normalizeTokenState(token));
  const tickResults: TickResult[] = [];
  for (let tick = 0; tick < input.ticks; tick += 1) {
    tokens = tokens.map((token, index) => {
      const result = simulateTokenTick({
        token,
        narrative: token.narrativeSlug
          ? input.narratives?.[token.narrativeSlug]
          : undefined,
        seed: `${input.seed}:${tick}:${index}`
      });
      tickResults.push(result);
      return result.after;
    });
  }
  return { tokens, tickResults };
}
