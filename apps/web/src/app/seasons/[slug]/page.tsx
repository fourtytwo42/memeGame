import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Panel } from "@meme-foundry/ui";
import { AppShell } from "@/components/shell/app-shell";
import { formatCompactCurrency } from "@/lib/game-state";
import { narrativeOpportunity } from "@/lib/server/world-state";
import { prisma } from "@meme-foundry/db";
import { Activity, Flame, RadioTower, Timer, TrendingUp } from "lucide-react";

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
        <Panel className="border-pink-300/20 bg-[linear-gradient(145deg,rgba(236,72,153,0.14),rgba(15,23,42,0.92))]">
          <div className="grid gap-5 lg:grid-cols-[1fr_20rem] lg:items-center">
            <div>
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
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-md bg-slate-950/55 p-3">
                <Timer className="mb-2 text-emerald-300" size={18} />
                <p className="text-2xl font-black text-white">
                  {daysLeft(season.endsAt)}d
                </p>
                <p className="text-xs font-bold uppercase text-slate-400">
                  left
                </p>
              </div>
              <div className="rounded-md bg-slate-950/55 p-3">
                <RadioTower className="mb-2 text-pink-300" size={18} />
                <p className="text-2xl font-black text-white">{liveLaunches}</p>
                <p className="text-xs font-bold uppercase text-slate-400">
                  live
                </p>
              </div>
              <div className="rounded-md bg-slate-950/55 p-3">
                <Flame className="mb-2 text-amber-300" size={18} />
                <p className="text-2xl font-black text-white">
                  {season.narratives.length}
                </p>
                <p className="text-xs font-bold uppercase text-slate-400">
                  metas
                </p>
              </div>
            </div>
          </div>
        </Panel>

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
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-black text-white">
                        {narrative.name}
                      </h3>
                      <Badge tone={toneFor(label)}>{label}</Badge>
                    </div>
                    <div className="mt-4 grid gap-3">
                      {[
                        ["Heat", narrative.heat, "bg-pink-400"],
                        ["Saturation", narrative.saturation, "bg-violet-400"],
                        ["Fatigue", narrative.fatigue, "bg-amber-300"]
                      ].map(([name, value, color]) => (
                        <div key={name}>
                          <div className="mb-1 flex justify-between text-sm font-bold text-slate-300">
                            <span>{name}</span>
                            <span>{value}</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                            <div
                              className={`h-full rounded-full ${color}`}
                              style={{ width: `${value}%` }}
                            />
                          </div>
                        </div>
                      ))}
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
          </aside>
        </section>
      </div>
    </AppShell>
  );
}
