import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cyclesApi, usersApi, goalsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { PageHeader, NeuCard } from "@/components/app/ui";
import { THRUST_AREAS, UOM_LABELS, UOM_TYPES } from "@/lib/scoring";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/admin/shared-goals")({
  head: () => ({ meta: [{ title: "Shared Goals · AtomQuest" }] }),
  component: Shared,
});

function Shared() {
  const { user, activeRole } = useAuth();
  const qc = useQueryClient();

  const data = useQuery({
    queryKey: ["shared:init", activeRole, user?._id],
    queryFn: async () => {
      const cycle = await cyclesApi.active().then((r) => r.data);
      const people = activeRole === "admin"
        ? await usersApi.list().then((r) => r.data)
        : await usersApi.myTeam().then((r) => r.data);
      return { cycle, people };
    },
  });

  const [thrust, setThrust] = useState(THRUST_AREAS[0]);
  const [title, setTitle] = useState("");
  const [uom, setUom] = useState("numeric_min");
  const [target, setTarget] = useState("");
  const [weight, setWeight] = useState("10");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  return (
    <>
      <PageHeader title="Shared Goals" subtitle="Push a single KPI to multiple employees. Each can adjust weightage but not the title or target." />
      <NeuCard>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Thrust area</Label>
            <select value={thrust} onChange={(e) => setThrust(e.target.value)} className="neu-inset w-full px-3 py-2 text-sm bg-transparent outline-none">
              {THRUST_AREAS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <Label>Goal title</Label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Department CSAT ≥ 90%"
              className="neu-inset w-full px-3 py-2 text-sm bg-transparent outline-none" />
          </div>
          <div>
            <Label>UoM</Label>
            <select value={uom} onChange={(e) => setUom(e.target.value)} className="neu-inset w-full px-3 py-2 text-sm bg-transparent outline-none">
              {UOM_TYPES.map((k) => <option key={k} value={k}>{UOM_LABELS[k as keyof typeof UOM_LABELS] ?? k}</option>)}
            </select>
          </div>
          <div>
            <Label>Target</Label>
            <input value={target} onChange={(e) => setTarget(e.target.value)} type={uom === "timeline" ? "date" : "number"}
              className="neu-inset w-full px-3 py-2 text-sm bg-transparent outline-none" />
          </div>
          <div>
            <Label>Default weightage %</Label>
            <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="neu-inset w-full px-3 py-2 text-sm bg-transparent outline-none" />
          </div>
        </div>
      </NeuCard>

      <NeuCard>
        <div className="flex items-center justify-between mb-3">
          <div className="font-display text-lg font-semibold">Recipients</div>
          <div className="text-xs text-muted-foreground">{selected.size} selected</div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {(data.data?.people ?? []).map((p) => {
            const on = selected.has(p._id);
            return (
              <button key={p._id} onClick={() => { const n = new Set(selected); on ? n.delete(p._id) : n.add(p._id); setSelected(n); }}
                className={`text-left px-4 py-3 rounded-2xl text-sm transition ${on ? "text-primary-foreground" : "neu-card-sm"}`}
                style={on ? { background: "var(--gradient-cool)" } : undefined}>
                <div className="font-semibold">{p.full_name}</div>
                <div className="text-xs opacity-80">{p.department ?? "—"}</div>
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex justify-end">
          <button
            disabled={!title || selected.size === 0 || !data.data?.cycle}
            onClick={async () => {
              try {
                const r = await goalsApi.pushShared({
                  cycleId: data.data!.cycle!._id,
                  ownerIds: [...selected],
                  thrust_area: thrust,
                  title,
                  uom_type: uom,
                  target: uom === "timeline" ? null : (target === "" ? null : Number(target)),
                  target_date: uom === "timeline" ? (target || null) : null,
                  defaultWeightage: Number(weight) || 10,
                });
                toast.success(`Pushed to ${r.data.pushed} employees`);
                setSelected(new Set()); setTitle("");
                qc.invalidateQueries();
              } catch (e: any) { toast.error(e.response?.data?.message ?? e.message); }
            }}
            className="pill px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50" style={{ background: "var(--gradient-cool)" }}
          >
            Push shared goal
          </button>
        </div>
      </NeuCard>
    </>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 font-semibold">{children}</div>;
}
