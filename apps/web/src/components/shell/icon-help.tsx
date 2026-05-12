import type { ReactNode } from "react";

export function IconHelpButton({
  label,
  help,
  children
}: {
  label: string;
  help: string;
  children: ReactNode;
}) {
  return (
    <span className="group relative inline-flex">
      <button
        aria-describedby="notification-help"
        aria-label={label}
        className="inline-flex size-10 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
        data-testid="icon-help-button"
        type="button"
      >
        {children}
      </button>
      <span
        className="pointer-events-none absolute right-0 top-12 z-50 w-64 rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm font-semibold text-white opacity-0 shadow-xl transition group-focus-within:opacity-100 group-hover:opacity-100"
        data-testid="icon-help-tooltip"
        id="notification-help"
        role="tooltip"
      >
        {help}
      </span>
    </span>
  );
}
