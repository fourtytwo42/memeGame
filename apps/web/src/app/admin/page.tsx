import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import {
  hideReportTargetAction,
  resolveReportAction,
  retryImageJobAction,
  updateNarrativeAction,
  updateSeasonAction
} from "@/app/admin/actions";
import { auth } from "@/auth";
import { getOpsHealth } from "@/lib/server/ops-health";
import { AppShell } from "@/components/shell/app-shell";
import { prisma } from "@meme-foundry/db";
import {
  Badge,
  Button,
  Kicker,
  MetricChip,
  NeonPanel,
  Panel
} from "@meme-foundry/ui";
import { Activity, Database, RefreshCw, Server, Zap } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");
  if (session.user.role !== "admin") redirect("/play");

  const [
    users,
    tokens,
    seasonCount,
    editableSeasons,
    narratives,
    aiLogs,
    imageJobs,
    reports,
    actions,
    health
  ] = await Promise.all([
    prisma.user.count(),
    prisma.launchToken.count(),
    prisma.season.count(),
    prisma.season.findMany({
      orderBy: [{ status: "asc" }, { startsAt: "desc" }],
      take: 8
    }),
    prisma.narrativeMeta.findMany({
      orderBy: [{ season: { startsAt: "desc" } }, { heat: "desc" }],
      take: 12,
      include: { season: true }
    }),
    prisma.aiGeneratedContent.findMany({
      orderBy: { createdAt: "desc" },
      take: 12
    }),
    prisma.imageJob.findMany({
      orderBy: { updatedAt: "desc" },
      take: 12,
      include: { token: true }
    }),
    prisma.report.findMany({
      where: { status: "open" },
      orderBy: { createdAt: "desc" },
      take: 12,
      include: { reporter: true }
    }),
    prisma.adminAction.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { actor: true }
    }),
    getOpsHealth()
  ]);

  return (
    <AppShell variant="admin">
      <div className="grid gap-4" data-testid="admin-page">
        <NeonPanel tone="violet">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-center">
            <div>
              <Kicker>Admin operations</Kicker>
              <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">
                Admin control room
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                Production console for world state, moderation, local AI, image
                jobs, health, queues, and audit trails.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  className="inline-flex min-h-10 items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-black text-slate-100 hover:bg-white/10"
                  href="/admin"
                >
                  <RefreshCw size={16} /> Refresh
                </a>
                <a
                  className="inline-flex min-h-10 items-center rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-black text-slate-100 hover:bg-white/10"
                  href="/admin/assets"
                >
                  Asset gallery
                </a>
              </div>
            </div>
            <dl className="grid gap-3" data-testid="admin-counts">
              <MetricChip label="Users" tone="good" value={users} />
              <MetricChip label="Tokens" tone="hot" value={tokens} />
              <MetricChip label="Seasons" tone="warn" value={seasonCount} />
            </dl>
          </div>
        </NeonPanel>

        <Panel data-testid="admin-health-panel">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Operations
              </p>
              <h2 className="text-xl font-black text-white">
                Health and scale
              </h2>
            </div>
            <Badge tone={health.db.ok && health.redis.ok ? "good" : "warn"}>
              {health.db.ok && health.redis.ok ? "healthy" : "degraded"}
            </Badge>
          </div>
          <div
            className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6"
            data-testid="admin-operations-cards"
          >
            <OpsCard
              detail="Next.js host-native web"
              icon={<Server size={20} />}
              label="Web"
              ok={health.db.ok}
              value="serving"
            />
            <HealthMetric
              label="Postgres"
              value={health.db.detail ?? "ok"}
              ok={health.db.ok}
              icon={<Database size={18} />}
            />
            <HealthMetric
              label="Redis"
              value={health.redis.detail ?? "ok"}
              ok={health.redis.ok}
              icon={<Database size={18} />}
            />
            <HealthMetric
              label="Realtime"
              value={health.realtime.detail ?? "ok"}
              ok={health.realtime.ok}
              icon={<Activity size={18} />}
            />
            <HealthMetric
              label="Local LLM"
              value={health.ai.detail ?? "ok"}
              ok={health.ai.ok}
              icon={<Zap size={18} />}
            />
            <HealthMetric
              label="Image backend"
              value={health.image.detail ?? "ok"}
              ok={health.image.ok}
              icon={<Zap size={18} />}
            />
          </div>
          <dl className="mt-4 grid gap-3 md:grid-cols-4">
            <Metric label="Sessions" value={health.sessions} />
            <Metric label="Socket clients" value={health.socketClients} />
            <Metric label="Queued images" value={health.queuedImages} />
            <Metric label="Failed images" value={health.failedImages} />
            <Metric label="AI fallbacks/hr" value={health.recentAiErrors} />
          </dl>
          <dl className="mt-4 grid gap-3 md:grid-cols-4">
            <Metric
              label="Image queue wait"
              value={health.queueStats.imageWaiting}
            />
            <Metric
              label="Image active"
              value={health.queueStats.imageActive}
            />
            <Metric label="AI queue wait" value={health.queueStats.aiWaiting} />
            <Metric
              label="Oldest image lag"
              value={health.queueStats.oldestQueuedImageSeconds}
            />
          </dl>
          <div className="mt-4 overflow-x-auto" data-testid="admin-queue-table">
            <table className="w-full min-w-[42rem] border-separate border-spacing-y-2 text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.12em] text-slate-400">
                <tr>
                  <th className="px-3 py-2">Queue</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Waiting</th>
                  <th className="px-3 py-2">Active</th>
                  <th className="px-3 py-2">Failed</th>
                  <th className="px-3 py-2">Oldest lag</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-slate-950/55">
                  <td className="rounded-l-md px-3 py-3 font-black text-white">
                    Image jobs
                  </td>
                  <td className="px-3 py-3">
                    <Badge tone={health.image.ok ? "good" : "warn"}>
                      {health.image.ok ? "ok" : "degraded"}
                    </Badge>
                  </td>
                  <td className="px-3 py-3 text-slate-200">
                    {health.queueStats.imageWaiting}
                  </td>
                  <td className="px-3 py-3 text-slate-200">
                    {health.queueStats.imageActive}
                  </td>
                  <td className="px-3 py-3 text-slate-200">
                    {health.failedImages}
                  </td>
                  <td className="rounded-r-md px-3 py-3 text-slate-200">
                    {health.queueStats.oldestQueuedImageSeconds}s
                  </td>
                </tr>
                <tr className="bg-slate-950/55">
                  <td className="rounded-l-md px-3 py-3 font-black text-white">
                    AI text
                  </td>
                  <td className="px-3 py-3">
                    <Badge tone={health.ai.ok ? "good" : "warn"}>
                      {health.ai.ok ? "ok" : "degraded"}
                    </Badge>
                  </td>
                  <td className="px-3 py-3 text-slate-200">
                    {health.queueStats.aiWaiting}
                  </td>
                  <td className="px-3 py-3 text-slate-200">0</td>
                  <td className="px-3 py-3 text-slate-200">
                    {health.recentAiErrors}
                  </td>
                  <td className="rounded-r-md px-3 py-3 text-slate-200">n/a</td>
                </tr>
              </tbody>
            </table>
          </div>
          <Panel
            className="mt-4 border-amber-300/25 bg-amber-300/10"
            data-testid="admin-system-alerts"
          >
            <h3 className="font-black text-white">System alerts</h3>
            <div className="mt-3 grid gap-2 text-sm text-slate-200">
              {!health.db.ok ? <p>Postgres reports degraded health.</p> : null}
              {!health.redis.ok ? <p>Redis reports degraded health.</p> : null}
              {!health.realtime.ok ? (
                <p>Realtime service is degraded or unreachable.</p>
              ) : null}
              {health.failedImages > 0 ? (
                <p>{health.failedImages} image jobs need attention.</p>
              ) : null}
              {health.db.ok &&
              health.redis.ok &&
              health.realtime.ok &&
              health.failedImages === 0 ? (
                <p>No blocking system alerts.</p>
              ) : null}
            </div>
          </Panel>
        </Panel>

        <Panel data-testid="admin-season-editor" id="season-editor">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                World control
              </p>
              <h2 className="text-xl font-black text-white">Season editor</h2>
            </div>
            <Badge tone="neutral">{editableSeasons.length} recent</Badge>
          </div>
          <div className="mt-4 grid gap-3">
            {editableSeasons.map((season) => (
              <form
                action={updateSeasonAction}
                className="grid gap-3 rounded-md border border-white/10 bg-slate-950/55 p-4 lg:grid-cols-[1fr_10rem_8rem]"
                key={season.id}
              >
                <input name="seasonId" type="hidden" value={season.id} />
                <label className="grid gap-2 text-sm font-bold text-slate-200">
                  Name
                  <input
                    className="min-h-10 rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-white"
                    defaultValue={season.name}
                    name="name"
                  />
                </label>
                <label className="grid gap-2 text-sm font-bold text-slate-200">
                  Status
                  <select
                    className="min-h-10 rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-white"
                    defaultValue={season.status}
                    name="status"
                  >
                    <option value="upcoming">upcoming</option>
                    <option value="active">active</option>
                    <option value="complete">complete</option>
                    <option value="archived">archived</option>
                  </select>
                </label>
                <Button className="self-end" type="submit">
                  Save
                </Button>
              </form>
            ))}
          </div>
        </Panel>

        <Panel data-testid="admin-narrative-editor" id="narrative-editor">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Meta tuning
              </p>
              <h2 className="text-xl font-black text-white">
                Narrative editor
              </h2>
            </div>
            <Badge tone="neutral">{narratives.length} tracked</Badge>
          </div>
          <div className="mt-4 grid gap-3">
            {narratives.map((narrative) => (
              <form
                action={updateNarrativeAction}
                className="grid gap-3 rounded-md border border-white/10 bg-slate-950/55 p-4 md:grid-cols-4 xl:grid-cols-[1.4fr_repeat(4,8rem)_7rem]"
                key={narrative.id}
              >
                <input name="narrativeId" type="hidden" value={narrative.id} />
                <div className="md:col-span-4 xl:col-span-1">
                  <p className="font-black text-white">{narrative.name}</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                    {narrative.season.name}
                  </p>
                </div>
                <NumberField
                  defaultValue={narrative.heat}
                  label="Heat"
                  name="heat"
                />
                <NumberField
                  defaultValue={narrative.memePotential}
                  label="Meme"
                  name="memePotential"
                />
                <NumberField
                  defaultValue={narrative.saturation}
                  label="Saturation"
                  name="saturation"
                />
                <NumberField
                  defaultValue={narrative.fatigue}
                  label="Fatigue"
                  name="fatigue"
                />
                <Button className="self-end" type="submit">
                  Save
                </Button>
              </form>
            ))}
          </div>
        </Panel>

        <Panel data-testid="admin-reports" id="reports">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Moderation
              </p>
              <h2 className="text-xl font-black text-white">Reports queue</h2>
            </div>
            <Badge tone={reports.length ? "warn" : "good"}>
              {reports.length} open
            </Badge>
          </div>
          <div className="mt-4 grid gap-3">
            {reports.map((report) => (
              <div
                className="rounded-md border border-white/10 bg-slate-950/55 p-4"
                key={report.id}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-black text-white">
                      {report.category} / {report.targetType}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      Target {report.targetId} / reporter{" "}
                      {report.reporter?.username ?? "anonymous"}
                    </p>
                    {report.detail ? (
                      <p className="mt-2 text-sm text-slate-300">
                        {report.detail}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <form action={hideReportTargetAction}>
                      <input name="reportId" type="hidden" value={report.id} />
                      <Button tone="danger" type="submit">
                        Hide target
                      </Button>
                    </form>
                    <form action={resolveReportAction}>
                      <input name="reportId" type="hidden" value={report.id} />
                      <input name="resolution" type="hidden" value="reviewed" />
                      <Button tone="secondary" type="submit">
                        Resolve
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
            {reports.length === 0 ? (
              <p className="rounded-md border border-dashed border-white/15 bg-slate-950/45 p-4 text-sm text-slate-400">
                No open reports.
              </p>
            ) : null}
          </div>
        </Panel>

        <Panel data-testid="admin-ai-logs" id="ai-logs">
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

        <Panel data-testid="admin-image-jobs" id="image-jobs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Image pipeline
              </p>
              <h2 className="text-xl font-black text-white">Image job queue</h2>
            </div>
            <Badge tone="neutral">CPU local</Badge>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[48rem] border-separate border-spacing-y-2 text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.12em] text-slate-400">
                <tr>
                  <th className="px-3 py-2">Token</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Model</th>
                  <th className="px-3 py-2">Attempts</th>
                  <th className="px-3 py-2">Error</th>
                </tr>
              </thead>
              <tbody>
                {imageJobs.map((job) => (
                  <tr className="bg-slate-950/55" key={job.id}>
                    <td className="rounded-l-md px-3 py-3 font-bold text-white">
                      {job.token.name}
                    </td>
                    <td className="px-3 py-3 text-slate-200">{job.status}</td>
                    <td className="px-3 py-3 text-slate-300">
                      {job.model ?? "local"}
                    </td>
                    <td className="px-3 py-3 text-slate-300">{job.attempts}</td>
                    <td className="rounded-r-md px-3 py-3 text-amber-200">
                      <div className="flex items-center justify-between gap-3">
                        <span>{job.error ?? "none"}</span>
                        {["failed", "retrying"].includes(job.status) ? (
                          <form action={retryImageJobAction}>
                            <input
                              name="imageJobId"
                              type="hidden"
                              value={job.id}
                            />
                            <Button tone="secondary" type="submit">
                              Retry
                            </Button>
                          </form>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {imageJobs.length === 0 ? (
              <p className="rounded-md border border-dashed border-white/15 bg-slate-950/45 p-4 text-sm text-slate-400">
                No image jobs have been queued yet.
              </p>
            ) : null}
          </div>
        </Panel>

        <Panel data-testid="admin-action-log">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Audit
          </p>
          <h2 className="mt-1 text-xl font-black text-white">
            Recent admin actions
          </h2>
          <div className="mt-4 grid gap-2">
            {actions.map((action) => (
              <div
                className="rounded-md bg-slate-950/55 px-3 py-2 text-sm text-slate-300"
                key={action.id}
              >
                <span className="font-bold text-white">
                  {action.actor.username}
                </span>{" "}
                {action.actionType} on {action.targetType}
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}

function NumberField({
  defaultValue,
  label,
  name
}: {
  defaultValue: number;
  label: string;
  name: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-200">
      {label}
      <input
        className="min-h-10 rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-white"
        defaultValue={defaultValue}
        max={100}
        min={0}
        name={name}
        type="number"
      />
    </label>
  );
}

function HealthMetric({
  icon,
  label,
  ok,
  value
}: {
  icon?: ReactNode;
  label: string;
  ok: boolean;
  value: string | number;
}) {
  return (
    <div className="rounded-md border border-white/10 bg-slate-950/50 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-violet-200">{icon}</span>
        <Badge tone={ok ? "good" : "warn"}>{ok ? "ok" : "degraded"}</Badge>
      </div>
      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-bold text-white">{value}</p>
    </div>
  );
}

function OpsCard({
  detail,
  icon,
  label,
  ok,
  value
}: {
  detail: string;
  icon: ReactNode;
  label: string;
  ok: boolean;
  value: string;
}) {
  return (
    <div className="rounded-md border border-white/10 bg-slate-950/50 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-violet-200">{icon}</span>
        <Badge tone={ok ? "good" : "warn"}>{ok ? "ok" : "degraded"}</Badge>
      </div>
      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-white">{value}</p>
      <p className="mt-1 text-xs leading-5 text-slate-400">{detail}</p>
    </div>
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
