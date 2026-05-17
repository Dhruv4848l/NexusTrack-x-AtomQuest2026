import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { auditApi } from "@/lib/api";
import { PageHeader, NeuCard } from "@/components/app/ui";

export const Route = createFileRoute("/_app/admin/audit")({
  head: () => ({ meta: [{ title: "Audit · AtomQuest" }] }),
  component: Audit,
});

function Audit() {
  const q = useQuery({
    queryKey: ["audit"],
    queryFn: () => auditApi.list({ limit: 200 }).then((r) => r.data.logs),
  });

  return (
    <>
      <PageHeader title="Audit Trail" subtitle="Every state change captured with actor and timestamp." />
      <NeuCard>
        <div className="space-y-2">
          {(q.data ?? []).map((r) => {
            const actor = typeof r.actor_id === "object" && r.actor_id
              ? (r.actor_id as any).full_name
              : "system";
            return (
              <div key={r._id} className="neu-inset rounded-xl px-4 py-3 flex items-center justify-between flex-wrap gap-2 text-sm">
                <div>
                  <span className="font-semibold">{actor}</span>
                  <span className="text-muted-foreground"> · {r.action} · </span>
                  <span className="font-mono text-xs">{r.entity}</span>
                </div>
                <div className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleString()}</div>
              </div>
            );
          })}
          {(q.data ?? []).length === 0 && <div className="text-center py-8 text-muted-foreground text-sm">No audit entries yet.</div>}
        </div>
      </NeuCard>
    </>
  );
}
