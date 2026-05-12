import { Badge, Panel } from "@meme-foundry/ui";
import { AppShell } from "@/components/shell/app-shell";
import {
  RecommendedActionCard,
  StatGroupSummary
} from "@/components/game/approachability";
import { prisma } from "@meme-foundry/db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [season, topTokens] = await Promise.all([
    prisma.season.findFirst({
      where: { status: "active" },
      orderBy: { startsAt: "desc" }
    }),
    prisma.launchToken.findMany({ orderBy: { score: "desc" }, take: 3 })
  ]);

  return (
    <AppShell>
      <div
        className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]"
        data-testid="home-command-hub"
      >
        <section className="rounded-lg border border-white/10 bg-[linear-gradient(145deg,rgba(20,184,166,0.20),rgba(15,23,42,0.94))] p-5 shadow-2xl shadow-black/30 sm:p-8">
          <Badge tone="good">{season?.name ?? "Season loading"}</Badge>
          <h1 className="mt-4 max-w-3xl text-4xl font-black text-white sm:text-5xl lg:text-6xl">
            Meme Foundry
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
            Launch fake coins, make readable tradeoffs, and graduate before
            attention burns out. No real trading, no real liquidity, just
            strategy-game chaos with clear next steps.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Panel className="bg-slate-950/45">
              <h2 className="text-lg font-black text-white">Create</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Pick a narrative and launch a fictional token fast.
              </p>
            </Panel>
            <Panel className="bg-slate-950/45">
              <h2 className="text-lg font-black text-white">React</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Spend energy on actions with visible upsides and risks.
              </p>
            </Panel>
            <Panel className="bg-slate-950/45">
              <h2 className="text-lg font-black text-white">Graduate</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Grow while keeping trust and community alive.
              </p>
            </Panel>
          </div>
        </section>
        <RecommendedActionCard
          href="/play"
          title="Start from Play"
          reason="The command hub shows your current situation and the next useful action before detailed mechanics."
          helps="Focus, learning, first launch"
          risks="None"
        />
        <StatGroupSummary />
        <Panel data-testid="top-token-preview">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Top seeded launches
          </p>
          <div className="mt-4 grid gap-3">
            {topTokens.map((token) => (
              <div
                key={token.id}
                className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-slate-950/50 p-3"
              >
                <div>
                  <h2 className="font-black text-white">{token.name}</h2>
                  <p className="text-sm text-slate-400">
                    ${token.ticker} · {token.status}
                  </p>
                </div>
                <Badge tone={token.status === "graduated" ? "good" : "neutral"}>
                  {token.score}
                </Badge>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
