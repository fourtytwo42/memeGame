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
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-black transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 disabled:cursor-not-allowed disabled:opacity-60",
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
        "rounded-lg border border-white/10 bg-white/[0.045] p-4 shadow-xl shadow-black/15 sm:p-5",
        className
      )}
      {...props}
    >
      {children}
    </section>
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
