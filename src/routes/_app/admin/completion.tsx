import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { sheetsApi, usersApi, achievementsApi, cyclesApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { PageHeader, NeuCard, Stat } from "@/components/app/ui";
import { EmptyState } from "@/components/app/EmptyState";
import { CheckCircle2, XCircle, Clock, BarChart3 } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_app/admin/completion")({
  head: () => ({ meta: [{ title: "Completion Dashboard · AtomQuest" }] }),
  component: CompletionDashboard,
});

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"] as const;

function CompletionDashboard() {
  const { activeRole } = useAuth();
  const [filterDept, setFilterDept] = useState<string>("all");

  const q = useQuery({
    queryKey: ["completion", activeRole],
    queryFn: async () => {
      const [people, allSheets, cycle] = await Promise.all([
        activeRole === "admin"
          ? usersApi.list().then((r) => r.data)
          : usersApi.myTeam().then((r) => r.data),
        sheetsApi.list().then((r) => r.data),
        cyclesApi.active().then((r) => r.data),
      ]);

      // Only employees (exclude admin-only users)
      const employees = people.filter((p) =>
        p.roles?.includes("employee") && !p.roles?.includes("admin") && !p.roles?.includes("database_admin")
      );

      const departments = [...new Set(employees.map((e) => e.department).filter(Boolean))];

      const rows = await Promise.all(
        employees.map(async (emp) => {
          const sheet = allSheets.find((s) => {
            const oid = typeof s.owner_id === "string" ? s.owner_id : (s.owner_id as any)?._id;
            return oid === emp._id;
          });

          const quarterStatus: Record<string, "done" | "partial" | "not_started"> = {};

          if (sheet && ["approved_locked", "completed"].includes(sheet.status)) {
            const achievements = await achievementsApi.forSheet(sheet._id).then((r) => r.data);
            const { goals } = await sheetsApi.get(sheet._id).then((r) => r.data);
            const goalIds = new Set(goals.map((g) => g._id));

            for (const qq of QUARTERS) {
              const qAchs = achievements.filter((a) => a.quarter === qq && goalIds.has(a.goal_id));
              if (qAchs.length === 0) {
                quarterStatus[qq] = "not_started";
              } else if (qAchs.length >= goals.length) {
                quarterStatus[qq] = "done";
              } else {
                quarterStatus[qq] = "partial";
              }
            }
          } else {
            for (const qq of QUARTERS) {
              quarterStatus[qq] = "not_started";
            }
          }

          return {
            _id: emp._id,
            name: `${emp.first_name} ${emp.last_name}`,
            department: emp.department ?? "—",
            sheetStatus: sheet?.status ?? "no_sheet",
            quarters: quarterStatus,
          };
        })
      );

      // Summary stats
      const totalEmployees = rows.length;
      const sheetsCompleted = rows.filter((r) => ["approved_locked", "completed"].includes(r.sheetStatus)).length;
      const q1Done = rows.filter((r) => r.quarters.Q1 === "done").length;

      return { rows, departments, cycle, totalEmployees, sheetsCompleted, q1Done };
    },
  });

  const data = q.data;
  const filteredRows = (data?.rows ?? []).filter((r) => filterDept === "all" || r.department === filterDept);

  return (
    <>
      <PageHeader
        title="Completion Dashboard"
        subtitle="Track which employees and managers have completed quarterly check-ins."
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <NeuCard>
          <Stat icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />} label="Goals Submitted" value={`${data?.sheetsCompleted ?? 0} / ${data?.totalEmployees ?? 0}`} hint="Approved or locked sheets" />
        </NeuCard>
        <NeuCard>
          <Stat icon={<BarChart3 className="w-5 h-5 text-blue-500" />} label="Q1 Complete" value={`${data?.q1Done ?? 0} / ${data?.totalEmployees ?? 0}`} hint="All Q1 actuals entered" />
        </NeuCard>
        <NeuCard>
          <Stat icon={<Clock className="w-5 h-5 text-amber-500" />} label="Active Cycle" value={data?.cycle?.name ?? "—"} hint={data?.cycle?.is_active ? "Currently active" : "No active cycle"} />
        </NeuCard>
      </div>

      {/* Filter */}
      <NeuCard>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="font-display text-lg font-semibold">Employee × Quarter Matrix</div>
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="neu-inset px-3 py-2 text-sm bg-transparent outline-none rounded-xl"
          >
            <option value="all">All Departments</option>
            {(data?.departments ?? []).map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="py-2 pr-4">Employee</th>
                <th className="py-2 pr-4">Department</th>
                <th className="py-2 pr-4">Sheet</th>
                {QUARTERS.map((qq) => (
                  <th key={qq} className="py-2 pr-4 text-center">{qq}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row._id} className="border-t border-border/40">
                  <td className="py-3 pr-4 font-semibold">{row.name}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{row.department}</td>
                  <td className="py-3 pr-4">
                    <SheetBadge status={row.sheetStatus} />
                  </td>
                  {QUARTERS.map((qq) => (
                    <td key={qq} className="py-3 pr-4 text-center">
                      <QuarterCell status={row.quarters[qq]} />
                    </td>
                  ))}
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">No data available.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </NeuCard>
    </>
  );
}

function SheetBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    approved_locked: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Approved" },
    completed: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Completed" },
    submitted: { bg: "bg-blue-100", text: "text-blue-700", label: "Submitted" },
    draft: { bg: "bg-gray-100", text: "text-gray-600", label: "Draft" },
    returned: { bg: "bg-amber-100", text: "text-amber-700", label: "Returned" },
    no_sheet: { bg: "bg-red-50", text: "text-red-500", label: "Not started" },
  };
  const s = map[status] ?? map.no_sheet;
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${s.bg} ${s.text}`}>{s.label}</span>;
}

function QuarterCell({ status }: { status: string }) {
  if (status === "done")
    return <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-100"><CheckCircle2 className="w-4 h-4 text-emerald-600" /></span>;
  if (status === "partial")
    return <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-100"><Clock className="w-4 h-4 text-amber-600" /></span>;
  return <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gray-100"><XCircle className="w-4 h-4 text-gray-400" /></span>;
}
