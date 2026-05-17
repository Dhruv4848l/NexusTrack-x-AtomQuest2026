import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-muted-foreground mt-1.5 text-sm">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function NeuCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("neu-card p-6", className)}>{children}</div>;
}

export function Stat({ label, value, accent, hint }: { label: string; value: ReactNode; accent?: "primary"|"mint"|"peach"|"coral"|"amber"; hint?: string }) {
  const bg: Record<string,string> = {
    primary: "var(--gradient-cool)",
    mint: "var(--gradient-mint)",
    peach: "var(--gradient-warm)",
    coral: "linear-gradient(135deg, var(--coral), var(--peach))",
    amber: "linear-gradient(135deg, var(--amber), var(--peach))",
  };
  return (
    <div className="neu-card-sm p-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-2xl shadow-[var(--shadow-soft-sm)]" style={{ background: bg[accent ?? "primary"] }} />
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="font-display text-2xl font-bold leading-tight">{value}</div>
        {hint && <div className="text-xs text-muted-foreground mt-0.5">{hint}</div>}
      </div>
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; fg: string; label: string }> = {
    draft:           { bg: "color-mix(in oklab, var(--amber) 30%, transparent)",   fg: "oklch(0.35 0.12 75)",  label: "Draft" },
    submitted:       { bg: "color-mix(in oklab, var(--lavender) 35%, transparent)", fg: "oklch(0.32 0.1 290)", label: "Submitted" },
    approved_locked: { bg: "color-mix(in oklab, var(--mint) 35%, transparent)",     fg: "oklch(0.32 0.1 165)", label: "Approved · Locked" },
    returned:        { bg: "color-mix(in oklab, var(--coral) 30%, transparent)",    fg: "oklch(0.35 0.14 15)", label: "Returned" },
    completed:       { bg: "color-mix(in oklab, var(--peach) 30%, transparent)",    fg: "oklch(0.35 0.13 40)", label: "Completed" },
    not_started:     { bg: "color-mix(in oklab, var(--muted) 80%, transparent)",    fg: "var(--muted-foreground)", label: "Not started" },
    on_track:        { bg: "color-mix(in oklab, var(--lavender) 35%, transparent)", fg: "oklch(0.32 0.1 290)", label: "On track" },
  };
  const s = map[status] ?? { bg: "var(--secondary)", fg: "var(--secondary-foreground)", label: status };
  return (
    <span className="pill px-3 py-1 text-xs font-semibold inline-flex items-center" style={{ background: s.bg, color: s.fg }}>
      {s.label}
    </span>
  );
}

export function ProgressBar({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="h-3 rounded-full neu-inset overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${v}%`, background: "var(--gradient-cool)" }} />
    </div>
  );
}
