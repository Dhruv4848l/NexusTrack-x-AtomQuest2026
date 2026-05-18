import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { sheetsApi, achievementsApi, cyclesApi, usersApi } from "@/lib/api";
import { useAuth, type AppRole } from "@/lib/auth-context";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader, NeuCard, Stat, StatusPill, ProgressBar } from "@/components/app/ui";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · AtomQuest" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user, activeRole } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    if (activeRole === "admin") {
      navigate({ to: "/admin/completion" });
    } else if (activeRole === "manager") {
      navigate({ to: "/goals/review" });
    } else if (activeRole === "database_admin") {
      navigate({ to: "/admin/users" });
    }
  }, [activeRole, navigate]);

  const activeCycleQ = useQuery({
    queryKey: ["cycle:active"],
    queryFn: () => cyclesApi.active().then((r) => r.data),
  });

  const cycle = activeCycleQ.data;

  const myData = useQuery({
    enabled: !!user && !!cycle,
    queryKey: ["dash:my", user?._id, cycle?._id],
    queryFn: async () => {
      const sheet = await sheetsApi.my(cycle!._id).then((r) => r.data);
      if (!sheet) return { sheet: null, goals: [], achievements: [] };
      const [goals, achievements] = await Promise.all([
        sheetsApi.get(sheet._id).then((r) => r.data.goals),
        achievementsApi.forSheet(sheet._id).then((r) => r.data),
      ]);
      return { sheet, goals, achievements };
    },
  });

  const teamData = useQuery({
    enabled: !!user && (activeRole === "manager" || activeRole === "admin"),
    queryKey: ["dash:team", user?._id, activeRole],
    queryFn: async () => {
      const [team, allSheets] = await Promise.all([
        usersApi.myTeam().then((r) => r.data),
        sheetsApi.list().then((r) => r.data),
      ]);
      const ids = new Set(team.map((t) => t._id));
      const teamSheets = allSheets.filter((s) => {
        const ownerId = typeof s.owner_id === "string" ? s.owner_id : (s.owner_id as any)._id;
        return ids.has(ownerId);
      });
      return { team, sheets: teamSheets };
    },
  });

  const allUsersQ = useQuery({
    enabled: activeRole === "admin",
    queryKey: ["users:all"],
    queryFn: () => usersApi.list().then((r) => r.data),
  });

  const myGoals = myData.data?.goals ?? [];
  const myAch = myData.data?.achievements ?? [];

  const avgScore = (() => {
    if (!myGoals.length) return 0;
    let weighted = 0, totalW = 0;
    for (const g of myGoals) {
      const a = myAch.filter((x) => x.goal_id === g._id).sort((a, b) => (a.quarter < b.quarter ? 1 : -1))[0];
      if (a?.computed_score != null) {
        weighted += Number(a.computed_score) * Number(g.weightage);
        totalW += Number(g.weightage);
      }
    }
    return totalW ? weighted / totalW : 0;
  })();

  const quarterChart = ["Q1", "Q2", "Q3", "Q4"].map((q) => {
    const rows = myAch.filter((a) => a.quarter === q);
    const avg = rows.length ? rows.reduce((s, r) => s + (Number(r.computed_score) || 0), 0) / rows.length : 0;
    return { q, score: Math.round(avg) };
  });

  const teamCompletion = (() => {
    const sheets = teamData.data?.sheets ?? [];
    if (!sheets.length) return 0;
    const done = sheets.filter((s) => s.status === "approved_locked" || s.status === "completed").length;
    return Math.round((done / sheets.length) * 100);
  })();

  return (
    <>
      <PageHeader
        title={`Hello, ${user?.full_name?.split(" ")[0] ?? "there"} 👋`}
        subtitle="Here's a snapshot of where your goals stand right now."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Stat label="Active goals" value={myGoals.length} accent="primary" hint={`Sheet: ${myData.data?.sheet?.status?.replace(/_/g, " ") ?? "not started"}`} />
        <Stat label="Weighted score" value={`${Math.round(avgScore)}%`} accent="mint" hint="Across approved goals" />
        <Stat label="On-track" value={myAch.filter((a) => a.status === "on_track" || a.status === "completed").length} accent="peach" hint={`${myAch.length} updates total`} />
        {activeRole !== "employee" && (
          <Stat label="Team completion" value={`${teamCompletion}%`} accent="coral" hint={`${teamData.data?.team.length ?? 0} reports`} />
        )}
        {activeRole === "employee" && (
          <Stat label="Cycle" value={cycle?.name ?? "—"} accent="amber" hint="Quarterly check-ins active" />
        )}
      </div>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-5">
        <NeuCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-semibold">Quarterly progress</h3>
            <Link to="/checkins" className="text-xs font-semibold text-primary">Open check-ins →</Link>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={quarterChart} barCategoryGap={32}>
                <XAxis dataKey="q" stroke="var(--muted-foreground)" fontSize={12} axisLine={false} tickLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "var(--muted)" }} contentStyle={{ borderRadius: 16, border: "none", boxShadow: "var(--shadow-soft-sm)", background: "var(--card)" }} />
                <Bar dataKey="score" radius={12} fill="oklch(0.62 0.17 275)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </NeuCard>

        <NeuCard>
          <h3 className="font-display text-lg font-semibold mb-4">Composite</h3>
          <div className="relative h-64 w-full overflow-hidden flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="65%" outerRadius="100%" data={[{ name: "score", value: Math.round(avgScore) }]} startAngle={90} endAngle={-270}>
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar background dataKey="value" cornerRadius={20} fill="oklch(0.62 0.17 275)" />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="font-display text-4xl font-bold">{Math.round(avgScore)}%</div>
              <div className="text-xs text-muted-foreground">Weighted achievement</div>
            </div>
          </div>
        </NeuCard>
      </div>

      <NeuCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-semibold">Your goals</h3>
          <Link to="/goals" className="text-xs font-semibold text-primary">Edit goal sheet →</Link>
        </div>
        {myGoals.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <p className="mb-3">You haven't drafted any goals yet.</p>
            <Link to="/goals" className="pill inline-flex px-5 py-2.5 text-sm font-semibold text-primary-foreground" style={{ background: "var(--gradient-cool)" }}>
              Create your goal sheet
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {myGoals.map((g) => {
              const lastAch = myAch.filter((a) => a.goal_id === g._id).sort((a, b) => (a.quarter < b.quarter ? 1 : -1))[0];
              const score = Number(lastAch?.computed_score ?? 0);
              return (
                <div key={g._id} className="neu-card-sm p-4 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-center">
                  <div>
                    <div className="text-xs text-muted-foreground">{g.thrust_area} · {g.weightage}%</div>
                    <div className="font-display font-semibold">{g.title}</div>
                    <div className="mt-2 max-w-md"><ProgressBar value={score} /></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusPill status={lastAch?.status ?? "not_started"} />
                    <div className="font-display text-lg font-bold tabular-nums">{Math.round(score)}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </NeuCard>

      {activeRole === "admin" && (
        <NeuCard>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display text-lg font-bold">Quick Role Management</h3>
              <p className="text-xs text-muted-foreground">Assign or revoke employee and manager roles for the team.</p>
            </div>
            <Link to="/admin/users" className="text-xs font-semibold text-primary">Full Directory →</Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
                  <th className="py-2 px-1">Person</th>
                  <th className="py-2 px-1">Dept</th>
                  <th className="py-2 px-1">Role Management</th>
                </tr>
              </thead>
              <tbody>
                {(allUsersQ.data ?? []).slice(0, 10).map((u) => (
                  <tr key={u._id} className="border-b border-border/50 last:border-0">
                    <td className="py-3 px-1">
                      <div className="font-semibold text-sm">{u.full_name}</div>
                      <div className="text-[10px] text-muted-foreground">{u.email}</div>
                    </td>
                    <td className="py-3 px-1 text-xs text-muted-foreground">{u.department || "—"}</td>
                    <td className="py-3 px-1">
                      <div className="flex gap-2">
                        {(["employee", "manager"] as const).map((r) => {
                          const has = u.roles.includes(r);
                          return (
                            <button
                              key={r}
                              onClick={async () => {
                                try {
                                  const newRoles = has 
                                    ? u.roles.filter(x => x !== r) 
                                    : [...u.roles, r];
                                  await usersApi.setRoles(u._id, newRoles);
                                  qc.invalidateQueries({ queryKey: ["users:all"] });
                                  toast.success(`${r} role updated`);
                                } catch (err: any) {
                                  toast.error(err.response?.data?.message || err.message);
                                }
                              }}
                              className={`px-3 py-1 rounded-full text-[10px] font-bold capitalize transition-all ${
                                has 
                                  ? "bg-primary text-primary-foreground shadow-sm" 
                                  : "bg-secondary text-muted-foreground hover:bg-muted"
                              }`}
                            >
                              {r}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {allUsersQ.data && allUsersQ.data.length > 10 && (
              <div className="text-center pt-4">
                <p className="text-[10px] text-muted-foreground mb-2">Showing first 10 users</p>
                <Link to="/admin/users" className="text-xs font-bold text-primary hover:underline">View all users in directory</Link>
              </div>
            )}
          </div>
        </NeuCard>
      )}
    </>
  );
}
