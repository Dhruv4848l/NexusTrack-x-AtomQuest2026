import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useAuth, type AppRole } from "@/lib/auth-context";
import { authApi } from "@/lib/api";
import { toast } from "sonner";
import {
  LayoutDashboard, Target, ClipboardCheck, CalendarRange,
  Users, ScrollText, FileBarChart2, Sparkles, LogOut,
  ChevronDown, ChevronRight, User, KeyRound, ShieldCheck, Lock
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type IconCmp = React.ComponentType<React.SVGProps<SVGSVGElement>>;
type NavChild = { to: string; label: string; icon: IconCmp; roles: AppRole[]; hint: string };
type NavGroup = { label: string; roles: AppRole[]; children: NavChild[] };

/** Groups of nav items — renders as a hover mega-menu panel */
const NAV_GROUPS: NavGroup[] = [
  {
    label: "My Work",
    roles: ["employee"],
    children: [
      { to: "/dashboard",  label: "Dashboard",    icon: LayoutDashboard, roles: ["employee"], hint: "Overview of your goals & scores" },
      { to: "/goals",      label: "My Goals",     icon: Target,          roles: ["employee"], hint: "Edit & submit your goal sheet" },
      { to: "/checkins",   label: "My Check-ins", icon: ClipboardCheck,  roles: ["employee"], hint: "Log quarterly actuals" },
    ],
  },
  {
    label: "Team",
    roles: ["manager"],
    children: [
      { to: "/goals/review",   label: "Approval Queue", icon: ScrollText, roles: ["manager"], hint: "Review & approve submitted sheets" },
      { to: "/checkins/team",  label: "Team Check-ins", icon: Users,      roles: ["manager"], hint: "Monitor team progress by quarter" },
      { to: "/admin/completion", label: "Completion Status", icon: ClipboardCheck, roles: ["manager"], hint: "Track team check-in completion" },
      { to: "/reports",        label: "Reports",        icon: FileBarChart2, roles: ["manager"], hint: "Export planned vs actual data" },
    ],
  },
  {
    label: "Admin",
    roles: ["admin", "database_admin"],
    children: [
      { to: "/admin/cycles",       label: "Cycles",       icon: CalendarRange, roles: ["admin"],          hint: "Manage annual goal cycles & phases" },
      { to: "/admin/users",        label: "People",       icon: Users,         roles: ["admin", "database_admin"], hint: "Assign roles & org hierarchy" },
      { to: "/admin/completion",   label: "Completion",   icon: ClipboardCheck,roles: ["admin"],       hint: "Track quarterly check-in completion" },
      { to: "/admin/shared-goals", label: "Shared Goals", icon: Sparkles,      roles: ["admin"],hint: "Push KPIs to multiple employees" },
      { to: "/admin/audit",        label: "Audit Log",    icon: ScrollText,    roles: ["admin"],          hint: "Full change history & actor trail" },
    ],
  },
];

export function AppShell() {
  const { user, roles, activeRole, setActiveRole, signOut, loading } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [hovered, setHovered] = useState<string | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [loading, user, nav]);



  if (loading || !user || !activeRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="neu-card-sm px-8 py-6 font-display text-muted-foreground">Loading…</div>
      </div>
    );
  }

  const visibleGroups = NAV_GROUPS.filter((g) => g.roles.includes(activeRole));

  function handleMouseEnter(label: string) {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    setHovered(label);
  }

  function handleMouseLeave() {
    leaveTimer.current = setTimeout(() => setHovered(null), 120);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ─── Top Navigation Bar ─── */}
      <header className="sticky top-0 z-50 w-full bg-card border-b border-border/50"
        style={{ boxShadow: "var(--shadow-soft-sm)" }}>
        <div className="mx-auto max-w-[1440px] flex items-center h-16 gap-1.5 sm:gap-3 px-4 sm:px-6">

          {/* Brand */}
          <Link to="/dashboard" className="flex items-center gap-2 shrink-0 mr-2 sm:mr-4 lg:mr-6">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-primary-foreground font-display font-bold text-sm"
              style={{ background: getRoleGradient(activeRole) }}>A</div>
            <div>
              <div className="font-display font-bold text-sm sm:text-base leading-tight">AtomQuest</div>
              <div className="text-[9px] sm:text-[10px] text-muted-foreground leading-none">GoalPortal</div>
            </div>
          </Link>

          {/* ─── Grouped Mega-Menu Nav ─── */}
          <nav className="flex items-center gap-1 flex-1">
            {/* Desktop Navigation (Inline links) */}
            <div className="hidden lg:flex items-center gap-1.5 flex-1">
              {visibleGroups.flatMap((group) =>
                group.children
                  .filter((c) => c.roles.includes(activeRole))
                  .map((item) => {
                    const Icon = item.icon;
                    const active = loc.pathname === item.to || loc.pathname.startsWith(item.to + "/");
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                          active
                            ? "text-primary-foreground shadow-[var(--shadow-soft-sm)]"
                            : "text-foreground/65 hover:text-foreground hover:bg-secondary"
                        }`}
                        style={active ? { background: getRoleGradient(activeRole) } : undefined}
                      >
                        <Icon className="w-4 h-4 shrink-0" strokeWidth={2} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })
              )}
            </div>

            {/* Mobile & Tablet Navigation (Collapsible Dropdown) */}
            <div className="flex lg:hidden items-center gap-1">
              {visibleGroups.map((group) => {
                const isGroupActive = group.children.some(
                  (c) => loc.pathname === c.to || loc.pathname.startsWith(c.to + "/")
                );
                const isOpen = hovered === group.label;

                return (
                  <div
                    key={group.label}
                    className="relative"
                    onMouseEnter={() => handleMouseEnter(group.label)}
                    onMouseLeave={handleMouseLeave}
                  >
                    {/* Group trigger button */}
                    <button
                      type="button"
                      onClick={() => setHovered(isOpen ? null : group.label)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                        isGroupActive
                          ? "text-primary-foreground shadow-[var(--shadow-soft-sm)]"
                          : "text-foreground/65 hover:text-foreground hover:bg-secondary"
                      }`}
                      style={isGroupActive ? { background: getRoleGradient(activeRole) } : undefined}
                    >
                      <span>{group.label}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    {/* Mega-menu dropdown */}
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.97 }}
                          transition={{ duration: 0.15, ease: "easeOut" }}
                          onMouseEnter={() => handleMouseEnter(group.label)}
                          onMouseLeave={handleMouseLeave}
                          className="absolute top-full left-0 mt-2 w-60 sm:w-64 neu-card p-1.5 sm:p-2 z-50"
                          style={{ borderRadius: "1.25rem" }}
                        >
                          {/* Column header */}
                          <div className="px-3 py-1.5 text-[9px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">
                            {group.label}
                          </div>

                          {group.children
                            .filter((c) => c.roles.includes(activeRole))
                            .map((item) => {
                              const Icon = item.icon;
                              const active = loc.pathname === item.to || loc.pathname.startsWith(item.to + "/");
                              return (
                                <Link
                                  key={item.to}
                                  to={item.to}
                                  onClick={() => setHovered(null)}
                                  className={`group flex items-start gap-2.5 px-2.5 py-2 sm:px-3 sm:py-2.5 rounded-xl transition-all ${
                                    active
                                      ? "text-primary-foreground"
                                      : "text-foreground/70 hover:text-foreground hover:bg-secondary"
                                  }`}
                                  style={active ? { background: getRoleGradient(activeRole) } : undefined}
                                >
                                  <div className={`mt-0.5 shrink-0 p-1.5 rounded-lg ${active ? "bg-white/20" : "bg-secondary group-hover:bg-muted"}`}>
                                    <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="text-sm font-semibold leading-tight truncate">{item.label}</div>
                                    <div className={`text-[10px] leading-tight mt-0.5 truncate ${active ? "text-white/70" : "text-muted-foreground"}`}>
                                      {item.hint}
                                    </div>
                                  </div>
                                  <ChevronRight className={`w-3.5 h-3.5 ml-auto mt-1 shrink-0 opacity-0 group-hover:opacity-60 transition-opacity ${active ? "opacity-60" : ""}`} />
                                </Link>
                              );
                            })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </nav>

          {/* ─── Right side ─── */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 ml-auto">
            {/* Welcome */}
            <div className="hidden md:block text-right">
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground leading-none">Welcome</div>
              <div className="font-display font-semibold text-sm leading-tight mt-0.5">{user?.first_name ?? "—"}</div>
            </div>

            {/* Profile Link */}
            <Link
              to="/profile"
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition"
            >
              <User className="w-[15px] h-[15px]" strokeWidth={1.75} />
              <span className="hidden sm:inline">Profile</span>
            </Link>

            {/* Sign Out */}
            <button
              id="sign-out-btn"
              onClick={() => signOut()}
              title="Sign out"
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition"
            >
              <LogOut className="w-[15px] h-[15px]" strokeWidth={1.75} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* ─── Page Content ─── */}
      <main className="flex-1 mx-auto w-full max-w-[1440px] px-4 lg:px-8 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={loc.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className="space-y-6"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {user.is_first_login && <ForcePasswordChangeModal user={user} onComplete={() => window.location.reload()} />}
      </AnimatePresence>
    </div>
  );
}

