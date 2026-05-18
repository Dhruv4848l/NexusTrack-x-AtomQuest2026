import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { sheetsApi, usersApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { PageHeader, NeuCard, StatusPill } from "@/components/app/ui";
import { EmptyState } from "@/components/app/EmptyState";
import { Inbox, Check, RotateCcw, Unlock, Pencil, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/goals_/review")({
  head: () => ({ meta: [{ title: "Approval Queue · AtomQuest" }] }),
  component: ReviewQueue,
});

function ReviewQueue() {
  const { user, activeRole } = useAuth();
  const qc = useQueryClient();

  const q = useQuery({
    enabled: !!user,
    queryKey: ["review", user?._id, activeRole],
    queryFn: async () => {
      const team = activeRole === "admin"
        ? await usersApi.list().then((r) => r.data)
        : await usersApi.myTeam().then((r) => r.data);
      if (!team.length) return { rows: [] };
      const teamIds = new Set(team.map((t) => t._id));
      const allSheets = await sheetsApi.list().then((r) => r.data);
      const teamSheets = allSheets.filter((s) => {
        const oid = typeof s.owner_id === "string" ? s.owner_id : (s.owner_id as any)._id;
        return teamIds.has(oid);
      });
      const rows = await Promise.all(
        teamSheets.map(async (s) => {
          const { goals } = await sheetsApi.get(s._id).then((r) => r.data);
          const ownerObj = typeof s.owner_id === "object" ? s.owner_id : team.find((t) => t._id === s.owner_id);
          return { ...s, owner: ownerObj, goals };
        })
      );
      return { rows };
    },
  });

  const [comments, setComments] = useState<Record<string, string>>({});
  // A1: Track inline edits per sheet: { [sheetId]: { [goalId]: { target?, weightage? } } }
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [edits, setEdits] = useState<Record<string, Record<string, { target?: number | null; target_date?: string | null; weightage?: number }>>>({});

  function setGoalEdit(sheetId: string, goalId: string, field: string, value: any) {
    setEdits((prev) => ({
      ...prev,
      [sheetId]: {
        ...(prev[sheetId] ?? {}),
        [goalId]: { ...(prev[sheetId]?.[goalId] ?? {}), [field]: value },
      },
    }));
  }

  function getEditVal(sheetId: string, goalId: string, field: string, original: any) {
    return edits[sheetId]?.[goalId]?.[field as keyof typeof edits[string][string]] ?? original;
  }

  return (
    <>
      <PageHeader title="Approval Queue" subtitle="Review submitted goal sheets and approve, or return for rework with feedback." />
      {(q.data?.rows ?? []).length === 0 && (
        <EmptyState icon={Inbox} title="Queue is clear" hint="Submitted goal sheets from your team will appear here for review and approval." />
      )}
      {(q.data?.rows ?? []).map((s: any) => {
        const isEditing = editing[s._id] ?? false;
        const sheetEdits = edits[s._id] ?? {};
        const goals = (s.goals ?? []).map((g: any) => ({
          ...g,
          _target: getEditVal(s._id, g._id, "target", g.target),
          _target_date: getEditVal(s._id, g._id, "target_date", g.target_date),
          _weightage: getEditVal(s._id, g._id, "weightage", g.weightage),
        }));
        const total = goals.reduce((sum: number, g: any) => sum + Number(g._weightage), 0);
        const c = comments[s._id] ?? "";
        const hasEdits = Object.keys(sheetEdits).length > 0;

        return (
          <NeuCard key={s._id}>
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <div>
                <div className="font-display text-lg font-semibold">{(s.owner as any)?.full_name}</div>
                <div className="text-xs text-muted-foreground">
                  {(s.owner as any)?.department} · {goals.length} goals · total{" "}
                  <span className={Math.abs(total - 100) > 0.01 ? "text-red-500 font-bold" : ""}>{total}%</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusPill status={s.status} />
                {s.status === "submitted" && (
                  <button
                    onClick={() => setEditing((prev) => ({ ...prev, [s._id]: !prev[s._id] }))}
                    className={`pill px-3 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5 transition ${
                      isEditing ? "text-primary-foreground" : "bg-secondary"
                    }`}
                    style={isEditing ? { background: "var(--gradient-peach)" } : undefined}
                  >
                    <Pencil className="w-3.5 h-3.5" /> {isEditing ? "Editing" : "Edit inline"}
                  </button>
                )}
              </div>
            </div>

            {/* Goal rows — editable when in editing mode */}
            <div className="space-y-2 mb-4">
              {goals.map((g: any) => (
                <div key={g._id} className="neu-inset px-4 py-3 rounded-2xl">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold flex items-center gap-2">
                        {g.title}
                        {g.shared_parent_id && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">🔗 Shared</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {g.thrust_area} · {g.uom_type.replace(/_/g, " ")}
                      </div>
                    </div>
                    {isEditing && s.status === "submitted" ? (
                      <div className="flex items-center gap-3 shrink-0">
                        <div>
                          <div className="text-[9px] uppercase text-muted-foreground mb-0.5">Target</div>
                          {g.uom_type === "timeline" ? (
                            <input
                              type="date"
                              value={g._target_date?.slice?.(0, 10) ?? ""}
                              onChange={(e) => setGoalEdit(s._id, g._id, "target_date", e.target.value || null)}
                              className="neu-inset px-2 py-1 text-xs w-28 bg-transparent outline-none rounded-lg"
                            />
                          ) : (
                            <input
                              type="number"
                              value={g._target ?? ""}
                              onChange={(e) => setGoalEdit(s._id, g._id, "target", e.target.value === "" ? null : Number(e.target.value))}
                              className="neu-inset px-2 py-1 text-xs w-20 bg-transparent outline-none rounded-lg"
                            />
                          )}
                        </div>
                        <div>
                          <div className="text-[9px] uppercase text-muted-foreground mb-0.5">Wt %</div>
                          <input
                            type="number"
                            value={g._weightage}
                            min={10}
                            max={100}
                            onChange={(e) => setGoalEdit(s._id, g._id, "weightage", Number(e.target.value))}
                            className="neu-inset px-2 py-1 text-xs w-16 bg-transparent outline-none rounded-lg"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 shrink-0 text-sm">
                        <span className="text-muted-foreground">target {g._target ?? g._target_date?.slice?.(0, 10) ?? "—"}</span>
                        <span className="font-display font-bold">{g._weightage}%</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Action buttons for submitted sheets */}
            {s.status === "submitted" && (
              <div className="flex flex-wrap gap-3 items-start">
                <button
                  onClick={async () => {
                    try {
                      if (hasEdits) {
                        const editArr = Object.entries(sheetEdits).map(([goalId, patch]) => ({ goalId, ...patch }));
                        await sheetsApi.approveWithEdits(s._id, editArr);
                        toast.success("Approved with edits & locked");
                      } else {
                        await sheetsApi.approve(s._id);
                        toast.success("Approved & locked");
                      }
                      setEditing((prev) => ({ ...prev, [s._id]: false }));
                      setEdits((prev) => { const n = { ...prev }; delete n[s._id]; return n; });
                      qc.invalidateQueries({ queryKey: ["review"] });
                    } catch (e: any) { toast.error(e.response?.data?.message ?? e.message); }
                  }}
                  className="pill px-4 py-2 text-sm font-semibold text-primary-foreground inline-flex items-center gap-2"
                  style={{ background: "var(--gradient-mint)" }}
                >
                  <Check className="w-4 h-4" /> {hasEdits ? "Save edits & approve" : "Approve & lock"}
                </button>
                <div className="flex-1 min-w-[260px] flex gap-2">
                  <input
                    placeholder="Return reason (≥20 chars)…"
                    value={c}
                    onChange={(e) => setComments({ ...comments, [s._id]: e.target.value })}
                    className="neu-inset flex-1 px-3 py-2 text-sm bg-transparent outline-none"
                  />
                  <button
                    disabled={c.trim().length < 20}
                    onClick={async () => {
                      try {
                        await sheetsApi.return(s._id, c);
                        toast.success("Returned");
                        setComments({ ...comments, [s._id]: "" });
                        qc.invalidateQueries({ queryKey: ["review"] });
                      } catch (e: any) { toast.error(e.response?.data?.message ?? e.message); }
                    }}
                    className="pill px-4 py-2 text-sm font-semibold bg-secondary inline-flex items-center gap-2 disabled:opacity-50"
                  ><RotateCcw className="w-4 h-4" /> Return</button>
                </div>
              </div>
            )}

            {/* Admin unlock for locked sheets */}
            {s.status === "approved_locked" && activeRole === "admin" && (
              <button
                onClick={async () => {
                  if (!confirm("Unlock this sheet for editing? This will be audit-logged.")) return;
                  try { await sheetsApi.unlock(s._id); toast.success("Unlocked"); qc.invalidateQueries({ queryKey: ["review"] }); }
                  catch (e: any) { toast.error(e.response?.data?.message ?? e.message); }
                }}
                className="pill px-4 py-2 text-sm font-semibold bg-secondary inline-flex items-center gap-2"
              ><Unlock className="w-4 h-4" /> Admin override · unlock</button>
            )}

            {/* Edit request banner */}
            {s.is_edit_requested && (
              <div className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200">
                <div className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Edit Request Pending</div>
                <p className="text-sm text-amber-900 mb-3">{s.edit_request_reason || "No reason provided"}</p>
                <div className="flex flex-wrap gap-3 items-start">
                  <button
                    onClick={async () => {
                      try {
                        await sheetsApi.approveEdit(s._id);
                        toast.success("Edit request approved. Sheet unlocked.");
                        qc.invalidateQueries({ queryKey: ["review"] });
                      } catch (e: any) { toast.error(e.response?.data?.message ?? e.message); }
                    }}
                    className="pill px-4 py-2 text-sm font-semibold text-primary-foreground inline-flex items-center gap-2"
                    style={{ background: "var(--gradient-mint)" }}
                  >
                    <Unlock className="w-4 h-4" /> Approve Edit
                  </button>
                  <div className="flex flex-1 min-w-[260px] gap-2">
                    <input
                      placeholder="Rejection reason (≥10 chars)…"
                      value={comments[`rej_${s._id}`] ?? ""}
                      onChange={(e) => setComments({ ...comments, [`rej_${s._id}`]: e.target.value })}
                      className="neu-inset flex-1 px-3 py-2 text-sm bg-transparent outline-none"
                    />
                    <button
                      disabled={(comments[`rej_${s._id}`] ?? "").trim().length < 10}
                      onClick={async () => {
                        try {
                          await sheetsApi.rejectEdit(s._id, comments[`rej_${s._id}`]);
                          toast.success("Edit request rejected. Employee notified.");
                          setComments({ ...comments, [`rej_${s._id}`]: "" });
                          qc.invalidateQueries({ queryKey: ["review"] });
                        } catch (e: any) { toast.error(e.response?.data?.message ?? e.message); }
                      }}
                      className="pill px-4 py-2 text-sm font-semibold bg-red-100 text-red-700 inline-flex items-center gap-2 disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>
              </div>
            )}
          </NeuCard>
        );
      })}
    </>
  );
}
