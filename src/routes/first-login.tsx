import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { authApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { KeyRound, ShieldCheck, Lock } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/first-login")({
  head: () => ({ meta: [{ title: "Setup Password · AtomQuest" }] }),
  component: FirstLogin,
});

function FirstLogin() {
  const { user, signOut } = useAuth();
  const nav = useNavigate();
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [repeatPass, setRepeatPass] = useState("");
  const [busy, setBusy] = useState(false);

  if (!user) {
    nav({ to: "/login" });
    return null;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (newPass !== repeatPass) return toast.error("New passwords do not match");
    
    // Constraint check
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#\-_.\^])[A-Za-z\d@$!%*?&#\-_.\^]{8,30}$/;
    if (!regex.test(newPass)) {
      return toast.error("Password must be 8-30 chars with mixed case, number, and special char.");
    }

    setBusy(true);
    try {
      await authApi.changePassword({ currentPassword: currentPass, newPassword: newPass, repeatPassword: repeatPass });
      toast.success("Password updated! Please sign in again.");
      signOut();
      nav({ to: "/login" });
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md neu-card p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl">First-time Setup</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Security Requirement</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          Welcome, <span className="font-semibold text-foreground">{user.first_name}</span>. 
          As this is your first login, please update your temporary password to a secure one.
        </p>

        <form onSubmit={submit} className="space-y-4">
          <Field label="Current Password" icon={KeyRound} type="password" value={currentPass} onChange={setCurrentPass} placeholder="Enter temporary password" required />
          <Field label="New Password" icon={ShieldCheck} type="password" value={newPass} onChange={setNewPass} placeholder="Min 8 characters" required />
          <Field label="Repeat New Password" icon={ShieldCheck} type="password" value={repeatPass} onChange={setRepeatPass} placeholder="Match new password" required />

          <div className="bg-secondary/50 p-4 rounded-2xl text-[11px] space-y-1.5 border border-border/50">
            <div className="font-bold text-muted-foreground uppercase mb-1">Requirements:</div>
            <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
              <li>8 to 20 characters long</li>
              <li>At least one capital letter (A-Z)</li>
              <li>At least one small letter (a-z)</li>
              <li>At least one number (0-9)</li>
              <li>At least one special character (@$!%*?&)</li>
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
