import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertAdmin(userId: string) {
  const { data } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId);
  if (!data?.some((r) => r.role === "admin")) throw new Error("Admin only");
}

type CycleInput = {
  name: string;
  phase1_open: string; phase1_close: string;
  q1_open: string; q1_close: string;
  q2_open: string; q2_close: string;
  q3_open: string; q3_close: string;
  q4_open: string; q4_close: string;
  is_active?: boolean;
};

async function logAudit(actorId: string, action: string, entityId: string | null, details: unknown) {
  await supabaseAdmin.from("audit_log").insert({
    actor_id: actorId, entity: "cycle", entity_id: entityId, action, details: details as never,
  });
}

export const createCycle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: CycleInput) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { data: row, error } = await supabaseAdmin.from("cycles").insert({ ...data, is_active: data.is_active ?? true }).select("id").single();
    if (error) throw new Error(error.message);
    await logAudit(context.userId, "created", row.id, { name: data.name });
    return { id: row.id };
  });

export const updateCycle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: Partial<CycleInput> & { id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { id, ...rest } = data;
    const { error } = await supabaseAdmin.from("cycles").update(rest).eq("id", id);
    if (error) throw new Error(error.message);
    await logAudit(context.userId, "updated", id, rest);
    return { ok: true };
  });

export const setActiveCycle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; active: boolean }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    if (data.active) {
      await supabaseAdmin.from("cycles").update({ is_active: false }).neq("id", data.id);
    }
    const { error } = await supabaseAdmin.from("cycles").update({ is_active: data.active }).eq("id", data.id);
    if (error) throw new Error(error.message);
    await logAudit(context.userId, data.active ? "activated" : "closed", data.id, {});
    return { ok: true };
  });