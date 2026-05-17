import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { sheetsApi, cyclesApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { PageHeader, NeuCard, StatusPill } from "@/components/app/ui";
import { THRUST_AREAS, UOM_LABELS, UOM_TYPES } from "@/lib/scoring";
import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Save, Send, Lock, MessageSquare, Printer } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/goals")({
  head: () => ({ meta: [{ title: "My Goals · AtomQuest" }] }),
  component: GoalsPage,
});

type GoalRow = {
  _id?: string;
  thrust_area: string;
  title: string;
  description: string;
  uom_type: string;
  target: number | null;
  target_date: string | null;
  weightage: number;
};

function emptyGoal(): GoalRow {
  return { thrust_area: THRUST_AREAS[0], title: "", description: "", uom_type: "numeric_min", target: null, target_date: null, weightage: 0 };
}

function GoalsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const sheetQ = useQuery({
    enabled: !!user,
    queryKey: ["goalsheet", user?._id],
    queryFn: async () => {
      const cycle = await cyclesApi.active().then((r) => r.data);
      if (!cycle) return null;
      const sheet = await sheetsApi.my(cycle._id).then((r) => r.data);
      if (!sheet) return { cycle, sheet: null, goals: [], returns: [] };
      const [{ goals }, comments] = await Promise.all([
        sheetsApi.get(sheet._id).then((r) => r.data),
        sheetsApi.comments(sheet._id).then((r) => r.data),
      ]);
      return { cycle, sheet, goals, returns: comments };
    },
  });

  const [rows, setRows] = useState<GoalRow[]>([]);
  useEffect(() => {
    if (sheetQ.data?.goals?.length) {
      setRows(sheetQ.data.goals.map((g) => ({
        _id: g._id, thrust_area: g.thrust_area, title: g.title,
        description: g.description ?? "", uom_type: g.uom_type,
        target: g.target, target_date: g.target_date, weightage: Number(g.weightage),
      })));
    } else if (sheetQ.data) {
      setRows([emptyGoal()]);
    }
  }, [sheetQ.data?.sheet?._id, sheetQ.data?.goals?.length]);

  const total = useMemo(() => rows.reduce((s, r) => s + Number(r.weightage || 0), 0), [rows]);
  const locked = sheetQ.data?.sheet?.status === "approved_locked";
  const submitted = sheetQ.data?.sheet?.status === "submitted";
  const editRequested = sheetQ.data?.sheet?.is_edit_requested;
  const canSubmit = !locked && !submitted && rows.length > 0 && rows.length <= 8 && Math.abs(total - 100) < 0.01 && rows.every((r) => r.weightage >= 10 && r.title.trim());

  async function handleRequestEdit() {
    const reason = window.prompt("Why do you need to edit these goals? (Sent to manager)");
    if (!reason) return;
    try {
      await sheetsApi.requestEdit(sheetQ.data!.sheet!._id, reason);
      toast.success("Edit request sent to manager");
      qc.invalidateQueries({ queryKey: ["goalsheet"] });
    } catch (e: any) { toast.error(e.response?.data?.message ?? e.message); }
  }

  async function persist(submit: boolean) {
    if (!sheetQ.data?.cycle) return toast.error("No active cycle found");
    try {
      await sheetsApi.save({
        cycleId: sheetQ.data.cycle._id,
        sheetId: sheetQ.data.sheet?._id,
        goals: rows.map((r, i) => ({ ...r, position: i })),
        submit,
      });
      toast.success(submit ? "Submitted for approval" : "Draft saved");
      qc.invalidateQueries({ queryKey: ["goalsheet"] });
    } catch (e: any) { toast.error(e.response?.data?.message ?? e.message); }
  }

  return (
    <>
      <PageHeader
        title="My Goal Sheet"
        subtitle={`Cycle ${sheetQ.data?.cycle?.name ?? "—"} · weightage must total 100%, max 8 goals, min 10% each`}
        actions={
          <>
            {sheetQ.data?.sheet?.status && <StatusPill status={sheetQ.data.sheet.status} />}
            <button onClick={() => window.print()} className="pill px-4 py-2 text-sm font-semibold bg-secondary inline-flex items-center gap-2 no-print">
              <Printer className="w-4 h-4" /> Print PDF
            </button>
            {!locked && !submitted && (
              <>
                <button onClick={() => persist(false)} className="pill px-4 py-2 text-sm font-semibold bg-secondary inline-flex items-center gap-2"><Save className="w-4 h-4" /> Save draft</button>
                <button onClick={() => persist(true)} disabled={!canSubmit} className="pill px-4 py-2 text-sm font-semibold text-primary-foreground inline-flex items-center gap-2 disabled:opacity-50" style={{ background: "var(--gradient-cool)" }}><Send className="w-4 h-4" /> Submit</button>
              </>
            )}
            {locked && (
              <button 
                onClick={handleRequestEdit} 
                disabled={editRequested}
                className="pill px-4 py-2 text-sm font-semibold bg-secondary inline-flex items-center gap-2 disabled:opacity-50"
              >
                {editRequested ? "Edit Requested" : "Request Edit"}
              </button>
            )}
          </>
        }
      />

      {(sheetQ.data?.returns?.length ?? 0) > 0 && sheetQ.data?.sheet?.status === "returned" && (
        <NeuCard>
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-700"><MessageSquare className="w-4 h-4" /> Returned for rework</div>
          <p className="text-sm text-muted-foreground mt-2">{(sheetQ.data.returns[0] as any).comment}</p>
        </NeuCard>
      )}

      <NeuCard>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="text-sm">
            Goals: <span className="font-display font-bold">{rows.length}</span> / 8 · Total weightage:
            <span className={`font-display font-bold ml-1 ${Math.abs(total - 100) < 0.01 ? "text-emerald-600" : "text-amber-600"}`}>{total}%</span>
          </div>
          {!locked && !submitted && (
            <button onClick={() => rows.length < 8 && setRows([...rows, emptyGoal()])} disabled={rows.length >= 8}
              className="pill px-4 py-2 text-sm font-semibold bg-secondary inline-flex items-center gap-2 disabled:opacity-50">
              <Plus className="w-4 h-4" /> Add goal
            </button>
          )}
        </div>

        <div className="space-y-3">
          {rows.map((r, i) => {
            const isShared = !!r.shared_parent_id;
            const fieldLocked = locked || submitted || isShared;
            return (
            <div key={i} className="neu-card-sm p-4 grid grid-cols-1 md:grid-cols-12 gap-3">
              {isShared && (
                <div className="md:col-span-12">
                  <span className="inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-bold uppercase tracking-wider">
                    🔗 Shared KPI — only weightage is editable
                  </span>
                </div>
              )}
              <div className="md:col-span-3">
                <Label>Thrust Area</Label>
                <Sel value={r.thrust_area} onChange={(v) => upd(i, { thrust_area: v })} disabled={fieldLocked}>
                  {THRUST_AREAS.map((t) => <option key={t} value={t}>{t}</option>)}
                </Sel>
              </div>
              <div className="md:col-span-5">
                <Label>Goal title</Label>
                <Inp value={r.title} onChange={(v) => upd(i, { title: v })} placeholder="e.g. Increase Q3 revenue by 20%" disabled={fieldLocked} />
              </div>
              <div className="md:col-span-2">
                <Label>UoM</Label>
                <Sel value={r.uom_type} onChange={(v) => upd(i, { uom_type: v })} disabled={fieldLocked}>
                  {UOM_TYPES.map((k) => <option key={k} value={k}>{UOM_LABELS[k as keyof typeof UOM_LABELS] ?? k}</option>)}
                </Sel>
              </div>
              <div className="md:col-span-1">
                <Label>Target</Label>
                {r.uom_type === "timeline" ? (
                  <Inp type="date" value={r.target_date ?? ""} onChange={(v) => upd(i, { target_date: v || null })} disabled={fieldLocked} />
                ) : r.uom_type === "zero" ? (
                  <Inp value="0" disabled />
                ) : (
                  <Inp type="number" value={r.target?.toString() ?? ""} onChange={(v) => upd(i, { target: v === "" ? null : Number(v) })} disabled={fieldLocked} />
                )}
              </div>
              <div className="md:col-span-1">
                <Label>Wt %</Label>
                <Inp type="number" value={r.weightage.toString()} onChange={(v) => upd(i, { weightage: Number(v || 0) })} disabled={locked || submitted} />
              </div>
              <div className="md:col-span-12">
                <Label>Description (optional)</Label>
                <Inp value={r.description} onChange={(v) => upd(i, { description: v })} disabled={fieldLocked} />
              </div>
              <div className="md:col-span-12 flex justify-end">
                {locked ? (
                  <span className="text-xs text-muted-foreground inline-flex items-center gap-1.5"><Lock className="w-3 h-3" /> Locked by manager</span>
                ) : !submitted ? (
                  isShared ? (
                    <span className="text-xs text-muted-foreground inline-flex items-center gap-1.5"><Lock className="w-3 h-3" /> Shared — cannot remove</span>
                  ) : (
                    <button onClick={() => setRows(rows.filter((_, j) => j !== i))} className="text-xs font-semibold text-destructive inline-flex items-center gap-1.5">
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  )
                ) : null}
              </div>
            </div>
            );
          })}
        </div>
      </NeuCard>
    </>
  );

  function upd(i: number, patch: Partial<GoalRow>) { setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r))); }
}

function Label({ children }: { children: React.ReactNode }) { return <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 font-semibold">{children}</div>; }
function Inp(p: { value: string; onChange?: (v: string) => void; type?: string; placeholder?: string; disabled?: boolean }) {
  return <input type={p.type ?? "text"} value={p.value} disabled={p.disabled} placeholder={p.placeholder}
    onChange={(e) => p.onChange?.(e.target.value)}
    className="neu-inset w-full px-3 py-2 text-sm bg-transparent outline-none disabled:opacity-60" />;
}
function Sel(p: { value: string; onChange: (v: string) => void; children: React.ReactNode; disabled?: boolean }) {
  return <select value={p.value} disabled={p.disabled} onChange={(e) => p.onChange(e.target.value)}
    className="neu-inset w-full px-3 py-2 text-sm bg-transparent outline-none disabled:opacity-60">{p.children}</select>;
}
