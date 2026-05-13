import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Badge,
  Kicker,
  MetricChip,
  NeonPanel,
  Panel,
  ProgressMeter
} from "@meme-foundry/ui";
import { AppShell } from "@/components/shell/app-shell";
import { narrativeImage } from "@/lib/assets";
import { formatCompactCurrency } from "@/lib/game-state";
import { narrativeOpportunity } from "@/lib/server/world-state";
import { prisma } from "@meme-foundry/db";
import { Activity, RadioTower, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

type SeasonDetailProps = {
  params: Promise<{ slug: string }>;
};

function daysLeft(endsAt: Date) {
  return Math.max(0, Math.ceil((endsAt.getTime() - Date.now()) / 86400000));
}

function toneFor(label: string) {
  if (label === "Good opportunity" || label === "Undiscovered") return "good";
  if (label === "Cooling off" || label === "Crowded") return "warn";
  return "neutral";
}

export default async function SeasonDetailPage({ params }: SeasonDetailProps) {
  const { slug } = await params;
  const season = await prisma.season.findUnique({
    where: { slug },
    include: {
      narratives: { orderBy: [{ heat: "desc" }, { saturation: "asc" }] },
      events: { orderBy: { createdAt: "desc" }, take: 16 },
      tokens: {
        where: { status: { in: ["live", "graduated"] } },
        orderBy: [{ score: "desc" }, { simulatedMarketCap: "desc" }],
        take: 12,
        include: { user: true }
      },
      crews: {
        where: { moderationStatus: "active" },
        orderBy: [{ score: "desc" }, { updatedAt: "desc" }],
        take: 8
      }
    }
  });
  if (!season) notFound();

  const liveLaunches = season.tokens.filter(
    (token) => token.status === "live"
  ).length;

  return (
    <AppShell>
      <div className="grid gap-4" data-testid="season-detail-page">
        <NeonPanel tone="pink">
          <div className="grid gap-5 lg:grid-cols-[10rem_minmax(0,1fr)_22rem] lg:items-center">
            <Image
              alt={`${season.name} season banner art`}
              className="mx-auto size-36 object-contain"
              height={144}
              priority
              src="/assets/game/share/foundry-workshop.png"
              width={144}
            />
            <div>
              <Kicker>Season narrative map</Kicker>
              <Badge tone={season.status === "active" ? "good" : "neutral"}>
                {season.status} season
              </Badge>
              <h1 className="mt-3 text-3xl font-black text-white sm:text-5xl">
                {season.name}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                Track the current fictional attention economy: active
                narratives, leading launches, crew pressure, and public events.
                Scores are simulated game state, not real markets.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <MetricChip
                label="Time left"
                tone="good"
                value={`${daysLeft(season.endsAt)}d`}
              />
              <MetricChip
                label="Live launches"
                tone="hot"
                value={liveLaunches}
              />
              <MetricChip
                label="Narratives"
                tone="warn"
                value={season.narratives.length}
              />
            </div>
          </div>
        </NeonPanel>

        <section className="grid gap-4 xl:grid-cols-[1.35fr_0.85fr]">
          <Panel data-testid="season-detail-narratives">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-pink-200">
                  Narrative map
                </p>
                <h2 className="text-xl font-black text-white">
                  Opportunity by theme
                </h2>
              </div>
              <Activity className="text-pink-300" />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {season.narratives.map((narrative) => {
                const label = narrativeOpportunity(narrative);
                return (
                  <article
                    className="rounded-lg border border-white/10 bg-slate-950/55 p-4"
                    key={narrative.id}
                  >
                    <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3">
                      <Image
                        alt={`${narrative.name} narrative art`}
                        className="size-18 rounded-md border border-white/10 bg-slate-950/70 object-contain p-1"
                        height={72}
                        src={narrativeImage(narrative.name ?? narrative.slug)}
                        width={72}
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-black text-white">
                            {narrative.name}
                          </h3>
                          <Badge tone={toneFor(label)}>{label}</Badge>
                        </div>
                        <p className="mt-1 text-sm leading-5 text-slate-400">
                          {narrative.activeLaunches} active launches · meme
                          potential {narrative.memePotential}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3">
                      <ProgressMeter
                        label="Heat"
                        tone="hot"
                        value={narrative.heat}
                      />
                      <ProgressMeter
                        label="Saturation"
                        tone="warn"
                        value={narrative.saturation}
                      />
                      <ProgressMeter
                        label="Fatigue"
                        tone="bad"
                        value={narrative.fatigue}
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          </Panel>

          <aside className="grid content-start gap-4">
            <Panel data-testid="season-detail-top-launches">
              <h2 className="mb-4 flex items-center gap-2 font-black text-white">
                <TrendingUp className="text-lime-300" size={18} />
                Top launches
              </h2>
              <div className="grid gap-3">
                {season.tokens.map((token, index) => (
                  <Link
                    className="block min-w-0 rounded-md border border-white/10 bg-slate-950/55 p-3 hover:border-lime-300/40"
                    href={`/token/${token.id}`}
                    key={token.id}
                  >
                    <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                      <div className="min-w-0">
                        <p className="break-words font-black text-white">
                          {index + 1}. {token.name}
                        </p>
                        <p className="break-words text-xs text-slate-400">
                          ${token.ticker} · {token.user.username}
                        </p>
                      </div>
                      <Badge
                        tone={token.status === "graduated" ? "good" : "neutral"}
                      >
                        {token.status}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm font-black text-lime-300">
                      {formatCompactCurrency(token.simulatedMarketCap)}
                    </p>
                  </Link>
                ))}
              </div>
            </Panel>

            <Panel data-testid="season-detail-event-feed">
              <h2 className="font-black text-white">Season feed</h2>
              <div className="mt-4 grid gap-3">
                {season.events.map((event) => (
                  <div
                    className="rounded-md bg-slate-950/55 p-3"
                    key={event.id}
                  >
                    <Badge
                      tone={event.severity === "warning" ? "warn" : "neutral"}
                    >
                      {event.severity}
                    </Badge>
                    <p className="mt-2 font-black text-white">{event.title}</p>
                    <p className="mt-1 text-sm leading-5 text-slate-400">
                      {event.description}
                    </p>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel data-testid="season-detail-top-crews">
              <h2 className="mb-4 flex items-center gap-2 font-black text-white">
                <RadioTower className="text-cyan-300" size={18} /> Top crews
              </h2>
              <div className="grid gap-3">
                {season.crews.map((crew, index) => (
                  <Link
                    className="grid grid-cols-[3rem_minmax(0,1fr)] gap-3 rounded-md border border-white/10 bg-slate-950/55 p-3 hover:border-cyan-300/40"
                    href={`/crews/${crew.slug}`}
                    key={crew.id}
                  >
                    <Image
                      alt={`${crew.name} crew avatar`}
                      className="size-12 rounded-md border border-white/10 object-contain p-1"
                      height={48}
                      src={
                        crew.avatarUrl ??
                        "/assets/game/crews/default-avatar.png"
                      }
                      width={48}
                    />
                    <div>
                      <p className="font-black text-white">
                        {index + 1}. {crew.name}
                      </p>
                      <p className="text-sm font-bold text-cyan-200">
                        Score {crew.score.toLocaleString()}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </Panel>
            <Panel data-testid="season-detail-daily-challenge">
              <Badge tone="good">Daily challenge</Badge>
              <h2 className="mt-3 font-black text-white">
                Protect a hot narrative from fatigue
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Pick a launch in a hot trend, then use lore, trust, or crew
                support before the crowd gets tired of the joke.
              </p>
            </Panel>
          </aside>
        </section>
      </div>
    </AppShell>
  );
}
