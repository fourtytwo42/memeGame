import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Badge,
  Button,
  Kicker,
  MetricChip,
  NeonPanel,
  Panel,
  ProgressMeter,
  StatBar
} from "@meme-foundry/ui";
import { auth } from "@/auth";
import { PublicMarketChart } from "@/components/game/public-market-chart";
import { RealtimeStatus } from "@/components/realtime/realtime-status";
import { AppShell } from "@/components/shell/app-shell";
import { narrativeImage } from "@/lib/assets";
import {
  formatCompactCurrency,
  formatPrice,
  graduationProgress,
  statGroups
} from "@/lib/game-state";
import {
  SUPPORT_ACTION_CATALOG,
  type SupportActionId
} from "@/lib/server/support-actions";
import { prisma } from "@meme-foundry/db";
import {
  ArrowRight,
  HeartHandshake,
  Info,
  MessageCircle,
  Palette,
  Radio,
  Users,
  Zap
} from "lucide-react";
import { supportTokenAction } from "./actions";

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

function cooldownLabel(seconds: number) {
  if (seconds <= 0) return "Ready now";
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} min cooldown`;
}

function displaySupportLabel(actionId: string) {
  if (actionId === "SHARE_LAUNCH") return "Signal Boost";
  return SUPPORT_ACTION_CATALOG[actionId as SupportActionId]?.label ?? actionId;
}

function supportCardTone(actionId: string) {
  if (actionId === "MAKE_MEME") return "border-pink-300/25 bg-pink-400/10";
  if (actionId === "DEFEND_CHAT") return "border-cyan-300/25 bg-cyan-400/10";
  if (actionId === "WRITE_LORE") return "border-violet-300/25 bg-violet-400/10";
  if (actionId === "SHARE_LAUNCH") return "border-lime-300/25 bg-lime-300/10";
  return "border-white/10 bg-slate-950/55";
}

export default async function PublicTokenPage({
  params,
  searchParams
}: PageProps) {
  const [{ id }, query, session] = await Promise.all([
    params,
    searchParams,
    auth()
  ]);

  const token = await prisma.launchToken.findUnique({
    where: { id },
    include: {
      user: true,
      crew: true,
      ticks: { orderBy: { createdAt: "asc" }, take: 48 },
      events: { orderBy: { createdAt: "desc" }, take: 10 },
      imageJobs: { orderBy: { createdAt: "desc" }, take: 3 },
      supportActions: {
        orderBy: { createdAt: "desc" },
        take: 24,
        include: { user: true, crew: true }
      }
    }
  });
  if (!token || !["live", "graduated"].includes(token.status)) notFound();

  const now = Date.now();
  const sessionUser = session?.user
    ? await prisma.user.findUnique({ where: { id: session.user.id } })
    : null;
  const recentForViewer = sessionUser
    ? await prisma.supportAction.findMany({
        where: { userId: sessionUser.id, tokenId: token.id },
        orderBy: { createdAt: "desc" }
      })
    : [];
  const latestByAction = new Map(
    recentForViewer.map((action) => [action.actionType, action.createdAt])
  );
  const supporterCount = new Set(
    token.supportActions.map((action) => action.userId)
  ).size;
  const lastHourSupport = await prisma.supportAction.count({
    where: {
      tokenId: token.id,
      createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) }
    }
  });
  const narrativeMeta =
    token.seasonId && token.narrativeSlug
      ? await prisma.narrativeMeta.findUnique({
          where: {
            seasonId_slug: {
              seasonId: token.seasonId,
              slug: token.narrativeSlug
            }
          }
        })
      : null;
  const topSupporters = Array.from(
    [...token.supportActions]
      .reduce((map, support) => {
        const current = map.get(support.userId);
        if (current) {
          current.actions += 1;
          return map;
        }
        map.set(support.userId, {
          actions: 1,
          latestAction: displaySupportLabel(support.actionType),
          username: support.user.username
        });
        return map;
      }, new Map<string, { username: string; actions: number; latestAction: string }>())
      .values()
  )
    .sort((a, b) => b.actions - a.actions)
    .slice(0, 5);
  const latestImageJob = token.imageJobs[0];
  const successAction = readParam(query, "support");
  const error = readParam(query, "error");
  const successLabel =
    successAction && successAction in SUPPORT_ACTION_CATALOG
      ? displaySupportLabel(successAction)
      : null;
  const chartTicks = token.ticks.length
    ? token.ticks
    : [
        {
          createdAt: token.updatedAt,
          marketCap: token.simulatedMarketCap,
          holders: token.simulatedHolders
        }
      ];
  const isOwner = sessionUser?.id === token.userId;

  return (
    <AppShell>
      <div className="grid gap-4" data-testid="public-token-page">
        {successLabel ? (
          <Panel
            className="border-emerald-300/25 bg-emerald-300/10"
            data-testid="support-success"
          >
            <div className="flex gap-3 text-emerald-100">
              <HeartHandshake aria-hidden="true" />
              <p className="font-bold">
                {successLabel} landed. The launch stats, feed, and live
                listeners were updated.
              </p>
            </div>
          </Panel>
        ) : null}
        {error ? (
          <Panel
            className="border-amber-300/25 bg-amber-300/10"
            data-testid="support-error"
          >
            <div className="flex gap-3 text-amber-100">
              <Info aria-hidden="true" />
              <p className="font-bold">{error}</p>
            </div>
          </Panel>
        ) : null}

        <NeonPanel
          className="border-lime-300/25"
          data-testid="public-token-header"
          tone="lime"
        >
          <div className="grid gap-5 lg:grid-cols-[15rem_minmax(0,1fr)_17rem] lg:items-center">
            <div className="rounded-lg border border-lime-300/25 bg-slate-950/55 p-4 shadow-[0_0_34px_rgba(132,204,22,0.16)]">
              <Image
                alt={`${token.name} token art`}
                className="mx-auto size-52 object-contain"
                height={208}
                priority
                src={
                  token.cardImageUrl ??
                  token.placeholderImageUrl ??
                  "/assets/game/tokens/default-token-mascot.png"
                }
                width={208}
              />
            </div>
            <div>
              <Kicker className="text-lime-100">Public launch page</Kicker>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={token.status === "graduated" ? "good" : "neutral"}>
                  {token.status}
                </Badge>
                <Badge>${token.ticker}</Badge>
                <span className="text-sm font-bold text-slate-300">
                  Founder {token.user.username}
                </span>
                {token.crew ? <Badge>Crew {token.crew.name}</Badge> : null}
              </div>
              <h1 className="mt-3 text-3xl font-black text-white sm:text-5xl">
                {token.name}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                {token.description ??
                  "A fictional launch competing for attention, support, and seasonal score. No real trading or liquidity is involved."}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MetricChip
                  label="Market cap"
                  tone="good"
                  value={formatCompactCurrency(token.simulatedMarketCap)}
                />
                <MetricChip
                  label="Holders"
                  value={token.simulatedHolders.toLocaleString()}
                />
                <MetricChip
                  label="Score"
                  tone="warn"
                  value={token.score.toLocaleString()}
                />
                <MetricChip
                  label="Support"
                  tone="hot"
                  value={`${supporterCount}`}
                />
              </div>
            </div>
            <div className="grid gap-3 rounded-lg border border-white/10 bg-slate-950/55 p-4">
              <div className="flex items-center gap-2 text-lime-200">
                <Radio size={18} />
                <span className="text-sm font-black uppercase">
                  Live support
                </span>
              </div>
              <p className="text-3xl font-black text-white">{supporterCount}</p>
              <p className="text-sm text-slate-400">
                unique supporters shown from recent activity. {lastHourSupport}{" "}
                support moves landed in the last hour.
              </p>
              <ProgressMeter
                label="Graduation"
                tone="good"
                value={graduationProgress(token)}
              />
            </div>
          </div>
        </NeonPanel>

        <section className="grid gap-4 xl:grid-cols-[1.3fr_0.85fr]">
          <Panel data-testid="public-token-market">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-lime-200">
                  Public stats
                </p>
                <h2 className="text-2xl font-black text-white">
                  Market-style simulation
                </h2>
              </div>
              <Badge tone="neutral">not real trading</Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              <MetricChip
                label="Market cap"
                tone="good"
                value={formatCompactCurrency(token.simulatedMarketCap)}
              />
              <MetricChip
                label="Price"
                value={formatPrice(token.simulatedPrice)}
              />
              <MetricChip
                label="Holders"
                value={token.simulatedHolders.toLocaleString()}
              />
              <MetricChip
                label="Score"
                tone="warn"
                value={token.score.toLocaleString()}
              />
            </div>
            <div className="mt-4">
              <PublicMarketChart
                points={chartTicks.map((tick, index) => ({
                  label:
                    index === chartTicks.length - 1 ? "Now" : `${index + 1}`,
                  marketCap: tick.marketCap,
                  holders: tick.holders
                }))}
              />
            </div>
          </Panel>

          <div className="grid gap-4">
            <RealtimeStatus
              seasonId={token.seasonId}
              tokenId={token.id}
              userId={sessionUser?.id}
            />
            <Panel data-testid="public-token-stat-summary">
              <h2 className="mb-4 flex items-center gap-2 font-black text-white">
                <Zap className="text-lime-300" size={18} /> Launch health
              </h2>
              <div className="grid gap-4">
                {statGroups(token).map((group) => (
                  <div key={group.label}>
                    <StatBar
                      label={group.label}
                      tone={group.tone}
                      value={group.value}
                    />
                    <p className="mt-2 text-sm leading-5 text-slate-400">
                      {group.detail}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <ProgressMeter
                  label="Graduation progress"
                  tone="good"
                  value={graduationProgress(token)}
                />
              </div>
            </Panel>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <Panel data-testid="support-action-catalog">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">
                  Support actions
                </p>
                <h2 className="text-2xl font-black text-white">
                  Help without trading
                </h2>
              </div>
              {sessionUser ? (
                <Badge tone="good">
                  Support energy {sessionUser.supportEnergy}/100
                </Badge>
              ) : (
                <Badge tone="warn">Sign in to support</Badge>
              )}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {(
                [
                  SUPPORT_ACTION_CATALOG.MAKE_MEME,
                  SUPPORT_ACTION_CATALOG.DEFEND_CHAT,
                  SUPPORT_ACTION_CATALOG.WRITE_LORE,
                  SUPPORT_ACTION_CATALOG.SHARE_LAUNCH
                ] satisfies Array<
                  (typeof SUPPORT_ACTION_CATALOG)[SupportActionId]
                >
              ).map((action) => {
                const last = latestByAction.get(action.id);
                const remainingSeconds = last
                  ? Math.max(
                      0,
                      Math.ceil(
                        (last.getTime() + action.cooldownSeconds * 1000 - now) /
                          1000
                      )
                    )
                  : 0;
                const disabledReason = !sessionUser
                  ? "Sign in to support."
                  : isOwner
                    ? "You cannot support your own launch here."
                    : token.status !== "live"
                      ? "Only live launches can receive support."
                      : sessionUser.supportEnergy < action.energyCost
                        ? "Not enough support energy."
                        : remainingSeconds > 0
                          ? cooldownLabel(remainingSeconds)
                          : null;
                return (
                  <form
                    action={supportTokenAction}
                    className={`rounded-md border p-4 ${supportCardTone(action.id)}`}
                    data-testid={`support-action-${action.id}`}
                    key={action.id}
                  >
                    <input name="tokenId" type="hidden" value={token.id} />
                    <input name="actionId" type="hidden" value={action.id} />
                    <input
                      name="nonce"
                      type="hidden"
                      value={`${token.id}-${action.id}-${Date.now()}`}
                    />
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-black text-white">
                          {displaySupportLabel(action.id)}
                        </h3>
                        <p className="mt-2 text-sm leading-5 text-slate-300">
                          {action.plainPurpose}
                        </p>
                      </div>
                      <HeartHandshake
                        className="shrink-0 text-cyan-300"
                        size={22}
                      />
                    </div>
                    <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                      <div className="rounded-md bg-emerald-300/10 p-2 text-emerald-100">
                        {action.upside}
                      </div>
                      <div className="rounded-md bg-amber-300/10 p-2 text-amber-100">
                        {action.downside}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-300">
                      <span className="rounded-full bg-white/10 px-2 py-1">
                        Energy {action.energyCost}
                      </span>
                      <span className="rounded-full bg-white/10 px-2 py-1">
                        {cooldownLabel(remainingSeconds)}
                      </span>
                    </div>
                    {disabledReason ? (
                      <p className="mt-3 text-sm font-semibold text-amber-200">
                        {disabledReason}
                      </p>
                    ) : null}
                    {sessionUser ? (
                      <Button
                        className="mt-4 w-full"
                        disabled={Boolean(disabledReason)}
                        type="submit"
                      >
                        Support launch
                      </Button>
                    ) : (
                      <Link
                        className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950 hover:bg-cyan-200"
                        href="/signin"
                      >
                        Sign in to support <ArrowRight size={16} />
                      </Link>
                    )}
                  </form>
                );
              })}
            </div>
          </Panel>

          <div className="grid gap-4">
            <Panel data-testid="public-token-ecosystem">
              <h2 className="mb-4 flex items-center gap-2 font-black text-white">
                <Radio className="text-lime-300" size={18} /> Ecosystem
              </h2>
              <div className="grid gap-3">
                <div className="grid grid-cols-[4rem_minmax(0,1fr)] gap-3 rounded-md border border-white/10 bg-slate-950/55 p-3">
                  <Image
                    alt={`${token.narrative} narrative art`}
                    className="size-16 rounded-md border border-white/10 bg-slate-950/70 object-contain p-1"
                    height={64}
                    src={narrativeImage(token.narrativeSlug ?? token.narrative)}
                    width={64}
                  />
                  <div>
                    <p className="font-black text-white">{token.narrative}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      Heat {narrativeMeta?.heat ?? token.narrativeStrength}% ·
                      Fatigue {narrativeMeta?.fatigue ?? token.fatigue}%
                    </p>
                  </div>
                </div>
                <div className="rounded-md border border-white/10 bg-slate-950/55 p-3">
                  <p className="font-black text-white">Image pipeline</p>
                  <p className="mt-1 text-sm text-slate-400">
                    {latestImageJob
                      ? `${latestImageJob.status} · ${latestImageJob.model ?? "local procedural"}`
                      : token.cardImageUrl
                        ? "ready · project-local generated art"
                        : "fallback art active · generation can run later"}
                  </p>
                </div>
                <div className="rounded-md border border-white/10 bg-slate-950/55 p-3">
                  <p className="font-black text-white">Simulated-only</p>
                  <p className="mt-1 text-sm text-slate-400">
                    No wallet, no real liquidity, no real trading. Support
                    actions only affect game stats.
                  </p>
                </div>
              </div>
            </Panel>
            <Panel data-testid="top-supporters-panel">
              <h2 className="mb-4 flex items-center gap-2 font-black text-white">
                <Users className="text-cyan-300" size={18} /> Top supporters
              </h2>
              <div className="grid gap-2">
                {topSupporters.length ? (
                  topSupporters.map((supporter) => (
                    <div
                      className="flex items-center justify-between gap-3 rounded-md bg-slate-950/55 p-3"
                      key={supporter.username}
                    >
                      <div>
                        <p className="font-black text-white">
                          {supporter.username}
                        </p>
                        <p className="text-xs text-slate-400">
                          {supporter.latestAction}
                        </p>
                      </div>
                      <Badge tone="good">{supporter.actions}x</Badge>
                    </div>
                  ))
                ) : (
                  <p className="rounded-md bg-slate-950/45 p-3 text-sm text-slate-400">
                    No supporters yet. The first support move will appear here.
                  </p>
                )}
              </div>
            </Panel>
            <Panel data-testid="supporter-list">
              <h2 className="mb-4 flex items-center gap-2 font-black text-white">
                <Users className="text-cyan-300" size={18} /> Recent supporters
              </h2>
              <div className="grid gap-2">
                {token.supportActions.length ? (
                  token.supportActions.slice(0, 10).map((support) => (
                    <div
                      className="flex items-center justify-between gap-3 rounded-md bg-slate-950/55 p-3"
                      key={support.id}
                    >
                      <div>
                        <p className="font-black text-white">
                          {support.user.username}
                        </p>
                        <p className="text-xs text-slate-400">
                          {SUPPORT_ACTION_CATALOG[
                            support.actionType as SupportActionId
                          ]
                            ? displaySupportLabel(support.actionType)
                            : support.actionType}
                        </p>
                      </div>
                      <Badge>Energy {support.energyCost}</Badge>
                    </div>
                  ))
                ) : (
                  <p className="rounded-md bg-slate-950/45 p-3 text-sm text-slate-400">
                    No support actions yet. Be the first person to help this
                    launch.
                  </p>
                )}
              </div>
            </Panel>

            <Panel data-testid="npc-chatter-panel">
              <h2 className="mb-4 flex items-center gap-2 font-black text-white">
                <MessageCircle className="text-pink-300" size={18} /> NPC feed
              </h2>
              <div className="grid gap-3">
                {token.events.slice(0, 3).map((event) => (
                  <div
                    className="rounded-md border border-white/10 bg-slate-950/55 p-3"
                    key={`npc-${event.id}`}
                  >
                    <p className="font-black text-white">
                      @
                      {event.severity === "warning"
                        ? "risk_watch"
                        : "meme_scout"}
                    </p>
                    <p className="mt-1 text-sm leading-5 text-slate-400">
                      {event.description}
                    </p>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel data-testid="public-token-event-feed">
              <h2 className="mb-4 flex items-center gap-2 font-black text-white">
                <Palette className="text-lime-300" size={18} /> Public event
                feed
              </h2>
              <div className="grid gap-3">
                {token.events.map((event) => (
                  <div
                    className="rounded-md border border-white/10 bg-slate-950/55 p-3"
                    key={event.id}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-black text-white">{event.title}</p>
                      <Badge
                        tone={event.severity === "warning" ? "warn" : "neutral"}
                      >
                        {event.severity}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm leading-5 text-slate-400">
                      {event.description}
                    </p>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
