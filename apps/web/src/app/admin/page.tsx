import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@meme-foundry/db";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");
  if (session.user.role !== "admin") redirect("/play");

  const [users, tokens, seasons] = await Promise.all([
    prisma.user.count(),
    prisma.launchToken.count(),
    prisma.season.count()
  ]);

  return (
    <main className="min-h-screen bg-[#0b0d12] px-4 py-6 text-slate-100">
      <section className="mx-auto max-w-4xl rounded-lg border border-white/10 bg-white/[0.04] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
          Admin only
        </p>
        <h1 className="mt-2 text-3xl font-black text-white">
          Admin control room
        </h1>
        <dl
          className="mt-5 grid gap-3 sm:grid-cols-3"
          data-testid="admin-counts"
        >
          <Metric label="Users" value={users} />
          <Metric label="Tokens" value={tokens} />
          <Metric label="Seasons" value={seasons} />
        </dl>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-white/10 bg-slate-950/50 p-4">
      <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </dt>
      <dd className="mt-2 text-2xl font-black text-white">{value}</dd>
    </div>
  );
}
