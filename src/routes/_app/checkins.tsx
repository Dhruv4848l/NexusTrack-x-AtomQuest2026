import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { sheetsApi, achievementsApi, cyclesApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { PageHeader, NeuCard, StatusPill, ProgressBar } from "@/components/app/ui";
import { useState } from "react";
import { toast } from "sonner";
import { Lock, Upload, FileText } from "lucide-react";

export const Route = createFileRoute("/_app/checkins")({
  head: () => ({ meta: [{ title: "My Check-ins · AtomQuest" }] }),
  component: MyCheckins,
});

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"] as const;

function MyCheckins() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [activeQ, setActiveQ] = useState<typeof QUARTERS[number]>("Q1");

  const q = useQuery({
    enabled: !!user,
    queryKey: ["checkins", user?._id],
    queryFn: async () => {
      const cycle = await cyclesApi.active().then((r) => r.data);
      if (!cycle) return { sheet: null, goals: [], ach: [], cycle: null };
      const sheet = await sheetsApi.my(cycle._id).then((r) => r.data);
      if (!sheet) return { sheet: null, goals: [], ach: [], cycle };
      const [{ goals }, ach] = await Promise.all([
        sheetsApi.get(sheet._id).then((r) => r.data),
        achievementsApi.forSheet(sheet._id).then((r) => r.data),
      ]);
      return { sheet, goals, ach, cycle };
    },
  });

  if (!q.data?.sheet) {
    return <><PageHeader title="My Check-ins" /><NeuCard><div className="text-center py-8 text-muted-foreground">No goal sheet yet — create one in My Goals.</div></NeuCard></>;
  }

  const locked = q.data.sheet.status !== "approved_locked" && q.data.sheet.status !== "completed";

  // A2: Compute which quarter windows are open
  const cycle = q.data.cycle;
  const now = new Date();
  const windowStatus: Record<string, { open: boolean; openDate: string; closeDate: string }> = {};
  if (cycle) {
    for (const qq of QUARTERS) {
      const key = qq.toLowerCase();
      const openDate = (cycle as any)[`${key}_open`];
      const closeDate = (cycle as any)[`${key}_close`];
      windowStatus[qq] = {
        open: openDate && closeDate ? now >= new Date(openDate) && now <= new Date(closeDate) : false,
        openDate: openDate ? new Date(openDate).toLocaleDateString() : '—',
        closeDate: closeDate ? new Date(closeDate).toLocaleDateString() : '—',
      };
    }
  }
  const activeWindow = windowStatus[activeQ];
  const isWindowOpen = !cycle || activeWindow?.open;

  return (
    <>
      <PageHeader
        title="Quarterly Check-ins"
        subtitle="Log actual achievement against planned targets each quarter."
        actions={<StatusPill status={q.data.sheet.status} />}
      />
      <div className="flex gap-2 flex-wrap">
        {QUARTERS.map((qq) => {
          const ws = windowStatus[qq];
          const isOpen = ws?.open;
          return (
            <button key={qq} onClick={() => setActiveQ(qq)}
              className={`pill px-5 py-2 text-sm font-semibold transition inline-flex items-center gap-1.5 ${activeQ === qq ? "text-primary-foreground" : "bg-secondary"}`}
              style={activeQ === qq ? { background: "var(--gradient-cool)" } : undefined}>
              {!isOpen && cycle && <Lock className="w-3 h-3 opacity-60" />}
              {qq}
            </button>
          );
        })}
      </div>

      {/* Window status banner */}
      {cycle && !isWindowOpen && !locked && (
        <NeuCard>
          <div className="flex items-center gap-2 text-sm text-amber-700">
            <Lock className="w-4 h-4" />
            <span>
              <strong>{activeQ} check-in window is closed.</strong>{' '}
              Open: {activeWindow?.openDate} – {activeWindow?.closeDate}. Entries will be blocked.
            </span>
          </div>
        </NeuCard>
      )}

      {locked && (
        <NeuCard><div className="flex items-center gap-2 text-sm text-muted-foreground"><Lock className="w-4 h-4" /> Sheet must be approved before you can log actuals.</div></NeuCard>
      )}

      {q.data.goals.map((g) => {
        const a = q.data.ach.find((x) => x.goal_id === g._id && x.quarter === activeQ);
        return (
          <CheckinRow key={g._id} goal={g} ach={a} quarter={activeQ} disabled={locked}
            onSave={async (payload) => {
              try {
                await achievementsApi.upsert({ goalId: g._id, quarter: activeQ, ...payload });
                toast.success("Saved");
                qc.invalidateQueries({ queryKey: ["checkins"] });
              } catch (e: any) { toast.error(e.response?.data?.message ?? e.message); }
            }} />
        );
      })}
    </>
  );
}

