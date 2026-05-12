import type { Route } from "next";
import Link from "next/link";
import { Badge, Button, FormField, Panel } from "@meme-foundry/ui";
import { auth } from "@/auth";
import { AppShell } from "@/components/shell/app-shell";
import { prisma } from "@meme-foundry/db";
import { Radio, Shield, Trophy, Users } from "lucide-react";
import { createCrewAction } from "./actions";

export const dynamic = "force-dynamic";

type CrewsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(
  params: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function noticeText(value?: string) {
  if (value === "created") return "Crew created. Pick a launch to feature.";
  if (value === "joined") return "You joined the crew.";
  return null;
}

export default async function CrewsPage({ searchParams }: CrewsPageProps) {
  const [session, query] = await Promise.all([auth(), searchParams]);
  const [crews, myMemberships] = await Promise.all([
    prisma.crew.findMany({
      orderBy: [{ score: "desc" }, { updatedAt: "desc" }],
      take: 30,
      include: {
        _count: { select: { members: true } },
        featuredToken: true,
        members: { take: 3, include: { user: true } },
        season: true
      }
    }),
    session?.user
      ? prisma.crewMember.findMany({
          where: { userId: session.user.id },
          select: { crewId: true }
        })
      : []
  ]);
  const myCrewIds = new Set(myMemberships.map((member) => member.crewId));
  const notice = noticeText(firstParam(query, "notice"));
  const error = firstParam(query, "error");

  return (
    <AppShell>
      <div className="grid gap-4" data-testid="crews-page">
        {notice ? (
          <Panel
            className="border-emerald-300/25 bg-emerald-300/10"
            data-testid="crew-notice"
          >
            <p className="font-bold text-emerald-100">{notice}</p>
          </Panel>
        ) : null}
        {error ? (
          <Panel
            className="border-amber-300/25 bg-amber-300/10"
            data-testid="crew-error"
          >
            <p className="font-bold text-amber-100">{error}</p>
          </Panel>
        ) : null}

        <section className="grid gap-4 xl:grid-cols-[0.85fr_1.4fr]">
          <Panel className="border-cyan-300/25 bg-cyan-400/10">
            <div className="flex items-start gap-3">
              <span className="grid size-14 shrink-0 place-items-center rounded-lg bg-cyan-300/15 text-cyan-200">
                <Users aria-hidden="true" />
              </span>
              <div>
                <Badge tone="good">Co-op support</Badge>
                <h1 className="mt-3 text-3xl font-black text-white sm:text-4xl">
                  Crews
                </h1>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Crews coordinate support around one featured launch. Join one
                  to spend shared energy and resources on bounded boosts.
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <div className="rounded-md bg-slate-950/55 p-3">
                <p className="text-xs font-bold uppercase text-slate-400">
                  Active crews
                </p>
                <p className="mt-1 text-2xl font-black text-white">
                  {crews.length}
                </p>
              </div>
              <div className="rounded-md bg-slate-950/55 p-3">
                <p className="text-xs font-bold uppercase text-slate-400">
                  Featured launches
                </p>
                <p className="mt-1 text-2xl font-black text-lime-200">
                  {crews.filter((crew) => crew.featuredTokenId).length}
                </p>
              </div>
              <div className="rounded-md bg-slate-950/55 p-3">
                <p className="text-xs font-bold uppercase text-slate-400">
                  My crews
                </p>
                <p className="mt-1 text-2xl font-black text-cyan-200">
                  {myCrewIds.size}
                </p>
              </div>
            </div>
          </Panel>

          <Panel data-testid="create-crew-panel">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-lime-200">
                  Coordinate
                </p>
                <h2 className="text-2xl font-black text-white">
                  Create a crew
                </h2>
              </div>
              <Shield className="text-lime-300" aria-hidden="true" />
            </div>
            {session?.user ? (
              <form action={createCrewAction} className="grid gap-3">
                <FormField label="Crew name">
                  <input
                    className="min-h-11 rounded-md border border-white/10 bg-slate-950/70 px-3 py-2 text-white outline-none focus:border-lime-300"
                    maxLength={64}
                    minLength={3}
                    name="name"
                    placeholder="Meme Signal Guild"
                    required
                  />
                </FormField>
                <FormField label="Tagline">
                  <input
                    className="min-h-11 rounded-md border border-white/10 bg-slate-950/70 px-3 py-2 text-white outline-none focus:border-lime-300"
                    maxLength={96}
                    name="tagline"
                    placeholder="We turn launch chaos into coordinated support."
                  />
                </FormField>
                <FormField label="Description">
                  <textarea
                    className="min-h-24 rounded-md border border-white/10 bg-slate-950/70 px-3 py-2 text-white outline-none focus:border-lime-300"
                    maxLength={280}
                    name="description"
                    placeholder="Describe the crew style, preferred launches, and coordination vibe."
                  />
                </FormField>
                <Button className="w-full" type="submit">
                  Create crew
                </Button>
              </form>
            ) : (
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-emerald-400 px-4 py-2 text-sm font-black text-slate-950 hover:bg-emerald-300"
                href="/signin"
              >
                Sign in to create a crew
              </Link>
            )}
          </Panel>
        </section>

        <Panel data-testid="crew-list">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-pink-200">
                Crew board
              </p>
              <h2 className="text-2xl font-black text-white">
                Active coordination groups
              </h2>
            </div>
            <Trophy className="text-amber-300" aria-hidden="true" />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {crews.map((crew, index) => (
              <Link
                className="grid gap-4 rounded-lg border border-white/10 bg-slate-950/55 p-4 hover:border-cyan-300/45"
                data-testid={`crew-card-${crew.slug}`}
                href={`/crews/${crew.slug}` as Route}
                key={crew.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        tone={
                          crew.moderationStatus === "active" ? "good" : "warn"
                        }
                      >
                        {crew.moderationStatus}
                      </Badge>
                      {myCrewIds.has(crew.id) ? (
                        <Badge tone="good">member</Badge>
                      ) : null}
                    </div>
                    <h3 className="mt-3 text-xl font-black text-white">
                      {crew.name}
                    </h3>
                    <p className="mt-1 text-sm leading-5 text-slate-400">
                      {crew.tagline ??
                        crew.description ??
                        "A crew coordinating fictional launch support."}
                    </p>
                  </div>
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-amber-300 text-lg font-black text-slate-950">
                    {index + 1}
                  </span>
                </div>
                <div className="grid gap-2 sm:grid-cols-4">
                  <div className="rounded-md bg-slate-900/80 p-3">
                    <p className="text-xs font-bold uppercase text-slate-400">
                      Score
                    </p>
                    <p className="text-lg font-black text-white">
                      {crew.score.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-md bg-slate-900/80 p-3">
                    <p className="text-xs font-bold uppercase text-slate-400">
                      Energy
                    </p>
                    <p className="text-lg font-black text-lime-200">
                      {crew.energy}
                    </p>
                  </div>
                  <div className="rounded-md bg-slate-900/80 p-3">
                    <p className="text-xs font-bold uppercase text-slate-400">
                      Members
                    </p>
                    <p className="text-lg font-black text-cyan-200">
                      {crew._count.members}
                    </p>
                  </div>
                  <div className="rounded-md bg-slate-900/80 p-3">
                    <p className="text-xs font-bold uppercase text-slate-400">
                      Feature
                    </p>
                    <p className="truncate text-sm font-black text-pink-200">
                      {crew.featuredToken?.ticker ?? "none"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-400">
                  {crew.members.map((member) => (
                    <span
                      className="rounded-full bg-white/10 px-2 py-1"
                      key={member.id}
                    >
                      {member.user.username}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
          {crews.length === 0 ? (
            <div className="rounded-lg border border-dashed border-white/15 bg-slate-950/45 p-6 text-center">
              <Radio className="mx-auto text-slate-400" />
              <h2 className="mt-3 text-xl font-black text-white">
                No crews yet
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Create the first crew and feature a live launch.
              </p>
            </div>
          ) : null}
        </Panel>
      </div>
    </AppShell>
  );
}
