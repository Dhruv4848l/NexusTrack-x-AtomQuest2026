import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE }}
      className="flex flex-wrap items-end justify-between gap-4"
    >
      <div>
        <div className="mb-2 h-px w-10 bg-primary/50" />
        <h1 className="font-display text-3xl md:text-4xl font-semibold italic tracking-tight">{title}</h1>
        {subtitle && <p className="text-muted-foreground mt-1.5 text-sm font-light">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </motion.div>
  );
}

export function NeuCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: EASE }}
      className={cn("neu-card glow-hover p-6", className)}
    >
      {children}
    </motion.div>
  );
}

export function Stat({ label, value, accent, hint }: { label: string; value: ReactNode; accent?: "primary"|"mint"|"peach"|"coral"|"amber"; hint?: string }) {
  const bg: Record<string,string> = {
    primary: "var(--gradient-cool)",
    mint: "var(--gradient-mint)",
    peach: "var(--gradient-warm)",
    coral: "var(--gradient-peach)",
    amber: "var(--gradient-amber)",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, ease: EASE }}
      className="neu-card-sm lift-hover p-5 flex items-center gap-4"
    >
      <div className="w-12 h-12 rounded-2xl shrink-0 shadow-[var(--shadow-soft-sm)]" style={{ background: bg[accent ?? "primary"] }} />
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
        <div className="font-display text-2xl font-bold leading-tight">{value}</div>
        {hint && <div className="text-xs text-muted-foreground mt-0.5 font-light">{hint}</div>}
      </div>
    </motion.div>
  );
}

export function StatusPill({ status }: { status: string }) {
  // Glass pill + a small semantic dot — stays within the luxury look while the
  // dot colour carries the state (gold for active, green success, terracotta warn).
  const map: Record<string, { dot: string; label: string }> = {
    draft:           { dot: "#9c9182", label: "Draft" },
    submitted:       { dot: "#c9b8a0", label: "Submitted" },
    approved_locked: { dot: "#7bd88f", label: "Approved · Locked" },
    returned:        { dot: "#cf6f5c", label: "Returned" },
    completed:       { dot: "#7bd88f", label: "Completed" },
    not_started:     { dot: "#6b6459", label: "Not started" },
    on_track:        { dot: "#d9b877", label: "On track" },
  };
  const s = map[status] ?? { dot: "#9c9182", label: status };
  return (
    <span className="pill glass px-3 py-1 text-xs font-medium inline-flex items-center gap-1.5 text-foreground/85">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.dot, boxShadow: `0 0 8px ${s.dot}` }} />
      {s.label}
    </span>
  );
}

export function ProgressBar({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="h-3 rounded-full neu-inset overflow-hidden">
      <motion.div
        className="progress-fill h-full rounded-full"
        style={{ background: "var(--gradient-gold)" }}
        initial={{ width: 0 }}
        whileInView={{ width: `${v}%` }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: EASE }}
      />
    </div>
  );
}
