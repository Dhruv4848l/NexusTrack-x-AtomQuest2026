import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { NetworkField } from "@/components/app/NetworkField";
import {
  Target, ClipboardCheck, ShieldCheck, BarChart3,
  ArrowRight, Sparkles, GitBranch, Lock, Activity, Layers,
} from "lucide-react";
import {
  motion, useMotionValue, useSpring, useTransform, useScroll,
} from "framer-motion";

export const Route = createFileRoute("/")({ component: Landing });

/* A card that tilts in 3D toward the cursor. */
function TiltCard({
  children, className = "", intensity = 10,
}: { children: React.ReactNode; className?: string; intensity?: number }) {
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 150, damping: 18 });
  const sry = useSpring(ry, { stiffness: 150, damping: 18 });

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    ry.set(px * intensity);
    rx.set(-py * intensity);
  }
  function onLeave() { rx.set(0); ry.set(0); }

  return (
    <motion.div
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX: srx, rotateY: sry, transformPerspective: 900 }}
      className={`preserve-3d ${className}`}
    >
      {children}
    </motion.div>
  );
}

function Landing() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => { if (!loading && user) nav({ to: "/dashboard" }); }, [loading, user, nav]);

  // hero parallax from cursor
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 60, damping: 20 });
  const smy = useSpring(my, { stiffness: 60, damping: 20 });
  const orbX = useTransform(smx, [-0.5, 0.5], [-40, 40]);
  const orbY = useTransform(smy, [-0.5, 0.5], [-30, 30]);
  const orb2X = useTransform(smx, [-0.5, 0.5], [30, -30]);
  const orb2Y = useTransform(smy, [-0.5, 0.5], [24, -24]);

  const { scrollYProgress } = useScroll();
  const floorY = useTransform(scrollYProgress, [0, 1], [0, -120]);

  function onHeroMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  const stats = [
    { i: Target,         t: "Goal Sheets",      d: "100% weightage validation", g: "var(--gradient-cool)",  rot: -8, z: 40 },
    { i: ClipboardCheck, t: "Quarterly Check-ins", d: "Auto progress scoring",  g: "var(--gradient-mint)",  rot: 5,  z: 70 },
    { i: ShieldCheck,    t: "Approval Workflow", d: "Lock & audit governance",  g: "var(--gradient-amber)", rot: -4, z: 20 },
    { i: BarChart3,      t: "Team Analytics",    d: "Real-time completion view", g: "var(--gradient-blue)",  rot: 9,  z: 55 },
  ];

  return (
    <div className="relative min-h-screen overflow-x-clip bg-background">
      {/* ─── HERO ─── */}
      <section
        onMouseMove={onHeroMove}
        className="relative min-h-screen overflow-hidden perspective-1600"
      >
        {/* network + depth layers */}
        <NetworkField />
        <motion.div style={{ y: floorY }} className="grid-floor absolute inset-x-0 bottom-0 h-[46vh]" aria-hidden />
        <motion.div
          style={{ x: orbX, y: orbY }}
          className="animate-drift pointer-events-none absolute -left-24 top-10 h-[30rem] w-[30rem] rounded-full blur-[90px]"
          aria-hidden
        >
          <div className="h-full w-full rounded-full opacity-40" style={{ background: "radial-gradient(circle, #7a6cf0, transparent 65%)" }} />
        </motion.div>
        <motion.div
          style={{ x: orb2X, y: orb2Y }}
          className="animate-drift pointer-events-none absolute -right-20 bottom-0 h-[26rem] w-[26rem] rounded-full blur-[90px]"
          aria-hidden
        >
          <div className="h-full w-full rounded-full opacity-30" style={{ background: "radial-gradient(circle, #2bb8a3, transparent 65%)" }} />
        </motion.div>

        <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-6 lg:px-10">
          {/* nav */}
          <header className="flex items-center justify-between py-6">
            <div className="flex items-center gap-3">
              <div className="relative grid h-11 w-11 place-items-center rounded-2xl font-display text-lg font-bold text-primary-foreground animate-pulse-ring"
                style={{ background: "var(--gradient-cool)" }}>A</div>
              <div>
                <div className="font-display text-lg font-bold leading-tight tracking-tight">AtomQuest</div>
                <div className="-mt-0.5 text-xs text-muted-foreground">GoalPortal</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a href="#features" className="hidden text-sm font-medium text-muted-foreground transition hover:text-foreground sm:block">Features</a>
              <a href="#flow" className="hidden text-sm font-medium text-muted-foreground transition hover:text-foreground sm:block">How it works</a>
              <Link
                to="/login"
                className="pill inline-flex items-center gap-1.5 border border-primary/60 px-5 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10"
              >
                Sign in <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </header>

          {/* hero body */}
          <div className="grid flex-1 items-center gap-12 py-10 lg:grid-cols-[1.05fr_0.95fr]">
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              <div className="glass pill inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                </span>
                <span className="tracking-wide text-accent">ATOMQUEST HACKATHON 1.0</span>
              </div>

              <h1 className="mt-6 font-display text-5xl font-bold leading-[1.02] tracking-tight text-balance md:text-6xl lg:text-7xl">
                Set goals.<br />
                <span className="text-gradient">Stay aligned.</span><br />
                Achieve more.
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                The in-house portal for goal setting, quarterly check-ins, and performance
                visibility — engineered to replace spreadsheets, email threads, and offline
                review cycles with one connected system.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link
                  to="/login"
                  className="pill group inline-flex items-center gap-2 px-7 py-3.5 text-sm font-semibold text-primary-foreground neu-pop transition active:scale-[0.98]"
                  style={{ background: "var(--gradient-cool)" }}
                >
                  Open the portal
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <a
                  href="#features"
                  className="pill glass inline-flex items-center gap-2 px-7 py-3.5 text-sm font-semibold text-foreground transition hover:border-primary/40"
                >
                  See what's inside
                </a>
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-xs text-muted-foreground">
                {[
                  { i: GitBranch, t: "Role-based workflows" },
                  { i: Lock, t: "Audited & lockable" },
                  { i: Activity, t: "Live scoring engine" },
                ].map(({ i: I, t }) => (
                  <div key={t} className="flex items-center gap-2">
                    <I className="h-4 w-4 text-primary" strokeWidth={1.75} /> {t}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* 3D floating card cluster */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotateY: -12 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 0.9, ease: "easeOut", delay: 0.15 }}
              className="preserve-3d relative hidden h-[30rem] lg:block"
            >
              {stats.map(({ i: Icon, t, d, g, rot, z }, idx) => (
                <motion.div
                  key={t}
                  className="preserve-3d absolute w-60"
                  style={{
                    top: `${[2, 20, 52, 60][idx]}%`,
                    left: `${[6, 46, 2, 40][idx]}%`,
                  }}
                  animate={{ y: [0, idx % 2 ? -12 : 12, 0] }}
                  transition={{ duration: 5 + idx, repeat: Infinity, ease: "easeInOut" }}
                >
                  <TiltCard intensity={14}>
                    <div
                      className="glass rounded-3xl p-5"
                      style={{ transform: `rotate(${rot}deg) translateZ(${z}px)`, boxShadow: "var(--shadow-pop)" }}
                    >
                      <div className="mb-3 grid h-11 w-11 place-items-center rounded-2xl" style={{ background: g }}>
                        <Icon className="h-5 w-5 text-primary-foreground" strokeWidth={1.9} />
                      </div>
                      <div className="font-display font-semibold">{t}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{d}</div>
                    </div>
                  </TiltCard>
                </motion.div>
              ))}
              {/* central glow anchor */}
              <div className="animate-spin-slow pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30"
                style={{ background: "conic-gradient(from 0deg, transparent, #968ae0, transparent 60%)", filter: "blur(30px)" }} aria-hidden />
            </motion.div>

            {/* mobile stat grid */}
            <div className="grid grid-cols-2 gap-4 lg:hidden">
              {stats.map(({ i: Icon, t, d, g }) => (
                <div key={t} className="neu-card-sm p-5">
                  <div className="mb-3 grid h-10 w-10 place-items-center rounded-2xl" style={{ background: g }}>
                    <Icon className="h-5 w-5 text-primary-foreground" strokeWidth={1.9} />
                  </div>
                  <div className="font-display text-sm font-semibold">{t}</div>
                  <div className="mt-1 text-[11px] text-muted-foreground">{d}</div>
                </div>
              ))}
            </div>
          </div>

          {/* scroll cue */}
          <div className="pb-8 text-center">
            <div className="mx-auto flex h-9 w-5 items-start justify-center rounded-full border border-border p-1">
              <motion.span
                className="h-1.5 w-1 rounded-full bg-primary"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="relative mx-auto max-w-7xl px-6 py-24 lg:px-10">
        <Reveal>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            <Layers className="h-4 w-4" /> The platform
          </div>
          <h2 className="mt-3 max-w-2xl font-display text-4xl font-bold tracking-tight text-balance md:text-5xl">
            Everything a goal cycle needs, <span className="text-gradient">in one place.</span>
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {[
            { i: Target, t: "Structured goal sheets", d: "Draft goals across thrust areas with UoM, target and weightage. Validation enforces a clean 100% before a sheet can be submitted.", g: "var(--gradient-cool)" },
            { i: ClipboardCheck, t: "Quarterly check-ins", d: "Capture actuals each quarter with status updates and progress auto-computed from each UoM formula by the scoring engine.", g: "var(--gradient-mint)" },
            { i: ShieldCheck, t: "Approval & governance", d: "Managers review, approve and lock sheets. Every change is written to an immutable audit trail with full actor history.", g: "var(--gradient-amber)" },
          ].map((f, i) => (
            <Reveal key={f.t} delay={i * 0.08}>
              <TiltCard intensity={6} className="h-full">
                <div className="glass group relative h-full overflow-hidden rounded-3xl p-7 transition-shadow hover:shadow-[var(--shadow-glow)]">
                  <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-40" style={{ background: f.g }} />
                  <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl" style={{ background: f.g }}>
                    <f.i className="h-6 w-6 text-primary-foreground" strokeWidth={1.9} />
                  </div>
                  <h3 className="font-display text-lg font-semibold">{f.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.d}</p>
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ─── FLOW ─── */}
      <section id="flow" className="relative mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <div className="glass relative overflow-hidden rounded-[2rem] p-10 md:p-14">
          <div className="animate-drift pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full opacity-25 blur-[80px]" style={{ background: "radial-gradient(circle, #7a6cf0, transparent 60%)" }} />
          <Reveal>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              <Sparkles className="h-4 w-4" /> How it works
            </div>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">Three phases, one continuous loop</h2>
          </Reveal>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              { n: "01", t: "Set", d: "Employees draft goals with UoM, target & weightage. The manager reviews, approves and locks the sheet for the cycle." },
              { n: "02", t: "Track", d: "Quarterly actuals are captured, statuses update, and progress is auto-computed per the UoM formula." },
              { n: "03", t: "Govern", d: "Cycle windows control the calendar, an audit trail records every change, and admins can override when needed." },
            ].map((s, i) => (
              <Reveal key={s.t} delay={i * 0.1}>
                <div className="relative">
                  <div className="font-display text-5xl font-bold text-primary/25">{s.n}</div>
                  <h3 className="mt-2 font-display text-xl font-semibold">{s.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="relative mx-auto max-w-7xl px-6 pb-28 lg:px-10">
        <Reveal>
          <div className="glass relative overflow-hidden rounded-[2rem] px-8 py-16 text-center">
            <div className="animate-drift pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full opacity-30 blur-[90px]" style={{ background: "radial-gradient(circle, #968ae0, transparent 60%)" }} />
            <h2 className="relative font-display text-4xl font-bold tracking-tight text-balance md:text-5xl">
              Ready to align your <span className="text-gradient">whole team?</span>
            </h2>
            <p className="relative mx-auto mt-4 max-w-lg text-muted-foreground">
              Sign in to open the portal, or explore instantly with a demo persona.
            </p>
            <Link
              to="/login"
              className="pill relative mt-8 inline-flex items-center gap-2 px-8 py-4 text-sm font-semibold text-primary-foreground neu-pop transition active:scale-[0.98]"
              style={{ background: "var(--gradient-cool)" }}
            >
              Open the portal <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
      </section>

      <footer className="mx-auto max-w-7xl px-6 pb-12 lg:px-10">
        <div className="hr-fade mb-6" />
        <div className="flex flex-col items-center justify-between gap-3 text-xs text-muted-foreground sm:flex-row">
          <span>AtomQuest GoalPortal · A solution for the Atomberg in-house goal-tracking challenge.</span>
          <span className="text-muted-foreground/70">Nocturne UI · AtomQuest Hackathon 1.0</span>
        </div>
      </footer>
    </div>
  );
}

/* Scroll-into-view reveal wrapper */
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
}
