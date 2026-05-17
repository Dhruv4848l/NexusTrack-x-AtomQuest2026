import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { computeScore, type UomType } from "./scoring";

type GoalInput = {
  id?: string;
  thrust_area: string;
  title: string;
  description?: string;
  uom_type: UomType;
  target?: number | null;
  target_date?: string | null;
  weightage: number;
  position: number;
};

async function logAudit(actorId: string, entity: string, entityId: string | null, action: string, details: unknown) {
  await supabaseAdmin.from("audit_log").insert({
    actor_id: actorId, entity, entity_id: entityId, action, details: details as never,
  });
}

export const saveGoalSheet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { sheetId?: string; cycleId: string; goals: GoalInput[]; submit?: boolean }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    let sheetId = data.sheetId;
    if (!sheetId) {
      const { data: existing } = await supabase
        .from("goal_sheets").select("id, status").eq("owner_id", userId).eq("cycle_id", data.cycleId).maybeSingle();
      if (existing) sheetId = existing.id;
      else {
        const { data: created, error } = await supabase
          .from("goal_sheets").insert({ owner_id: userId, cycle_id: data.cycleId, status: "draft" }).select("id").single();
        if (error) throw new Error(error.message);
        sheetId = created.id;
      }
    }
    const { data: sheet } = await supabase.from("goal_sheets").select("status, owner_id").eq("id", sheetId!).single();
    if (!sheet) throw new Error("Sheet not found");
    if (sheet.owner_id !== userId) throw new Error("Forbidden");
    if (sheet.status === "approved_locked") throw new Error("Sheet is locked");

    if (data.submit) {
      if (data.goals.length === 0 || data.goals.length > 8) throw new Error("Goal count must be 1-8");
      const total = data.goals.reduce((s, g) => s + Number(g.weightage || 0), 0);
      if (Math.abs(total - 100) > 0.01) throw new Error(`Total weightage must be 100% (currently ${total}%)`);
      if (data.goals.some((g) => Number(g.weightage) < 10)) throw new Error("Each goal must be at least 10%");
      if (data.goals.some((g) => !g.title.trim())) throw new Error("Every goal needs a title");
    }

    // Replace goals (simple): delete & re-insert
    await supabase.from("goals").delete().eq("sheet_id", sheetId!);
    if (data.goals.length) {
      const rows = data.goals.map((g, i) => ({
        sheet_id: sheetId!,
        thrust_area: g.thrust_area,
        title: g.title,
        description: g.description ?? null,
        uom_type: g.uom_type,
        target: g.target ?? null,
        target_date: g.target_date ?? null,
        weightage: g.weightage,
        position: i,
      }));
      const { error } = await supabase.from("goals").insert(rows);
      if (error) throw new Error(error.message);
    }

    if (data.submit) {
      const { error } = await supabase
        .from("goal_sheets")
        .update({ status: "submitted", submitted_at: new Date().toISOString() })
        .eq("id", sheetId!);
      if (error) throw new Error(error.message);
      await logAudit(userId, "goal_sheet", sheetId!, "submitted", { goalCount: data.goals.length });
    } else {
      await logAudit(userId, "goal_sheet", sheetId!, "draft_saved", { goalCount: data.goals.length });
    }
    return { sheetId };
  });

export const approveSheet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { sheetId: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("goal_sheets")
      .update({ status: "approved_locked", approved_at: new Date().toISOString(), approved_by: userId })
      .eq("id", data.sheetId);
    if (error) throw new Error(error.message);
    await logAudit(userId, "goal_sheet", data.sheetId, "approved_locked", {});
    return { ok: true };
  });

export const returnSheet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { sheetId: string; comment: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (!data.comment || data.comment.trim().length < 20) throw new Error("Return comment must be at least 20 characters");
    const { error } = await supabase.from("goal_sheets").update({ status: "returned" }).eq("id", data.sheetId);
    if (error) throw new Error(error.message);
    const { error: cErr } = await supabase.from("return_comments").insert({
      sheet_id: data.sheetId, manager_id: userId, comment: data.comment.trim(),
    });
    if (cErr) throw new Error(cErr.message);
    await logAudit(userId, "goal_sheet", data.sheetId, "returned", { comment: data.comment.trim().slice(0, 80) });
    return { ok: true };
  });

