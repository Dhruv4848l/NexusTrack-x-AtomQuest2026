import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  Target, ClipboardCheck, ShieldCheck, BarChart3,
  ArrowRight, GitBranch, Lock, Activity, Sparkles, ArrowUpRight,
} from "lucide-react";
import {
  motion, useMotionValue, useSpring, useTransform, useScroll,
} from "framer-motion";

export const Route = createFileRoute("/")({ component: Landing });

/* A glass card that tilts in 3D toward the cursor. */
function TiltCard({
  children, className = "", intensity = 10, style,
}: { children: React.ReactNode; className?: string; intensity?: number; style?: React.CSSProperties }) {
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
      style={{ rotateX: srx, rotateY: sry, transformPerspective: 900, ...style }}
      className={`preserve-3d ${className}`}
    >
      {children}
    </motion.div>
  );
}

/* Neural connection lines from the four satellites to the central node. */
function NeuralLines() {
  // viewBox 1000x620; centre ~ (500, 310); satellite anchors near each corner.
  const anchors = [
    { x: 175, y: 120 }, // top-left
    { x: 825, y: 120 }, // top-right
    { x: 175, y: 500 }, // bottom-left
    { x: 825, y: 500 }, // bottom-right
  ];
  const cx = 500, cy = 310;
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 1000 620"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c9b8a0" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#a78b71" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      {anchors.map((a, i) => {
        const mx = (a.x + cx) / 2;
        const d = `M ${a.x} ${a.y} C ${mx} ${a.y}, ${mx} ${cy}, ${cx} ${cy}`;
        return (
          <g key={i}>
            <path d={d} className="node-line" stroke="url(#lineGrad)" style={{ animationDelay: `${i * 0.4}s` }} />
            <path d={d} className="node-line-flow" stroke="#e8d5b7" strokeOpacity="0.5" strokeWidth={1.5} style={{ animationDelay: `${i * 0.3}s` }} />
          </g>
        );
      })}
    </svg>
  );
}

function LivePill({ text }: { text: string }) {
  return (
    <div className="glass pill inline-flex items-center gap-2 px-3 py-1.5">
      <span className="live-dot h-2 w-2 rounded-full bg-green-400" />
      <span className="text-[8px] font-bold tracking-[0.2em] text-green-400">LIVE</span>
      <span className="text-xs text-foreground/80">{text}</span>
    </div>
  );
}

