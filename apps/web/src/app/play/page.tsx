import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Badge,
  EventRow,
  Kicker,
  MetricChip,
  NeonPanel,
  Panel,
  ProgressMeter
} from "@meme-foundry/ui";
import { auth } from "@/auth";
import { AppShell } from "@/components/shell/app-shell";
import { StatGroupSummary } from "@/components/game/approachability";
import { narrativeImage, tokenImage } from "@/lib/assets";
import { formatCompactCurrency, graduationProgress } from "@/lib/game-state";
import { prisma } from "@meme-foundry/db";
import { ArrowRight, Flame, Sparkles, Trophy, Users, Zap } from "lucide-react";

export const dynamic = "force-dynamic";

type PlayProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(
  params: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function PlayPage({ searchParams }: PlayProps) {
  const session = await auth();
  if (!session?.user) redirect("/signin" as Route);
  const query = await searchParams;

  const [profile, token, events, narratives, leaders, crew] = await Promise.all(
    [
      prisma.founderProfile.findUnique({ where: { userId: session.user.id } }),
      prisma.launchToken.findFirst({
        where: { userId: session.user.id },
        orderBy: { updatedAt: "desc" },
        include: {
          ticks: { orderBy: { createdAt: "desc" }, take: 10 }
        }
      }),
      prisma.gameEvent.findMany({ orderBy: { createdAt: "desc" }, take: 4 }),
      prisma.narrativeMeta.findMany({ orderBy: { heat: "desc" }, take: 4 }),
      prisma.launchToken.findMany({
        where: { status: { in: ["live", "graduated"] } },
        orderBy: [{ score: "desc" }, { simulatedMarketCap: "desc" }],
        take: 5,
        include: { user: true }
      }),
      prisma.crew.findFirst({
        where: { members: { some: { userId: session.user.id } } },
        include: { members: { take: 4, include: { user: true } } }
      })
    ]
  );

  const launched = firstParam(query, "launched");
  if (launched && token?.id === launched) {
    redirect(`/launch/${token.id}/manage?launched=1` as Route);
  }

  const hasToken = Boolean(token);
  const ctaHref = !profile
    ? "/profile"
    : token
      ? (`/launch/${token.id}/manage` as Route)
      : "/launch/new";
  const ctaTitle = !profile
    ? "Create founder profile"
    : token
      ? "Manage active launch"
      : "Create your first token";
  const progress = token ? graduationProgress(token) : 0;
  const sparkline = token ? [...token.ticks].reverse() : [];
  const sparkMax = Math.max(
    1,
    ...sparkline.map((tick) => Math.round(tick.marketCap))
  );

  return (
    <AppShell>
      <div className="grid gap-4" data-testid="play-command-hub">
        <section className="grid gap-4 xl:grid-cols-[1.2fr_0.95fr_1.45fr]">
          <NeonPanel tone="lime" data-testid="play-primary-panel">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={hasToken ? "good" : "warn"}>
                {hasToken ? "Active token" : "First launch"}
              </Badge>
              <Badge tone="neutral">No real trading</Badge>
              <span className="text-sm font-bold text-slate-300">
                Signed in as {session.user.username}
              </span>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-[9rem_1fr] sm:items-center">
              <div className="relative grid size-32 place-items-center overflow-hidden rounded-lg border border-lime-300/30 bg-slate-950/65 shadow-[0_0_24px_rgba(132,204,22,0.16)]">
                <Image
                  alt={
                    token
                      ? `${token.name} token art`
                      : "Meme Foundry token mascot"
                  }
                  className="size-full object-contain p-2"
                  height={128}
                  priority
                  src={tokenImage(token)}
                  width={128}
                />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white sm:text-4xl">
                  {token ? token.name : "Start your first launch"}
                </h1>
                <p className="mt-2 text-sm font-bold text-lime-200">
                  {token
                    ? `$${token.ticker} · ${token.status}`
                    : "Guided launch setup"}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {token
                    ? "Run the dashboard, spend limited resources, and push toward graduation before risk burns the launch down."
                    : "Create a fictional token, pick a trend, and learn the loop through one obvious next action."}
                </p>
              </div>
            </div>
            {token ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <MetricChip
                  label="Hype score"
                  tone="good"
                  value={`${token.hype}/100`}
                />
                <MetricChip
                  label="Holders"
                  value={token.simulatedHolders.toLocaleString()}
                />
                <MetricChip
                  label="Market cap"
                  value={formatCompactCurrency(token.simulatedMarketCap)}
                />
              </div>
            ) : null}
            {sparkline.length ? (
              <div className="mt-5 rounded-md border border-lime-300/15 bg-slate-950/45 p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-xs font-black uppercase text-slate-400">
                    Market pulse
                  </p>
                  <p className="text-xs font-black text-lime-200">live sim</p>
                </div>
                <div className="flex h-16 items-end gap-1">
                  {sparkline.map((tick) => (
                    <div
                      className="min-w-0 flex-1 rounded-t bg-lime-300/80 shadow-[0_0_14px_rgba(190,242,100,0.22)]"
                      key={tick.id}
                      style={{
                        height: `${Math.max(14, Math.round((tick.marketCap / sparkMax) * 100))}%`
                      }}
                      title={formatCompactCurrency(tick.marketCap)}
                    />
                  ))}
                </div>
              </div>
            ) : null}
            {token ? (
              <div className="mt-5">
                <ProgressMeter label="Graduation progress" value={progress} />
              </div>
            ) : null}
            <Link
              className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-lime-300/50 bg-lime-300 px-4 py-2 text-sm font-black text-slate-950 hover:bg-lime-200"
              href={ctaHref as Route}
            >
              {token ? "Manage launch" : ctaTitle}
              <ArrowRight aria-hidden="true" size={18} />
            </Link>
          </NeonPanel>

          <Panel
            className="border-violet-300/25 bg-violet-400/10"
            data-testid="recommended-action-card"
          >
            <div className="flex items-start gap-3">
              <span className="grid size-14 shrink-0 place-items-center rounded-lg bg-violet-500/25 text-violet-200">
                <Sparkles aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-200">
                  Recommended
                </p>
                <h2 className="mt-1 text-2xl font-black text-white">
                  {ctaTitle}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {!profile
                    ? "Set up your founder identity so launches and results feel owned."
                    : token
                      ? "Your active launch has a live dashboard with actions, chart movement, and risk explanations."
                      : "You do not have an active token yet. Launching starts the playable loop."}
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              <div className="rounded-md border border-white/10 bg-slate-950/50 p-3">
                <p className="text-xs font-bold uppercase text-slate-400">
                  Action
                </p>
                <p className="mt-1 font-black text-white">
                  {token ? "Take the next dashboard action" : ctaTitle}
                </p>
              </div>
              <div className="rounded-md border border-white/10 bg-slate-950/50 p-3">
                <p className="text-xs font-bold uppercase text-slate-400">
                  Tradeoff
                </p>
                <p className="mt-1 font-black text-amber-200">
                  {token ? "Costs energy or budget" : "No gameplay risk"}
                </p>
              </div>
            </div>
            <Link
              className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-violet-500 px-4 py-2 text-sm font-black text-white hover:bg-violet-400"
              href={ctaHref as Route}
            >
              Take action
              <ArrowRight aria-hidden="true" size={18} />
            </Link>
          </Panel>

          <Panel data-testid="narrative-heat-panel">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <Kicker>Narrative heat</Kicker>
                <h2 className="text-xl font-black text-white">Live metas</h2>
              </div>
              <Flame className="text-pink-300" />
            </div>
            <div className="grid gap-3">
              {narratives.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[3.25rem_minmax(0,1fr)] gap-3 rounded-md border border-white/10 bg-slate-950/55 p-3"
                >
                  <Image
                    alt={`${item.name} narrative art`}
                    className="size-12 rounded-md bg-slate-950/80 object-contain p-1"
                    height={48}
                    src={narrativeImage(item.slug)}
                    width={48}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <span className="break-words font-black text-white">
                        {item.name}
                      </span>
                      <Badge tone={item.heat > 70 ? "good" : "neutral"}>
                        {item.heat}
                      </Badge>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-pink-400"
                        style={{ width: `${item.heat}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1fr_0.85fr_1fr]">
          <Panel data-testid="recent-events-panel">
            <h2 className="mb-4 flex items-center gap-2 font-black text-white">
              <Zap className="text-lime-300" size={18} /> Global events
            </h2>
            <div className="grid gap-3">
              {events.length ? (
                events.map((event) => (
                  <EventRow
                    detail={event.description}
                    icon={<Zap aria-hidden="true" size={18} />}
                    key={event.id}
                    meta={event.severity}
                    title={event.title}
                  />
                ))
              ) : (
                <p className="text-sm text-slate-400">
                  No major events yet. The first active situation appears after
                  gameplay actions start.
                </p>
              )}
            </div>
          </Panel>

          <Panel data-testid="leaderboard-preview-panel">
            <h2 className="mb-4 flex items-center gap-2 font-black text-white">
              <Trophy className="text-amber-300" size={18} /> Leaderboard
            </h2>
            <div className="grid gap-2">
              {leaders.map((leader, index) => (
                <div
                  className="grid min-w-0 gap-3 rounded-md bg-slate-950/55 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                  key={leader.id}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-7 place-items-center rounded-full bg-amber-300 text-sm font-black text-slate-950">
                      {index + 1}
                    </span>
                    <Image
                      alt={`${leader.name} token art`}
                      className="size-11 shrink-0 rounded-md bg-slate-900 object-cover"
                      height={44}
                      src={
                        leader.cardImageUrl ??
                        leader.placeholderImageUrl ??
                        "/assets/game/tokens/default-token-mascot.png"
                      }
                      width={44}
                    />
                    <div className="min-w-0">
                      <p className="break-words font-black text-white">
                        {leader.name}
                      </p>
                      <p className="break-words text-xs text-slate-400">
                        {leader.user.username}
                      </p>
                    </div>
                  </div>
                  <span className="font-black text-pink-300 sm:text-right">
                    {leader.score.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
            <Link
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-sm font-black text-white hover:bg-white/10"
              href="/leaderboard"
            >
              View leaderboard
            </Link>
          </Panel>

          <Panel data-testid="crew-status-panel">
            <h2 className="mb-4 flex items-center gap-2 font-black text-white">
              <Users className="text-cyan-300" size={18} /> Crew status
            </h2>
            {crew ? (
              <div>
                <p className="text-2xl font-black text-white">{crew.name}</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {crew.description ?? "Crew coordination is active."}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {crew.members.map((member) => (
                    <div
                      className="rounded-md bg-slate-950/55 p-3"
                      key={member.id}
                    >
                      <p className="font-black text-white">
                        {member.user.username}
                      </p>
                      <p className="text-xs uppercase text-lime-300">
                        {member.role}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid gap-3 rounded-md border border-dashed border-cyan-300/20 bg-cyan-300/5 p-4 sm:grid-cols-[5rem_minmax(0,1fr)]">
                <Image
                  alt=""
                  aria-hidden="true"
                  className="size-20 rounded-md border border-white/10 bg-slate-950/60 object-contain p-2"
                  height={80}
                  src="/assets/game/crews/default-avatar.png"
                  width={80}
                />
                <div>
                  <p className="font-black text-white">No crew yet</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Crews unlock coordinated boosts, shared energy, and featured
                    launch support. Your active launch is playable now.
                  </p>
                  <Link
                    className="mt-3 inline-flex min-h-10 items-center justify-center rounded-md bg-cyan-300 px-3 py-2 text-sm font-black text-slate-950 hover:bg-cyan-200"
                    href="/crews"
                  >
                    Find a crew
                  </Link>
                </div>
              </div>
            )}
          </Panel>
        </section>

        {!token ? <StatGroupSummary /> : null}
      </div>
    </AppShell>
  );
}