function roleColor(r: AppRole) {
  if (r === "admin") return "var(--coral)";
  if (r === "database_admin") return "var(--primary)";
  if (r === "manager") return "var(--amber)";
  return "var(--mint)";
}

function getRoleGradient(r: AppRole) {
  if (r === "manager") return "var(--gradient-amber)";
  if (r === "database_admin") return "var(--gradient-blue)";
  if (r === "employee") return "var(--gradient-mint)";
  return "var(--gradient-cool)";
}

function ForcePasswordChangeModal({ user, onComplete }: { user: any, onComplete: () => void }) {
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [repeatPass, setRepeatPass] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (newPass !== repeatPass) return toast.error("New passwords do not match");
    
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#\-_.\^])[A-Za-z\d@$!%*?&#\-_.\^]{8,30}$/;
    if (!regex.test(newPass)) {
      return toast.error("Password must be 8-30 chars with mixed case, number, and special char.");
    }

    setBusy(true);
    try {
      await authApi.changePassword({ currentPassword: currentPass, newPassword: newPass, repeatPassword: repeatPass });
      toast.success("Password updated successfully!");
      onComplete();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-background/95 backdrop-blur-md p-4">
      <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="w-full max-w-md neu-card p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shadow-inner">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl">First-time Setup</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Security Requirement</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          Welcome, <span className="font-semibold text-foreground">{user.first_name}</span>. 
          Please update your initial password to a secure one before accessing your account.
        </p>

        <form onSubmit={submit} className="space-y-4">
          <Field label="Current Password" icon={KeyRound} type="password" value={currentPass} onChange={setCurrentPass} placeholder="Enter initial password" required />
          <Field label="New Password" icon={ShieldCheck} type="password" value={newPass} onChange={setNewPass} placeholder="Min 8 characters" required />
          <Field label="Repeat New Password" icon={ShieldCheck} type="password" value={repeatPass} onChange={setRepeatPass} placeholder="Match new password" required />

          <div className="bg-secondary/50 p-4 rounded-2xl text-[11px] space-y-1.5 border border-border/50">
            <div className="font-bold text-muted-foreground uppercase mb-1">Requirements:</div>
            <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
              <li>8 to 30 characters long</li>
              <li>At least one capital letter (A-Z)</li>
              <li>At least one small letter (a-z)</li>
              <li>At least one number (0-9)</li>
              <li>At least one special character (@$!%*?&#-_.)</li>
            </ul>
          </div>

          <button disabled={busy} className="pill w-full px-5 py-4 text-sm font-bold text-primary-foreground disabled:opacity-60 transition active:scale-[0.98]" style={{ background: "var(--gradient-cool)" }}>
            {busy ? "Updating…" : "Update Password & Continue"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function Field({ label, icon: Icon, ...p }: any) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5 ml-1">{label}</div>
      <div className="neu-inset flex items-center gap-3 px-4 py-3">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <input className="bg-transparent outline-none text-sm flex-1 placeholder:text-muted-foreground" {...p} onChange={(e) => p.onChange(e.target.value)} />
      </div>
    </div>
  );
}