function Landing() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => { if (!loading && user) nav({ to: "/dashboard" }); }, [loading, user, nav]);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 60, damping: 20 });
  const smy = useSpring(my, { stiffness: 60, damping: 20 });
  const glowX = useTransform(smx, [-0.5, 0.5], [-30, 30]);
  const glowY = useTransform(smy, [-0.5, 0.5], [-24, 24]);

  // Neural cluster "focus" dim: it sits at ~45% while off-centre and ramps to
  // full 100% opacity as it reaches the middle of the viewport, then eases back
  // to ~45% as it scrolls out the top. Tracks the cluster's own position, not
  // raw page scroll — so peak brightness lands exactly when it's centred.
  const clusterRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: clusterScroll } = useScroll({
    target: clusterRef,
    offset: ["start end", "end start"],
  });
  const clusterOpacity = useSpring(
    useTransform(clusterScroll, [0, 0.5, 1], [0.45, 1, 0.45]),
    { stiffness: 120, damping: 30 }
  );

  function onHeroMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  const satellites = [
    { i: Target,         t: "Goal Sheets",   d: "100% weightage validation", pos: "left-[2%] top-[6%]  md:left-[4%]  md:top-[8%]" },
    { i: ClipboardCheck, t: "Check-ins",     d: "Auto progress scoring",     pos: "right-[2%] top-[6%] md:right-[4%] md:top-[8%]" },
    { i: ShieldCheck,    t: "Approvals",     d: "Lock & audit governance",   pos: "left-[2%] bottom-[6%] md:left-[4%]  md:bottom-[8%]" },
    { i: BarChart3,      t: "Analytics",     d: "Real-time completion view", pos: "right-[2%] bottom-[6%] md:right-[4%] md:bottom-[8%]" },
  ];

  return (
    <div className="relative min-h-screen overflow-x-clip bg-background">
      {/* ─── NAVBAR ─── */}
      <header className="fixed inset-x-0 top-0 z-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-12">
          <div className="font-display text-xl font-bold italic tracking-tight">Nexus<span className="text-primary">Tracker</span></div>
          <nav className="hidden items-center gap-8 md:flex">
            {["Features", "Workflow", "Roles"].map((l) => (
              <a key={l} href={`#${l.toLowerCase()}`} className="text-[11px] font-medium uppercase tracking-[0.18em] text-foreground/60 transition hover:text-primary">{l}</a>
            ))}
          </nav>
          <Link
            to="/login"
            className="pill shimmer bg-white px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-black transition hover:bg-[#e8d5b7]"
          >
            Open the portal
          </Link>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section onMouseMove={onHeroMove} className="relative min-h-screen overflow-hidden px-6 pt-28 md:px-12">
        <motion.div
          style={{ x: glowX, y: glowY }}
          className="animate-glow-pulse pointer-events-none absolute left-1/2 top-[38%] h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full"
          aria-hidden
        >
          <div className="h-full w-full rounded-full" style={{ background: "radial-gradient(circle, rgba(167,139,113,0.22), transparent 60%)" }} />
        </motion.div>

        <div className="relative z-10 mx-auto max-w-4xl pt-6 text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <LivePill text="FY 2026–27 cycle active" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="mt-7 font-display font-medium italic leading-[1.05] tracking-tight"
            style={{ fontSize: "clamp(2.5rem, 8vw, 5.5rem)" }}
          >
            Set goals. <span className="text-gold">Stay aligned.</span><br />Achieve <span className="text-gold">more.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.15 }}
            className="mx-auto mt-6 max-w-xl text-base font-light leading-relaxed text-foreground/60 md:text-lg"
          >
            One connected system for goal setting, quarterly check-ins, and performance
            visibility — replacing spreadsheets, email threads, and offline review cycles.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.25 }}
            className="mt-9 flex flex-wrap items-center justify-center gap-3"
          >
            <Link to="/login" className="pill glass px-7 py-3.5 text-sm font-medium text-foreground transition hover:border-primary/50">
              <span className="inline-flex items-center gap-2">Explore a demo <ArrowRight className="h-4 w-4" /></span>
            </Link>
            <Link to="/login" className="pill shimmer bg-white px-7 py-3.5 text-sm font-semibold text-black transition hover:bg-[#e8d5b7]">
              Open the portal
            </Link>
          </motion.div>
        </div>

        {/* Neural node cluster */}
        <motion.div ref={clusterRef} style={{ opacity: clusterOpacity }} className="relative mx-auto mt-16 h-[30rem] max-w-5xl md:mt-20">
          <NeuralLines />

          {/* central node */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-1/2 top-1/2 w-[68%] max-w-md -translate-x-1/2 -translate-y-1/2 md:w-[46%]"
          >
            <TiltCard intensity={8}>
              <div className="glass neu-pop relative aspect-video overflow-hidden rounded-[24px] p-6">
                <div className="flex items-center justify-between">
                  <div className="font-display text-lg font-semibold italic">The Core</div>
                  <span className="animate-spin-slow grid h-9 w-9 place-items-center rounded-full border border-primary/40">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {["46%", "5", "4"].map((v, i) => (
                    <div key={i} className="rounded-xl border border-white/5 bg-black/30 p-3 text-center">
                      <div className="font-display text-2xl font-bold text-gold">{v}</div>
                      <div className="mt-0.5 text-[9px] uppercase tracking-widest text-foreground/40">
                        {["Score", "Updates", "Goals"][i]}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-primary/70">
                  <Activity className="h-3.5 w-3.5" /> Live scoring engine
                </div>
              </div>
            </TiltCard>
          </motion.div>

          {/* satellites */}
          {satellites.map(({ i: Icon, t, d, pos }, idx) => (
            <motion.div
              key={t}
              className={`absolute w-40 md:w-52 ${pos}`}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1, y: [0, idx % 2 ? -10 : 10, 0] }}
              transition={{
                opacity: { duration: 0.7, delay: 0.5 + idx * 0.1 },
                scale: { duration: 0.7, delay: 0.5 + idx * 0.1 },
                y: { duration: 5 + idx, repeat: Infinity, ease: "easeInOut" },
              }}
            >
              <TiltCard intensity={14}>
                <div className="glass-card p-4">
                  <div className="mb-2.5 grid h-11 w-11 place-items-center rounded-2xl" style={{ background: "rgba(167,139,113,0.12)" }}>
                    <Icon className="h-5 w-5 text-primary" strokeWidth={1.7} />
                  </div>
                  <div className="font-display text-sm font-semibold">{t}</div>
                  <div className="mt-0.5 text-[11px] font-light text-foreground/50">{d}</div>
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="relative mx-auto max-w-7xl px-6 py-24 md:px-12">
        <Reveal>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
            <span className="h-px w-8 bg-primary/50" /> The platform
          </div>
          <h2 className="mt-4 max-w-2xl font-display text-4xl font-medium italic tracking-tight md:text-5xl">
            Everything a goal cycle needs, <span className="text-gold">in one place.</span>
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { i: Target, t: "Goal Sheets", d: "Draft goals across thrust areas with UoM, target and weightage. 100% validation before submit." },
            { i: ClipboardCheck, t: "Quarterly Check-ins", d: "Capture actuals each quarter; progress auto-computed by the scoring engine." },
            { i: ShieldCheck, t: "Approval & Lock", d: "Managers review, approve and lock. Every change written to an immutable audit trail." },
            { i: BarChart3, t: "Team Analytics", d: "Real-time completion matrix, weighted scores and CSV export across the org." },
          ].map((f, i) => (
            <Reveal key={f.t} delay={i * 0.07}>
              <div className="group glass-card h-full p-6">
                <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl transition-transform duration-500 group-hover:scale-110" style={{ background: "rgba(167,139,113,0.12)" }}>
                  <f.i className="h-6 w-6 text-primary" strokeWidth={1.7} />
                </div>
                <h3 className="font-display text-xl font-semibold">{f.t}</h3>
                <p className="mt-2 text-sm font-light leading-relaxed text-foreground/50">{f.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ─── WORKFLOW ─── */}
      <section id="workflow" className="relative mx-auto max-w-7xl px-6 py-16 md:px-12">
        <div className="glass relative overflow-hidden rounded-[32px] p-10 md:p-16">
          <div className="animate-drift pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full" style={{ background: "radial-gradient(circle, rgba(167,139,113,0.18), transparent 60%)" }} />
          <Reveal>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
              <span className="h-px w-8 bg-primary/50" /> How it works
            </div>
            <h2 className="mt-4 font-display text-3xl font-medium italic tracking-tight md:text-4xl">Three phases, one continuous loop</h2>
          </Reveal>
          <div className="mt-12 grid gap-10 md:grid-cols-3">
            {[
              { n: "01", t: "Set", d: "Employees draft goals with UoM, target & weightage. The manager reviews, approves and locks the sheet." },
              { n: "02", t: "Track", d: "Quarterly actuals are captured, statuses update, and progress is auto-computed per the UoM formula." },
              { n: "03", t: "Govern", d: "Cycle windows control the calendar, an audit trail records every change, and admins can override." },
            ].map((s, i) => (
              <Reveal key={s.t} delay={i * 0.1}>
                <div className="relative">
                  <div className="font-display text-6xl font-bold italic text-primary/25">{s.n}</div>
                  <h3 className="mt-2 font-display text-2xl font-semibold">{s.t}</h3>
                  <p className="mt-2 text-sm font-light leading-relaxed text-foreground/50">{s.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ROLES / STATS BAND ─── */}
      <section id="roles" className="relative mx-auto max-w-7xl px-6 py-20 md:px-12">
        <Reveal>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { k: "Employee", v: "Set & track", d: "Draft goals, log quarterly actuals" },
              { k: "Manager", v: "Review & lock", d: "Approve sheets, monitor the team" },
              { k: "Admin", v: "Govern cycles", d: "Windows, shared KPIs, overrides" },
              { k: "Database Admin", v: "People & roles", d: "Provision users, assign managers" },
            ].map((r) => (
              <div key={r.k} className="glass-card p-6">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/70">{r.k}</div>
                <div className="mt-3 font-display text-2xl font-semibold italic">{r.v}</div>
                <div className="mt-1.5 text-xs font-light text-foreground/50">{r.d}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ─── CTA ─── */}
      <section className="relative mx-auto max-w-7xl px-6 pb-28 md:px-12">
        <Reveal>
          <div className="glass relative overflow-hidden rounded-[32px] px-8 py-20 text-center">
            <div className="animate-glow-pulse pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full" style={{ background: "radial-gradient(circle, rgba(167,139,113,0.25), transparent 60%)" }} />
            <h2 className="relative font-display text-4xl font-medium italic tracking-tight md:text-5xl">
              Ready to align your <span className="text-gold">whole team?</span>
            </h2>
            <p className="relative mx-auto mt-4 max-w-lg font-light text-foreground/55">
              Sign in to open the portal, or explore instantly with a demo persona.
            </p>
            <Link
              to="/login"
              className="pill shimmer relative mt-9 inline-flex items-center gap-2 bg-white px-8 py-4 text-sm font-semibold text-black transition hover:bg-[#e8d5b7]"
            >
              Open the portal <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="mx-auto max-w-7xl px-6 pb-14 md:px-12">
        <div className="hr-fade mb-8" />
        <div className="grid gap-8 md:grid-cols-[1.5fr_1fr_1fr_1.5fr]">
          <div>
            <div className="font-display text-lg font-bold italic">Nexus<span className="text-primary">Tracker</span></div>
            <p className="mt-3 max-w-xs text-xs font-light leading-relaxed text-foreground/45">
              The in-house goal-tracking portal for the Atomberg hackathon — set, track, and achieve.
            </p>
            <div className="mt-4 flex gap-2">
              {[GitBranch, Lock, Activity].map((I, i) => (
                <span key={i} className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-foreground/50 transition hover:border-primary/50 hover:text-primary">
                  <I className="h-4 w-4" />
                </span>
              ))}
            </div>
          </div>
          {[
            { h: "Product", l: ["Features", "Workflow", "Roles"] },
            { h: "Portal", l: ["Sign in", "Demo personas", "Dashboard"] },
          ].map((col) => (
            <div key={col.h}>
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground/40">{col.h}</div>
              <ul className="mt-4 space-y-2.5">
                {col.l.map((x) => (
                  <li key={x}><Link to="/login" className="text-sm font-light text-foreground/60 transition hover:text-primary">{x}</Link></li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground/40">Join the digest</div>
            <div className="mt-4 flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] p-1.5 pl-4">
              <input placeholder="you@atomberg.com" className="flex-1 bg-transparent text-sm font-light text-foreground outline-none placeholder:text-foreground/35" />
              <button className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-black transition hover:bg-[#e8d5b7]">
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        <div className="mt-10 text-[11px] font-light text-foreground/35">
          Nexus Tracker · AtomQuest GoalPortal · Atomberg Hackathon 2026
        </div>
      </footer>
    </div>
  );
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}
