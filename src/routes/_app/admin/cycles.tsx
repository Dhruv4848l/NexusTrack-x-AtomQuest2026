import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cyclesApi } from "@/lib/api";
import { PageHeader, NeuCard } from "@/components/app/ui";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Save } from "lucide-react";

export const Route = createFileRoute("/_app/admin/cycles")({
  head: () => ({ meta: [{ title: "Cycles · AtomQuest" }] }),
  component: Cycles,
});

const QUARTERS = ["phase1", "q1", "q2", "q3", "q4"] as const;

function emptyCycle() {
  const y = new Date().getFullYear();
  return {
    name: `FY ${y + 1}`,
    phase1_open: `${y}-04-01`, phase1_close: `${y}-06-30`,
    q1_open: `${y}-07-01`, q1_close: `${y}-09-30`,
    q2_open: `${y}-10-01`, q2_close: `${y}-12-31`,
    q3_open: `${y + 1}-01-01`, q3_close: `${y + 1}-03-31`,
    q4_open: `${y + 1}-04-01`, q4_close: `${y + 1}-06-30`,
    is_active: true,
  };
}

function toDateInput(s?: string | null) { return s ? new Date(s).toISOString().slice(0, 10) : ""; }
function isOpenNow(o: string, c: string) { const n = Date.now(); return n >= +new Date(o) && n <= +new Date(c); }

function Cycles() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<ReturnType<typeof emptyCycle> | null>(null);

  const q = useQuery({
    queryKey: ["cycles"],
    queryFn: () => cyclesApi.list().then((r) => r.data),
  });

  async function save() {
    if (!draft) return;
    try {
      if (editing === "new") await cyclesApi.create(draft);
      else await cyclesApi.update(editing!, draft);
      toast.success("Saved"); setEditing(null); setDraft(null);
      qc.invalidateQueries({ queryKey: ["cycles"] });
      qc.invalidateQueries({ queryKey: ["cycle:active"] });
    } catch (e: any) { toast.error(e.response?.data?.message ?? e.message); }
  }

  return (
    <>
      <PageHeader
        title="Cycle Management"
        subtitle="Annual goal-setting cycles and quarterly check-in windows."
        actions={
          <button
            onClick={() => { setEditing("new"); setDraft(emptyCycle()); }}
            className="pill px-4 py-2 text-sm font-semibold text-primary-foreground inline-flex items-center gap-2"
            style={{ background: "var(--gradient-cool)" }}
          ><Plus className="w-4 h-4" /> New cycle</button>
        }
      />
      {editing && draft && (
        <NeuCard>
          <div className="flex items-center justify-between mb-4">
            <div className="font-display font-bold text-lg">{editing === "new" ? "New cycle" : "Edit cycle"}</div>
            <button onClick={() => { setEditing(null); setDraft(null); }} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <label className="neu-inset px-3 py-2 rounded-xl col-span-2">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Name</div>
              <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="bg-transparent outline-none w-full font-semibold" />
            </label>
            {QUARTERS.map((k) => (
              <div key={k} className="grid grid-cols-2 gap-2">
                <label className="neu-inset px-3 py-2 rounded-xl">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k} open</div>
                  <input type="date" value={toDateInput((draft as any)[`${k}_open`])} onChange={(e) => setDraft({ ...draft, [`${k}_open`]: e.target.value })} className="bg-transparent outline-none w-full" />
                </label>
                <label className="neu-inset px-3 py-2 rounded-xl">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k} close</div>
                  <input type="date" value={toDateInput((draft as any)[`${k}_close`])} onChange={(e) => setDraft({ ...draft, [`${k}_close`]: e.target.value })} className="bg-transparent outline-none w-full" />
                </label>
              </div>
            ))}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={draft.is_active} onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })} />
              Active cycle
            </label>
          </div>
          <button onClick={save} className="mt-4 pill px-5 py-2 text-sm font-semibold text-primary-foreground inline-flex items-center gap-2" style={{ background: "var(--gradient-mint)" }}>
            <Save className="w-4 h-4" /> Save cycle
          </button>
        </NeuCard>
      )}
      <div className="grid md:grid-cols-2 gap-5">
        {(q.data ?? []).map((c) => (
          <NeuCard key={c._id}>
            <div className="flex items-center justify-between mb-4">
              <div className="font-display text-xl font-bold">{c.name}</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    try {
                      await cyclesApi.activate(c._id, !c.is_active);
                      toast.success(c.is_active ? "Closed" : "Activated");
                      qc.invalidateQueries({ queryKey: ["cycles"] });
                      qc.invalidateQueries({ queryKey: ["cycle:active"] });
                    } catch (e: any) { toast.error(e.response?.data?.message ?? e.message); }
                  }}
                  className={`pill px-3 py-1 text-xs font-semibold ${c.is_active ? "text-primary-foreground" : "bg-secondary"}`}
                  style={c.is_active ? { background: "var(--gradient-mint)" } : undefined}
                >{c.is_active ? "Active" : "Closed"}</button>
                <button onClick={() => { setEditing(c._id); setDraft({ name: c.name, phase1_open: toDateInput(c.phase1_open), phase1_close: toDateInput(c.phase1_close), q1_open: toDateInput(c.q1_open), q1_close: toDateInput(c.q1_close), q2_open: toDateInput(c.q2_open), q2_close: toDateInput(c.q2_close), q3_open: toDateInput(c.q3_open), q3_close: toDateInput(c.q3_close), q4_open: toDateInput(c.q4_open), q4_close: toDateInput(c.q4_close), is_active: c.is_active }); }} className="text-xs text-primary font-semibold">Edit</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {([["Phase 1", c.phase1_open, c.phase1_close], ["Q1", c.q1_open, c.q1_close], ["Q2", c.q2_open, c.q2_close], ["Q3", c.q3_open, c.q3_close], ["Q4", c.q4_open, c.q4_close]] as [string, string, string][]).map(([label, o, cl]) => (
                <div key={label} className="neu-inset rounded-xl px-3 py-2">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
                    {isOpenNow(o, cl) && <span className="text-[9px] font-bold text-emerald-600">OPEN</span>}
                  </div>
                  <div className="font-semibold text-xs">{new Date(o).toLocaleDateString()} → {new Date(cl).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          </NeuCard>
        ))}
      </div>
    </>
  );
}