export const adminUnlockSheet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { sheetId: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    if (!roles?.some((r) => r.role === "admin")) throw new Error("Admin only");
    const { error } = await supabase.from("goal_sheets").update({ status: "draft" }).eq("id", data.sheetId);
    if (error) throw new Error(error.message);
    await logAudit(userId, "goal_sheet", data.sheetId, "admin_unlocked", {});
    return { ok: true };
  });

export const upsertAchievement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { goalId: string; quarter: "Q1"|"Q2"|"Q3"|"Q4"; actualValue: number | null; actualDate: string | null; status: "not_started"|"on_track"|"completed"; notes?: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: goal } = await supabase
      .from("goals")
      .select("id, target, target_date, uom_type, sheet_id, goal_sheets!inner(owner_id, status)")
      .eq("id", data.goalId).single();
    if (!goal) throw new Error("Goal not found");
    const sheet = (goal as unknown as { goal_sheets: { owner_id: string; status: string } }).goal_sheets;
    if (sheet.owner_id !== userId) throw new Error("Forbidden");
    if (sheet.status !== "approved_locked" && sheet.status !== "completed")
      throw new Error("Sheet must be approved before logging actuals");
    const score = computeScore({
      uom: goal.uom_type as UomType,
      target: goal.target as number | null,
      targetDate: goal.target_date,
      actual: data.actualValue,
      actualDate: data.actualDate,
    });
    const { error } = await supabase.from("achievements").upsert({
      goal_id: data.goalId,
      quarter: data.quarter,
      actual_value: data.actualValue,
      actual_date: data.actualDate,
      status: data.status,
      computed_score: score,
      notes: data.notes ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "goal_id,quarter" });
    if (error) throw new Error(error.message);
    await logAudit(userId, "achievement", data.goalId, `actual_${data.quarter}`, { actual: data.actualValue, status: data.status, score });
    return { score };
  });

export const addCheckinComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { goalId: string; quarter: "Q1"|"Q2"|"Q3"|"Q4"; comment: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (!data.comment.trim()) throw new Error("Comment required");
    const { error } = await supabase.from("checkin_comments").insert({
      goal_id: data.goalId, quarter: data.quarter, manager_id: userId, comment: data.comment.trim(),
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const pushSharedGoal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { cycleId: string; ownerIds: string[]; thrust_area: string; title: string; description?: string; uom_type: UomType; target?: number | null; target_date?: string | null; defaultWeightage: number }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    if (!roles?.some((r) => r.role === "admin" || r.role === "manager")) throw new Error("Admin/Manager only");
    let pushed = 0;
    for (const ownerId of data.ownerIds) {
      // ensure draft sheet exists
      let { data: sheet } = await supabase.from("goal_sheets").select("id, status").eq("owner_id", ownerId).eq("cycle_id", data.cycleId).maybeSingle();
      if (!sheet) {
        const { data: created } = await supabaseAdmin.from("goal_sheets").insert({ owner_id: ownerId, cycle_id: data.cycleId, status: "draft" }).select("id, status").single();
        sheet = created;
      }
      if (!sheet || sheet.status === "approved_locked") continue;
      const { count } = await supabaseAdmin.from("goals").select("*", { count: "exact", head: true }).eq("sheet_id", sheet.id);
      if ((count ?? 0) >= 8) continue;
      await supabaseAdmin.from("goals").insert({
        sheet_id: sheet.id,
        thrust_area: data.thrust_area,
        title: data.title,
        description: data.description ?? null,
        uom_type: data.uom_type,
        target: data.target ?? null,
        target_date: data.target_date ?? null,
        weightage: data.defaultWeightage,
        position: count ?? 0,
      });
      pushed++;
    }
    await logAudit(userId, "shared_goal", null, "pushed", { count: pushed, title: data.title });
    return { pushed };
  });
