import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/components/shell/app-shell";
import { prisma } from "@meme-foundry/db";
import { Badge, Panel } from "@meme-foundry/ui";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");
  if (session.user.role !== "admin") redirect("/play");

  const [users, tokens, seasons, aiLogs] = await Promise.all([
    prisma.user.count(),
    prisma.launchToken.count(),
    prisma.season.count(),
    prisma.aiGeneratedContent.findMany({
      orderBy: { createdAt: "desc" },
      take: 12
    })
  ]);

  return (
    <AppShell>
      <div className="grid gap-4" data-testid="admin-page">
        <Panel>
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
        </Panel>

        <Panel data-testid="admin-ai-logs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Local AI
              </p>
              <h2 className="text-xl font-black text-white">
                AI generation logs
              </h2>
            </div>
            <Badge tone="neutral">Local-only</Badge>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[44rem] border-separate border-spacing-y-2 text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.12em] text-slate-400">
                <tr>
                  <th className="px-3 py-2">Purpose</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Model</th>
                  <th className="px-3 py-2">Created</th>
                  <th className="px-3 py-2">Error</th>
                </tr>
              </thead>
              <tbody>
                {aiLogs.map((log) => (
                  <tr className="bg-slate-950/55" key={log.id}>
                    <td className="rounded-l-md px-3 py-3 font-bold text-white">
                      {log.purpose}
                    </td>
                    <td className="px-3 py-3 text-slate-200">{log.status}</td>
                    <td className="px-3 py-3 text-slate-300">
                      {log.model ?? "template"}
                    </td>
                    <td className="px-3 py-3 text-slate-300">
                      {log.createdAt.toLocaleString("en-US")}
                    </td>
                    <td className="rounded-r-md px-3 py-3 text-amber-200">
                      {log.error ?? "none"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {aiLogs.length === 0 ? (
              <p className="rounded-md border border-dashed border-white/15 bg-slate-950/45 p-4 text-sm text-slate-400">
                No AI generations have been recorded yet.
              </p>
            ) : null}
          </div>
        </Panel>
      </div>
    </AppShell>
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
