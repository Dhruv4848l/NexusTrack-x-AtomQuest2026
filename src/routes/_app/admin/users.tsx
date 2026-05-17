import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/lib/api";
import { PageHeader, NeuCard } from "@/components/app/ui";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, UserPlus, Users as UsersIcon, Shield, Search, X } from "lucide-react";

export const Route = createFileRoute("/_app/admin/users")({
  head: () => ({ meta: [{ title: "People · AtomQuest" }] }),
  component: Users,
});

function Users() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"employees" | "managers" | "admins">("employees");
  const [search, setSearch] = useState("");
  const [createModal, setCreateModal] = useState(false);

  const q = useQuery({
    queryKey: ["users"],
    queryFn: () => usersApi.list().then((r) => r.data),
  });

  const users = q.data ?? [];
  const filtered = useMemo(() => {
    return users.filter(u => 
      `${u.first_name} ${u.last_name} ${u.email} ${u.employee_id}`.toLowerCase().includes(search.toLowerCase())
    );
  }, [users, search]);

  const managers = useMemo(() => {
    const m = filtered.filter(u => u.roles.includes('manager'));
    const grouped: Record<string, typeof m> = {};
    m.forEach(x => {
      const dept = x.department || "No Department";
      if (!grouped[dept]) grouped[dept] = [];
      grouped[dept].push(x);
    });
    return grouped;
  }, [filtered]);

  const admins = useMemo(() => {
    const a = filtered.filter(u => u.roles.includes('admin'));
    const grouped: Record<string, typeof a> = {};
    a.forEach(x => {
      const dept = x.department || "No Department";
      if (!grouped[dept]) grouped[dept] = [];
      grouped[dept].push(x);
    });
    return grouped;
  }, [filtered]);

  return (
    <>
      <PageHeader
        title="People Management"
        subtitle="Organize your workforce, assign managers, and manage system access."
        actions={
          <button onClick={() => setCreateModal(true)} className="pill px-4 py-2 text-sm font-semibold text-primary-foreground inline-flex items-center gap-2" style={{ background: "var(--gradient-cool)" }}>
            <UserPlus className="w-4 h-4" /> Add User
          </button>
        }
      />

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab("employees")} className={`pill px-4 py-2 text-sm font-semibold inline-flex items-center gap-2 transition ${tab === "employees" ? "text-primary-foreground shadow-sm" : "bg-secondary text-secondary-foreground"}`} style={tab === "employees" ? { background: "var(--gradient-cool)" } : {}}>
          <UsersIcon className="w-4 h-4" /> Employees
        </button>
        <button onClick={() => setTab("managers")} className={`pill px-4 py-2 text-sm font-semibold inline-flex items-center gap-2 transition ${tab === "managers" ? "text-primary-foreground shadow-sm" : "bg-secondary text-secondary-foreground"}`} style={tab === "managers" ? { background: "var(--gradient-warm)" } : {}}>
          <Shield className="w-4 h-4" /> Managers
        </button>
        <button onClick={() => setTab("admins")} className={`pill px-4 py-2 text-sm font-semibold inline-flex items-center gap-2 transition ${tab === "admins" ? "text-primary-foreground shadow-sm" : "bg-secondary text-secondary-foreground"}`} style={tab === "admins" ? { background: "var(--coral)" } : {}}>
          <Shield className="w-4 h-4" /> Admins
        </button>
        <div className="flex-1" />
        <div className="neu-inset flex items-center gap-2 px-3 py-1.5 w-full max-w-xs">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input placeholder="Search people…" value={search} onChange={e => setSearch(e.target.value)} className="bg-transparent outline-none text-sm flex-1" />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {tab === "employees" ? (
          <motion.div key="emp" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <NeuCard>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="py-2 pr-3">Employee</th>
                      <th className="py-2 pr-3">Dept & ID</th>
                      <th className="py-2 pr-3">Assigned Manager</th>
                      <th className="py-2 pr-3">System Roles</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p) => (
                      <UserRow key={p._id} user={p} allUsers={users} onUpdate={() => qc.invalidateQueries({ queryKey: ["users"] })} />
                    ))}
                  </tbody>
                </table>
              </div>
            </NeuCard>
          </motion.div>
        ) : tab === "managers" ? (
          <motion.div key="mgr" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            {Object.entries(managers).map(([dept, deptUsers]) => (
              <div key={dept}>
                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 ml-2 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-peach" /> {dept}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {deptUsers.map(u => (
                    <NeuCard key={u._id} className="!p-4 border-l-4 border-l-peach">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg" style={{ background: "var(--gradient-peach)", color: "white" }}>
                          {u.first_name?.[0] || "?"}
                        </div>
                        <div>
                          <div className="font-semibold text-sm">{u.first_name || "Unknown"} {u.last_name || ""}</div>
                          <div className="text-[10px] text-muted-foreground">{u.email}</div>
                        </div>
                      </div>
                    </NeuCard>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        ) : tab === "admins" ? (
          <motion.div key="adm" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            {Object.entries(admins).map(([dept, deptUsers]) => (
              <div key={dept}>
                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 ml-2 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-coral" /> {dept}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {deptUsers.map(u => (
                    <NeuCard key={u._id} className="!p-4 border-l-4 border-l-coral">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg" style={{ background: "var(--coral)", color: "white" }}>
                          {u.first_name?.[0] || "?"}
                        </div>
                        <div>
                          <div className="font-semibold text-sm">{u.first_name || "Unknown"} {u.last_name || ""}</div>
                          <div className="text-[10px] text-muted-foreground">{u.email}</div>
                        </div>
                      </div>
                    </NeuCard>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {createModal && <CreateUserModal onClose={() => setCreateModal(false)} onCreated={() => { setCreateModal(false); qc.invalidateQueries({ queryKey: ["users"] }); }} />}
      </AnimatePresence>
    </>
  );
}

function UserRow({ user: p, allUsers, onUpdate }: { user: any; allUsers: any[]; onUpdate: () => void }) {
  const roles = p.roles ?? [];
  const managerId = typeof p.manager_id === "string" ? p.manager_id : (p.manager_id as any)?._id ?? null;

  return (
    <tr className="border-t border-border group">
      <td className="py-3 pr-3">
        <div className="font-semibold text-sm">{p.first_name} {p.last_name}</div>
        <div className="text-[11px] text-muted-foreground">{p.email}</div>
      </td>
      <td className="py-3 pr-3">
        <div className="flex flex-col gap-1">
          <input
            defaultValue={p.department ?? ""}
            placeholder="Dept"
            onBlur={async (e) => {
              if (e.target.value !== (p.department ?? "")) {
                try {
                  await usersApi.update(p._id, { department: e.target.value });
                  toast.success("Updated");
                  onUpdate();
                } catch (err: any) { toast.error(err.response?.data?.message ?? err.message); }
              }
            }}
            className="neu-inset px-2 py-1 text-[11px] rounded-lg bg-transparent outline-none w-24"
          />
          <div className="text-[10px] text-muted-foreground ml-1">ID: {p.employee_id || "—"}</div>
        </div>
      </td>
      <td className="py-3 pr-3">
        <select
          value={managerId ?? ""}
          onChange={async (e) => {
            try {
              await usersApi.update(p._id, { manager_id: e.target.value || null });
              toast.success("Manager updated");
              onUpdate();
            } catch (err: any) { toast.error(err.response?.data?.message ?? err.message); }
          }}
          className="neu-inset px-2 py-1 text-[11px] rounded-lg bg-transparent outline-none max-w-[140px]"
        >
          <option value="">No Manager</option>
          {allUsers.filter((m) => m.roles.includes('manager') && m._id !== p._id).map((m) => (
            <option key={m._id} value={m._id}>{m.first_name} {m.last_name} ({m.department})</option>
          ))}
        </select>
      </td>
      <td className="py-3 pr-3">
        <div className="flex gap-1 flex-wrap">
          {(["employee", "manager", "admin", "database_admin"] as const).map((r) => {
            const has = roles.includes(r);
            const newRoles = [r];
            return (
              <button
                key={r}
                onClick={async () => {
                  try {
                    await usersApi.setRoles(p._id, newRoles);
                    onUpdate();
                  } catch (err: any) { toast.error(err.response?.data?.message ?? err.message); }
                }}
                className={`pill px-2 py-0.5 text-[9px] font-bold uppercase tracking-tighter transition ${has ? "text-primary-foreground" : "bg-secondary opacity-60"}`}
                style={has ? { background: roleColor(r) } : undefined}
              >
                {r.replace(/_/g, '')}
              </button>
            );
          })}
        </div>
      </td>
    </tr>
  );
}

function roleColor(r: string) {
  if (r === "admin") return "var(--gradient-cool)";
  if (r === "database_admin") return "var(--gradient-blue)";
  if (r === "manager") return "var(--gradient-amber)";
  if (r === "employee") return "var(--gradient-mint)";
  return "var(--gradient-cool)";
}

function CreateUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", password: "", department: "", employee_id: "" });
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await authApi.register(form.first_name, form.last_name, form.email, form.password, form.department, form.employee_id);
      toast.success("User created successfully");
      onCreated();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md neu-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="font-display font-bold text-lg">Create New User</div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-secondary transition"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Inp label="First Name" value={form.first_name} onChange={v => setForm({...form, first_name: v})} required />
            <Inp label="Last Name" value={form.last_name} onChange={v => setForm({...form, last_name: v})} required />
          </div>
          <Inp label="Email Address" type="email" value={form.email} onChange={v => setForm({...form, email: v})} required />
          <Inp label="Initial Password" type="text" value={form.password} onChange={v => setForm({...form, password: v})} required />
          <div className="grid grid-cols-2 gap-3">
            <Inp label="Department" value={form.department} onChange={v => setForm({...form, department: v})} />
            <Inp label="Employee ID" value={form.employee_id} onChange={v => setForm({...form, employee_id: v})} />
          </div>
          <button disabled={busy} className="pill w-full px-5 py-3 text-sm font-bold text-primary-foreground disabled:opacity-60 transition" style={{ background: "var(--gradient-cool)" }}>
            {busy ? "Creating…" : "Create Account"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function Inp({ label, ...p }: any) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1 ml-1">{label}</div>
      <input className="neu-inset w-full px-3 py-2 text-sm bg-transparent outline-none" {...p} onChange={e => p.onChange(e.target.value)} />
    </div>
  );
}
