import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { Badge, Kicker, MetricChip, NeonPanel, Panel } from "@meme-foundry/ui";
import { AppShell } from "@/components/shell/app-shell";
import { tokenImage } from "@/lib/assets";
import { formatCompactCurrency } from "@/lib/game-state";
import { prisma } from "@meme-foundry/db";
import { Medal, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

type LeaderboardProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const tabs = [
  ["score", "Score"],
  ["market", "Market cap"],
  ["holders", "Holders"],
  ["graduated", "Graduated"]
] as const;

function readTab(params: Record<string, string | string[] | undefined>) {
  const raw = Array.isArray(params.tab) ? params.tab[0] : params.tab;
  return tabs.some(([id]) => id === raw) ? raw! : "score";
}

function formatValue(category: string, value: number) {
  if (category === "market") return formatCompactCurrency(value);
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
    value
  );
}

export default async function LeaderboardPage({
  searchParams
}: LeaderboardProps) {
  const query = await searchParams;
  const category = readTab(query);
  const season = await prisma.season.findFirst({
    where: { status: "active" },
    orderBy: { startsAt: "desc" }
  });
  const snapshots = season
    ? await prisma.scoreSnapshot.findMany({
        where: { seasonId: season.id, category },
        orderBy: [{ rank: "asc" }, { score: "desc" }],
        take: 50
      })
    : [];
  const tokens = await prisma.launchToken.findMany({
    where: { id: { in: snapshots.map((snapshot) => snapshot.entityId) } },
    include: { user: true, crew: true }
  });
  const tokenById = new Map(tokens.map((token) => [token.id, token]));

  return (
    <AppShell>
      <div className="grid gap-4" data-testid="leaderboard-page">
        <NeonPanel tone="amber">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <Kicker className="text-amber-200">Season scoped</Kicker>
              <h1 className="mt-3 text-3xl font-black text-white sm:text-4xl">
                Leaderboard
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                Rankings come from stored launch state and refreshed score
                snapshots. Tabs let players compare total score, market cap,
                holders, and graduated launches without real trading.
              </p>
            </div>
            <MetricChip
              label="Active season"
              tone="warn"
              value={season?.name ?? "No active season"}
            />
          </div>
        </NeonPanel>

        <Panel data-testid="leaderboard-tabs">
          <div className="grid grid-cols-[4.75rem_minmax(0,1fr)] items-start gap-2 sm:grid-cols-[13rem_minmax(0,1fr)] sm:gap-4">
            <nav
              aria-label="Leaderboard categories"
              className="sticky top-3 grid gap-2"
              data-testid="leaderboard-side-menu"
            >
              {tabs.map(([id, label]) => (
                <Link
                  className={`flex min-h-10 items-center break-words rounded-md border px-2 py-2 text-xs font-black leading-4 sm:px-3 sm:text-sm ${category === id ? "border-amber-300 bg-amber-300 text-slate-950" : "border-white/10 bg-white/[0.04] text-slate-200 hover:border-amber-300/40 hover:bg-white/10"}`}
                  href={`/leaderboard?tab=${id}` as Route}
                  key={id}
                >
                  {label}
                </Link>
              ))}
            </nav>
            <div
              className="grid min-w-0 gap-3"
              data-testid="leaderboard-results"
            >
              {snapshots.map((snapshot) => {
                const token = tokenById.get(snapshot.entityId);
                if (!token) return null;
                return (
                  <Link
                    className="grid min-w-0 gap-3 rounded-lg border border-white/10 bg-slate-950/55 p-3 hover:border-amber-300/50 sm:grid-cols-[4rem_minmax(0,1fr)_10rem] sm:items-center sm:p-4"
                    href={`/token/${token.id}` as Route}
                    key={snapshot.id}
                  >
                    <div className="flex items-center gap-3 md:block">
                      <span className="grid size-10 place-items-center rounded-full bg-amber-300 text-lg font-black text-slate-950">
                        {snapshot.rank}
                      </span>
                      {snapshot.rank && snapshot.rank <= 3 ? (
                        <Medal className="text-amber-300 sm:mt-2" size={20} />
                      ) : null}
                    </div>
                    <div className="grid min-w-0 grid-cols-[4rem_minmax(0,1fr)] items-center gap-3">
                      <Image
                        alt={`${token.name} token art`}
                        className="size-16 rounded-lg border border-white/10 bg-slate-950/80 object-cover p-1"
                        height={64}
                        src={tokenImage(token)}
                        width={64}
                      />
                      <div className="min-w-0">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <h2 className="min-w-0 break-words text-lg font-black text-white sm:text-xl">
                            {token.name}
                          </h2>
                          <Badge>${token.ticker}</Badge>
                          <Badge
                            tone={
                              token.status === "graduated" ? "good" : "neutral"
                            }
                          >
                            {token.status}
                          </Badge>
                        </div>
                        <p className="mt-1 break-words text-sm text-slate-400">
                          Founder {token.user.username}
                          {token.crew ? ` · Crew ${token.crew.name}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="min-w-0 rounded-md bg-slate-900/80 p-3 text-left sm:text-right">
                      <p className="text-xs font-bold uppercase text-slate-400">
                        {tabs.find(([id]) => id === category)?.[1]}
                      </p>
                      <p className="mt-1 text-2xl font-black text-amber-200">
                        {formatValue(category, snapshot.score)}
                      </p>
                    </div>
                  </Link>
                );
              })}
              {snapshots.length === 0 ? (
                <div className="rounded-lg border border-dashed border-white/15 bg-slate-950/45 p-6 text-center">
                  <TrendingUp className="mx-auto text-slate-400" />
                  <h2 className="mt-3 text-xl font-black text-white">
                    No rankings yet
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Run the world refresh worker after launches exist to create
                    season-scoped score snapshots.
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
