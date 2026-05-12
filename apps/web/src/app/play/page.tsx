import { redirect } from "next/navigation";
import { Badge, Panel } from "@meme-foundry/ui";
import { auth } from "@/auth";
import { AppShell } from "@/components/shell/app-shell";
import {
  RecommendedActionCard,
  StatGroupSummary
} from "@/components/game/approachability";
import { prisma } from "@meme-foundry/db";

export const dynamic = "force-dynamic";

export default async function PlayPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const [profile, token, events, narratives] = await Promise.all([
    prisma.founderProfile.findUnique({ where: { userId: session.user.id } }),
    prisma.launchToken.findFirst({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" }
    }),
    prisma.gameEvent.findMany({ orderBy: { createdAt: "desc" }, take: 4 }),
    prisma.narrativeMeta.findMany({ orderBy: { heat: "desc" }, take: 4 })
  ]);

  return (
    <AppShell>
      <div
        className="grid gap-4 lg:grid-cols-[1fr_22rem]"
        data-testid="play-command-hub"
      >
        <section className="grid gap-4">
          <Panel
            className="bg-[linear-gradient(145deg,rgba(16,185,129,0.16),rgba(15,23,42,0.88))]"
            data-testid="play-primary-panel"
          >
            <Badge tone="good">Signed in as {session.user.username}</Badge>
            <h1 className="mt-3 text-3xl font-black text-white sm:text-4xl">
              {token ? `Manage ${token.name}` : "Start your first launch"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              {token
                ? `Your latest launch is ${token.status}. Keep attention useful, protect trust, and push toward graduation.`
                : "Create a fictional token, pick a trend, and learn the core loop through one guided action."}
            </p>
          </Panel>
          <RecommendedActionCard
            href={!profile ? "/profile" : token ? "/play" : "/launch/new"}
            title={
              !profile
                ? "Create founder profile"
                : token
                  ? "Post a meme pack"
                  : "Create your first token"
            }
            reason={
              !profile
                ? "Set up your founder identity first. It takes one short form and makes the launch yours."
                : token
                  ? "Attention is useful right now, but the action still explains fatigue before you commit."
                  : "You do not have an active launch yet, so the fastest useful move is creating one."
            }
            helps={
              !profile
                ? "Onboarding, identity"
                : token
                  ? "Growth, community"
                  : "First run, learning"
            }
            risks={
              !profile
                ? "No gameplay risk"
                : token
                  ? "A little fatigue"
                  : "No gameplay risk"
            }
          />
          <StatGroupSummary />
        </section>
        <aside className="grid gap-4 content-start">
          <Panel data-testid="narrative-heat-panel">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Narrative heat
            </p>
            <div className="mt-4 grid gap-3">
              {narratives.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="font-bold text-white">{item.name}</span>
                  <Badge tone={item.heat > 70 ? "good" : "neutral"}>
                    {item.heat}
                  </Badge>
                </div>
              ))}
            </div>
          </Panel>
          <Panel data-testid="recent-events-panel">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Recent events
            </p>
            <div className="mt-4 grid gap-3">
              {events.length ? (
                events.map((event) => (
                  <p
                    key={event.id}
                    className="rounded-md bg-slate-950/50 p-3 text-sm leading-5 text-slate-300"
                  >
                    {event.title}
                  </p>
                ))
              ) : (
                <p className="text-sm text-slate-400">
                  No major events yet. The first active situation appears after
                  gameplay actions start.
                </p>
              )}
            </div>
          </Panel>
        </aside>
      </div>
    </AppShell>
  );
}
