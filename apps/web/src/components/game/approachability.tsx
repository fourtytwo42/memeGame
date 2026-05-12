import { Badge, Panel, StatBar } from "@meme-foundry/ui";
import { Info, Sparkles } from "lucide-react";

export function RecommendedActionCard({
  title,
  reason,
  helps,
  risks,
  href = "/launch/new"
}: {
  title: string;
  reason: string;
  helps: string;
  risks: string;
  href?: string;
}) {
  return (
    <Panel
      className="border-emerald-300/25 bg-emerald-300/10"
      data-testid="recommended-action-card"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">
            Recommended next action
          </p>
          <h2 className="mt-1 text-2xl font-black text-white">{title}</h2>
        </div>
        <span
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-emerald-300 text-slate-950"
          title="This card explains the best next move and its tradeoff."
        >
          <Sparkles aria-hidden="true" size={20} />
        </span>
      </div>
      <p className="text-sm leading-6 text-slate-200">{reason}</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <div className="rounded-md bg-slate-950/50 p-3">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
            Helps
          </p>
          <p className="mt-1 font-black text-emerald-200">{helps}</p>
        </div>
        <div className="rounded-md bg-slate-950/50 p-3">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
            Risk
          </p>
          <p className="mt-1 font-black text-amber-200">{risks}</p>
        </div>
      </div>
      <a
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-black text-slate-950 hover:bg-slate-200"
        href={href}
      >
        Take recommended action
      </a>
    </Panel>
  );
}

export function StatGroupSummary() {
  const groups = [
    {
      label: "Growth",
      value: 64,
      detail:
        "Attention is building. Keep it useful so it does not turn into noise.",
      tone: "good" as const
    },
    {
      label: "Belief",
      value: 52,
      detail: "Trust is stable. Defensive choices help when pressure rises.",
      tone: "good" as const
    },
    {
      label: "Community",
      value: 46,
      detail:
        "People are showing up, but the launch needs a stronger identity.",
      tone: "warn" as const
    },
    {
      label: "Risk",
      value: 28,
      detail: "Risk is manageable. Watch fatigue before taking loud actions.",
      tone: "warn" as const
    }
  ];

  return (
    <Panel data-testid="stat-group-summary">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Launch readout
          </p>
          <h2 className="text-xl font-black text-white">
            Plain-language stats
          </h2>
        </div>
        <Info
          aria-label="Stats are grouped into Growth, Belief, Community, and Risk before detailed numbers."
          className="text-emerald-300"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {groups.map((group) => (
          <div
            key={group.label}
            className="rounded-md border border-white/10 bg-slate-950/50 p-4"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="font-black text-white">{group.label}</h3>
              <Badge tone={group.tone === "good" ? "good" : "warn"}>
                {group.value}
              </Badge>
            </div>
            <p className="mb-3 text-sm leading-5 text-slate-400">
              {group.detail}
            </p>
            <StatBar
              label={group.label}
              tone={group.tone}
              value={group.value}
            />
          </div>
        ))}
      </div>
    </Panel>
  );
}
