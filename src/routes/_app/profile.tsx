import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { authApi } from "@/lib/api";
import { PageHeader, NeuCard } from "@/components/app/ui";
import { useState } from "react";
import { toast } from "sonner";
import { User, Mail, Phone, Calendar, Hash, Lock, Camera, Save } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "My Profile · AtomQuest" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, refresh, activeRole } = useAuth();
  const [busy, setBusy] = useState(false);
  
  // Profile Fields
  const [phone, setPhone] = useState(user?.phone_number ?? "");
  const [dob, setDob] = useState(user?.dob?.slice(0, 10) ?? "");
  const [personalEmail, setPersonalEmail] = useState(user?.personal_email ?? "");
  
  // Password Fields
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [repeatPass, setRepeatPass] = useState("");

  const isAdmin = activeRole === "admin" || activeRole === "database_admin";

  if (!user) return null;

  async function updateProfile(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await authApi.updateMe({ phone_number: phone, dob, personal_email: personalEmail });
      toast.success("Profile updated");
      await refresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? err.message);
    } finally {
      setBusy(false);
    }
  }

  async function updatePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPass !== repeatPass) return toast.error("Passwords do not match");
    setBusy(true);
    try {
      await authApi.changePassword({ currentPassword: currentPass, newPassword: newPass, repeatPassword: repeatPass });
      toast.success("Password changed successfully");
      setCurrentPass("");
      setNewPass("");
      setRepeatPass("");
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="My Profile" subtitle="Manage your personal information and account security." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-2 space-y-6">
          <NeuCard>
            <div className="flex items-center gap-6 mb-8">
              <div className="relative group">
                <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-3xl font-bold text-white shadow-lg overflow-hidden" style={{ background: "var(--gradient-cool)" }}>
                  {user.profile_image ? (
                    <img src={user.profile_image} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    user.first_name[0]
                  )}
                </div>
                <button className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-background border border-border shadow-sm hover:shadow-md transition group-hover:scale-110">
                  <Camera className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold">{user.first_name} {user.last_name}</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <span className="pill px-2 py-0.5 bg-secondary text-[10px] font-bold uppercase">{activeRole?.replace(/_/g, ' ')}</span>
                  <span>•</span>
                  <span>{user.department || "No Department"}</span>
                </div>
              </div>
            </div>

            <form onSubmit={updateProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ReadOnlyField label="First Name" icon={User} value={user.first_name} />
                <ReadOnlyField label="Last Name" icon={User} value={user.last_name} />
                <ReadOnlyField label="Email Address" icon={Mail} value={user.email} />
                <ReadOnlyField label="Employee ID" icon={Hash} value={user.employee_id || "Not Assigned"} />
                
                <EditableField label="Phone Number" icon={Phone} value={phone} onChange={setPhone} placeholder="e.g. +91 9876543210" />
                <EditableField label="Date of Birth" icon={Calendar} type="date" value={dob} onChange={setDob} />
                <EditableField label="Personal Email (for test delivery)" icon={Mail} value={personalEmail} onChange={setPersonalEmail} placeholder="e.g. yourname@gmail.com" />
              </div>

              <div className="flex justify-end pt-4">
                <button disabled={busy} className="pill px-6 py-2.5 text-sm font-bold text-primary-foreground inline-flex items-center gap-2 disabled:opacity-60 transition active:scale-95" style={{ background: "var(--gradient-cool)" }}>
                  <Save className="w-4 h-4" /> Save Changes
                </button>
              </div>
            </form>
          </NeuCard>
        </div>

        {/* Security Card */}
        <div className="space-y-6">
          <NeuCard>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-600">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-lg">Change Password</h3>
            </div>

            <form onSubmit={updatePassword} className="space-y-4">
              <EditableField label="Current Password" icon={Lock} type="password" value={currentPass} onChange={setCurrentPass} required />
              <EditableField label="New Password" icon={Lock} type="password" value={newPass} onChange={setNewPass} required />
              <EditableField label="Repeat New Password" icon={Lock} type="password" value={repeatPass} onChange={setRepeatPass} required />
              
              <div className="text-[10px] text-muted-foreground bg-secondary/30 p-3 rounded-xl border border-border/50">
                Password must be 8-20 characters with at least one capital letter, one small letter, one number, and one special character.
              </div>

              <button disabled={busy} className="pill w-full px-5 py-3 text-sm font-bold text-primary-foreground disabled:opacity-60 transition" style={{ background: "var(--gradient-cool)" }}>
                Update Security
              </button>
            </form>
          </NeuCard>
        </div>
      </div>
    </>
  );
}

function ReadOnlyField({ label, icon: Icon, value }: any) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1.5 ml-1">{label}</div>
      <div className="neu-inset flex items-center gap-3 px-4 py-3 bg-secondary/20 opacity-80 cursor-not-allowed">
        <Icon className="w-4 h-4 text-muted-foreground/50" />
        <div className="text-sm text-muted-foreground flex-1">{value}</div>
        <Lock className="w-3 h-3 text-muted-foreground/30" />
      </div>
    </div>
  );
}

function EditableField({ label, icon: Icon, ...p }: any) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1.5 ml-1">{label}</div>
      <div className="neu-inset flex items-center gap-3 px-4 py-3 focus-within:shadow-[var(--shadow-soft-sm)] transition">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <input className="bg-transparent outline-none text-sm flex-1 placeholder:text-muted-foreground" {...p} onChange={e => p.onChange(e.target.value)} />
      </div>
    </div>
  );
}