function CheckinRow({ goal, ach, disabled, onSave }: {
  goal: any; ach: any; quarter: string; disabled: boolean;
  onSave: (p: { actualValue: number | null; actualDate: string | null; status: "not_started" | "on_track" | "completed"; notes?: string }) => void
}) {
  const qc = useQueryClient();
  const [val, setVal] = useState<string>(ach?.actual_value?.toString() ?? "");
  const [date, setDate] = useState<string>(ach?.actual_date?.slice(0, 10) ?? "");
  const [status, setStatus] = useState<"not_started" | "on_track" | "completed">(ach?.status ?? "not_started");
  const [notes, setNotes] = useState<string>(ach?.notes ?? "");
  const score = Number(ach?.computed_score ?? 0);

  return (
    <NeuCard>
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div>
          <div className="text-xs text-muted-foreground">{goal.thrust_area} · {goal.weightage}%</div>
          <div className="font-display text-lg font-semibold">{goal.title}</div>
          <div className="text-xs text-muted-foreground mt-1">Target: {goal.target ?? goal.target_date ?? "0"} · {goal.uom_type.replace(/_/g, " ")}</div>
        </div>
        <div className="text-right">
          <div className="font-display text-2xl font-bold">{Math.round(score)}%</div>
          <div className="text-xs text-muted-foreground">computed</div>
        </div>
      </div>
      <div className="max-w-md mb-4"><ProgressBar value={score} /></div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {goal.uom_type === "timeline" ? (
          <input type="date" value={date} disabled={disabled} onChange={(e) => setDate(e.target.value)}
            className="neu-inset px-3 py-2 text-sm bg-transparent outline-none disabled:opacity-60" />
        ) : (
          <input type="number" placeholder="Actual" value={val} disabled={disabled} onChange={(e) => setVal(e.target.value)}
            className="neu-inset px-3 py-2 text-sm bg-transparent outline-none disabled:opacity-60" />
        )}
        <select value={status} disabled={disabled} onChange={(e) => setStatus(e.target.value as any)}
          className="neu-inset px-3 py-2 text-sm bg-transparent outline-none disabled:opacity-60">
          <option value="not_started">Not started</option>
          <option value="on_track">On track</option>
          <option value="completed">Completed</option>
        </select>
        <input placeholder="Notes (optional)" value={notes} disabled={disabled} onChange={(e) => setNotes(e.target.value)}
          className="neu-inset md:col-span-1 px-3 py-2 text-sm bg-transparent outline-none disabled:opacity-60" />
        <button disabled={disabled}
          onClick={() => onSave({ actualValue: val === "" ? null : Number(val), actualDate: date || null, status, notes })}
          className="pill px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50" style={{ background: "var(--gradient-cool)" }}>
          Save check-in
        </button>
      </div>

      {status === "completed" && (
        <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Proof of Work</div>
            {ach?.proof_url ? (
              <a href={`http://localhost:5000${ach.proof_url}`} target="_blank" rel="noreferrer" className="text-sm font-semibold text-primary flex items-center gap-2 hover:underline">
                <FileText className="w-4 h-4" /> {ach.proof_name || "View proof"}
              </a>
            ) : (
              <p className="text-xs text-muted-foreground italic">No proof uploaded yet</p>
            )}
          </div>
          <div>
            <input 
              type="file" 
              id={`proof-${goal._id}`} 
              className="hidden" 
              accept=".pdf,.docx"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file || !ach?._id) return;
                try {
                  await achievementsApi.uploadProof(ach._id, file);
                  toast.success("Proof uploaded");
                  qc.invalidateQueries({ queryKey: ["checkins"] });
                } catch (err: any) { toast.error(err.response?.data?.message ?? err.message); }
              }}
            />
            <button 
              disabled={disabled || !ach?._id}
              onClick={() => document.getElementById(`proof-${goal._id}`)?.click()}
              className="pill px-3 py-1.5 text-xs font-semibold bg-secondary inline-flex items-center gap-2 disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" /> {ach?.proof_url ? "Update proof" : "Add proof"}
            </button>
          </div>
        </div>
      )}
    </NeuCard>
  );
}
