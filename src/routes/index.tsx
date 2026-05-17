import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Target, ClipboardCheck, ShieldCheck, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/")({ component: Landing });

function Landing() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => { if (!loading && user) nav({ to: "/dashboard" }); }, [loading, user, nav]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-6 lg:px-10 py-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-primary-foreground font-display font-bold text-lg" style={{ background: "var(--gradient-cool)" }}>A</div>
            <div>
              <div className="font-display font-bold text-lg leading-tight">AtomQuest</div>
              <div className="text-xs text-muted-foreground -mt-0.5">GoalPortal</div>
            </div>
          </div>
          <Link to="/login" className="pill px-5 py-2.5 text-sm font-semibold text-primary-foreground" style={{ background: "var(--gradient-cool)" }}>
            Sign in
          </Link>
        </header>

        <section className="mt-16 grid lg:grid-cols-[1.2fr_1fr] gap-10 items-center">
          <div>
            <div className="pill inline-flex items-center gap-2 px-3 py-1.5 bg-secondary text-xs font-semibold text-secondary-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" /> ATOMQUEST HACKATHON 1.0
            </div>
            <h1 className="mt-4 font-display text-5xl md:text-6xl font-bold tracking-tight text-balance">
              Set goals.<br/>
              <span style={{ background: "var(--gradient-cool)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Stay aligned.
              </span><br/>
              Achieve more.
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-xl">
              The in-house portal for goal setting, quarterly check-ins, and performance visibility. Built to replace
              spreadsheets, emails, and offline review cycles.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/login" className="pill px-6 py-3 text-sm font-semibold text-primary-foreground neu-pop" style={{ background: "var(--gradient-cool)" }}>
                Open the portal
              </Link>
              <a href="#features" className="pill px-6 py-3 text-sm font-semibold bg-secondary text-secondary-foreground">
                See what's inside
              </a>
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="neu-card p-6 grid grid-cols-2 gap-4">
            {[
              { i: Target,         t: "Goal Sheets",        d: "100% weightage validation",   c: "var(--gradient-cool)" },
              { i: ClipboardCheck, t: "Quarterly Check-ins", d: "Auto progress scoring",       c: "var(--gradient-mint)" },
              { i: ShieldCheck,    t: "Approval Workflow",   d: "Lock & audit governance",     c: "var(--gradient-warm)" },
              { i: BarChart3,      t: "Team Analytics",      d: "Real-time completion view",   c: "linear-gradient(135deg, var(--lavender), var(--coral))" },
            ].map(({ i: Icon, t, d, c }) => (
              <div key={t} className="neu-card-sm p-5">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-3" style={{ background: c }}>
                  <Icon className="w-5 h-5 text-primary-foreground" strokeWidth={1.75} />
                </div>
                <div className="font-display font-semibold">{t}</div>
                <div className="text-xs text-muted-foreground mt-1">{d}</div>
              </div>
            ))}
          </motion.div>
        </section>

        <section id="features" className="mt-24 grid md:grid-cols-3 gap-5">
          {[
            { t: "Phase 1 — Set", d: "Employees draft goals across thrust areas with UoM, target & weightage. Manager approves and locks." },
            { t: "Phase 2 — Track", d: "Quarterly actuals capture, status updates, and auto-computed progress per UoM formula." },
            { t: "Govern", d: "Cycle windows, audit trail of every change, and admin override when needed." },
          ].map((f) => (
            <div key={f.t} className="neu-card-sm p-6">
              <div className="font-display font-bold text-lg">{f.t}</div>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{f.d}</p>
            </div>
          ))}
        </section>

        <footer className="mt-24 pt-8 border-t border-border text-xs text-muted-foreground">
          AtomQuest GoalPortal · A solution for the Atomberg in-house goal-tracking challenge.
        </footer>
      </div>
    </div>
  );
}
