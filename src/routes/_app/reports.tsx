import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { sheetsApi, achievementsApi, usersApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { PageHeader, NeuCard } from "@/components/app/ui";
import { Download } from "lucide-react";

export const Route = createFileRoute("/_app/reports")({
  head: () => ({ meta: [{ title: "Reports · AtomQuest" }] }),
  component: Reports,
});

function Reports() {
  const { activeRole } = useAuth();

  const q = useQuery({
    queryKey: ["report", activeRole],
    queryFn: async () => {
      const people = activeRole === "admin"
        ? await usersApi.list().then((r) => r.data)
        : await usersApi.myTeam().then((r) => r.data);

      if (!people.length) return [];

      const teamIds = new Set(people.map((p) => p._id));
      const allSheets = await sheetsApi.list().then((r) => r.data);
      const teamSheets = allSheets.filter((s) => {
        const oid = typeof s.owner_id === "string" ? s.owner_id : (s.owner_id as any)._id;
        return teamIds.has(oid);
      });

      const rows: any[] = [];

      await Promise.all(teamSheets.map(async (s) => {
        const ownerId = typeof s.owner_id === "string" ? s.owner_id : (s.owner_id as any)._id;
        const person = people.find((p) => p._id === ownerId);
        if (!person) return;

        const [{ goals }, achievements] = await Promise.all([
          sheetsApi.get(s._id).then((r) => r.data),
          achievementsApi.forSheet(s._id).then((r) => r.data),
        ]);

        goals.forEach((g) => {
          ["Q1", "Q2", "Q3", "Q4"].forEach((qq) => {
            const a = achievements.find((x) => x.goal_id === g._id && x.quarter === qq);
            rows.push({
              employee: person.full_name, department: person.department ?? "",
              sheet_status: s.status, thrust_area: g.thrust_area, goal: g.title,
              uom: g.uom_type, target: g.target ?? g.target_date ?? "", weightage: g.weightage,
              quarter: qq, actual: a?.actual_value ?? a?.actual_date ?? "", status: a?.status ?? "not_started",
              score: a?.computed_score != null ? Math.round(Number(a.computed_score)) : "",
            });
          });
        });
      }));

      return rows;
    },
  });

  function downloadCSV() {
    const rows = q.data ?? [];
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => JSON.stringify((r as any)[h] ?? "")).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `atomquest-report-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageHeader title="Achievement Report" subtitle="Planned vs actual across all goals and quarters." actions={
        <button onClick={downloadCSV} className="pill px-4 py-2 text-sm font-semibold text-primary-foreground inline-flex items-center gap-2" style={{ background: "var(--gradient-cool)" }}>
          <Download className="w-4 h-4" /> Export CSV
        </button>
      } />
      <NeuCard>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-left text-muted-foreground uppercase tracking-wider">
              <tr><th className="py-2 pr-3">Employee</th><th className="py-2 pr-3">Goal</th><th className="py-2 pr-3">UoM</th><th className="py-2 pr-3">Target</th><th className="py-2 pr-3">Wt</th><th className="py-2 pr-3">Q</th><th className="py-2 pr-3">Actual</th><th className="py-2 pr-3">Status</th><th className="py-2 pr-3">Score</th></tr>
            </thead>
            <tbody>
              {(q.data ?? []).map((r, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="py-2 pr-3 font-semibold">{r.employee}</td>
                  <td className="py-2 pr-3">{r.goal}</td>
                  <td className="py-2 pr-3">{r.uom}</td>
                  <td className="py-2 pr-3">{r.target}</td>
                  <td className="py-2 pr-3">{r.weightage}%</td>
                  <td className="py-2 pr-3">{r.quarter}</td>
                  <td className="py-2 pr-3">{r.actual}</td>
                  <td className="py-2 pr-3">{r.status}</td>
                  <td className="py-2 pr-3 font-semibold">{r.score === "" ? "—" : `${r.score}%`}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(q.data ?? []).length === 0 && <div className="text-center py-8 text-muted-foreground">No data yet.</div>}
        </div>
      </NeuCard>
    </>
  );
}
