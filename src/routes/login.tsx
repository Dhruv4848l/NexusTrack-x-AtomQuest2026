import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import api, { authApi } from "@/lib/api";
import { toast } from "sonner";
import { Mail, KeyRound, User as UserIcon, ChevronDown, ArrowLeft, ShieldCheck } from "lucide-react";
import { type AppRole } from "@/lib/auth-context";
import { motion, AnimatePresence } from "framer-motion";
import { useRef } from "react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in · AtomQuest GoalPortal" }] }),
  component: Login,
});

function Login() {
  const { user, loading, setAuth } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [selectedRole, setSelectedRole] = useState<AppRole>("employee");
  const [forgotModal, setForgotModal] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const roleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && user) nav({ to: "/dashboard" });
  }, [loading, user, nav]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) setRoleOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    // Handle SSO Callback
    const params = new URLSearchParams(window.location.search);
    const ssoToken = params.get("sso_token");
    const ssoUserStr = params.get("sso_user");
    const err = params.get("error");
    
    if (ssoToken && ssoUserStr) {
      try {
        const ssoUser = JSON.parse(decodeURIComponent(ssoUserStr));
        // Default active role based on user roles
        const primaryRole = ssoUser.roles.includes("admin") ? "admin" 
                          : ssoUser.roles.includes("manager") ? "manager" 
                          : "employee";
        localStorage.setItem("activeRole", primaryRole);
        setAuth(ssoToken, ssoUser);
        toast.success("Successfully signed in with Microsoft!");
        nav({ to: "/dashboard" });
      } catch (e) {
        toast.error("Failed to parse SSO data");
      }
    } else if (err) {
      toast.error(`SSO Error: ${err}`);
    }
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await authApi.login(email, password, selectedRole);
      // Use server-determined activeRole (falls back to user's primary role if selectedRole doesn't match)
      const effectiveRole = data.activeRole || selectedRole;
      localStorage.setItem("activeRole", effectiveRole);
      setAuth(data.token, data.user);
      toast.success("Welcome back!");
      nav({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? err.message);
    } finally {
      setBusy(false);
    }
  }

  async function quickDemo(role: "employee" | "manager" | "admin") {
    setBusy(true);
    const creds = {
      employee: { email: "demo.employee@atomquest.app", password: "Atom!2026", first: "Aarav", last: "Sharma", roles: ["employee"] },
      manager:  { email: "demo.manager@atomquest.app",  password: "Atom!2026", first: "Preksha", last: "Iyer", roles: ["employee", "manager"] },
      admin:    { email: "demo.admin@atomquest.app",    password: "Atom!2026", first: "Riya", last: "Mehta", roles: ["employee", "manager", "admin"] },
    }[role];
    try {
      // Try login first; if fails, register then login
      let res;
      try {
        res = await authApi.login(creds.email, creds.password);
      } catch {
        res = await authApi.register(creds.first, creds.last, creds.email, creds.password, undefined, undefined, creds.roles);
      }
      localStorage.setItem("activeRole", role);
      setAuth(res.data.token, res.data.user);
      toast.success(`Signed in as demo ${role}`);
      nav({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex w-full">
      {/* ─── Left Pane: Branding & Info ─── */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-card border-r border-border/50 items-center justify-center p-12">
        {/* Decorative Gradients */}
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.15] pointer-events-none" style={{ background: "radial-gradient(circle at top left, var(--primary) 0%, transparent 50%)" }} />
        <div className="absolute bottom-0 right-0 w-full h-full opacity-[0.15] pointer-events-none" style={{ background: "radial-gradient(circle at bottom right, var(--mint) 0%, transparent 50%)" }} />
        
        <motion.div 
          initial={{ opacity: 0, x: -30 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 max-w-lg"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-primary-foreground font-display font-bold text-3xl shadow-xl" style={{ background: "var(--gradient-cool)" }}>A</div>
            <div className="font-display font-bold text-3xl tracking-widest text-foreground uppercase">ATOMBERG</div>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold leading-tight mb-6 text-foreground">
            Pioneering the future of <br />
            <span className="text-transparent bg-clip-text whitespace-nowrap" style={{ backgroundImage: "var(--gradient-cool)" }}>
              <TypewriterText words={["Smart Fans", "Mixer Grinders", "Smart Locks", "Home Appliances", "Smart Plugs", "Exhaust Fans"]} />
            </span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Atomberg is revolutionizing home appliances with cutting-edge BLDC technology and beautiful, smart design. Join us in shaping a more efficient and connected world.
          </p>
        </motion.div>
      </div>

      {/* ─── Right Pane: Authentication ─── */}
      <div className="flex-1 flex items-center justify-center px-4 py-10 relative">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="w-full max-w-md neu-card p-8 relative z-10"
        >
          <div className="flex items-center justify-between mb-8">
            {/* Mobile Header (Hidden on Desktop) */}
            <div className="flex items-center gap-3 lg:hidden">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-primary-foreground font-display font-bold text-lg shadow-sm" style={{ background: "var(--gradient-cool)" }}>A</div>
              <div>
                <div className="font-display font-bold text-lg leading-tight tracking-wider uppercase">ATOMBERG</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest">GoalPortal</div>
              </div>
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:block">
              <div className="font-display font-bold text-2xl leading-tight">Welcome Back</div>
              <div className="text-[11px] text-muted-foreground uppercase tracking-widest mt-1">Sign in to your account</div>
            </div>

            {/* Role Pill UI */}
            <div className="relative" ref={roleRef}>
              <button
                type="button"
                onClick={() => setRoleOpen((v) => !v)}
                className="pill flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-secondary-foreground text-[11px] font-bold capitalize hover:shadow-[var(--shadow-soft-sm)] transition"
              >
                <span className="w-2 h-2 rounded-full shadow-sm" style={{ background: roleColor(selectedRole) }} />
                {selectedRole}
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <AnimatePresence>
                {roleOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-40 neu-card-sm p-1.5 z-50"
                  >
                    {(["employee", "manager", "admin", "database_admin"] as AppRole[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => { setSelectedRole(r); setRoleOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-semibold capitalize hover:bg-secondary transition"
                      >
                        <span className="w-1.5 h-1.5 rounded-full shadow-sm" style={{ background: roleColor(r) }} />
                        {r.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <Field icon={Mail} type="email" placeholder="you@atomberg.com" value={email} onChange={setEmail} required />
            <Field icon={KeyRound} type="password" placeholder="Password" value={password} onChange={setPassword} required minLength={6} />

            <div className="flex justify-end pt-1">
              <button type="button" onClick={() => setForgotModal(true)} className="text-[11px] font-semibold text-primary hover:underline transition-colors">Forgot password?</button>
            </div>

            <button disabled={busy} className="pill w-full px-5 py-3.5 mt-2 text-sm font-bold text-primary-foreground disabled:opacity-60 transition-all active:scale-[0.98]" style={{ background: "var(--gradient-cool)", boxShadow: "var(--shadow-soft-sm)" }}>
              {busy ? "Signing in…" : "Sign in to GoalPortal"}
            </button>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-border/50"></div>
              <span className="flex-shrink-0 mx-4 text-muted-foreground text-xs font-semibold uppercase tracking-wider">Or</span>
              <div className="flex-grow border-t border-border/50"></div>
            </div>

            <button 
              type="button" 
              onClick={() => { window.location.href = `${api.defaults.baseURL}/auth/entra/login`; }}
              className="pill w-full px-5 py-3.5 text-sm font-bold text-foreground bg-secondary hover:bg-secondary/80 flex items-center justify-center gap-2 transition-all active:scale-[0.98]" 
              style={{ boxShadow: "var(--shadow-soft-sm)" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 21 21">
                <path fill="#f25022" d="M1 1h9v9H1z"/>
                <path fill="#00a4ef" d="M1 11h9v9H1z"/>
                <path fill="#7fba00" d="M11 1h9v9h-9z"/>
                <path fill="#ffb900" d="M11 11h9v9h-9z"/>
              </svg>
              Sign in with Microsoft
            </button>
          </form>

          <AnimatePresence>
            {forgotModal && <ForgotModal onClose={() => setForgotModal(false)} />}
          </AnimatePresence>

          <div className="mt-8 pt-6 border-t border-border/50">
            <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-4 text-center">Or try a demo persona</div>
            <div className="grid grid-cols-3 gap-2">
              {(["employee", "manager", "admin"] as const).map((r) => (
                <button key={r} onClick={() => quickDemo(r)} disabled={busy}
                  className="pill text-xs font-bold py-2.5 capitalize bg-secondary text-secondary-foreground hover:shadow-[var(--shadow-soft-sm)] transition disabled:opacity-50">
                  {r}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-4 text-center leading-relaxed max-w-[280px] mx-auto">
              Demo accounts are created on first click. Connect your MongoDB Atlas DB and backend first.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function roleColor(r: AppRole) {
  if (r === "admin") return "var(--coral)";
  if (r === "database_admin") return "var(--primary)";
  if (r === "manager") return "var(--amber)";
  return "var(--mint)";
}

function Field({ icon: Icon, ...p }: { icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; type?: string; placeholder: string; value: string; onChange: (s: string) => void; required?: boolean; minLength?: number }) {
  return (
    <div className="neu-inset flex items-center gap-3 px-4 py-3">
      <Icon className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
      <input
        className="bg-transparent outline-none text-sm flex-1 placeholder:text-muted-foreground"
        type={p.type ?? "text"}
        placeholder={p.placeholder}
        value={p.value}
        onChange={(e) => p.onChange(e.target.value)}
        required={p.required}
        minLength={p.minLength}
      />
    </div>
  );
}

function ForgotModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [pass, setPass] = useState("");
  const [repeat, setRepeat] = useState("");
  const [busy, setBusy] = useState(false);

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await authApi.requestForgotPassword(identifier);
      toast.success("OTP sent to your email/phone (check server logs)");
      setStep(2);
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? err.message);
    } finally {
      setBusy(false);
    }
  }

  async function verifyAndReset(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await authApi.verifyForgotPassword({ identifier, otp, newPassword: pass, repeatPassword: repeat });
      toast.success("Password reset successfully. Please sign in.");
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="w-full max-w-sm neu-card p-6">
        <div className="flex items-center gap-2 mb-6">
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-secondary transition"><ArrowLeft className="w-4 h-4" /></button>
          <div className="font-display font-bold text-lg">Reset Password</div>
        </div>

        {step === 1 ? (
          <form onSubmit={requestOtp} className="space-y-4">
            <p className="text-sm text-muted-foreground">Enter your registered email or phone number to receive a verification OTP.</p>
            <Field icon={Mail} placeholder="Email or Phone" value={identifier} onChange={setIdentifier} required />
            <button disabled={busy} className="pill w-full px-4 py-3 text-sm font-bold text-primary-foreground disabled:opacity-60 transition" style={{ background: "var(--gradient-cool)" }}>
              {busy ? "Sending…" : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyAndReset} className="space-y-4">
            <p className="text-sm text-muted-foreground">Enter the 6-digit OTP and your new password.</p>
            <Field icon={ShieldCheck} placeholder="6-digit OTP" value={otp} onChange={setOtp} required />
            <Field icon={KeyRound} type="password" placeholder="New Password" value={pass} onChange={setPass} required />
            <Field icon={KeyRound} type="password" placeholder="Repeat Password" value={repeat} onChange={setRepeat} required />
            <button disabled={busy} className="pill w-full px-4 py-3 text-sm font-bold text-primary-foreground disabled:opacity-60 transition" style={{ background: "var(--gradient-mint)" }}>
              {busy ? "Resetting…" : "Reset Password"}
            </button>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}

function TypewriterText({ words }: { words: string[] }) {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [reverse, setReverse] = useState(false);
  const [blink, setBlink] = useState(true);

  // Blinking cursor
  useEffect(() => {
    const timeout = setTimeout(() => setBlink((prev) => !prev), 500);
    return () => clearTimeout(timeout);
  }, [blink]);

  useEffect(() => {
    if (subIndex === words[index].length + 1 && !reverse) {
      const timeout = setTimeout(() => setReverse(true), 1500);
      return () => clearTimeout(timeout);
    }

    if (subIndex === 0 && reverse) {
      setReverse(false);
      setIndex((prev) => (prev + 1) % words.length);
      return;
    }

    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (reverse ? -1 : 1));
    }, Math.max(reverse ? 40 : 80, Math.random() * 80)); 

    return () => clearTimeout(timeout);
  }, [subIndex, index, reverse, words]);

  return (
    <span>
      {`${words[index].substring(0, subIndex)}`}
      <span className={`${blink ? "opacity-100" : "opacity-0"} transition-opacity duration-100 ml-1 font-light text-primary`}>|</span>
    </span>
  );
}
