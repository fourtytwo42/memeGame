import type { ComponentPropsWithoutRef, ReactNode } from "react";

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function Button({
  className,
  tone = "primary",
  ...props
}: ComponentPropsWithoutRef<"button"> & {
  tone?: "primary" | "secondary" | "danger" | "ghost";
}) {
  const tones = {
    primary: "bg-emerald-400 text-slate-950 hover:bg-emerald-300",
    secondary: "bg-white text-slate-950 hover:bg-slate-200",
    danger: "bg-rose-400 text-slate-950 hover:bg-rose-300",
    ghost:
      "border border-white/10 bg-white/[0.04] text-slate-100 hover:bg-white/10"
  };

  return (
    <button
      className={joinClasses(
        "inline-flex min-h-11 scroll-mt-24 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-black transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 disabled:cursor-not-allowed disabled:opacity-60",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}

export function Panel({
  children,
  className,
  ...props
}: ComponentPropsWithoutRef<"section">) {
  return (
    <section
      className={joinClasses(
        "min-w-0 rounded-lg border border-white/10 bg-white/[0.045] p-4 shadow-xl shadow-black/15 sm:p-5",
        className
      )}
      {...props}
    >
      {children}
    </section>
  );
}

export function NeonPanel({
  children,
  className,
  tone = "lime",
  ...props
}: ComponentPropsWithoutRef<"section"> & {
  tone?: "lime" | "pink" | "cyan" | "violet" | "amber";
}) {
  const tones = {
    amber:
      "border-amber-300/25 bg-[linear-gradient(145deg,rgba(251,191,36,0.15),rgba(15,23,42,0.9))] shadow-amber-950/20",
    cyan: "border-cyan-300/25 bg-[linear-gradient(145deg,rgba(34,211,238,0.14),rgba(15,23,42,0.9))] shadow-cyan-950/20",
    lime: "border-lime-300/25 bg-[linear-gradient(145deg,rgba(132,204,22,0.16),rgba(15,23,42,0.9))] shadow-lime-950/20",
    pink: "border-pink-300/25 bg-[linear-gradient(145deg,rgba(236,72,153,0.15),rgba(15,23,42,0.9))] shadow-pink-950/20",
    violet:
      "border-violet-300/25 bg-[linear-gradient(145deg,rgba(139,92,246,0.16),rgba(15,23,42,0.9))] shadow-violet-950/20"
  };
  return (
    <section
      className={joinClasses(
        "min-w-0 overflow-hidden rounded-lg border p-4 shadow-2xl sm:p-5",
        tones[tone],
        className
      )}
      {...props}
    >
      {children}
    </section>
  );
}

export function Kicker({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={joinClasses(
        "text-xs font-semibold uppercase tracking-[0.18em] text-pink-200",
        className
      )}
    >
      {children}
    </p>
  );
}

export function MetricChip({
  label,
  value,
  tone = "neutral"
}: {
  label: string;
  value: ReactNode;
  tone?: "neutral" | "good" | "warn" | "bad" | "hot";
}) {
  const tones = {
    bad: "border-rose-300/20 bg-rose-400/10 text-rose-100",
    good: "border-lime-300/20 bg-lime-300/10 text-lime-100",
    hot: "border-pink-300/20 bg-pink-400/10 text-pink-100",
    neutral: "border-white/10 bg-slate-950/55 text-white",
    warn: "border-amber-300/20 bg-amber-300/10 text-amber-100"
  };
  return (
    <div className={joinClasses("rounded-md border p-3", tones[tone])}>
      <p className="text-xs font-black uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}

export function ProgressMeter({
  label,
  value,
  tone = "good"
}: {
  label: string;
  value: number;
  tone?: "good" | "warn" | "bad" | "hot" | "cyan";
}) {
  const width = `${Math.max(0, Math.min(100, value))}%`;
  const tones = {
    bad: "bg-rose-300",
    cyan: "bg-cyan-300",
    good: "bg-lime-300",
    hot: "bg-pink-400",
    warn: "bg-amber-300"
  };
  return (
    <div className="grid gap-2">
      <div className="flex justify-between gap-3 text-sm font-black text-slate-200">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-950/80">
        <div
          className={joinClasses("h-full rounded-full", tones[tone])}
          style={{ width }}
        />
      </div>
    </div>
  );
}

export function EventRow({
  icon,
  title,
  detail,
  meta
}: {
  icon?: ReactNode;
  title: ReactNode;
  detail: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <div className="grid min-w-0 grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 rounded-md border border-white/10 bg-slate-950/55 p-3">
      <div className="grid size-10 place-items-center rounded-md bg-white/10 text-lime-200">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="break-words font-black text-white">{title}</p>
        <p className="mt-1 line-clamp-2 break-words text-sm leading-5 text-slate-400">
          {detail}
        </p>
      </div>
      {meta ? (
        <div className="text-right text-xs font-black text-amber-200">
          {meta}
        </div>
      ) : null}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral"
}: {
  children: ReactNode;
  tone?: "neutral" | "good" | "warn" | "bad";
}) {
  const tones = {
    neutral: "bg-white/10 text-slate-200",
    good: "bg-emerald-400/15 text-emerald-200",
    warn: "bg-amber-300/15 text-amber-200",
    bad: "bg-rose-400/15 text-rose-200"
  };
  return (
    <span
      className={joinClasses(
        "rounded-full px-2.5 py-1 text-xs font-black",
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}

export function StatBar({
  label,
  value,
  tone = "good"
}: {
  label: string;
  value: number;
  tone?: "good" | "warn" | "bad";
}) {
  const width = `${Math.max(0, Math.min(100, value))}%`;
  const tones = {
    good: "bg-emerald-300",
    warn: "bg-amber-300",
    bad: "bg-rose-300"
  };

  return (
    <div
      className="grid gap-2"
      data-testid={`stat-${label.toLowerCase().replaceAll(" ", "-")}`}
    >
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-bold text-slate-200">{label}</span>
        <span className="font-black text-white">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
        <div
          className={joinClasses("h-full rounded-full", tones[tone])}
          style={{ width }}
        />
      </div>
    </div>
  );
}

export function Tabs({
  tabs,
  activeId
}: {
  tabs: Array<{ id: string; label: string; content: ReactNode }>;
  activeId?: string;
}) {
  const active = activeId ?? tabs[0]?.id;
  return (
    <div data-testid="ui-tabs">
      <div
        className="flex gap-1 overflow-x-auto rounded-lg border border-white/10 bg-slate-950/60 p-1"
        role="tablist"
      >
        {tabs.map((tab) => (
          <button
            aria-selected={tab.id === active}
            className={joinClasses(
              "min-h-10 shrink-0 rounded-md px-3 py-2 text-sm font-black",
              tab.id === active
                ? "bg-emerald-300 text-slate-950"
                : "text-slate-300 hover:bg-white/10 hover:text-white"
            )}
            key={tab.id}
            role="tab"
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div hidden={tab.id !== active} key={tab.id} role="tabpanel">
          {tab.content}
        </div>
      ))}
    </div>
  );
}

export function ModalFrame({
  title,
  children,
  open = true
}: {
  title: string;
  children: ReactNode;
  open?: boolean;
}) {
  if (!open) return null;
  return (
    <div
      className="rounded-lg border border-white/10 bg-slate-950 p-5 shadow-2xl"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      data-testid="ui-modal-frame"
    >
      <h2 className="text-xl font-black text-white">{title}</h2>
      <div className="mt-3 text-sm leading-6 text-slate-300">{children}</div>
    </div>
  );
}

export function FormField({
  label,
  hint,
  children
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label
      className="grid gap-2 text-sm font-bold text-slate-200"
      data-testid="ui-form-field"
    >
      {label}
      {children}
      {hint ? (
        <span className="text-xs leading-5 text-slate-500">{hint}</span>
      ) : null}
    </label>
  );
}

export function ToastMessage({
  title,
  detail,
  tone = "good"
}: {
  title: string;
  detail: string;
  tone?: "good" | "warn" | "bad";
}) {
  return (
    <div
      className="rounded-lg border border-white/10 bg-slate-950 p-4"
      role="status"
      data-testid="ui-toast"
    >
      <Badge tone={tone}>{tone}</Badge>
      <h2 className="mt-2 font-black text-white">{title}</h2>
      <p className="mt-1 text-sm leading-5 text-slate-300">{detail}</p>
    </div>
  );
}

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div
      className="grid min-h-32 place-items-center rounded-lg border border-white/10 bg-white/[0.04] p-5 text-center"
      data-testid="ui-loading-state"
    >
      <div>
        <div className="mx-auto mb-3 size-8 animate-spin rounded-full border-2 border-emerald-300 border-t-transparent" />
        <p className="font-black text-white">{label}</p>
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  detail,
  action
}: {
  title: string;
  detail: string;
  action?: ReactNode;
}) {
  return (
    <div
      className="rounded-lg border border-dashed border-white/15 bg-white/[0.035] p-5 text-center"
      data-testid="ui-empty-state"
    >
      <h2 className="text-xl font-black text-white">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
        {detail}
      </p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title,
  detail
}: {
  title: string;
  detail: string;
}) {
  return (
    <div
      className="rounded-lg border border-rose-300/30 bg-rose-400/10 p-5"
      role="alert"
      data-testid="ui-error-state"
    >
      <h2 className="text-xl font-black text-rose-100">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-rose-100/80">{detail}</p>
    </div>
  );
}

export function DegradedState({
  service,
  detail
}: {
  service: string;
  detail: string;
}) {
  return (
    <div
      className="rounded-lg border border-amber-300/30 bg-amber-300/10 p-4"
      role="status"
      data-testid="ui-degraded-state"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-200">
        Degraded
      </p>
      <h2 className="mt-1 font-black text-white">{service}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-300">{detail}</p>
    </div>
  );
}
