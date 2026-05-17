import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertAdmin(userId: string) {
  const { data } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId);
  if (!data?.some((r) => r.role === "admin")) throw new Error("Admin only");
}

const PASSWORD = "Atom!2026";

const PEOPLE = [
  { email: "demo.manager@atomquest.app",  full_name: "Preksha Iyer",  role: "manager"  as const, department: "Sales" },
  { email: "demo.employee@atomquest.app", full_name: "Aarav Sharma",  role: "employee" as const, department: "Sales" },
  { email: "demo.diya@atomquest.app",     full_name: "Diya Kapoor",   role: "employee" as const, department: "Sales" },
  { email: "demo.karan@atomquest.app",    full_name: "Karan Nair",    role: "employee" as const, department: "Sales" },
];

async function ensureUser(email: string, full_name: string) {
  // Try to find existing
  const { data: existing } = await supabaseAdmin.from("profiles").select("id").eq("email", email).maybeSingle();
  if (existing?.id) return existing.id;
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email, password: PASSWORD, email_confirm: true, user_metadata: { full_name },
  });
  if (error) throw new Error(`createUser ${email}: ${error.message}`);
  return data.user!.id;
}

export const seedDemoOrg = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);

    const ids: Record<string, string> = {};
    for (const p of PEOPLE) {
      ids[p.email] = await ensureUser(p.email, p.full_name);
      await supabaseAdmin.from("profiles").update({ full_name: p.full_name, department: p.department }).eq("id", ids[p.email]);
      await supabaseAdmin.from("user_roles").upsert({ user_id: ids[p.email], role: p.role }, { onConflict: "user_id,role" });
    }

    const managerId = ids["demo.manager@atomquest.app"];
    for (const p of PEOPLE.filter((x) => x.role === "employee")) {
      await supabaseAdmin.from("profiles").update({ manager_id: managerId }).eq("id", ids[p.email]);
    }

    // Active cycle
    const { data: cycle } = await supabaseAdmin.from("cycles").select("id").eq("is_active", true).maybeSingle();
    if (!cycle) return { ok: true, note: "Seeded people only — no active cycle." };

    // Helper: create or reset sheet
    type Uom = "numeric_max" | "numeric_min" | "percent_max" | "percent_min" | "timeline" | "zero";
    async function resetSheet(ownerEmail: string, status: "draft" | "submitted" | "approved_locked", goals: Array<{ thrust_area: string; title: string; uom_type: Uom; target?: number | null; target_date?: string | null; weightage: number }>) {
      const ownerId = ids[ownerEmail];
      let sheetId: string;
      const { data: existing } = await supabaseAdmin.from("goal_sheets").select("id").eq("owner_id", ownerId).eq("cycle_id", cycle!.id).maybeSingle();
      if (existing) {
        sheetId = existing.id;
        await supabaseAdmin.from("goals").delete().eq("sheet_id", sheetId);
        await supabaseAdmin.from("goal_sheets").update({
          status,
          submitted_at: status === "draft" ? null : new Date().toISOString(),
          approved_at: status === "approved_locked" ? new Date().toISOString() : null,
          approved_by: status === "approved_locked" ? managerId : null,
        }).eq("id", sheetId);
      } else {
        const { data: created, error } = await supabaseAdmin.from("goal_sheets").insert({
          owner_id: ownerId, cycle_id: cycle!.id, status,
          submitted_at: status === "draft" ? null : new Date().toISOString(),
          approved_at: status === "approved_locked" ? new Date().toISOString() : null,
          approved_by: status === "approved_locked" ? managerId : null,
        }).select("id").single();
        if (error) throw new Error(error.message);
        sheetId = created.id;
      }
      const rows = goals.map((g, i) => ({
        sheet_id: sheetId,
        thrust_area: g.thrust_area, title: g.title,
        uom_type: g.uom_type, target: g.target ?? null, target_date: g.target_date ?? null,
        weightage: g.weightage, position: i,
      }));
      await supabaseAdmin.from("goals").insert(rows);
      return sheetId;
    }

    // Aarav — approved + Q1 achievement
    const aaravSheet = await resetSheet("demo.employee@atomquest.app", "approved_locked", [
      { thrust_area: "Revenue Growth", title: "Achieve regional sales target", uom_type: "numeric_min", target: 5000000, weightage: 40 },
      { thrust_area: "Customer Success", title: "NPS score above 60",          uom_type: "percent_min", target: 60, weightage: 25 },
      { thrust_area: "Operations",      title: "Submit weekly reports on time", uom_type: "zero",        target: 0, weightage: 15 },
      { thrust_area: "Strategy",        title: "Launch new dealer onboarding",   uom_type: "timeline",    target_date: "2026-09-30", weightage: 20 },
    ]);
    // Q1 achievement for first goal
    const { data: aaravGoals } = await supabaseAdmin.from("goals").select("id, weightage").eq("sheet_id", aaravSheet).order("position");
    if (aaravGoals?.[0]) {
      await supabaseAdmin.from("achievements").upsert({
        goal_id: aaravGoals[0].id, quarter: "Q1",
        actual_value: 1200000, status: "on_track", computed_score: 24,
        updated_at: new Date().toISOString(),
      }, { onConflict: "goal_id,quarter" });
    }

    // Diya — submitted
    await resetSheet("demo.diya@atomquest.app", "submitted", [
      { thrust_area: "Revenue Growth", title: "South-zone account expansion", uom_type: "numeric_min", target: 3000000, weightage: 50 },
      { thrust_area: "People",         title: "Mentor 2 new joiners",          uom_type: "numeric_min", target: 2,       weightage: 20 },
      { thrust_area: "Operations",     title: "CRM hygiene score",             uom_type: "percent_min", target: 95,      weightage: 30 },
    ]);

    // Karan — draft
    await resetSheet("demo.karan@atomquest.app", "draft", [
      { thrust_area: "Revenue Growth", title: "West-zone dealer revenue",      uom_type: "numeric_min", target: 2500000, weightage: 60 },
      { thrust_area: "Learning",       title: "Complete product certification", uom_type: "timeline",    target_date: "2026-08-31", weightage: 40 },
    ]);

    return { ok: true, seeded: PEOPLE.length };
  });