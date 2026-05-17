import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { sheetsApi, achievementsApi, usersApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { PageHeader, NeuCard, ProgressBar, StatusPill } from "@/components/app/ui";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/checkins_/team")({
  head: () => ({ meta: [{ title: "Team Check-ins · AtomQuest" }] }),
  component: TeamCheckins,
});

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"] as const;

function TeamCheckins() {
  const { user, activeRole } = useAuth();
  const qc = useQueryClient();
  const [activeQ, setActiveQ] = useState<typeof QUARTERS[number]>("Q1");
  const [comments, setComments] = useState<Record<string, string>>({});

  const q = useQuery({
    enabled: !!user,
    queryKey: ["team-checkins", user?._id, activeRole],
    queryFn: async () => {
      const team = activeRole === "admin"
        ? await usersApi.list().then((r) => r.data)
        : await usersApi.myTeam().then((r) => r.data);
      if (!team.length) return { team: [], sheetsMap: {}, goalsMap: {}, achMap: {} };

      const teamIds = new Set(team.map((t) => t._id));
      const allSheets = await sheetsApi.list().then((r) => r.data);
      const teamSheets = allSheets.filter((s) => {
        const oid = typeof s.owner_id === "string" ? s.owner_id : (s.owner_id as any)._id;
        return teamIds.has(oid);
      });

      const sheetsWithGoals = await Promise.all(
        teamSheets.map((s) => sheetsApi.get(s._id).then((r) => ({ sheet: s, goals: r.data.goals })))
      );

      const goalIds = sheetsWithGoals.flatMap((sg) => sg.goals.map((g) => g._id));

      const achByGoal: Record<string, any[]> = {};
      for (const sg of sheetsWithGoals) {
        for (const g of sg.goals) {
          const ach = await achievementsApi.list(g._id).then((r) => r.data);
          achByGoal[g._id] = ach;
        }
      }

      return { team, sheetsWithGoals, achByGoal };
    },
  });

  return (
    <>
      <PageHeader title="Team Check-ins" subtitle="Track planned vs actual for each report and add structured feedback." />
      <div className="flex gap-2 flex-wrap">
        {QUARTERS.map((qq) => (
          <button key={qq} onClick={() => setActiveQ(qq)}
            className={`pill px-5 py-2 text-sm font-semibold transition ${activeQ === qq ? "text-primary-foreground" : "bg-secondary"}`}
            style={activeQ === qq ? { background: "var(--gradient-cool)" } : undefined}>
            {qq}
          </button>
        ))}
      </div>

      {(q.data?.team ?? []).map((member: any) => {
        const sg = (q.data?.sheetsWithGoals ?? []).find((s: any) => {
          const oid = typeof s.sheet.owner_id === "string" ? s.sheet.owner_id : (s.sheet.owner_id as any)._id;
          return oid === member._id;
        });
        const goals = sg?.goals ?? [];
        const sheet = sg?.sheet;
        return (
          <NeuCard key={member._id}>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <div className="font-display text-lg font-semibold">{member.full_name}</div>
                <div className="text-xs text-muted-foreground">{member.department}</div>
              </div>
              {sheet ? <StatusPill status={sheet.status} /> : <span className="text-xs text-muted-foreground">No goal sheet</span>}
            </div>
            <div className="space-y-3">
              {goals.map((g: any) => {
                const ach = (q.data?.achByGoal ?? {})[g._id] ?? [];
                const a = ach.find((x: any) => x.quarter === activeQ);
                const score = Number(a?.computed_score ?? 0);
                const cKey = `${g._id}:${activeQ}`;
                const cText = comments[cKey] ?? "";
                return (
                  <div key={g._id} className="neu-inset rounded-2xl p-4">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <div className="font-semibold">{g.title}</div>
                        <div className="text-xs text-muted-foreground">Planned: {g.target ?? g.target_date ?? "—"} · Actual: {a?.actual_value ?? a?.actual_date ?? "—"}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-32"><ProgressBar value={score} /></div>
                        <div className="font-display text-lg font-bold w-12 text-right">{Math.round(score)}%</div>
                        {a && <StatusPill status={a.status} />}
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <input value={cText} placeholder="Add check-in comment…" onChange={(e) => setComments({ ...comments, [cKey]: e.target.value })}
                        className="flex-1 bg-transparent rounded-xl px-3 py-2 text-sm outline-none border border-border" />
                      <button disabled={!cText.trim()} onClick={async () => {
                        try {
                          await achievementsApi.addComment(g._id, activeQ, cText);
                          setComments({ ...comments, [cKey]: "" });
                          toast.success("Comment added");
                          qc.invalidateQueries({ queryKey: ["team-checkins"] });
                        } catch (e: any) { toast.error(e.response?.data?.message ?? e.message); }
                      }} className="pill px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50" style={{ background: "var(--gradient-cool)" }}>Save</button>
                    </div>
                  </div>
                );
              })}
              {goals.length === 0 && <div className="text-sm text-muted-foreground">No goals submitted yet.</div>}
            </div>
          </NeuCard>
        );
      })}
      {(q.data?.team ?? []).length === 0 && <NeuCard><div className="text-center py-8 text-muted-foreground">No direct reports.</div></NeuCard>}
    </>
  );
}
