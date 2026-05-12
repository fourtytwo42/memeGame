import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@meme-foundry/db";

export const dynamic = "force-dynamic";

export default async function PlayPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const token = await prisma.launchToken.findFirst({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" }
  });

  return (
    <main className="min-h-screen bg-[#0b0d12] px-4 py-6 text-slate-100">
      <section className="mx-auto max-w-4xl rounded-lg border border-white/10 bg-white/[0.04] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
          Protected play space
        </p>
        <h1 className="mt-2 text-3xl font-black text-white">
          Welcome, {session.user.username}
        </h1>
        <p className="mt-3 text-slate-300" data-testid="play-session-status">
          You are signed in and ready to manage a simulated launch.
        </p>
        {token ? (
          <div
            className="mt-5 rounded-md border border-white/10 bg-slate-950/50 p-4"
            data-testid="seeded-token-card"
          >
            <h2 className="text-xl font-black text-white">{token.name}</h2>
            <p className="mt-1 text-sm text-slate-400">
              ${token.ticker} is currently {token.status}.
            </p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
